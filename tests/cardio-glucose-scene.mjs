import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {makePerson} from '../center-visuals.js';
import {createGlucoseScene,GLUCOSE_SEQUENCE} from '../cardio-glucose-scene.js';
const mats=Object.fromEntries(['white','wood','green','dark','blue','skin','metal','leather','fabric','leaf','yellow'].map(n=>[n,new THREE.MeshStandardMaterial({color:'#aabbcc'})]));
const root=new THREE.Group(),visitor=makePerson('#cb8c99',root,mats),employee=makePerson('#eeeeee',root,mats),device=new THREE.Group();root.add(device);device.position.set(-.43,1.22,.04);const home=device.position.clone();
const screen=new THREE.Group();screen.position.set(0,.157,-.0696);device.add(screen);device.userData.glucoseScreen=screen;
const display={value:{mode:'idle',value:null,unit:'mg/dL',example:true},reset(){this.value={mode:'idle',value:null,unit:'mg/dL',example:true}},update(mode){this.value={mode,value:mode==='result'?92:null,unit:'mg/dL',example:true}}};device.userData.glucoseDisplay=display;
function pose(p,on){p.legs.forEach(l=>{l.rotation.x=on?-Math.PI/2:0;l.userData.knee.rotation.x=on?Math.PI/2:0});p.arms.forEach(a=>{a.rotation.x=on?-.3:0;a.userData.elbow.rotation.x=0;a.userData.indexFinger.visible=false})}
let completed=0;const stages=[];const scene=createGlucoseScene(visitor,employee,device,pose,s=>stages.push(s),()=>{completed++;pose(visitor,true)});
scene.start();const start=performance.now();let elapsed=0;
for(const [stage,seconds]of GLUCOSE_SEQUENCE){
 scene.update(start+(elapsed+seconds*.7)*1000);assert.equal(scene.stage,stage);assert.equal(visitor.g.position.z,2);assert.equal(visitor.legs[0].rotation.x,-Math.PI/2);
 if(stage==='result'){
  assert(scene.snapshot().leftIndex);assert.equal(display.value.value,92);assert(display.value.example);
  visitor.g.updateWorldMatrix(true,true);device.updateWorldMatrix(true,true);const fingertip=visitor.arms[1].userData.elbow.localToWorld(new THREE.Vector3(.02,-.505,0)),strip=device.localToWorld(new THREE.Vector3(0,.055,.52));assert(fingertip.distanceTo(strip)<1e-6);
  const shot=scene.camera(.55);assert(Number.isFinite(shot.position.x));
 }
 elapsed+=seconds;
}
scene.update(start+(elapsed+1)*1000);assert.equal(scene.stage,'complete');assert.equal(completed,1);assert(!scene.snapshot().leftIndex);assert(device.position.distanceTo(home)<1e-8);assert.equal(employee.g.position.z,-2);assert.equal(display.value.value,92);
scene.start();scene.update(performance.now()+19000);assert(scene.snapshot().leftIndex);scene.cancel();assert.equal(scene.stage,'idle');assert(!scene.snapshot().leftIndex);assert.equal(display.value.value,null);assert(device.position.distanceTo(home)<1e-8);assert.equal(visitor.g.position.z,2);assert.equal(employee.g.position.z,-2);assert(stages.includes('finishing'));
scene.dispose();console.log('Glucose sequence: seated visitor, left index, strip contact, illustrative value, restored staff/device and interruption passed.');
