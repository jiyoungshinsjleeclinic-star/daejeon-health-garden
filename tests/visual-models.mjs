import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {roundedGeometry,compactMeshes,makePerson,makeChair,makeTable,makePlant} from '../center-visuals.js';
import {makeDevice} from '../center-models.js';
import {CARDIO_EQUIPMENT} from '../center-plan.js';

const mat=color=>new THREE.MeshStandardMaterial({color});
const mats=Object.fromEntries(['white','wood','green','dark','blue','skin','metal','leather','fabric','leaf','yellow'].map(name=>[name,mat('#aabbcc')]));
function add(geometry,material,x,y,z,parent){const o=new THREE.Mesh(geometry,material);o.position.set(x,y,z);parent.add(o);return o}
const box=(w,h,d,x,y,z,m,p)=>add(roundedGeometry(w,h,d),m,x,y,z,p);
const cylinder=(r,h,x,y,z,m,p)=>add(new THREE.CylinderGeometry(r,r,h,12),m,x,y,z,p);
const sphere=(r,x,y,z,m,p)=>add(new THREE.SphereGeometry(r,12,8),m,x,y,z,p);
function finiteModel(root){
 root.updateMatrixWorld(true);let count=0;
 root.traverse(o=>{if(o.isMesh){count++;assert([...o.geometry.attributes.position.array].every(Number.isFinite));assert(o.material)}});
 assert(count>0);const bounds=new THREE.Box3().setFromObject(root);assert(!bounds.isEmpty());return bounds;
}
for(const dims of [[1.4,.2,1.1],[.08,.12,.02],[3,.8,.5]]){
 const geo=roundedGeometry(...dims);geo.computeBoundingBox();const size=geo.boundingBox.getSize(new THREE.Vector3());
 dims.forEach((d,i)=>assert(Math.abs(size.getComponent(i)-d)<.003));
}
const person=makePerson('#cb8c99',new THREE.Group(),mats);
const standing=finiteModel(person.g);assert(standing.max.y>2&&standing.max.y<2.3);assert(standing.min.y>=0);
assert.equal(person.legs.length,2);assert.equal(person.arms.length,2);
for(const leg of person.legs){assert(leg.parent===person.g);leg.rotation.x=-Math.PI/2;leg.userData.knee.rotation.x=Math.PI/2}
finiteModel(person.g);
for(const build of [p=>makeChair(0,0,mats.fabric,p,mats),p=>makeTable(0,0,2.5,p,mats),p=>makePlant(0,0,1,p,mats)])finiteModel(build(new THREE.Group()));
for(const type of ['coffee','water','bloodpressure','inbody','bloodtest','bed','massage','ceragem','bike','treadmill','weights','heightweight','arterial','cholesterol','glucose','hba1c']){
 const device=makeDevice(type,0,0,{parent:new THREE.Group(),box,cylinder,sphere,mat,mats});finiteModel(device);
}
const devices=Object.fromEntries(CARDIO_EQUIPMENT.map(item=>[item.id,item]));
assert(!devices.inbody);
assert.deepEqual(devices.heightweight,{id:'heightweight',name:'신장·체중 측정기',x:-3.85,z:-3.1,y:0});
assert(devices.bed.x>0&&devices.arterial.x>0&&devices.heightweight.x<0);
for(const id of ['cholesterol','glucose','hba1c']){
 const item=devices[id];assert.equal(item.y,1.22);assert(Math.abs(item.x)<1.7&&Math.abs(item.z)<.65);
}
const group=new THREE.Group();box(1,1,1,-2,.5,0,mats.white,group);box(1,1,1,2,.5,0,mats.white,group);
const before=finiteModel(group);compactMeshes(group);const after=finiteModel(group);assert.equal(group.children.length,1);assert(before.min.distanceTo(after.min)<1e-5&&before.max.distanceTo(after.max)<1e-5);
console.log('Visual model bounds, articulated joints, all device meshes, and merged geometry: passed.');
