import * as THREE from './vendor/three.module.js';

const scanStages=new Set(['front','side','rear','adams']);
const sweepDuration=2300;

// Match the ease-in-out curve and alternate direction of the photo's dotted rings.
function scanProgress(elapsed){
 const phase=Math.max(0,elapsed)/sweepDuration%2;
 const time=phase<=1?phase:2-phase;
 let min=0,max=1;
 for(let i=0;i<14;i++){
  const t=(min+max)/2, u=1-t;
  const x=3*u*u*t*.42+3*u*t*t*.58+t*t*t;
  if(x<time)min=t;else max=t;
 }
 const t=(min+max)/2;
 return t*t*(3-2*t);
}

export function createPostureScanLight(device,visitor){
 const group=new THREE.Group();
 const origin=new THREE.Vector3(0,2.66,-1.18);
 const target=new THREE.Vector3();
 const direction=new THREE.Vector3();
 const up=new THREE.Vector3(0,1,0);
 const body=new THREE.Box3();
 const upperCenter=new THREE.Vector3();
 const vertices=new THREE.Float32BufferAttribute(new Float32Array(9),3);
 const fanGeometry=new THREE.BufferGeometry();
 fanGeometry.setAttribute('position',vertices);
 const fan=new THREE.Mesh(fanGeometry,new THREE.MeshBasicMaterial({
  color:'#4dff71',transparent:true,opacity:.18,side:THREE.DoubleSide,
  depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,
 }));
 fan.frustumCulled=false;
 const beam=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,1,8),new THREE.MeshBasicMaterial({
  color:'#87ff9a',transparent:true,opacity:.8,depthWrite:false,toneMapped:false,
 }));
 const glow=new THREE.PointLight('#36ff65',.8,.92,2);
 group.add(fan,beam,glow);
 device.add(group);
 group.visible=false;

 return {
  update(stage,elapsed){
   group.visible=scanStages.has(stage);
   if(!group.visible)return;
   body.setFromObject(visitor.upperBody);
   body.getCenter(upperCenter);
   const floor=device.localToWorld(device.userData.postureStandingPoint.clone()).y;
   const height=THREE.MathUtils.lerp(body.max.y-.035,floor+.035,scanProgress(elapsed));
   const lean=stage==='adams'?THREE.MathUtils.smoothstep(height,floor+.62,body.max.y):0;
   target.copy(visitor.g.position).lerp(upperCenter,lean);
   target.y=height;
   device.worldToLocal(target);
   const halfWidth=stage==='side'?.27:.41;
   vertices.setXYZ(0,origin.x,origin.y,origin.z);
   vertices.setXYZ(1,target.x-halfWidth,target.y,target.z+.07);
   vertices.setXYZ(2,target.x+halfWidth,target.y,target.z+.07);
   vertices.needsUpdate=true;
   direction.subVectors(target,origin);
   beam.scale.y=direction.length();
   beam.position.copy(origin).lerp(target,.5);
   beam.quaternion.setFromUnitVectors(up,direction.normalize());
   glow.position.copy(target).add(new THREE.Vector3(-.15,0,-.24));
  },
  stop(){group.visible=false},
  dispose(){
   group.removeFromParent();
   fan.geometry.dispose();fan.material.dispose();
   beam.geometry.dispose();beam.material.dispose();
   glow.dispose();
  },
  snapshot(){return {visible:group.visible,height:target.y}},
 };
}
