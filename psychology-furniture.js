import * as THREE from './vendor/three.module.js';
import {compactMeshes,roundedGeometry} from './center-visuals.js?v=adams-1';

export const PSYCHOLOGY_VISITOR_SEAT={
 x:-1.7,z:1.06,approach:{x:-3.05,z:1.06,facing:Math.PI/2}
};

const otherSeats=[
 {x:-1.7,z:-.87,approach:{x:-3.05,z:-.87,facing:Math.PI/2}},
 {x:1.72,z:.36,approach:{x:3.1,z:.36,facing:-Math.PI/2}},
 {x:1.72,z:-.98,approach:{x:3.1,z:-.98,facing:-Math.PI/2}},
];

export function buildPsychologyFurniture(parent,mats){
 const room=new THREE.Group();
 parent.add(room);
 const wood=mats.wood.clone();
 wood.color.set('#e1d3bd');
 const gray=mats.fabric.clone();
 gray.color.set('#a3a0a4');
 const matte=color=>new THREE.MeshStandardMaterial({color,roughness:.74});
 const white=matte('#e6e7e6'),cream=matte('#d8d2ab'),lavender=matte('#9890a2');
 const pink=matte('#d989a2'),blue=matte('#8db9c8'),leaf=matte('#517848');
 const glass=new THREE.MeshPhysicalMaterial({color:'#b0cec2',transparent:true,opacity:.35,roughness:.15});
 const mesh=(geometry,material,x,y,z,group=room)=>{
  const part=new THREE.Mesh(geometry,material);
  part.position.set(x,y,z);part.castShadow=true;part.receiveShadow=true;
  group.add(part);return part;
 };
 const box=(w,h,d,x,y,z,material,group=room)=>mesh(roundedGeometry(w,h,d),material,x,y,z,group);
 const sphere=(material,x,y,z,rx,ry,rz)=>{
  const part=mesh(new THREE.SphereGeometry(1,16,10),material,x,y,z);
  part.scale.set(rx,ry,rz);return part;
 };
 function spindle(group,material,from,to,top,bottom=top){
  const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to);
  const vector=b.clone().sub(a),center=a.lerp(b,.5);
  const part=mesh(new THREE.CylinderGeometry(top,bottom,vector.length(),10),material,center.x,center.y,center.z,group);
  part.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),vector.normalize());
 }
 function makeChair(x,z,facing){
  const group=new THREE.Group();
  room.add(group);group.position.set(x,0,z);group.rotation.y=facing;
  box(.92,.11,.84,0,.67,0,wood,group);
  box(.94,.14,.85,0,.77,.035,gray,group);
  for(const side of [-1,1]){
   spindle(group,wood,[side*.42,.08,.38],[side*.36,.69,.30],.041,.027);
   spindle(group,wood,[side*.43,.08,-.44],[side*.37,1.43,-.38],.044,.026);
   spindle(group,wood,[side*.38,.32,-.40],[side*.38,.32,.34],.027);
  }
  const outline=new THREE.Shape();
  outline.moveTo(-.49,-.035);outline.quadraticCurveTo(-.52,-.12,-.4,-.125);
  outline.lineTo(.4,-.125);outline.quadraticCurveTo(.52,-.12,.49,-.035);
  outline.lineTo(.49,.045);outline.quadraticCurveTo(.46,.114,.36,.12);
  outline.lineTo(-.36,.12);outline.quadraticCurveTo(-.49,.114,-.49,-.035);
  const back=new THREE.ExtrudeGeometry(outline,{depth:.065,bevelEnabled:false,steps:1,curveSegments:8});
  const vertices=back.getAttribute('position');
  for(let i=0;i<vertices.count;i++)vertices.setZ(i,vertices.getZ(i)+.24*vertices.getX(i)**2);
  back.computeVertexNormals();
  mesh(back,wood,0,1.4,-.47,group);
  return compactMeshes(group);
 }

 const top=new THREE.Shape();
 const x=1.02,z=1.68,r=.37;
 top.moveTo(-x+r,-z);top.lineTo(x-r,-z);top.quadraticCurveTo(x,-z,x,-z+r);
 top.lineTo(x,z-r);top.quadraticCurveTo(x,z,x-r,z);top.lineTo(-x+r,z);
 top.quadraticCurveTo(-x,z,-x,z-r);top.lineTo(-x,-z+r);top.quadraticCurveTo(-x,-z,-x+r,-z);
 const table=mesh(new THREE.ExtrudeGeometry(top,{
  depth:.085,bevelEnabled:true,bevelThickness:.012,bevelSize:.012,bevelSegments:2,curveSegments:10,
 }),wood,0,1.17,0);
 table.rotation.x=-Math.PI/2;
 for(const side of [-1,1])for(const end of [-1,1])
  spindle(room,wood,[side*.88,.08,end*1.5],[side*.73,1.17,end*1.25],.079,.042);

 // Blinds on the left wall keep the wall behind the cabinet clear.
 const blindBacking=matte('#b7aca0'),blindSlats=matte('#bfa689');
 box(.05,2.95,2.76,-6.85,1.66,-3.88,blindBacking);
 for(let i=0;i<16;i++)
  box(.037,.13,2.70,-6.81,.27+i*.177,-3.88,blindSlats);

 const cabinetX=-2.9,cabinetZ=-5.3;
 box(4.16,1.63,.83,cabinetX,.91,cabinetZ,white);
 box(4.25,.09,.94,cabinetX,1.77,cabinetZ,white);
 box(4.06,.09,.78,cabinetX,.125,cabinetZ,matte('#bfc3c1'));
 const knob=matte('#737b7b');
 for(let i=0;i<4;i++){
  const doorX=cabinetX+(i-1.5)*1.025;
  box(1.005,1.56,.065,doorX,.94,cabinetZ+.44,white);
  sphere(knob,doorX+(i%2===0?.38:-.38),1.61,cabinetZ+.50,.042,.042,.031);
 }
 box(.38,.47,.075,-4.48,2.06,-5.46,blue).rotation.x=-.14;
 box(.52,.55,.07,-2.77,2.11,-5.48,white).rotation.x=-.16;
 box(.30,.30,.019,-2.77,2.04,-5.412,pink).rotation.x=-.16;
 box(.43,.22,.31,-2.12,1.93,-5.22,blue);
 box(.24,.09,.04,-2.12,2.08,-5.22,white).rotation.x=.24;

 const bench=new THREE.Group();
 room.add(bench);bench.position.set(2.55,0,-4.1);
 box(1.98,.46,1.17,0,.47,0,cream,bench);
 box(1.96,.14,1.16,0,.74,0,cream,bench);
 for(const a of [-.82,.82])for(const b of [-.42,.42])
  spindle(bench,mats.metal,[a,.08,b],[a,.30,b],.041,.035);
 box(.66,.71,.18,-.48,1.06,-.41,matte('#c4c8af'),bench).rotation.x=-.16;
 box(.68,.74,.22,.54,1.09,-.42,lavender,bench).rotation.z=-.16;

 const vaseZ=.70;
 mesh(new THREE.CylinderGeometry(.116,.087,.45,20),glass,.04,1.49,vaseZ);
 for(const [i,dx,dz,height] of [[0,-.19,.08,.65],[1,.04,-.09,.75],[2,.18,.08,.60],[3,-.14,-.10,.78],[4,.29,-.09,.70]]){
  const finish=[.04+dx,1.33+height,vaseZ+dz];
  spindle(room,leaf,[.04,1.30,vaseZ],finish,.012);
  sphere(leaf,.04+dx*.58,1.30+height*.66,vaseZ+dz*.6,.055,.17,.028).rotation.z=-dx*2.8;
  sphere(i<2?pink:blue,finish[0],finish[1]+.047,finish[2],.082,.126,.080).rotation.z=-dx*.95;
 }
 const paper=box(.48,.035,.34,.29,1.29,-.92,white);
 paper.rotation.y=.12;
 spindle(room,pink,[.13,1.32,-.80],[.39,1.32,-.82],.012);

 const visitorSeats=[PSYCHOLOGY_VISITOR_SEAT,...otherSeats].map(seat=>({
  seat,object:makeChair(seat.x,seat.z,seat.approach.facing),
 }));
 makeChair(0,-2.46,0);
 return {visitorSeats,staffZ:-2.46};
}
