import * as THREE from './vendor/three.module.js';

export const CHOLESTEROL_SEQUENCE=[['invitation',5],['ring-forward',4],['code-check',3],['strip-insert',3],['finger-prep',4],['sample',4],['waiting',5],['staff-return',5],['result-total',6],['result-triglyceride',6],['result-ldl',6],['result-hdl',8]];
export function createCholesterolScene(visitor,employee,device,pose,onStage,onComplete){
 const home=device.position.clone(),rotation=device.quaternion.clone(),display=device.userData.cholesterolDisplay,strip=device.userData.cholesterolStrip;
 const left=visitor.arms[1],ringFinger=left.userData.indexFinger.clone(true);ringFinger.position.x=-.04;ringFinger.visible=false;left.userData.elbow.add(ringFinger);
 const staffRoute=[new THREE.Vector3(0,0,-2),new THREE.Vector3(-2.25,0,-2),new THREE.Vector3(-2.25,0,1.32),new THREE.Vector3(-1.35,0,1.32)];
 let active=false,stage='idle',startTime=0;const heldPosition=home.clone(),heldRotation=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI/2),stripTip=new THREE.Vector3(0,.055,.5356);
 function resetArms(person){person.arms.forEach(a=>{a.rotation.set(0,0,0);a.position.z=0;if(a.userData.elbow)a.userData.elbow.rotation.x=0;if(a.userData.indexFinger)a.userData.indexFinger.visible=false});if(person===visitor)ringFinger.visible=false}
 function restoreStaff(){employee.g.position.set(0,.13,-2);employee.g.rotation.set(0,0,0);resetArms(employee);pose(employee,true)}
 function restoreMeter(){device.position.copy(home);device.quaternion.copy(rotation);if(strip)strip.visible=false}
 function transition(next){if(stage!==next){stage=next;onStage(next)}}
 function walkStaff(f,back=false){
  const lengths=staffRoute.slice(1).map((p,i)=>p.distanceTo(staffRoute[i]));let distance=THREE.MathUtils.clamp(back?1-f:f,0,1)*lengths.reduce((a,b)=>a+b,0);
  for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]||i===lengths.length-1){employee.g.position.lerpVectors(staffRoute[i],staffRoute[i+1],Math.min(1,distance/lengths[i]));const d=staffRoute[i+1].clone().sub(staffRoute[i]).multiplyScalar(back?-1:1);employee.g.rotation.y=Math.atan2(d.x,d.z);break}distance-=lengths[i]}
  employee.legs.forEach((l,i)=>{l.rotation.x=Math.sin(f*36+i*Math.PI)*.25});employee.arms.forEach((a,i)=>a.rotation.x=-Math.sin(f*36+i*Math.PI)*.18);
 }
 function ring(reach){left.rotation.x=THREE.MathUtils.lerp(-.3,-.65,reach);left.userData.elbow.rotation.x=-.95*reach;ringFinger.visible=reach>.1}
 function fingertip(){visitor.g.updateWorldMatrix(true,true);return left.userData.elbow.localToWorld(new THREE.Vector3(-.02,-.505,0))}
 function holdMeter(f=1){const point=fingertip(),target=point.clone().sub(stripTip.clone().applyQuaternion(heldRotation));heldPosition.copy(target);device.position.lerpVectors(home,target,f);device.quaternion.slerpQuaternions(rotation,heldRotation,f)}
 function show(mode){if(display?.value.mode!==mode)display?.update(mode)}
 function cancel(){const wasActive=active;active=false;stage='idle';restoreMeter();display?.reset();restoreStaff();resetArms(visitor);if(wasActive){visitor.g.position.set(0,.13,2);visitor.g.rotation.set(0,Math.PI,0);pose(visitor,true)}}
 return{
  start(){cancel();active=true;startTime=performance.now();visitor.g.position.set(0,.13,2);visitor.g.rotation.set(0,Math.PI,0);pose(visitor,true);transition('invitation')},
  cancel,
  dispose(){cancel();ringFinger.removeFromParent()},
  get active(){return active},get stage(){return stage},
  update(now){
   if(!active)return;let t=Math.max(0,(now-startTime)/1000),entry=null;
   for(const candidate of CHOLESTEROL_SEQUENCE){if(t<candidate[1]){entry=candidate;break}t-=candidate[1]}
   if(!entry){active=false;resetArms(visitor);pose(visitor,true);restoreMeter();restoreStaff();display?.update('result-hdl');onComplete();transition('complete');return}
   const [next,duration]=entry,f=t/duration,s=f*f*(3-2*f);transition(next);resetArms(visitor);pose(visitor,true);resetArms(employee);pose(employee,false);
   visitor.g.position.set(0,.13,2);visitor.g.rotation.set(0,Math.PI,0);const isResult=next.startsWith('result-'),reach=next==='invitation'?0:next==='ring-forward'?s:next==='staff-return'?1-s:isResult?0:1;ring(reach);
   if(next==='invitation'||next==='ring-forward'){restoreStaff();restoreMeter()}
   else if(next==='code-check'){walkStaff(f);device.position.copy(home);show('code-check')}
   else if(next==='staff-return'){walkStaff(f,true);device.position.lerpVectors(heldPosition,home,s);device.quaternion.slerpQuaternions(heldRotation,rotation,s);if(strip)strip.visible=true;show('waiting')}
   else if(isResult){restoreStaff();device.position.copy(home);device.quaternion.copy(rotation);if(strip)strip.visible=true;show(next)}
   else{
    employee.g.position.copy(staffRoute.at(-1));employee.g.rotation.set(0,Math.PI/2,0);employee.arms.forEach((a,i)=>{a.rotation.x=-1.2;a.rotation.z=i===0?.45:-.45});
    holdMeter(next==='strip-insert'?s:1);if(strip)strip.visible=true;
    if(next==='strip-insert')show('strip-insert');
    if(next==='finger-prep')show('finger-prep');
    if(next==='sample')show('sample');
    if(next==='waiting')show('waiting');
   }
  },
  camera(aspect){
   if(['code-check','strip-insert','sample','waiting'].includes(stage)||stage.startsWith('result-')){device.updateWorldMatrix(true,true);const screen=device.userData.cholesterolScreen?.getWorldPosition(new THREE.Vector3())||device.position.clone(),result=stage.startsWith('result-'),focus=screen.clone();if(result){focus.x-=aspect<1?.06:.14;focus.y-=aspect<1?.18:.12}else if(aspect<1)focus.y-=.025;const distance=Math.max(1,.276/(2*Math.tan(17*Math.PI/180)*aspect)*1.2/.62)*(result?1.55:1),offset=new THREE.Vector3(0,.44,.38).applyQuaternion(device.quaternion).multiplyScalar(distance);return{focus,position:screen.clone().add(offset),fov:34}}
   const focus=new THREE.Vector3(-.4,1.35,1.4);return{focus,position:focus.clone().add(new THREE.Vector3(-1.6,1.3,1.2).multiplyScalar(aspect<1?1.2:1)),fov:50};
  },
  snapshot(){return{active,stage,leftRing:ringFinger.visible,leftElbow:left.userData.elbow.rotation.x,display:display?.value||null,stripVisible:!!strip?.visible,staffSeated:employee.legs[0].rotation.x===-Math.PI/2,meterX:device.position.x,meterY:device.position.y,meterZ:device.position.z}}
 };
}
