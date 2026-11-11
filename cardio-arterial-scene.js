import * as THREE from './vendor/three.module.js';

export const ARTERIAL_SEQUENCE=[['invitation',8],['standing',1],['walking-bed',5],['shoes-off',2],['lying-down',3],['staff-standing',1],['staff-walking',4],['cuff-arms',5],['cuff-legs',5],['wrist-clips',4],['question-phone',4],['question-birth',4],['question-height',4],['still',4],['measuring',7],['result',10],['finish-message',4],['sitting-up',2],['shoes-on',2],['walking-back',5],['sitting',1]];

export function createArterialScene(visitor,employee,bed,device,pose,onStage,onComplete){
 const display=device.userData.arterialDisplay,bedPoint=new THREE.Vector3(bed.position.x,1.06,bed.position.z+.72),bedSide=new THREE.Vector3(bed.position.x-1.35,0,bed.position.z+1.15),seatPoint=new THREE.Vector3(0,.13,2);
 const visitorRoute=[new THREE.Vector3(0,0,3.3),new THREE.Vector3(2.2,0,3.3),new THREE.Vector3(2.2,0,2),bedSide];
 const staffRoute=[new THREE.Vector3(0,.13,-2),new THREE.Vector3(1.7,0,-2),new THREE.Vector3(2.35,0,-1.25),new THREE.Vector3(2.35,0,.25)];
 const looseShoes=new THREE.Group();bed.parent.add(looseShoes);looseShoes.visible=false;
 visitor.shoes.forEach((shoe,index)=>{const copy=shoe.clone(true);copy.position.set(bed.position.x-1.18+(index?-.18:.18),.16,bed.position.z+1.35);copy.rotation.y=Math.PI/2;looseShoes.add(copy)});
 const cuffMaterial=new THREE.MeshStandardMaterial({color:'#718aa0',roughness:.82}),clipMaterial=new THREE.MeshStandardMaterial({color:'#d3e0db',metalness:.25,roughness:.45});
 const cuffs=[];for(const limb of [...visitor.arms,...visitor.legs]){const cuff=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,.21,20,1,true),cuffMaterial);cuff.position.set(0,-.16,0);cuff.visible=false;limb.add(cuff);cuffs.push(cuff)}
 const clips=[];for(const arm of visitor.arms){const clip=new THREE.Mesh(new THREE.BoxGeometry(.09,.11,.13),clipMaterial);clip.position.set(0,-.34,.03);clip.visible=false;arm.userData.elbow.add(clip);clips.push(clip)}
 let active=false,stage='idle',startTime=0;
 const setShoes=on=>{visitor.shoes.forEach(shoe=>shoe.visible=on);visitor.feet.forEach(foot=>foot.visible=!on);looseShoes.visible=!on};
 const setSensors=(armCount=0,legCount=0,clipCount=0)=>{cuffs.forEach((cuff,index)=>cuff.visible=index<(armCount+legCount)&&(index<2?index<armCount:index<2+legCount));clips.forEach((clip,index)=>clip.visible=index<clipCount)};
 function resetPerson(person,seated=false){person.g.rotation.set(0,seated?Math.PI:0,0);pose(person,seated);person.arms.forEach(arm=>{arm.rotation.set(seated?-.3:0,0,0);arm.position.z=0;if(arm.userData.elbow)arm.userData.elbow.rotation.x=0;if(arm.userData.indexFinger)arm.userData.indexFinger.visible=false})}
 function restoreStaff(){employee.g.position.set(0,.13,-2);resetPerson(employee,true)}
 function transition(next){if(stage!==next){stage=next;onStage(next)}}
 function routeWalk(person,points,f,reverse=false){const lengths=points.slice(1).map((p,index)=>p.distanceTo(points[index]));let distance=THREE.MathUtils.clamp(reverse?1-f:f,0,1)*lengths.reduce((sum,n)=>sum+n,0);for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]||i===lengths.length-1){person.g.position.lerpVectors(points[i],points[i+1],Math.min(1,distance/lengths[i]));const direction=points[i+1].clone().sub(points[i]).multiplyScalar(reverse?-1:1);person.g.rotation.y=Math.atan2(direction.x,direction.z);break}distance-=lengths[i]}person.legs.forEach((leg,index)=>leg.rotation.x=Math.sin(f*34+index*Math.PI)*.28);person.arms.forEach((arm,index)=>arm.rotation.x=-Math.sin(f*34+index*Math.PI)*.2)}
 function lying(){pose(visitor,false);visitor.g.position.copy(bedPoint);visitor.g.rotation.set(-Math.PI/2,0,0);visitor.arms.forEach(arm=>arm.rotation.set(0,0,0));visitor.legs.forEach(leg=>{leg.rotation.set(0,0,0);leg.userData.knee.rotation.x=0})}
 function show(mode){if(display?.value.mode!==mode){if(mode==='idle')display?.reset();else display?.update(mode)}}
 function cancel(){const wasActive=active;active=false;stage='idle';display?.reset();setSensors();setShoes(true);restoreStaff();resetPerson(visitor,true);if(wasActive)visitor.g.position.copy(seatPoint)}
 return{
  start(){cancel();active=true;startTime=performance.now();visitor.g.position.copy(seatPoint);resetPerson(visitor,true);transition('invitation')},cancel,
  dispose(){cancel();looseShoes.removeFromParent();cuffs.forEach(cuff=>cuff.removeFromParent());clips.forEach(clip=>clip.removeFromParent());cuffMaterial.dispose();clipMaterial.dispose()},get active(){return active},get stage(){return stage},
  update(now){
   if(!active)return;let t=Math.max(0,(now-startTime)/1000),entry=null;for(const candidate of ARTERIAL_SEQUENCE){if(t<candidate[1]){entry=candidate;break}t-=candidate[1]}
   if(!entry){active=false;setSensors();setShoes(true);restoreStaff();visitor.g.position.copy(seatPoint);resetPerson(visitor,true);display?.update('result');onComplete();transition('complete');return}
   const [next,duration]=entry,f=t/duration,s=f*f*(3-2*f);transition(next);setSensors();setShoes(true);if(!['result','finish-message'].includes(next))show('idle');
   if(next==='invitation'){visitor.g.position.copy(seatPoint);resetPerson(visitor,true);restoreStaff()}
   else if(next==='standing'){resetPerson(visitor,false);visitor.g.position.lerpVectors(seatPoint,visitorRoute[0],s);visitor.legs.forEach(leg=>{leg.rotation.x=-Math.PI/2*(1-s);leg.userData.knee.rotation.x=Math.PI/2*(1-s)});restoreStaff()}
   else if(next==='walking-bed'||next==='walking-back'){resetPerson(visitor,false);routeWalk(visitor,visitorRoute,f,next==='walking-back');restoreStaff();if(next==='walking-back')setShoes(true)}
   else if(next==='shoes-off'){resetPerson(visitor,false);visitor.g.position.copy(bedSide);visitor.g.rotation.y=Math.PI/2;const bend=Math.sin(Math.PI*f);visitor.g.rotation.x=bend*.38;visitor.arms.forEach(arm=>arm.rotation.x=-bend*.65);setShoes(f<.55);restoreStaff()}
   else if(next==='lying-down'){setShoes(false);resetPerson(visitor,false);visitor.g.position.lerpVectors(bedSide,bedPoint,s);visitor.g.rotation.x=-Math.PI/2*s;visitor.g.rotation.y=THREE.MathUtils.lerp(Math.PI/2,0,s);restoreStaff()}
   else if(next==='sitting-up'){lying();setSensors();visitor.g.position.lerpVectors(bedPoint,bedSide,s);visitor.g.rotation.x=-Math.PI/2*(1-s);visitor.g.rotation.y=Math.PI/2*s;restoreStaff()}
   else if(next==='shoes-on'){resetPerson(visitor,false);visitor.g.position.copy(bedSide);visitor.g.rotation.y=Math.PI/2;const bend=Math.sin(Math.PI*f);visitor.g.rotation.x=bend*.38;visitor.arms.forEach(arm=>arm.rotation.x=-bend*.65);setShoes(f>=.55);restoreStaff()}
   else if(next==='sitting'){resetPerson(visitor,false);visitor.g.position.lerpVectors(visitorRoute[0],seatPoint,s);visitor.g.rotation.y=Math.PI;visitor.legs.forEach(leg=>{leg.rotation.x=-Math.PI/2*s;leg.userData.knee.rotation.x=Math.PI/2*s});restoreStaff()}
   else{
    lying();setShoes(false);const armsOn=!['staff-standing','staff-walking'].includes(next),legsOn=!['staff-standing','staff-walking','cuff-arms'].includes(next),clipsOn=!['staff-standing','staff-walking','cuff-arms','cuff-legs'].includes(next);setSensors(armsOn?2:0,legsOn?2:0,clipsOn?2:0);
    if(next==='staff-standing'){employee.g.position.lerpVectors(staffRoute[0],new THREE.Vector3(0,0,-2),s);resetPerson(employee,false);employee.legs.forEach(leg=>{leg.rotation.x=-Math.PI/2*(1-s);leg.userData.knee.rotation.x=Math.PI/2*(1-s)})}
    else if(next==='staff-walking'){resetPerson(employee,false);routeWalk(employee,staffRoute,f)}
    else{resetPerson(employee,false);employee.g.position.copy(staffRoute.at(-1));employee.g.rotation.y=Math.PI/2;employee.arms.forEach((arm,index)=>{arm.rotation.x=-.9;arm.rotation.z=index?-.35:.35});if(next==='result'||next==='finish-message')show('result')}
   }
  },
  camera(aspect){if(stage==='result'){device.updateWorldMatrix(true,true);const screen=device.userData.arterialScreen?.getWorldPosition(new THREE.Vector3())||device.position.clone(),focus=screen.clone();focus.x-=aspect<1?.06:.12;focus.y-=aspect<1?.04:.06;const position=screen.clone().add(new THREE.Vector3(0,.16,aspect<1?1.05:.92));return{focus,position,fov:36}}const focus=bed.position.clone().add(new THREE.Vector3(-.1,1.05,.2));return{focus,position:focus.clone().add(new THREE.Vector3(-3.2,2.1,4.2).multiplyScalar(aspect<1?1.25:1)),fov:52}},
  snapshot(){return{active,stage,lying:visitor.g.rotation.x< -1.4,shoesOn:visitor.shoes.every(shoe=>shoe.visible),looseShoesVisible:looseShoes.visible,armCuffs:cuffs.slice(0,2).filter(cuff=>cuff.visible).length,legCuffs:cuffs.slice(2).filter(cuff=>cuff.visible).length,wristClips:clips.filter(clip=>clip.visible).length,display:display?.value||null,staffSeated:employee.legs[0].rotation.x===-Math.PI/2}}
 };
}
