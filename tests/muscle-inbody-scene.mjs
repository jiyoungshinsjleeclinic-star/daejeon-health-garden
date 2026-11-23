import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {makePerson} from '../center-visuals.js';
import {createMuscleInBodyScene,INBODY_SEQUENCE} from '../muscle-inbody-scene.js';
import {INBODY_EXAMPLES} from '../inbody-display.js';

const mats=Object.fromEntries(['white','wood','green','dark','blue','skin','metal','leather','fabric','leaf','yellow'].map(name=>[name,new THREE.MeshStandardMaterial({color:'#aabbcc'})]));
const root=new THREE.Group(),visitor=makePerson('#cb8c99',root,mats,{gender:'female'}),staff=makePerson('#e8f3ef',root,mats),device=new THREE.Group();device.position.set(-6.7,0,4.4);root.add(device);staff.g.position.set(0,.13,-2);const screen=new THREE.Group();screen.position.set(0,1.96,-.248);device.add(screen);device.userData.inbodyScreen=screen;
const display={value:{mode:'idle',example:true},reset(){this.value={mode:'idle',example:true}},update(mode,gender){this.value={mode,gender,...INBODY_EXAMPLES[gender],example:true}}};device.userData.inbodyDisplay=display;
function pose(person,on){person.legs.forEach(leg=>{leg.rotation.x=on?-Math.PI/2:0;leg.userData.knee.rotation.x=on?Math.PI/2:0});person.arms.forEach(arm=>{arm.rotation.x=on?-.3:0;arm.rotation.z=0;arm.userData.elbow.rotation.x=0})}
const stages=[];let completed=0;const scene=createMuscleInBodyScene(visitor,staff,device,pose,stage=>stages.push(stage),()=>{completed++;pose(visitor,true)},()=>visitor.gender);scene.start();const start=performance.now();let elapsed=0;
function checkArmView(){
 for(const aspect of [.55,1.7]){
  const shot=scene.camera(aspect);
  const camera=new THREE.PerspectiveCamera(shot.fov,aspect,.05,30);
  camera.position.copy(shot.position);camera.lookAt(shot.focus);camera.updateMatrixWorld(true);
  const hands=visitor.arms.map(arm=>arm.userData.elbow.localToWorld(new THREE.Vector3(0,-.294,.026)).project(camera));
  assert(hands.every(hand=>Math.abs(hand.x)<.95&&Math.abs(hand.y)<.95),`both hands should fit in the shot: ${JSON.stringify(hands)}`);
  const bounds=new THREE.Box3().setFromObject(staff.g);
  const staffEdges=[];
  for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])
   staffEdges.push(new THREE.Vector3(x,y,z).project(camera).x);
  const handMin=Math.min(...hands.map(hand=>hand.x)),handMax=Math.max(...hands.map(hand=>hand.x));
  assert(Math.max(...staffEdges)<handMin-.025||Math.min(...staffEdges)>handMax+.025,'guide must stay outside the view between the hands');
 }
}
for(const [stage,seconds] of INBODY_SEQUENCE){scene.update(start+(elapsed+seconds*.7)*1000);assert.equal(scene.stage,stage);const snap=scene.snapshot();if(!['invitation','walking','walking-back','sitting'].includes(stage))assert(snap.staffAtStation);if(['weight-ready','weight-result','handle-instruction','handles','measuring','result','finished'].includes(stage)){assert(snap.barefoot);assert(snap.onPlatform);assert(snap.facingDevice)}if(stage==='weight-result'){assert.equal(snap.display.weight,55);assert.equal(snap.display.mode,'weight')}if(['handles','measuring','result'].includes(stage))assert(snap.gripping);const shot=scene.camera(.55);assert(shot.position.x>-7.6&&shot.position.x<7.6);assert(shot.position.z>-5.7&&shot.position.z<6.6);if(stage==='measuring')checkArmView();if(stage==='result'){assert.equal(snap.display.mode,'result');assert.equal(snap.display.score,'78점');assert(snap.display.example);assert(shot.position.z-shot.focus.z>1.2)}elapsed+=seconds}
scene.update(start+(elapsed+1)*1000);assert.equal(scene.stage,'complete');assert.equal(completed,1);assert(scene.snapshot().shoesOn);assert(scene.snapshot().staffSeated);assert.equal(visitor.g.position.z,2);assert(stages.includes('walking-back'));
visitor.setGender('male');scene.start();scene.update(performance.now()+18000);assert.equal(scene.stage,'weight-result');assert.equal(scene.snapshot().display.weight,70);scene.cancel();assert.equal(scene.stage,'idle');assert(scene.snapshot().shoesOn);assert.equal(visitor.g.position.z,2);scene.dispose();
console.log('InBody sequence: explanation route, shoes, gendered weight, handles, example composition results and seated return passed.');
