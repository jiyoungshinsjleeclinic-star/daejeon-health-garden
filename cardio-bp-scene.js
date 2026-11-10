import * as THREE from './vendor/three.module.js';
import {CENTER_PLAN,planPortal} from './center-plan.js?v=return-1';

export const BP_EXAMPLE={systolic:118,diastolic:76,pulse:72};
export const BP_SEQUENCE=[['invitation',5],['standing',1],['room-out',3],['lobby-walk',3],['bp-seat',1],['rest',4],['arm-in',5],['press-start',6],['inflating',8],['result',9],['arm-out',2],['bp-stand',1],['lobby-return',3],['room-in',3],['room-seat',1]];
export function createBPScene(visitor,device,pose,onStage,onSpace,onComplete){
 const display=device.userData.bpDisplay,portal=planPortal(CENTER_PLAN.rooms.cardio),doorX=CENTER_PLAN.rooms.cardio.doorX;
 const outside=new THREE.Vector3(portal.x-1.5,0,portal.z),approach=new THREE.Vector3(device.position.x,0,device.position.z+1.8),chair=new THREE.Vector3(device.position.x,-.27,device.position.z+.9);
 const roomRoute=[new THREE.Vector3(0,0,3.3),new THREE.Vector3(doorX,0,3.3),new THREE.Vector3(doorX,0,4.25)];
 const lobbyRoute=[outside,new THREE.Vector3(3.9,0,4.9),new THREE.Vector3(4.1,0,6.1),approach];
 let active=false,stage='idle',space='cardio',startTime=0,lastPressure=-1;
 function resetPose(){pose(visitor,false);visitor.g.rotation.x=0;visitor.arms.forEach(a=>{a.rotation.set(0,0,0);a.position.z=0;if(a.userData.elbow)a.userData.elbow.rotation.x=0;if(a.userData.indexFinger)a.userData.indexFinger.visible=false})}
 function point(x,y,z){return device.position.clone().add(new THREE.Vector3(x,y*device.scale.y,z))}
 function transition(next){if(stage===next)return;stage=next;const desiredSpace=['lobby-walk','bp-seat','rest','arm-in','press-start','inflating','result','arm-out','bp-stand','lobby-return'].includes(next)?'lobby':'cardio';if(space!==desiredSpace){space=desiredSpace;onSpace(space)}onStage(next)}
 function walk(points,f,reverse,t){
  const lengths=points.slice(1).map((p,i)=>p.distanceTo(points[i]));let distance=THREE.MathUtils.clamp(reverse?1-f:f,0,1)*lengths.reduce((a,b)=>a+b,0);
  for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]||i===lengths.length-1){visitor.g.position.lerpVectors(points[i],points[i+1],Math.min(1,distance/lengths[i]));const d=points[i+1].clone().sub(points[i]).multiplyScalar(reverse?-1:1);visitor.g.rotation.y=Math.atan2(d.x,d.z);break}distance-=lengths[i]}
  visitor.legs.forEach((l,i)=>{l.rotation.x=Math.sin(t*9+i*Math.PI)*.3;if(l.userData.knee)l.userData.knee.rotation.x=Math.max(0,-Math.sin(t*9+i*Math.PI))*.25});visitor.arms.forEach((a,i)=>a.rotation.x=-Math.sin(t*9+i*Math.PI)*.2);
 }
 function cancel(){const wasActive=active;active=false;stage='idle';display?.reset();lastPressure=-1;resetPose();if(wasActive)visitor.g.position.copy(space==='lobby'?approach:roomRoute[0])}
 return{
  start(){cancel();space='cardio';active=true;startTime=performance.now();transition('invitation')},
  cancel,
  get active(){return active},
  get stage(){return stage},
  update(now){
   if(!active)return;let t=Math.max(0,(now-startTime)/1000),entry=null;
   for(const candidate of BP_SEQUENCE){if(t<candidate[1]){entry=candidate;break}t-=candidate[1]}
   if(!entry){active=false;resetPose();if(space!=='cardio'){space='cardio';onSpace(space)}display?.update({mode:'result',...BP_EXAMPLE});onComplete();transition('complete');return}
   const [next,duration]=entry,f=t/duration,s=f*f*(3-2*f);transition(next);resetPose();
   if(next==='invitation'){visitor.g.position.set(0,.13,2);visitor.g.rotation.y=Math.PI;pose(visitor,true)}
   else if(next==='standing'){visitor.g.position.lerpVectors(new THREE.Vector3(0,.13,2),roomRoute[0],s);visitor.g.rotation.y=Math.PI;visitor.legs.forEach(l=>{l.rotation.x=-Math.PI/2*(1-s);if(l.userData.knee)l.userData.knee.rotation.x=Math.PI/2*(1-s)})}
   else if(next==='room-out'||next==='room-in')walk(roomRoute,f,next==='room-in',t);
   else if(next==='lobby-walk'||next==='lobby-return')walk(lobbyRoute,f,next==='lobby-return',t);
   else if(next==='room-seat'){visitor.g.position.lerpVectors(roomRoute[0],new THREE.Vector3(0,.13,2),s);visitor.g.rotation.y=Math.PI;visitor.legs.forEach(l=>{l.rotation.x=-Math.PI/2*s;if(l.userData.knee)l.userData.knee.rotation.x=Math.PI/2*s})}
   else if(next==='bp-seat'||next==='bp-stand'){
    const off=next==='bp-stand';visitor.g.position.lerpVectors(off?chair:approach,off?approach:chair,s);visitor.g.rotation.y=Math.PI;const bend=off?1-s:s;visitor.legs.forEach(l=>{l.rotation.x=-1.2*bend;if(l.userData.knee)l.userData.knee.rotation.x=1.2*bend});
   }
   else{
    visitor.g.position.copy(chair);visitor.g.rotation.y=Math.PI;pose(visitor,true);visitor.legs.forEach(l=>{l.rotation.x=-1.2;if(l.userData.knee)l.userData.knee.rotation.x=1.2});
    const right=visitor.arms[0],left=visitor.arms[1];
    const reach=next==='rest'?0:next==='arm-in'?s:next==='arm-out'?1-s:1;
    right.rotation.x=THREE.MathUtils.lerp(-.3,-Math.PI/2,reach);
    if(next==='press-start'){
     const action=THREE.MathUtils.clamp((t-2.8)/3,0,1),reachLeft=Math.sin(Math.PI*Math.min(1,action/.85));left.rotation.x=THREE.MathUtils.lerp(-.3,.15,reachLeft);left.userData.elbow.rotation.x=-1.565*reachLeft;left.userData.indexFinger.visible=true;
    }
    if(next==='inflating'){const pressure=Math.round(35+125*s);if(pressure!==lastPressure){lastPressure=pressure;display?.update({mode:'inflating',pressure})}}
    if(next==='result'&&display?.value.mode!=='result')display?.update({mode:'result',...BP_EXAMPLE});
   }
  },
  seated(){return['invitation','bp-seat','rest','arm-in','press-start','inflating','result','arm-out','complete'].includes(stage)},
  camera(aspect){
   if(stage==='arm-in'){const focus=point(.32,1.6,.6),offset=new THREE.Vector3(1.7,1.1,1.8).multiplyScalar(aspect<1?1.4:1);return{focus,position:focus.clone().add(offset),fov:50}}
   if(['inflating','result'].includes(stage)){const focus=point(-.355,1.47,.332),distance=Math.max(.85,.66/(2*Math.tan(19*Math.PI/180)*aspect)*1.2);return{focus,position:focus.clone().add(new THREE.Vector3(-.38,.12,distance)),fov:38}}
   if(stage==='press-start'){const focus=point(-.15,1.4,.65),offset=new THREE.Vector3(-1.25,2.75,Math.max(1.4,.9/aspect)).multiplyScalar(aspect<1?1.2:1);return{focus,position:focus.clone().add(offset),fov:42}}
   const focus=visitor.g.position.clone().add(new THREE.Vector3(0,1.15,0));return{focus,position:focus.clone().add(new THREE.Vector3(-2,1.5,3.4)),fov:62};
  },
  snapshot(){return{active,stage,space,rightArm:visitor.arms[0].rotation.x,leftElbow:visitor.arms[1].userData.elbow.rotation.x,leftIndex:visitor.arms[1].userData.indexFinger.visible,display:display?.value||null}}
 };
}
