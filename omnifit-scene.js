import * as THREE from './vendor/three.module.js';

export const OMNIFIT_STAGES=[
 ['intro',17],['approach',6],['fit',5],['quiet',7],['eyes',5],
 ['measure',60],['finished',4],['remove',5],['return',6],
];

export function createOmnifitScene(avatar,guide,room,pose,planWalk,onStage){
 const staffSeat=guide.g.position.clone();
 const group=new THREE.Group();group.visible=false;room.add(group);
 const silver=new THREE.MeshStandardMaterial({color:'#9eafb7',metalness:.45,roughness:.34});
 const black=new THREE.MeshStandardMaterial({color:'#141b21',roughness:.38});
 const screenLight=new THREE.MeshBasicMaterial({color:'#a9c7da'});
 const accent=new THREE.MeshBasicMaterial({color:'#57868f'});
 const mesh=(geometry,material,parent)=>{const object=new THREE.Mesh(geometry,material);parent.add(object);return object};
 const box=(w,h,d,material,parent)=>mesh(new THREE.BoxGeometry(w,h,d),material,parent);
 const tablet=new THREE.Group();group.add(tablet);
 box(.88,.58,.055,black,tablet);
 box(.80,.49,.012,screenLight,tablet).position.z=.033;
 for(let i=0;i<4;i++)box(.62-i*.08,.028,.014,accent,tablet).position.set(0,.14-i*.085,.04);
 box(.58,.035,.22,black,tablet).position.set(0,-.29,-.055);
 tablet.scale.setScalar(.77);
 const band=new THREE.Group(),clip=new THREE.Group();
 group.add(band,clip);
 band.scale.copy(avatar.head.scale);clip.scale.setScalar(.78);
 mesh(new THREE.TorusGeometry(.25,.022,9,38,Math.PI*1.86),silver,band).rotation.x=Math.PI/2;
 for(const x of [-.22,.22])box(.097,.062,.12,black,band).position.set(x,.006,.088);
 box(.065,.115,.044,black,clip);
 const line=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0x202125}));
 group.add(line);
 const cablePositions=new THREE.Float32BufferAttribute(new Float32Array(9),3);
 line.geometry.setAttribute('position',cablePositions);line.frustumCulled=false;
 group.traverse(part=>{part.userData.navigationActor=true});

 const limits={minX:-6.5,maxX:6.5,minZ:-5.5,maxZ:5.5};
 const visitorPose=new THREE.Vector3(),bandTable=new THREE.Vector3(),clipTable=new THREE.Vector3();
 const head=new THREE.Vector3(),ear=new THREE.Vector3();
 let stage='idle',started=0,route=[],side=1;
 let lengths=[],total=0;

 function guideWalk(f,back=false){
  let distance=total*(back?1-f:f);
  for(let i=0;i<lengths.length;i++){
   if(distance<=lengths[i]||i===lengths.length-1){
    guide.g.position.lerpVectors(route[i],route[i+1],Math.min(1,distance/lengths[i]));
    const delta=route[i+1].clone().sub(route[i]).multiplyScalar(back?-1:1);
    guide.g.rotation.set(0,Math.atan2(delta.x,delta.z),0);
    break;
   }
   distance-=lengths[i];
  }
  guide.legs.forEach((leg,i)=>{leg.rotation.x=Math.sin(f*total*6+i*Math.PI)*.23});
  guide.arms.forEach((arm,i)=>{arm.rotation.x=-Math.sin(f*total*6+i*Math.PI)*.18});
 }
 function restGuide(){
  guide.g.rotation.set(0,0,0);guide.g.position.copy(staffSeat);
  guide.arms.forEach(arm=>arm.rotation.set(0,0,0));
  pose(guide,true);
 }
 function holdGear(progress){
  const bandProgress=THREE.MathUtils.smoothstep(progress,0,.58);
  const clipProgress=THREE.MathUtils.smoothstep(progress,.55,1);
  band.position.lerpVectors(bandTable,head,bandProgress);
  band.position.y+=Math.sin(Math.PI*bandProgress)*.32;
  clip.position.lerpVectors(clipTable,ear,clipProgress);
  clip.position.y+=Math.sin(Math.PI*clipProgress)*.18;
  band.rotation.y=avatar.g.rotation.y;
  clip.rotation.y=avatar.g.rotation.y;
  const bend=band.position.clone().lerp(clip.position,.57);
  bend.y-=.10;bend.z+=.075;
  [band.position,bend,clip.position].forEach((point,i)=>cablePositions.setXYZ(i,point.x,point.y,point.z));
  cablePositions.needsUpdate=true;
 }
 function reachForGear(point){
  const target=guide.upperBody.worldToLocal(room.localToWorld(point.clone()));
  const arm=guide.arms.reduce((nearest,current)=>current.position.distanceToSquared(target)<nearest.position.distanceToSquared(target)?current:nearest);
  const direction=target.sub(arm.position);
  arm.quaternion.setFromUnitVectors(new THREE.Vector3(0,-1,0),direction.normalize());
  arm.userData.elbow.rotation.x=-.36;
 }
 function emit(next){stage=next;onStage(next)}
 const api={
  get active(){return stage!=='idle'&&stage!=='complete'},
  start(now=performance.now()){
   if(api.active)return false;
   visitorPose.copy(avatar.g.position);
   side=Math.sign(visitorPose.x)||1;
   const exit=new THREE.Vector3(side*1.0,0,staffSeat.z);
   const station=new THREE.Vector3(visitorPose.x+side*.94,0,visitorPose.z+.56);
   const path=planWalk(exit,station,true,limits);
   if(!path)return false;
   route=[staffSeat.clone().setY(0),...path].filter((point,i,points)=>i===0||point.distanceToSquared(points[i-1])>1e-8);
   lengths=route.slice(1).map((point,i)=>point.distanceTo(route[i]));
   total=lengths.reduce((sum,length)=>sum+length,0);
   bandTable.set(side*.67,1.30,THREE.MathUtils.clamp(visitorPose.z,-1.3,1.3));
   clipTable.copy(bandTable).add(new THREE.Vector3(0,.03,.22));
   tablet.position.set(side*.30,1.50,THREE.MathUtils.clamp(bandTable.z+.48,-1.18,1.22));
   tablet.rotation.y=side*Math.PI/2*.72;tablet.rotation.x=-.18;
   room.worldToLocal(avatar.head.localToWorld(head.set(0,1.986-1.67,0)));
   room.worldToLocal(avatar.head.localToWorld(ear.set(-.258,1.81-1.67,.02)));
   started=now;group.visible=true;holdGear(0);emit('intro');
   return true;
  },
  update(now){
   if(!api.active)return;
   let elapsed=Math.max(0,(now-started)/1000);
   const step=OMNIFIT_STAGES.find(([,seconds])=>{if(elapsed<seconds)return true;elapsed-=seconds;return false});
   if(!step){avatar.setEyesClosed(false);holdGear(0);restGuide();emit('complete');return}
   const [next,seconds]=step,f=elapsed/seconds;
   if(next!==stage)emit(next);
   avatar.setEyesClosed(['eyes','measure'].includes(next));
   if(next==='measure')onStage('tick',Math.ceil(seconds-elapsed));
   if(next==='intro'){restGuide();return}
   pose(guide,false);guide.arms.forEach(arm=>arm.rotation.set(0,0,0));
   if(next==='approach'||next==='return'){guideWalk(f,next==='return');holdGear(0);return}
   guide.g.position.copy(route.at(-1));
   guide.g.rotation.set(0,Math.atan2(visitorPose.x-guide.g.position.x,visitorPose.z-guide.g.position.z),0);
   const progress=next==='fit'?f:next==='remove'?1-f:1;
   holdGear(progress);
   if(next==='fit'||next==='remove')reachForGear(progress<.58?band.position:clip.position);
  },
  camera(aspect){
   const focus=visitorPose.clone().add(new THREE.Vector3(-side*.22,1.38,.07));
   const position=visitorPose.clone().add(new THREE.Vector3(-side*.95,2.52,2.76));
   return {focus,position,fov:aspect<1?62:54};
  },
  cancel(){
   const wasActive=api.active;
   stage='idle';group.visible=false;avatar.setEyesClosed(false);restGuide();
   if(wasActive)onStage('cancelled');
  },
  dispose(){api.cancel()},
 };
 return api;
}
