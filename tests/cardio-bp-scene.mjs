import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {createBPScene,BP_SEQUENCE,BP_EXAMPLE} from '../cardio-bp-scene.js';
const visitor={g:new THREE.Group(),arms:[new THREE.Group(),new THREE.Group()],legs:[new THREE.Group(),new THREE.Group()]};
visitor.legs.forEach(l=>l.userData.knee=new THREE.Group());visitor.arms.forEach(a=>{a.userData.elbow=new THREE.Group();a.userData.indexFinger=new THREE.Group();a.userData.indexFinger.visible=false});
const device=new THREE.Group();device.position.set(5.1,0,4.3);const display={value:{mode:'idle'},update(value){this.value={...this.value,...value}},reset(){this.value={mode:'idle'}}};device.userData.bpDisplay=display;
const spaces=[],stages=[];let finished=0;const scene=createBPScene(visitor,device,()=>{},s=>stages.push(s),s=>spaces.push(s),()=>{finished++;visitor.g.position.set(0,.13,2)});
scene.start();let start=performance.now(),elapsed=0;
for(const [name,seconds] of BP_SEQUENCE){
 scene.update(start+(elapsed+seconds*(name==='press-start'?.65:.4))*1000);assert.equal(scene.stage,name);
 if(name==='press-start'){assert(scene.snapshot().leftIndex);assert(scene.snapshot().leftElbow<-.55);assert.equal(scene.snapshot().rightArm,-Math.PI/2)}
 if(name==='inflating'){const a=scene.snapshot().display.pressure;scene.update(start+(elapsed+seconds*.8)*1000);assert(scene.snapshot().display.pressure>a);assert(scene.snapshot().display.pressure<=160)}
 if(name==='result')assert.deepEqual(scene.snapshot().display,{mode:'result',pressure:scene.snapshot().display.pressure,...BP_EXAMPLE});
 elapsed+=seconds;
}
scene.update(start+(elapsed+1)*1000);assert.equal(scene.stage,'complete');assert.equal(finished,1);assert(scene.seated());assert.equal(visitor.g.position.z,2);assert.deepEqual(spaces,['lobby','cardio']);assert(!scene.snapshot().leftIndex);
scene.start();scene.update(performance.now()+28000);assert.equal(scene.snapshot().space,'lobby');assert.equal(spaces.at(-1),'lobby');scene.cancel();assert.equal(scene.stage,'idle');assert.equal(display.value.mode,'idle');assert(!scene.snapshot().leftIndex);assert.equal(visitor.g.position.y,0);
scene.start();scene.update(performance.now()+24500);assert(scene.snapshot().leftIndex);scene.cancel();assert(!scene.snapshot().leftIndex);assert.equal(scene.snapshot().rightArm,0);assert.equal(scene.snapshot().leftElbow,0);
scene.start();start=performance.now();scene.update(start+28000);scene.update(start+100000);assert.equal(scene.stage,'complete');assert.equal(scene.snapshot().space,'cardio');assert.equal(spaces.at(-1),'cardio');assert.equal(finished,2);
const shot=scene.camera(.55);assert(Number.isFinite(shot.position.x));assert(stages.includes('press-start'));
console.log('Blood-pressure sequence: spaces, right arm, left index, rising digits, simulated results, return, cancellation and skipped-frame recovery passed.');
