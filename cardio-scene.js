import * as THREE from './vendor/three.module.js';

const route=[[-2.25,-2],[-2.25,3.25],[-.88,3.25]];
export function createWaistScene(visitor,employee,pose,onStage){
 let running=false,startTime=0,stage='idle';
 const tape=new THREE.Mesh(new THREE.TorusGeometry(.34,.026,8,64),new THREE.MeshStandardMaterial({color:'#f8e4a0',roughness:.8}));
 tape.rotation.x=Math.PI/2;tape.scale.y=.66;tape.position.y=1.04;tape.visible=false;visitor.g.add(tape);
 const marks=new THREE.Group();tape.add(marks);
 for(let i=0;i<32;i++){const a=i/32*Math.PI*2,m=new THREE.Mesh(new THREE.BoxGeometry(.009,i%4===0?.035:.02,.01),new THREE.MeshBasicMaterial({color:'#453e32'}));m.position.set(Math.cos(a)*.34,Math.sin(a)*.34,.025);m.rotation.z=a;marks.add(m)}
 function resetArms(p){p.arms.forEach(a=>a.rotation.set(0,0,0))}
 function cancel(){running=false;stage='idle';tape.visible=false;resetArms(visitor);resetArms(employee);employee.g.position.set(0,.13,-2);employee.g.rotation.set(0,0,0);pose(employee,true)}
 function transition(next){if(stage===next)return;stage=next;onStage(next)}
 function walk(t,reverse=false){
  const points=[[0,-2],...route],lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));
  let distance=Math.min(1,Math.max(0,reverse?1-t:t))*lengths.reduce((a,b)=>a+b,0);
  for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]||i===lengths.length-1){const f=Math.min(1,distance/lengths[i]),a=points[i],b=points[i+1];employee.g.position.set(a[0]+(b[0]-a[0])*f,0,a[1]+(b[1]-a[1])*f);employee.g.rotation.y=Math.atan2((b[0]-a[0])*(reverse?-1:1),(b[1]-a[1])*(reverse?-1:1));break}distance-=lengths[i]}
 }
 return {
  start(){cancel();running=true;startTime=performance.now();visitor.g.position.set(0,0,3.3);visitor.g.rotation.set(0,Math.PI,0);pose(visitor,false);pose(employee,false);transition('standing')},
  cancel,
  dispose(){cancel();visitor.g.remove(tape);tape.traverse(o=>{o.geometry?.dispose();o.material?.dispose()})},
  get active(){return running},
  get stage(){return stage},
  update(now){
   if(!running)return;const t=(now-startTime)/1000;resetArms(visitor);resetArms(employee);pose(employee,false);
   const lift=t<1?t:t>9?Math.max(0,10-t):1;visitor.arms.forEach((arm,i)=>arm.rotation.z=(i===0?-1:1)*Math.PI/2*lift);
   if(t<1){employee.g.position.y=.13*(1-t)}
   else if(t<5){transition('approaching');walk((t-1)/4);employee.legs.forEach((l,i)=>{l.rotation.x=Math.sin(t*9+i*Math.PI)*.28});employee.arms.forEach((a,i)=>a.rotation.x=-Math.sin(t*9+i*Math.PI)*.2)}
   else if(t<9){transition('measuring');employee.g.position.set(-.88,0,3.25);employee.g.rotation.y=Math.PI/2;employee.g.rotation.x=.14;employee.arms.forEach((a,i)=>{a.rotation.x=-.95;a.rotation.z=i===0?.24:-.24});tape.visible=true}
   else if(t<13){transition('returning');tape.visible=false;employee.g.rotation.x=0;walk((t-9)/4,true);employee.legs.forEach((l,i)=>{l.rotation.x=Math.sin(t*9+i*Math.PI)*.28})}
   else{running=false;tape.visible=false;resetArms(visitor);resetArms(employee);employee.g.position.set(0,.13,-2);employee.g.rotation.set(0,0,0);pose(employee,true);transition('complete')}
  },
  snapshot(){return{stage,active:running,tapeVisible:tape.visible,arms:visitor.arms.map(a=>a.rotation.z),employeeX:employee.g.position.x,employeeZ:employee.g.position.z}}
 };
}
