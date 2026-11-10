import * as THREE from './vendor/three.module.js';

export const GLUCOSE_SEQUENCE=[['invitation',5],['finger-forward',4],['preparing',5],['measuring',3],['result',8],['finishing',4],['staff-back',5]];
export function createGlucoseScene(visitor,employee,device,pose,onStage,onComplete){
 const home=device.position.clone(),rotation=device.quaternion.clone(),display=device.userData.glucoseDisplay;
 const staffRoute=[new THREE.Vector3(0,0,-2),new THREE.Vector3(-2.25,0,-2),new THREE.Vector3(-2.25,0,1.33),new THREE.Vector3(-1.42,0,1.33)];
 let active=false,stage='idle',startTime=0;const heldPosition=home.clone();
 function resetArms(person){person.arms.forEach(a=>{a.rotation.set(0,0,0);a.position.z=0;if(a.userData.elbow)a.userData.elbow.rotation.x=0;if(a.userData.indexFinger)a.userData.indexFinger.visible=false})}
 function restoreStaff(){employee.g.position.set(0,.13,-2);employee.g.rotation.set(0,0,0);resetArms(employee);pose(employee,true)}
 function restoreMeter(){device.position.copy(home);device.quaternion.copy(rotation)}
 function transition(next){if(stage!==next){stage=next;onStage(next)}}
 function walkStaff(f,back=false){
  const lengths=staffRoute.slice(1).map((p,i)=>p.distanceTo(staffRoute[i]));let distance=THREE.MathUtils.clamp(back?1-f:f,0,1)*lengths.reduce((a,b)=>a+b,0);
  for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]||i===lengths.length-1){employee.g.position.lerpVectors(staffRoute[i],staffRoute[i+1],Math.min(1,distance/lengths[i]));const d=staffRoute[i+1].clone().sub(staffRoute[i]).multiplyScalar(back?-1:1);employee.g.rotation.y=Math.atan2(d.x,d.z);break}distance-=lengths[i]}
  employee.legs.forEach((l,i)=>{l.rotation.x=Math.sin(f*36+i*Math.PI)*.25});employee.arms.forEach((a,i)=>a.rotation.x=-Math.sin(f*36+i*Math.PI)*.18);
 }
 function finger(reach){const left=visitor.arms[1];left.rotation.x=THREE.MathUtils.lerp(-.3,-.65,reach);left.userData.elbow.rotation.x=-.95*reach;left.userData.indexFinger.visible=reach>.1}
 function fingertip(){visitor.g.updateWorldMatrix(true,true);return visitor.arms[1].userData.elbow.localToWorld(new THREE.Vector3(.02,-.505,0))}
 function holdMeter(f=1){
  const point=fingertip(),target=point.clone().add(new THREE.Vector3(-.52,-.055,0));heldPosition.copy(target);device.position.lerpVectors(home,target,f);device.quaternion.slerpQuaternions(rotation,new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI/2),f);
 }
 function cancel(){const wasActive=active;active=false;stage='idle';restoreMeter();display?.reset();restoreStaff();resetArms(visitor);if(wasActive){visitor.g.position.set(0,.13,2);visitor.g.rotation.set(0,Math.PI,0);pose(visitor,true)}}
 return{
  start(){cancel();active=true;startTime=performance.now();visitor.g.position.set(0,.13,2);visitor.g.rotation.set(0,Math.PI,0);pose(visitor,true);transition('invitation')},
  cancel,
  dispose:cancel,
  get active(){return active},
  get stage(){return stage},
  update(now){
   if(!active)return;let t=Math.max(0,(now-startTime)/1000),entry=null;
   for(const candidate of GLUCOSE_SEQUENCE){if(t<candidate[1]){entry=candidate;break}t-=candidate[1]}
   if(!entry){active=false;resetArms(visitor);pose(visitor,true);restoreMeter();restoreStaff();display?.update('result');onComplete();transition('complete');return}
   const [next,duration]=entry,f=t/duration,s=f*f*(3-2*f);transition(next);resetArms(visitor);pose(visitor,true);resetArms(employee);pose(employee,false);
   visitor.g.position.set(0,.13,2);visitor.g.rotation.set(0,Math.PI,0);
   const reach=next==='invitation'?0:next==='finger-forward'?s:next==='finishing'?1-s:next==='staff-back'?0:1;finger(reach);
   if(next==='invitation'||next==='finger-forward'){restoreStaff();restoreMeter()}
   else if(next==='preparing'){walkStaff(f);holdMeter(s)}
   else if(next==='staff-back'){walkStaff(f,true);restoreMeter()}
   else{
    employee.g.position.copy(staffRoute.at(-1));employee.g.rotation.set(0,Math.PI/2,0);employee.arms.forEach((a,i)=>{a.rotation.x=-1.2;a.rotation.z=i===0?.45:-.45});
    if(next==='finishing'){device.position.lerpVectors(heldPosition,home,s);device.quaternion.slerpQuaternions(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI/2),rotation,s)}else holdMeter();
    if(next==='measuring'&&display?.value.mode!=='measuring')display?.update('measuring');
    if(next==='result'&&display?.value.mode!=='result')display?.update('result');
   }
  },
  camera(aspect){
   if(['measuring','result'].includes(stage)){
    device.updateWorldMatrix(true,true);const focus=device.userData.glucoseScreen?.getWorldPosition(new THREE.Vector3())||device.position.clone();if(aspect<1)focus.y-=.025;
    const offset=new THREE.Vector3(0,.4,.35).applyQuaternion(device.quaternion).multiplyScalar(Math.max(1,.214/(2*Math.tan(17*Math.PI/180)*aspect)*1.2/.53));return{focus,position:focus.clone().add(offset),fov:34};
   }
   const focus=new THREE.Vector3(-.4,1.35,1.4);return{focus,position:focus.clone().add(new THREE.Vector3(-1.6,1.3,1.2).multiplyScalar(aspect<1?1.2:1)),fov:50};
  },
  snapshot(){return{active,stage,leftIndex:visitor.arms[1].userData.indexFinger.visible,leftElbow:visitor.arms[1].userData.elbow.rotation.x,display:display?.value||null,meterX:device.position.x,meterY:device.position.y,meterZ:device.position.z}}
 };
}
