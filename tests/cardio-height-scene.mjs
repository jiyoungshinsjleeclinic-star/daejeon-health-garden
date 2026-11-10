import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {createHeightScene,HEIGHT_SEQUENCE} from '../cardio-height-scene.js';
const visitor={g:new THREE.Group(),arms:[new THREE.Group(),new THREE.Group()],legs:[new THREE.Group(),new THREE.Group()],shoes:[new THREE.Group(),new THREE.Group()],feet:[new THREE.Group(),new THREE.Group()]};
visitor.legs.forEach(l=>l.userData.knee=new THREE.Group());visitor.feet.forEach(f=>f.visible=false);
const room=new THREE.Group(),device=new THREE.Group(),head=new THREE.Group();room.add(device);device.add(head);head.position.y=2.8;device.position.set(-3.85,0,-3.1);device.userData.heightHead=head;
const stages=[];let finished=0;
const scene=createHeightScene(visitor,device,()=>{},s=>stages.push(s),()=>{finished++;visitor.g.position.set(0,.13,2)});
scene.start();const start=performance.now();let elapsed=0;
for(const [name,seconds] of HEIGHT_SEQUENCE){
 scene.update(start+(elapsed+seconds*.8)*1000);assert.equal(scene.stage,name);
 const state=scene.snapshot();
 if(['ready','head-down','head-hold','head-up','step-down-request'].includes(name)){assert(state.onPlatform);assert(state.barefoot);assert(!state.shoesOn);assert(state.looseShoesVisible);assert.equal(visitor.g.rotation.y,0)}
 if(name==='head-down'||name==='head-up')assert(state.headY<state.headHomeY&&state.headY>2.47);
 if(name==='head-hold')assert(Math.abs(state.headY-2.47)<1e-6);
 if(name==='shoes-off')assert(!state.shoesOn);
 if(name==='shoes-on')assert(state.shoesOn);
 elapsed+=seconds;
}
scene.update(start+(elapsed+1)*1000);assert.equal(scene.stage,'complete');assert.equal(finished,1);assert(scene.snapshot().shoesOn);assert(!scene.snapshot().barefoot);assert.equal(head.position.y,2.8);assert.equal(visitor.g.position.z,2);
scene.start();scene.update(performance.now()+16000);assert(scene.snapshot().barefoot);scene.cancel();assert.equal(scene.stage,'idle');assert(scene.snapshot().shoesOn);assert.equal(head.position.y,2.8);assert.equal(visitor.g.position.y,0);assert(!scene.snapshot().looseShoesVisible);
scene.dispose();assert.equal(room.children.length,1);assert(stages.includes('step-down-request'));
console.log('Height sequence: safe route, shoes, platform, moving headpiece, return seat, cancellation and cleanup passed.');
