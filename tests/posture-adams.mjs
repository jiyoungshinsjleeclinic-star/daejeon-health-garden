import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {makePerson} from '../center-visuals.js';
import {createPostureScene,POSTURE_STEPS} from '../posture-scene.js';

globalThis.requestAnimationFrame=()=>1;
globalThis.cancelAnimationFrame=()=>{};
const mats=Object.fromEntries(['white','skin','leather','dark','fabric'].map(name=>[name,new THREE.MeshStandardMaterial()]));
const adamsStart=POSTURE_STEPS.slice(0,POSTURE_STEPS.findIndex(([stage])=>stage==='adams')).reduce((sum,[,seconds])=>sum+seconds,0);

function pose(person,seated){
 for(const leg of person.legs){
  leg.rotation.x=seated?-Math.PI/2:0;
  leg.userData.knee.rotation.x=seated?Math.PI/2:0;
 }
}

for(const gender of ['female','male']){
 const root=new THREE.Group();
 const visitor=makePerson('#d58a91',root,mats,{gender});
 const staff=makePerson('#e8f3ef',root,mats);
 const device=new THREE.Group();
 root.add(device);
 device.position.set(6.3,0,4.2);
 device.userData.postureStandingPoint=new THREE.Vector3(0,.12,.35);
 const scene=createPostureScene(visitor,staff,device,pose,()=>{},()=>{},(from,to)=>[from,to]);
 assert(scene.start());
 const now=performance.now();
 scene.update(now+(adamsStart+.1)*1000);
 const planted=visitor.feet.map(foot=>foot.getWorldPosition(new THREE.Vector3()));
 scene.update(now+(adamsStart+2)*1000);
 assert.equal(scene.stage,'adams');
 assert.equal(visitor.g.rotation.x,0);
 assert.equal(visitor.upperBody.rotation.x,Math.PI/2);
 visitor.arms.forEach((arm,index)=>{
  const palm=arm.userData.elbow.localToWorld(new THREE.Vector3(0,-.294,.026));
  const knee=visitor.legs[index].userData.knee.localToWorld(new THREE.Vector3(0,.055,.144));
  assert(palm.distanceTo(knee)<.005);
  assert(visitor.feet[index].getWorldPosition(new THREE.Vector3()).distanceTo(planted[index])<.001);
 });
 scene.cancel();
 assert.equal(visitor.upperBody.rotation.x,0);
}
console.log('Adams assessment: waist bends, feet stay planted, and both palms reach the knees.');
