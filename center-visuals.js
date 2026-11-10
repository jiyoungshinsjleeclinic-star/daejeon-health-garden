import * as THREE from './vendor/three.module.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';

// Merge only siblings so articulated joints and interactive group roots stay intact.
export function compactMeshes(group){
 for(const child of [...group.children])if(child.isGroup)compactMeshes(child);
 const buckets=new Map();
 for(const child of group.children)if(child.isMesh&&!Array.isArray(child.material)){
  const list=buckets.get(child.material)||[];list.push(child);buckets.set(child.material,list);
 }
 for(const [material,parts] of buckets){
  if(parts.length<2)continue;
  const geometries=parts.map(part=>{part.updateMatrix();return (part.geometry.index?part.geometry.toNonIndexed():part.geometry.clone()).applyMatrix4(part.matrix)});
  const merged=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());if(!merged)continue;
  const o=new THREE.Mesh(merged,material);o.castShadow=o.receiveShadow=true;group.add(o);
  parts.forEach(part=>{part.geometry.dispose();group.remove(part)});
 }
 return group;
}

// Bevels use Three's extrusion geometry; structural walls keep their simple geometry.
export function roundedGeometry(w,h,d,r=.06){
 r=Math.min(r,w*.22,h*.22,d*.22);
 const x=w/2-r,y=h/2-r,c=Math.min(r*.5,x*.5,y*.5),s=new THREE.Shape();
 s.moveTo(-x+c,-y);s.lineTo(x-c,-y);s.quadraticCurveTo(x,-y,x,-y+c);
 s.lineTo(x,y-c);s.quadraticCurveTo(x,y,x-c,y);s.lineTo(-x+c,y);
 s.quadraticCurveTo(-x,y,-x,y-c);s.lineTo(-x,-y+c);s.quadraticCurveTo(-x,-y,-x+c,-y);
 const g=new THREE.ExtrudeGeometry(s,{depth:d-2*r,bevelEnabled:true,bevelThickness:r,bevelSize:r,bevelSegments:2,steps:1,curveSegments:3});
 g.translate(0,0,-d/2+r);g.computeVertexNormals();return g;
}

