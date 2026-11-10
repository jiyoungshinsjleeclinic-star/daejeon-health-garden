import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {makePerson} from '../center-visuals.js';
import {createCholesterolScene,CHOLESTEROL_SEQUENCE} from '../cardio-cholesterol-scene.js';
const mats=Object.fromEntries(['white','wood','green','dark','blue','skin','metal','leather','fabric','leaf','yellow'].map(n=>[n,new THREE.MeshStandardMaterial({color:'#aabbcc'})]));
const root=new THREE.Group(),visitor=makePerson('#cb8c99',root,mats),employee=makePerson('#eeeeee',root,mats),device=new THREE.Group();root.add(device);device.position.set(-1.08,1.22,.03);const home=device.position.clone();
const screen=new THREE.Group();screen.position.set(0,.157,-.083);device.add(screen);device.userData.cholesterolScreen=screen;const strip=new THREE.Group();device.add(strip);device.userData.cholesterolStrip=strip;
const display={value:{mode:'idle',value:null,unit:'mg/dL',example:true},reset(){this.value={mode:'idle',value:null,unit:'mg/dL',example:true}},update(mode){this.value={mode,value:mode==='result'?168:null,unit:'mg/dL',example:true}}};device.userData.cholesterolDisplay=display;
function pose(p,on){p.legs.forEach(l=>{l.rotation.x=on?-Math.PI/2:0;l.userData.knee.rotation.x=on?Math.PI/2:0});p.arms.forEach(a=>{a.rotation.x=on?-.3:0;a.userData.elbow.rotation.x=0;a.userData.indexFinger.visible=false})}
let completed=0;const stages=[];const scene=createCholesterolScene(visitor,employee,device,pose,s=>stages.push(s),()=>{completed++;pose(visitor,true)});
scene.start();const start=performance.now();let elapsed=0;
for(const [stage,seconds]of CHOLESTEROL_SEQUENCE){
 scene.update(start+(elapsed+seconds*.7)*1000);assert.equal(scene.stage,stage);assert.equal(visitor.g.position.z,2);assert.equal(visitor.legs[0].rotation.x,-Math.PI/2);
 if(stage==='result'){assert(scene.snapshot().leftRing);assert.equal(display.value.value,168);assert(display.value.example);assert(scene.snapshot().stripVisible);visitor.g.updateWorldMatrix(true,true);device.updateWorldMatrix(true,true);const fingertip=visitor.arms[1].userData.elbow.localToWorld(new THREE.Vector3(-.02,-.505,0)),stripTip=device.localToWorld(new THREE.Vector3(0,.055,.5356));assert(fingertip.distanceTo(stripTip)<1e-6);const shot=scene.camera(.55);assert(Number.isFinite(shot.position.x))}
 elapsed+=seconds;
}
scene.update(start+(elapsed+1)*1000);assert.equal(scene.stage,'complete');assert.equal(completed,1);assert(!scene.snapshot().leftRing);assert(device.position.distanceTo(home)<1e-8);assert.equal(employee.g.position.z,-2);assert.equal(display.value.value,168);assert(stages.includes('code-check'));assert(stages.includes('strip-insert'));assert(stages.includes('sample'));
scene.start();scene.update(performance.now()+24000);assert(scene.snapshot().leftRing);scene.cancel();assert.equal(scene.stage,'idle');assert(!scene.snapshot().leftRing);assert.equal(display.value.value,null);assert(device.position.distanceTo(home)<1e-8);assert.equal(visitor.g.position.z,2);assert.equal(employee.g.position.z,-2);
scene.dispose();console.log('Cholesterol sequence: seated visitor, left ring finger, ordered strip workflow, illustrative result and restoration passed.');
