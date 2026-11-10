import * as THREE from './vendor/three.module.js';

export const HEIGHT_SEQUENCE=[['invitation',3],['walking',6],['shoes-off',2],['stepping-on',1.5],['ready',1],['head-down',2],['head-hold',1],['head-up',2],['step-down-request',2],['stepping-off',1.5],['shoes-on',2],['walking-back',6],['sitting',1]];
export function createHeightScene(visitor,device,pose,onStage,onComplete){
 const head=device.userData.heightHead,home=head.position.y,platformY=.24;
 const approach=new THREE.Vector3(device.position.x,0,device.position.z+1.35);
 const platform=new THREE.Vector3(device.position.x,platformY,device.position.z+.12);
 const route=[new THREE.Vector3(0,0,3.3),new THREE.Vector3(-2.7,0,3.3),new THREE.Vector3(-2.7,0,-1.3),approach];
 const lengths=route.slice(1).map((p,i)=>p.distanceTo(route[i])),total=lengths.reduce((a,b)=>a+b,0);
 const loose=new THREE.Group();device.parent.add(loose);loose.visible=false;
 visitor.shoes.forEach((shoe,i)=>{const copy=shoe.clone(true);copy.position.set(approach.x+(i===0?-.15:.15),.5,approach.z+.3);loose.add(copy)});
 let active=false,startTime=0,stage='idle';
 const setShoes=on=>{visitor.shoes.forEach(s=>s.visible=on);visitor.feet.forEach(f=>f.visible=!on);loose.visible=!on};
 function resetPose(){pose(visitor,false);visitor.g.rotation.x=0;visitor.arms.forEach(a=>a.rotation.set(0,0,0))}
 function transition(next){if(stage!==next){stage=next;onStage(next)}}
 function walk(f,reverse=false){
  let distance=THREE.MathUtils.clamp(reverse?1-f:f,0,1)*total;
  for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]||i===lengths.length-1){visitor.g.position.lerpVectors(route[i],route[i+1],Math.min(1,distance/lengths[i]));const direction=route[i+1].clone().sub(route[i]).multiplyScalar(reverse?-1:1);visitor.g.rotation.y=Math.atan2(direction.x,direction.z);break}distance-=lengths[i]}
 }
 function cancel(){const wasActive=active;active=false;stage='idle';head.position.y=home;setShoes(true);resetPose();if(wasActive)visitor.g.position.copy(approach)}
 return {
  start(){cancel();active=true;startTime=performance.now();visitor.g.position.copy(route[0]);visitor.g.rotation.y=Math.PI;transition('invitation')},
  cancel,
  dispose(){cancel();loose.removeFromParent()},
  get active(){return active},
  get stage(){return stage},
  update(now){
   if(!active)return;let elapsed=Math.max(0,(now-startTime)/1000),current=null;
   for(const entry of HEIGHT_SEQUENCE){if(elapsed<entry[1]){current=entry;break}elapsed-=entry[1]}
   if(!current){active=false;head.position.y=home;setShoes(true);resetPose();onComplete();transition('complete');return}
   const [next,duration]=current,f=elapsed/duration,smooth=f*f*(3-2*f);transition(next);resetPose();head.position.y=home;setShoes(true);
   if(next==='invitation'){visitor.g.position.copy(route[0]);visitor.g.rotation.y=Math.PI}
   else if(next==='walking'||next==='walking-back'){walk(f,next==='walking-back');visitor.legs.forEach((l,i)=>{l.rotation.x=Math.sin(elapsed*9+i*Math.PI)*.3;l.userData.knee.rotation.x=Math.max(0,-Math.sin(elapsed*9+i*Math.PI))*.25});visitor.arms.forEach((a,i)=>a.rotation.x=-Math.sin(elapsed*9+i*Math.PI)*.2)}
   else if(next==='shoes-off'||next==='shoes-on'){
    visitor.g.position.copy(approach);visitor.g.rotation.y=0;const bend=Math.sin(Math.PI*f);visitor.g.rotation.x=bend*.4;visitor.arms.forEach(a=>a.rotation.x=-bend*.7);setShoes(next==='shoes-off'?f<.55:f>=.55);
   }
   else if(next==='stepping-on'||next==='stepping-off'){
    const off=next==='stepping-off';visitor.g.position.lerpVectors(off?platform:approach,off?approach:platform,smooth);visitor.g.rotation.y=0;setShoes(false);visitor.legs.forEach((l,i)=>l.rotation.x=Math.sin(f*Math.PI*2+i*Math.PI)*.16);
   }
   else if(next==='sitting'){
    visitor.g.position.lerpVectors(route[0],new THREE.Vector3(0,.13,2),smooth);visitor.g.rotation.y=Math.PI;visitor.legs.forEach(l=>{l.rotation.x=-Math.PI/2*smooth;l.userData.knee.rotation.x=Math.PI/2*smooth});
   }
   else{
    visitor.g.position.copy(platform);visitor.g.rotation.y=0;setShoes(false);
    // Match the underside of the headpiece to the character's crown, not a clinical reading.
    const contact=platformY+2.19+.04;
    if(next==='head-down')head.position.y=THREE.MathUtils.lerp(home,contact,smooth);
    if(next==='head-hold')head.position.y=contact;
    if(next==='head-up')head.position.y=THREE.MathUtils.lerp(contact,home,smooth);
   }
  },
  camera(compact=false){const focus=visitor.g.position.clone().add(new THREE.Vector3(0,compact?1.45:1.1,0));return{focus,position:focus.clone().add(compact?new THREE.Vector3(3.6,1.5,4.8):new THREE.Vector3(3,1.35,4))}},
  snapshot(){return{stage,active,headY:head.position.y,headHomeY:home,shoesOn:visitor.shoes.every(s=>s.visible),barefoot:visitor.feet.every(f=>f.visible),looseShoesVisible:loose.visible,onPlatform:visitor.g.position.distanceTo(platform)<.01}}
 };
}