function surfaceTexture(kind){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d');
 ctx.fillStyle=kind==='wood'?'#d2b78e':'#dddcd8';ctx.fillRect(0,0,256,256);
 if(kind==='wood'){
  for(let i=0;i<110;i++){ctx.strokeStyle=`rgba(102,70,41,${.025+(i%5)*.009})`;ctx.lineWidth=.5+i%3*.35;ctx.beginPath();
   for(let x=0;x<=256;x+=8){const y=(i*2.37+Math.sin(x*.018+i*.7)*(1+i%4))%256;x?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke()}
 }else{for(let i=0;i<256;i+=3){ctx.fillStyle=i%2?'#cccac5':'#eeeae4';ctx.globalAlpha=.22;ctx.fillRect(i,0,1,256);ctx.fillRect(0,i,256,1)}ctx.globalAlpha=1}
 const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;
}

export function makeMaterials(){
 const wood=surfaceTexture('wood'),fabric=surfaceTexture('fabric');
 const m=(color,options={})=>new THREE.MeshStandardMaterial({color,roughness:.7,...options});
 return {green:m('#719283',{map:fabric,roughness:.95}),dark:m('#285c50'),white:m('#f3f4f1',{roughness:.48}),wood:m('#ffffff',{map:wood,roughness:.58}),pink:m('#cb8c99',{map:fabric}),blue:m('#88acb8',{map:fabric,roughness:.95}),yellow:m('#d8bd6e'),leaf:m('#477950',{roughness:.6}),floor:m('#e5e7e6'),skin:m('#e6b997',{roughness:.8}),metal:m('#b8c0c2',{metalness:.75,roughness:.3}),leather:m('#33383a',{roughness:.6}),fabric:m('#dedbd0',{map:fabric,roughness:.95})};
}

function mesh(parent,geometry,material,x,y,z){const o=new THREE.Mesh(geometry,material);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o}
function ellipsoid(parent,material,x,y,z,sx,sy,sz){const o=mesh(parent,new THREE.SphereGeometry(1,16,12),material,x,y,z);o.scale.set(sx,sy,sz);return o}
function softBox(parent,m,w,h,d,x,y,z,r=.07){return mesh(parent,roundedGeometry(w,h,d,r),m,x,y,z)}
function limb(parent,m,r,length,x,y,z){return mesh(parent,new THREE.CapsuleGeometry(r,Math.max(.01,length-r*2),3,10),m,x,y,z)}

export function makePerson(color,parent,mats){
 const g=new THREE.Group();parent.add(g);const shirt=new THREE.MeshStandardMaterial({color,roughness:.92,map:mats.fabric.map});
 const trousers=new THREE.MeshStandardMaterial({color:'#424c51',roughness:.95}),hair=new THREE.MeshStandardMaterial({color:'#392f2b',roughness:.9});
 const eyes=new THREE.MeshStandardMaterial({color:'#252724',roughness:.3}),lip=new THREE.MeshStandardMaterial({color:'#ad7667'});
 const torso=limb(g,shirt,.28,.72,0,1.23,0);torso.scale.z=.68;
 ellipsoid(g,shirt,0,1.46,0,.30,.095,.18);
 limb(g,mats.skin,.087,.2,0,1.62,0);
 ellipsoid(g,mats.skin,0,1.87,.015,.235,.285,.225);
 for(const x of [-.239,.239])ellipsoid(g,mats.skin,x,1.86,0,.045,.07,.035);
 const cap=mesh(g,new THREE.SphereGeometry(1,20,12,0,Math.PI*2,0,Math.PI*.53),hair,0,1.89,.015);cap.scale.set(.25,.3,.245);
 for(const x of [-.13,0,.13]){const bang=ellipsoid(g,hair,x,2.018,.16,.105,.065,.055);bang.rotation.z=-.25}
 for(const x of [-.085,.085]){
  ellipsoid(g,mats.white,x,1.89,.221,.038,.022,.012);ellipsoid(g,eyes,x,1.889,.232,.018,.023,.009);
  ellipsoid(g,mats.white,x-.005,1.897,.24,.005,.006,.003);
  const brow=softBox(g,hair,.066,.012,.012,x,1.947,.222,.003);brow.rotation.z=x<0?.06:-.06;
 }
 ellipsoid(g,mats.skin,0,1.849,.246,.027,.039,.036);
 ellipsoid(g,lip,0,1.788,.219,.045,.009,.008);
 for(const side of [-1,1]){const collar=softBox(g,mats.white,.085,.105,.02,side*.055,1.49,.18,.012);collar.rotation.z=side*.4}
 softBox(g,shirt,.035,.48,.025,0,1.2,.186,.005);
 for(const y of [1.12,1.27,1.39])ellipsoid(g,mats.white,0,y,.207,.011,.011,.005);
 const arms=[],legs=[],shoes=[],feet=[];
 for(const x of [-.355,.355]){
  const arm=new THREE.Group();arm.position.set(x,1.47,0);g.add(arm);
  limb(arm,shirt,.085,.36,0,-.15,0);const elbow=new THREE.Group();elbow.position.y=-.3;arm.add(elbow);arm.userData.elbow=elbow;limb(elbow,shirt,.077,.29,0,-.1,.015);
  softBox(elbow,mats.white,.16,.045,.17,0,-.215,.015,.015);ellipsoid(elbow,mats.skin,0,-.294,.026,.079,.095,.063);
  const finger=new THREE.Group();elbow.add(finger);finger.visible=false;limb(finger,mats.skin,.017,.18,.02,-.415,0);arm.userData.indexFinger=finger;arms.push(arm);
 }
 for(const x of [-.14,.14]){
  const leg=new THREE.Group();leg.position.set(x,.91,0);g.add(leg);limb(leg,trousers,.112,.44,0,-.2,0);
  const knee=new THREE.Group();knee.position.y=-.41;leg.add(knee);limb(knee,trousers,.097,.39,0,-.17,0);
  const shoe=new THREE.Group();knee.add(shoe);shoes.push(shoe);
  softBox(shoe,mats.white,.22,.06,.39,0,-.455,.072,.025);softBox(shoe,mats.leather,.205,.135,.35,0,-.38,.065,.045);
  for(const z of [.03,.09,.15])softBox(shoe,mats.white,.12,.009,.013,0,-.31,z,.003);
  const foot=new THREE.Group();knee.add(foot);foot.visible=false;feet.push(foot);softBox(foot,mats.skin,.18,.08,.28,0,-.44,.065,.035);
  leg.userData.knee=knee;legs.push(leg);
 }
 compactMeshes(g);return {g,shirt,legs,arms,shoes,feet};
}

export function makeChair(x,z,color,parent,mats){
 const g=new THREE.Group();g.position.set(x,0,z);parent.add(g);
 softBox(g,color,1.3,.23,1.19,0,.68,0,.1);
 const back=softBox(g,color,1.3,1.03,.21,0,1.23,-.51,.09);back.rotation.x=-.075;
 softBox(g,color,1.13,.7,.09,0,1.29,-.37,.06);
 for(const side of [-1,1]){
  softBox(g,color,.15,.32,1.04,side*.65,.88,-.04,.06);
  for(const depth of [-.4,.4]){const leg=mesh(g,new THREE.CylinderGeometry(.035,.047,.56,10),mats.metal,side*.49,.3,depth);leg.rotation.z=side*-.07}
 }
 return compactMeshes(g);
}

export function makeTable(x,z,w,parent,mats){
 const g=new THREE.Group();g.position.set(x,0,z);parent.add(g);softBox(g,mats.wood,w,.12,1.3,0,1.16,0,.045);
 for(const a of [-w/2+.2,w/2-.2])for(const b of [-.42,.42]){mesh(g,new THREE.CylinderGeometry(.045,.035,1.1,10),mats.metal,a,.55,b);softBox(g,mats.leather,.085,.04,.085,a,.025,b,.01)}
 return compactMeshes(g);
}

export function makePlant(x,z,scale,parent,mats){
 const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(scale);parent.add(g);
 mesh(g,new THREE.CylinderGeometry(.34,.25,.5,20),mats.white,0,.25,0);
 mesh(g,new THREE.CylinderGeometry(.3,.3,.025,20),new THREE.MeshStandardMaterial({color:'#423c32'}),0,.5,0);
 for(let i=0;i<9;i++){
  const angle=i*2.4,height=.85+i%4*.19,end=new THREE.Vector3(Math.cos(angle)*.38,height,Math.sin(angle)*.38),start=new THREE.Vector3(0,.5,0),delta=end.clone().sub(start);
  const stem=mesh(g,new THREE.CylinderGeometry(.012,.016,delta.length(),5),mats.leaf,...start.clone().add(end).multiplyScalar(.5).toArray());stem.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.clone().normalize());
  const leaf=ellipsoid(g,mats.leaf,end.x,end.y,end.z,.13,.32,.035);leaf.rotation.set(Math.sin(angle)*.6,angle,Math.cos(angle)*.6);
 }
 return compactMeshes(g);
}
