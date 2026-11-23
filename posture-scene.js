import * as THREE from './vendor/three.module.js';
import {createPostureScanLight} from './posture-scan-light.js?v=1';

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

export function createPostureScene(visitor,staff,device,pose,onStage,onComplete,planWalk){
 const seat=new THREE.Vector3(0,.13,2),staffSeat=new THREE.Vector3(0,.13,-2);
 // Align the soles with the top of the red mat.
 const mat=device.localToWorld(device.userData.postureStandingPoint.clone());
 mat.y-=.02;
 const staffSpot=new THREE.Vector3(device.position.x+.95,0,device.position.z-2.1);
 const staffFacing=Math.atan2(device.position.x-staffSpot.x,device.position.z-1.38-staffSpot.z);
 const approach=new THREE.Vector3(device.position.x-1.8,0,device.position.z+1.65);
 const scanLight=createPostureScanLight(device,visitor);
 let route,staffRoute,visitorReturn,staffReturn;
 let active=false,stage='idle',started=0,scanStarted=0,frame=0;
 const shoes=visitor.shoes.map((shoe,i)=>{const copy=shoe.clone(true);copy.position.set(approach.x+(i?-.16:.16),.42,approach.z);device.parent.add(copy);copy.visible=false;return copy});
 function shoeState(on){visitor.shoes.forEach(s=>s.visible=on);visitor.feet.forEach(f=>f.visible=!on);shoes.forEach(s=>s.visible=!on)}
 function seatBoth(){pose(visitor,false);pose(staff,false);visitor.g.rotation.x=0;staff.g.rotation.x=0;visitor.g.position.copy(seat);visitor.g.rotation.y=Math.PI;pose(visitor,true);staff.g.position.copy(staffSeat);staff.g.rotation.y=0;pose(staff,true);shoeState(true)}
 function walk(model,points,t){
  const lengths=points.slice(1).map((point,index)=>point.distanceTo(points[index]));
  let distance=lengths.reduce((sum,length)=>sum+length,0)*t;
  const index=lengths.findIndex((length,i)=>{
   if(distance<=length||i===lengths.length-1)return true;
   distance-=length;
   return false;
  });
  const a=points[index],b=points[index+1];
  model.g.position.lerpVectors(a,b,Math.min(distance/lengths[index],1));
  model.g.rotation.set(0,Math.atan2(b.x-a.x,b.z-a.z),0);
  model.legs.forEach((leg,i)=>leg.rotation.x=Math.sin(t*36+i*Math.PI)*.25);
  model.arms.forEach((arm,i)=>arm.rotation.x=-Math.sin(t*36+i*Math.PI)*.18);
 }
 function resetAdams(){visitor.upperBody.rotation.x=0;visitor.arms.forEach(arm=>{arm.rotation.set(0,0,0);arm.userData.elbow.rotation.set(0,0,0)})}
 function reset(){if(active)resetAdams();scanLight.stop();active=false;cancelAnimationFrame(frame);stage='idle';seatBoth()}
 const api={
 start(){
  const visitorWalk=planWalk(new THREE.Vector3(0,0,1.025),approach);
  const matWalk=planWalk(approach,mat.clone().setY(0));
  const guideWalk=planWalk(new THREE.Vector3(0,0,-1.025),staffSpot);
  if(!visitorWalk||!matWalk||!guideWalk)return false;
  route=[seat.clone().setY(0),...visitorWalk,...matWalk.slice(1,-1),mat];
  staffRoute=[staffSeat.clone().setY(0),...guideWalk];
  visitorReturn=[...route].reverse();
  staffReturn=[...staffRoute].reverse();
  reset();active=true;started=performance.now();stage='setup';onStage(stage);
  frame=requestAnimationFrame(loop);
  return true;
 },
 cancel:reset,dispose(){reset();scanLight.dispose();shoes.forEach(s=>s.removeFromParent())},get active(){return active},get stage(){return stage},
 update(now){if(!active)return;let elapsed=(now-started)/1000,entry;for(const item of POSTURE_STEPS){if(elapsed<item[1]){entry=item;break}elapsed-=item[1]}if(!entry){resetAdams();scanLight.stop();active=false;seatBoth();onComplete();stage='complete';onStage('complete');return}const [next,duration]=entry,f=elapsed/duration;if(next!==stage){stage=next;scanStarted=now;scanLight.stop();onStage(next)}
 if(['setup','clear-mat','invitation'].includes(next)){pose(visitor,true);visitor.g.position.copy(seat);visitor.g.rotation.y=Math.PI;pose(staff,false);if(next==='setup'){walk(staff,staffRoute,f)}else{staff.g.position.copy(staffSpot);staff.g.rotation.y=staffFacing;staff.g.rotation.x=.27}return}
 if(next==='prepare'){pose(visitor,false);pose(staff,false);walk(visitor,route,f);staff.g.position.copy(staffSpot);staff.g.rotation.x=.22;shoeState(f<.78);return}
 if(next==='return'){pose(visitor,false);pose(staff,false);walk(visitor,visitorReturn,f);walk(staff,staffReturn,f);shoeState(f>=.2);return}
 pose(visitor,false);pose(staff,false);visitor.g.position.copy(mat);staff.g.position.copy(staffSpot);staff.g.rotation.y=staffFacing;staff.g.rotation.x=.27;shoeState(false);
 visitor.g.rotation.x=0;visitor.g.rotation.y=next==='side'||next==='side-ready'?Math.PI/2:next==='rear'||next==='rear-ready'||next==='adams'||next==='adams-ready'||next==='adams-guide'?0:Math.PI;
 resetAdams();
 if(next==='adams'||next==='precautions'){
  const progress=Math.min(f*duration,1);
  const bend=progress*progress*(3-2*progress);
  visitor.g.rotation.y=0;
  bendForAdams(visitor,next==='adams'?bend:1-bend);
 }
 scanLight.update(next,now-scanStarted);
 },camera(aspect){
  if(stage==='setup'){
   const focus=staff.g.position.clone().add(new THREE.Vector3(0,1.17,0));
   const position=new THREE.Vector3(Math.max(-7.25,focus.x-2.8),3.35,THREE.MathUtils.clamp(focus.z+2.7,-5.45,5.55));
   return {focus,position,fov:aspect<1?57:51};
  }
  const focus=visitor.g.position.clone().lerp(staff.g.position,.28).add(new THREE.Vector3(0,1.25,0));
  const position=new THREE.Vector3(aspect<1?2.6:2.1,aspect<1?2.3:2.8,5.6);
  return {focus,position,fov:aspect<1?59:51};
 },snapshot(){return{active,stage,visitorOnMat:visitor.g.position.distanceTo(mat)<.1,staffAtCamera:staff.g.position.distanceTo(staffSpot)<.1,scan:scanLight.snapshot(),shoesOn:visitor.shoes.every(s=>s.visible)}}};
 function loop(now){api.update(now);if(active)frame=requestAnimationFrame(loop)}return api;
}
