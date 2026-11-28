import * as THREE from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';

const models = new Map();
const materialCache = new Map();
const textures = new Map();
const directory = new URL('./assets/characters/', import.meta.url);
const textureNames = {
  'ivory woven shirt': 'shirt', 'pine knit': 'vest', 'charcoal trousers': 'trousers',
  'brown eyes': 'eyes', 'shoes03': 'shoes'
};

function materialFor(part, gender) {
  const base = part.replace(/-[01]$/, '');
  const name = ['skin', 'barefoot'].includes(base) ? gender + '-skin' : textureNames[base] || base;
  if (!materialCache.has(name)) {
    const hair = name === 'short02' || name === 'bob01';
    const cutout = hair || name === 'eyelashes01' || name === 'eyebrow003';
    const material = new THREE.MeshStandardMaterial({
      map: textures.get(name), roughness: name === 'eyes' ? .28 : .76,
      alphaTest: cutout ? .28 : 0, side: cutout ? THREE.DoubleSide : THREE.FrontSide
    });
    material.userData.sharedCharacter = true;
    materialCache.set(name, material);
  }
  return materialCache.get(name);
}

export async function loadCharacterModels() {
  const textureLoader = new THREE.TextureLoader();
  const gltfLoader = new GLTFLoader();
  const names = ['male-skin','female-skin','shirt','vest','trousers','eyes','shoes','short02','bob01','eyebrow003','eyelashes01'];
  await Promise.all(names.map(async name => {
    const texture = await textureLoader.loadAsync(new URL(name + '.webp', directory).href);
    texture.flipY = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.userData.sharedCharacter = true;
    textures.set(name, texture);
  }));
  for (const [gender, gltf] of await Promise.all(['male','female'].map(async gender =>
    [gender, await gltfLoader.loadAsync(new URL(gender + '.glb', directory).href)]))) {
    const parts = [];
    gltf.scene.traverse(node => {
      if (!node.isMesh) return;
      const geometry = node.geometry;
      geometry.setAttribute('skinIndex', geometry.getAttribute('_joints'));
      geometry.setAttribute('skinWeight', geometry.getAttribute('_weights'));
      geometry.deleteAttribute('_joints');
      geometry.deleteAttribute('_weights');
      geometry.userData.sharedCharacter = true;
      parts.push({part: node.userData.part, geometry});
    });
    addBlinkTarget(parts);
    models.set(gender, parts);
  }
}

// Bring the upper and lower lids together around each eye in the model's rest space.
function addBlinkTarget(parts) {
  const eyes = parts.find(p => p.part === 'brown eyes').geometry;
  eyes.computeBoundingBox();
  const bounds = eyes.boundingBox, center = bounds.getCenter(new THREE.Vector3());
  const eyeX = (bounds.max.x + .012) / 2;
  for (const {geometry, part} of parts) {
    if (!['skin','eyelashes01','brown eyes'].includes(part)) continue;
    const positions = geometry.getAttribute('position'), blink = positions.clone();
    for (let i = 0; i < positions.count; i++) {
      const dx = Math.abs(Math.abs(positions.getX(i)) - eyeX);
      const dy = positions.getY(i) - center.y;
      const strength = part === 'skin' ? (1 - THREE.MathUtils.smoothstep(dx,.016,.028)) *
        (1 - THREE.MathUtils.smoothstep(Math.abs(dy),.009,.021)) : 1;
      if (positions.getZ(i) > center.z - .011 || part !== 'skin') {
        blink.setY(i, positions.getY(i) - strength * (dy + .002));
        if (part === 'skin') blink.setZ(i, positions.getZ(i) + strength * .004);
      }
    }
    geometry.morphAttributes.position = [blink];
  }
}

export function dressCharacter(rig) {
  if (!models.size) return rig;
  const {g, head, upperBody, legs, arms, shoes, feet} = rig;
  const bones = [upperBody, head];
  for (let i = 0; i < 2; i++) {
    const arm = arms[i], hand = arm.userData;
    bones.push(arm, hand.elbow, hand.indexFinger, hand.middleFinger, hand.ringFinger,
      hand.littleFinger, legs[i], legs[i].userData.knee);
  }
  g.updateWorldMatrix(true,true);
  const inverseRest = node => node.matrixWorld.clone().invert().multiply(g.matrixWorld);
  const skeleton = new THREE.Skeleton(bones, bones.map(inverseRest));
  const footwearRest = shoes.map(inverseRest);
  const placeholders = [];
  g.traverse(node => { if (node.isMesh) placeholders.push(node); });
  for (const node of placeholders) {
    node.removeFromParent();
    node.geometry.dispose();
  }
  const originalSetGender = rig.setGender;
  const look = new THREE.Group();
  g.add(look);
  let current, eyesClosed = false, pieces = [], tints = [];
  function setGender(gender) {
    originalSetGender(gender);
    if (current === rig.gender) return;
    current = rig.gender;
    for (const node of pieces) node.removeFromParent();
    for (const material of tints) material.dispose();
    pieces = []; tints = [];
    for (const {part,geometry} of models.get(current)) {
      let material = materialFor(part,current);
      if (part === (current === 'female' ? 'pine knit' : 'ivory woven shirt')) {
        material = material.clone();
        material.color = rig.shirt.color;
        material.userData.sharedCharacter = false;
        tints.push(material);
      }
      let mesh;
      if (part.startsWith('shoes03-') || part.startsWith('barefoot-')) {
        const i = Number(part.slice(-1));
        mesh = new THREE.Mesh(geometry,material);
        mesh.applyMatrix4(footwearRest[i]);
        (part.startsWith('barefoot') ? feet : shoes)[i].add(mesh);
      } else {
        mesh = new THREE.SkinnedMesh(geometry,material);
        mesh.bind(skeleton,new THREE.Matrix4());
        mesh.frustumCulled = false;
        look.add(mesh);
      }
      mesh.name = current + '/' + part;
      mesh.castShadow = mesh.receiveShadow = true;
      pieces.push(mesh);
    }
    setEyesClosed(eyesClosed);
  }
  function setEyesClosed(closed) {
    eyesClosed = Boolean(closed);
    for (const mesh of pieces) {
      if (mesh.morphTargetInfluences) mesh.morphTargetInfluences[0] = Number(eyesClosed);
    }
  }
  rig.setGender = setGender;
  rig.setEyesClosed = setEyesClosed;
  g.userData.disposeCharacter = () => {
    skeleton.dispose();
    for (const material of tints) material.dispose();
  };
  setGender(rig.gender);
  return rig;
}
