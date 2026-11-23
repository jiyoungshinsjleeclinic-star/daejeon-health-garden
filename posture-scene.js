import * as THREE from './vendor/three.module.js';

export const POSTURE_STEPS=[
 ['setup',4],['clear-mat',4],['invitation',4],['prepare',7],['front-ready',4],['front',7],['side-ready',3],['side',7],['rear-ready',3],['rear',7],['adams-guide',7],['adams',7],['precautions',6],['remeasure',6],['summary',6],['finish',4],['return',6]
];
export function createPostureScene(visitor,staff,device,pose,onStage,onComplete){
 const seat=new THREE.Vector3(0,.13,2),staffSeat=new THREE.Vector3(0,.13,-2);
 const mat=new THREE.Vector3(device.position.x,0,device.position.z+.35),staffSpot=new THREE.Vector3(device.position.x-1.45,0,device.position.z-1.25);
 const approach=new THREE.Vector3(device.position.x-1.8,0,device.position.z+1.65);
 const route=[new THREE.Vector3(0,0,2),new THREE.Vector3(0,0,5.65),new THREE.Vector3(4.6,0,5.65),approach,mat];
 let active=false,stage='idle',started=0,frame=0;
 const shoes=visitor.shoes.map((shoe,i)=>{const copy=shoe.clone(true);copy.position.set(approach.x+(i?-.16:.16),.42,approach.z);device.parent.add(copy);copy.visible=false;return copy});
 function shoeState(on){visitor.shoes.forEach(s=>s.visible=on);visitor.feet.forEach(f=>f.visible=!on);shoes.forEach(s=>s.visible=!on)}
 function seatBoth(){pose(visitor,false);pose(staff,false);visitor.g.rotation.x=0;staff.g.rotation.x=0;visitor.g.position.copy(seat);visitor.g.rotation.y=Math.PI;pose(visitor,true);staff.g.position.copy(staffSeat);staff.g.rotation.y=0;pose(staff,true);shoeState(true)}
 function walk(model,points,t){const segment=Math.min(points.length-2,Math.floor(t*(points.length-1))),f=Math.min(1,t*(points.length-1)-segment),a=points[segment],b=points[segment+1];model.g.position.lerpVectors(a,b,f);model.g.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);model.legs.forEach((leg,i)=>leg.rotation.x=Math.sin(t*36+i*Math.PI)*.25)}
 function reset(){active=false;cancelAnimationFrame(frame);stage='idle';seatBoth()}
 const api={start(){reset();active=true;started=performance.now();onStage('setup');frame=requestAnimationFrame(loop)},cancel:reset,dispose(){reset();shoes.forEach(s=>s.removeFromParent())},get active(){return active},get stage(){return stage},
 update(now){if(!active)return;let elapsed=(now-started)/1000,entry;for(const item of POSTURE_STEPS){if(elapsed<item[1]){entry=item;break}elapsed-=item[1]}if(!entry){active=false;seatBoth();onComplete();stage='complete';onStage('complete');return}const [next,duration]=entry,f=elapsed/duration;if(next!==stage){stage=next;onStage(next)}
 if(['setup','clear-mat','invitation'].includes(next)){pose(visitor,true);visitor.g.position.copy(seat);visitor.g.rotation.y=Math.PI;pose(staff,false);if(next==='setup'){walk(staff,[staffSeat.clone().setY(0),new THREE.Vector3(0,0,4.8),new THREE.Vector3(4.65,0,4.8),staffSpot],f)}else{staff.g.position.copy(staffSpot);staff.g.rotation.y=0;staff.g.rotation.x=.27}return}
 if(next==='prepare'){pose(visitor,false);pose(staff,false);walk(visitor,route,f);staff.g.position.copy(staffSpot);staff.g.rotation.x=.22;shoeState(f<.78);return}
 if(next==='return'){pose(visitor,false);pose(staff,false);walk(visitor,[...route].reverse(),f);staff.g.position.lerpVectors(staffSpot,staffSeat,f);shoeState(f<.2?false:true);return}
 pose(visitor,false);pose(staff,false);visitor.g.position.copy(mat);staff.g.position.copy(staffSpot);staff.g.rotation.y=0;staff.g.rotation.x=.27;shoeState(false);
 visitor.g.rotation.x=(next==='adams'||next==='adams-guide')?.78:0;visitor.g.rotation.y=next==='side'||next==='side-ready'?Math.PI/2:next==='rear'||next==='rear-ready'||next==='adams'||next==='adams-guide'?0:Math.PI;
 if(next==='adams'){visitor.arms.forEach(a=>a.rotation.x=-.65)}
 },camera(aspect){const focus=visitor.g.position.clone().lerp(staff.g.position,.28).add(new THREE.Vector3(0,1.25,0));return{focus,position:focus.clone().add(new THREE.Vector3(aspect<1?2.8:4,aspect<1?1.5:1.9,aspect<1?3.5:4.8)),fov:aspect<1?55:48}},snapshot(){return{active,stage,visitorOnMat:visitor.g.position.distanceTo(mat)<.1,staffAtCamera:staff.g.position.distanceTo(staffSpot)<.1,shoesOn:visitor.shoes.every(s=>s.visible)}}};
 function loop(now){api.update(now);if(active)frame=requestAnimationFrame(loop)}return api;
}
