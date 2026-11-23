import * as THREE from './vendor/three.module.js';

export const POSTURE_STEPS=[
 ['setup',4],['clear-mat',4],['invitation',4],['prepare',7],['front-ready',4],['front',7],['side-ready',3],['side',7],['rear-ready',3],['rear',7],['adams-ready',3],['adams-guide',7],['adams',7],['precautions',6],['remeasure',6],['summary',6],['finish',4],['return',6]
];

function bendForAdams(visitor, amount){
 const {upperBody,arms,legs}=visitor;
 upperBody.rotation.x=Math.PI / 2;
 arms.forEach((arm,index)=>{
  const elbow=arm.userData.elbow;
  // Solve the shoulder and elbow angles in the character's local coordinates.
  const shoulder=arm.position.clone().applyEuler(upperBody.rotation).add(upperBody.position);
  const knee=legs[index].userData.knee.position.clone().add(legs[index].position);
  const palmCenter=knee.add(new THREE.Vector3(0,.055,.144));
  const reach=palmCenter.clone().sub(shoulder);
  const distance=reach.length();
  const direction=reach.normalize();
  const forearm=new THREE.Vector3(0,-.294,.026);
  const upperLength=-elbow.position.y;
  const along=(distance**2+upperLength**2-forearm.lengthSq())/(2*distance);
  const elbowOut=new THREE.Vector3(Math.sign(arm.position.x),0,0);
  elbowOut.addScaledVector(direction,-elbowOut.dot(direction)).normalize();
  const upperDirection=direction.multiplyScalar(along).addScaledVector(elbowOut,Math.sqrt(Math.max(0,upperLength**2-along**2)));
  const lowerDirection=palmCenter.sub(shoulder).sub(upperDirection);
  const inverseBody=upperBody.quaternion.clone().invert();
  arm.quaternion.setFromUnitVectors(new THREE.Vector3(0,-1,0),upperDirection.applyQuaternion(inverseBody).normalize());
  elbow.quaternion.setFromUnitVectors(forearm.normalize(),lowerDirection.applyQuaternion(inverseBody).applyQuaternion(arm.quaternion.clone().invert()).normalize());
  const relaxed=new THREE.Quaternion();
  arm.quaternion.copy(relaxed.clone().slerp(arm.quaternion,amount));
  elbow.quaternion.copy(relaxed.slerp(elbow.quaternion,amount));
 });
 upperBody.rotation.x*=amount;
}

export function createPostureScene(visitor,staff,device,pose,onStage,onComplete){
 const seat=new THREE.Vector3(0,.13,2),staffSeat=new THREE.Vector3(0,.13,-2);
 // Align the soles with the top of the red mat.
 const mat=new THREE.Vector3(device.position.x,.059,device.position.z+.35),staffSpot=new THREE.Vector3(device.position.x-1.45,0,device.position.z-1.25);
 const approach=new THREE.Vector3(device.position.x-1.8,0,device.position.z+1.65);
 const route=[new THREE.Vector3(0,0,2),new THREE.Vector3(0,0,5.65),new THREE.Vector3(4.6,0,5.65),approach,mat];
 let active=false,stage='idle',started=0,frame=0;
 const shoes=visitor.shoes.map((shoe,i)=>{const copy=shoe.clone(true);copy.position.set(approach.x+(i?-.16:.16),.42,approach.z);device.parent.add(copy);copy.visible=false;return copy});
 function shoeState(on){visitor.shoes.forEach(s=>s.visible=on);visitor.feet.forEach(f=>f.visible=!on);shoes.forEach(s=>s.visible=!on)}
 function seatBoth(){pose(visitor,false);pose(staff,false);visitor.g.rotation.x=0;staff.g.rotation.x=0;visitor.g.position.copy(seat);visitor.g.rotation.y=Math.PI;pose(visitor,true);staff.g.position.copy(staffSeat);staff.g.rotation.y=0;pose(staff,true);shoeState(true)}
 function walk(model,points,t){const segment=Math.min(points.length-2,Math.floor(t*(points.length-1))),f=Math.min(1,t*(points.length-1)-segment),a=points[segment],b=points[segment+1];model.g.position.lerpVectors(a,b,f);model.g.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);model.legs.forEach((leg,i)=>leg.rotation.x=Math.sin(t*36+i*Math.PI)*.25)}
 function resetAdams(){visitor.upperBody.rotation.x=0;visitor.arms.forEach(arm=>{arm.rotation.set(0,0,0);arm.userData.elbow.rotation.set(0,0,0)})}
 function reset(){if(active)resetAdams();active=false;cancelAnimationFrame(frame);stage='idle';seatBoth()}
 const api={start(){reset();active=true;started=performance.now();onStage('setup');frame=requestAnimationFrame(loop)},cancel:reset,dispose(){reset();shoes.forEach(s=>s.removeFromParent())},get active(){return active},get stage(){return stage},
 update(now){if(!active)return;let elapsed=(now-started)/1000,entry;for(const item of POSTURE_STEPS){if(elapsed<item[1]){entry=item;break}elapsed-=item[1]}if(!entry){resetAdams();active=false;seatBoth();onComplete();stage='complete';onStage('complete');return}const [next,duration]=entry,f=elapsed/duration;if(next!==stage){stage=next;onStage(next)}
 if(['setup','clear-mat','invitation'].includes(next)){pose(visitor,true);visitor.g.position.copy(seat);visitor.g.rotation.y=Math.PI;pose(staff,false);if(next==='setup'){walk(staff,[staffSeat.clone().setY(0),new THREE.Vector3(0,0,4.8),new THREE.Vector3(4.65,0,4.8),staffSpot],f)}else{staff.g.position.copy(staffSpot);staff.g.rotation.y=0;staff.g.rotation.x=.27}return}
 if(next==='prepare'){pose(visitor,false);pose(staff,false);walk(visitor,route,f);staff.g.position.copy(staffSpot);staff.g.rotation.x=.22;shoeState(f<.78);return}
 if(next==='return'){pose(visitor,false);pose(staff,false);walk(visitor,[...route].reverse(),f);staff.g.position.lerpVectors(staffSpot,staffSeat,f);shoeState(f<.2?false:true);return}
 pose(visitor,false);pose(staff,false);visitor.g.position.copy(mat);staff.g.position.copy(staffSpot);staff.g.rotation.y=0;staff.g.rotation.x=.27;shoeState(false);
 visitor.g.rotation.x=0;visitor.g.rotation.y=next==='side'||next==='side-ready'?Math.PI/2:next==='rear'||next==='rear-ready'||next==='adams'||next==='adams-ready'||next==='adams-guide'?0:Math.PI;
 resetAdams();
 if(next==='adams'||next==='precautions'){
  const progress=Math.min(f*duration,1);
  const bend=progress*progress*(3-2*progress);
  visitor.g.rotation.y=0;
  bendForAdams(visitor,next==='adams'?bend:1-bend);
 }
 },camera(aspect){const focus=visitor.g.position.clone().lerp(staff.g.position,.28).add(new THREE.Vector3(0,1.25,0));const position=new THREE.Vector3(aspect<1?2.6:2.1,aspect<1?2.3:2.8,5.6);return{focus,position,fov:aspect<1?59:51}},snapshot(){return{active,stage,visitorOnMat:visitor.g.position.distanceTo(mat)<.1,staffAtCamera:staff.g.position.distanceTo(staffSpot)<.1,shoesOn:visitor.shoes.every(s=>s.visible)}}};
 function loop(now){api.update(now);if(active)frame=requestAnimationFrame(loop)}return api;
}
