import * as THREE from './vendor/three.module.js';

export const aromaOils=[
 ['시트러스 블리스','엘리베이션','밸런스','세레니티'],
 ['패션','모티베이트','치어','포기브','피스풀','콘솔'],
];
const colors=['#e2a141','#d8ba61','#68a99b','#a176be','#cf5574','#ec9a47','#e1c94a','#75aa5e','#5eb6cc','#8274b2'];
export const aromaColors=colors;

export function createAromaScene(avatar,room,onComplete){
 const props=new THREE.Group();
 props.visible=false;
 room.add(props);
 const material=color=>new THREE.MeshStandardMaterial({color,roughness:.65});
 const purple=material('#302445'),amber=material('#59331e'),black=material('#211f24');
 const green=material('#82a92d'),wood=material('#e8c296');
 const labels=colors.map(material);
 const mesh=(geometry,paint,parent,x,y,z)=>{
  const object=new THREE.Mesh(geometry,paint);
  object.position.set(x,y,z);
  parent.add(object);
  return object;
 };
 const box=(w,h,d,paint,parent,x,y,z)=>mesh(new THREE.BoxGeometry(w,h,d),paint,parent,x,y,z);
 const cylinder=(top,bottom,h,paint,parent,x,y,z)=>mesh(new THREE.CylinderGeometry(top,bottom,h,12),paint,parent,x,y,z);
 const tray=new THREE.Group();props.add(tray);tray.position.set(.29,.012,.69);
 box(.65,.025,.26,purple,tray,0,0,0);
 for(const x of [-.314,.314])box(.025,.085,.26,purple,tray,x,.052,0);
 for(const z of [-.12,.12])box(.65,.085,.02,purple,tray,0,.052,z);
 box(.65,.28,.027,purple,tray,0,.19,.137).rotation.x=-.22;
 const bottle=(index,x,z,lying)=>{
  const group=new THREE.Group();props.add(group);
  group.position.set(x,lying?.071:.006,z);
  cylinder(.042,.044,.134,amber,group,0,.069,0);
  cylinder(.043,.043,.069,labels[index],group,0,.066,0);
  cylinder(.034,.036,.054,black,group,0,.151,0);
  cylinder(.025,.025,.004,labels[index],group,0,.18,0);
  if(lying)group.rotation.x=-Math.PI/2;
 };
 for(let i=0;i<4;i++)bottle(i,-.48+i*.103,.58,false);
 for(let i=0;i<6;i++)bottle(i+4,.045+i*.097,.78,true);
 const canvas=document.createElement('canvas');canvas.width=640;canvas.height=400;
 const ctx=canvas.getContext('2d'),texture=new THREE.CanvasTexture(canvas);
 texture.colorSpace=THREE.SRGBColorSpace;
 const sheet=mesh(new THREE.PlaneGeometry(.71,.43),new THREE.MeshStandardMaterial({map:texture}),props,-.14,.008,.085);
 sheet.rotation.x=-Math.PI/2;
 function drawSheet(marks){
  ctx.fillStyle='#fff';ctx.fillRect(0,0,640,400);
  ctx.fillStyle='#20242a';ctx.font='32px sans-serif';ctx.fillText('감정오일 진단 방법',32,61);
  aromaOils.forEach((oils,row)=>{
   const y=113+row*128,width=355/oils.length;
   ctx.font='22px sans-serif';ctx.fillStyle='#20242a';ctx.fillText('Step '+(row+1),32,y);
   oils.forEach((oil,i)=>{
    const x=32+i*width;
    ctx.strokeStyle='#474951';ctx.strokeRect(x,y+18,width,65);
    ctx.font='17px sans-serif';ctx.fillStyle='#333';ctx.fillText((i+1)+'위',x+8,y+40);
    ctx.fillStyle=colors[(row?4:0)+i];ctx.fillRect(440+i*27,y-18,20,41);
    if(i<2&&row*2+i<marks){ctx.font='bold 27px sans-serif';ctx.fillStyle='#345b66';ctx.fillText('✓',x+8,y+71)}
   });
  });
  texture.needsUpdate=true;
 }
 const pencil=new THREE.Group();props.add(pencil);
 cylinder(.008,.008,.19,green,pencil,0,0,0);
 cylinder(.008,.001,.028,wood,pencil,0,-.108,0);
 cylinder(.008,.008,.028,purple,pencil,0,.085,0);
 props.traverse(part=>{part.userData.navigationActor=true});

 const arm=avatar.arms[0],elbow=arm.userData.elbow;
 const armRest=new THREE.Quaternion(),elbowRest=new THREE.Quaternion();
 const torso=avatar.upperBody,torsoRest=new THREE.Quaternion(),torsoPosition=new THREE.Vector3();
 const visitor=new THREE.Vector3(),forward=new THREE.Vector3();
 const tip=new THREE.Vector3(),target=new THREE.Vector3(),localTarget=new THREE.Vector3();
 const upper=new THREE.Vector3(),lower=new THREE.Vector3(),bend=new THREE.Vector3();
 const down=new THREE.Vector3(0,-1,0),bendHint=new THREE.Vector3(-1,0,0);
 const heldDirection=new THREE.Vector3(-.18,1,-.56).normalize();
 const restPosition=new THREE.Vector3(-.54,.018,.085);
 const restRotation=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),Math.PI/2);
 const heldRotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),heldDirection);
 let stage='idle',started=0,markCount=0;
 const duration=4600;

 function moveHand(){
  target.set(0,.025,0).applyQuaternion(pencil.quaternion).add(pencil.position);
  props.localToWorld(target);
  arm.parent.worldToLocal(localTarget.copy(target)).sub(arm.position);
  const length=Math.min(.595,Math.max(.06,localTarget.length()));
  lower.copy(localTarget).normalize();
  bend.copy(bendHint).addScaledVector(lower,-bendHint.dot(lower)).normalize();
  upper.copy(lower).multiplyScalar(length/2).addScaledVector(bend,Math.sqrt(.3**2-(length/2)**2));
  arm.quaternion.setFromUnitVectors(down,upper.clone().normalize());
  lower.multiplyScalar(length).sub(upper).normalize().applyQuaternion(arm.quaternion.clone().invert());
  elbow.quaternion.setFromUnitVectors(down,lower);
 }
 function resetHand(){
  arm.quaternion.copy(armRest);elbow.quaternion.copy(elbowRest);
  torso.quaternion.copy(torsoRest);torso.position.copy(torsoPosition);
 }
 function restPencil(){pencil.position.copy(restPosition);pencil.quaternion.copy(restRotation)}
 return {
  get active(){return stage==='ready'||stage==='writing'},
  start(){
   visitor.copy(avatar.g.position);
   forward.set(0,0,1).applyQuaternion(avatar.g.quaternion);
   props.rotation.y=avatar.g.rotation.y;
   props.position.copy(visitor).addScaledVector(forward,.82);
   props.position.y=1.267;
   props.position.z=THREE.MathUtils.clamp(props.position.z,-.93,1.13);
   armRest.copy(arm.quaternion);elbowRest.copy(elbow.quaternion);
   torsoRest.copy(torso.quaternion);torsoPosition.copy(torso.position);
   restPencil();drawSheet(0);markCount=0;props.visible=true;stage='ready';
  },
  write(now=performance.now()){
   if(stage==='ready'){stage='writing';started=now}
  },
  update(now){
   if(stage!=='writing')return;
   const elapsed=now-started;
   if(elapsed>=duration){resetHand();restPencil();stage='complete';onComplete();return}
   const writing=Math.min(3.99,Math.max(0,(elapsed-900)/630));
   const index=Math.floor(writing),stroke=writing-index;
   const row=Math.floor(index/2),column=index%2;
   const x=-.14+((40+column*355/aromaOils[row].length)/640-.5)*.71;
   const z=.085+((176+row*128)/400-.5)*.43;
   tip.set(x+stroke*.042,.015+Math.max(0,stroke-.79)*.12,z+(stroke<.35?stroke*.045:(.65-stroke)*.05));
   const pickup=THREE.MathUtils.smoothstep(elapsed,200,900);
   const putdown=THREE.MathUtils.smoothstep(elapsed,3500,4340);
   pencil.position.copy(tip).addScaledVector(heldDirection,.118).lerp(restPosition,1-pickup*(1-putdown));
   pencil.quaternion.copy(restRotation).slerp(heldRotation,pickup*(1-putdown));
   const lean=THREE.MathUtils.smoothstep(elapsed,0,720)*(1-THREE.MathUtils.smoothstep(elapsed,4150,duration));
   torso.quaternion.copy(torsoRest);
   torso.rotateX(.55*lean);
   torso.position.copy(torsoPosition);torso.position.z+=.17*lean;
   moveHand();
   const relax=Math.max(1-THREE.MathUtils.smoothstep(elapsed,0,550),THREE.MathUtils.smoothstep(elapsed,4220,duration));
   arm.quaternion.slerp(armRest,relax);elbow.quaternion.slerp(elbowRest,relax);
   const next=Math.min(4,Math.floor(writing+.15));
   if(next!==markCount){markCount=next;drawSheet(next)}
  },
  camera(aspect){
   const side=new THREE.Vector3(-1,0,0).applyQuaternion(avatar.g.quaternion);
   const focus=visitor.clone().addScaledVector(forward,.83);focus.y=1.37;
   const position=focus.clone().addScaledVector(forward,.38).addScaledVector(side,2.55);position.y=2.98;
   return {focus,position,fov:aspect<1?63:51};
  },
  cancel(){
   if(this.active)resetHand();
   stage='idle';props.visible=false;restPencil();
  },
 };
}
