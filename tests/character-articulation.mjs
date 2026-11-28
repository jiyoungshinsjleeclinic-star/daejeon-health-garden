import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from '../vendor/three.module.js';
import {makePerson} from '../center-visuals.js';
import {articulate} from '../character-articulation.js';
import {setFingerExtended} from '../finger-pose.js';

const mats=Object.fromEntries(['skin','white','dark','leather','fabric'].map(key=>[key,new THREE.MeshStandardMaterial()]));
for(const gender of ['male','female']){
  const glb=await readFile(new URL('../assets/characters/'+gender+'.glb',import.meta.url));
  const json=JSON.parse(glb.subarray(20,20+glb.readUInt32LE(12)));
  const {jointNames,pivots}=json.scenes[0].extras;
  const rig=makePerson('#ffffff',new THREE.Group(),mats,{gender});
  rig.g.updateMatrixWorld(true);
  const rest=new Map();
  rig.g.traverse(node=>rest.set(node,node.matrixWorld.clone().invert()));
  const motion=articulate(rig,jointNames,pivots,rest);
  const bone=name=>motion.skeleton.bones[jointNames.indexOf(name)];
  for(const i of [0,1]){
    const arm=rig.arms[i];
    arm.rotation.z=i?.74:-.74;
    arm.userData.grip=.8;
    rig.g.updateMatrixWorld(true);
    const collar=bone('clavicle'+i), shoulder=bone('arm'+i);
    assert(Math.abs(collar.rotation.z)>.1 && Math.abs(collar.rotation.z)<.74);
    assert(collar.quaternion.clone().multiply(shoulder.quaternion).angleTo(arm.quaternion)<1e-6);
    for(const digit of ['thumb','index','middle','ring','little']){
      const proximal=bone(digit+i),middle=bone(digit+'Mid'+i),distal=bone(digit+'Tip'+i);
      assert.equal(middle.parent,proximal);assert.equal(distal.parent,middle);
      assert(middle.quaternion.angleTo(new THREE.Quaternion())>0);
      assert(distal.scale.equals(new THREE.Vector3(1,1,1)));
    }
    setFingerExtended(arm.userData.indexFinger,true);
    rig.g.updateMatrixWorld(true);
    assert(shoulder.matrixWorld.elements.every(Number.isFinite));
  }
  motion.dispose();
}
