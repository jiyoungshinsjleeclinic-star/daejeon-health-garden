import * as THREE from './vendor/three.module.js';

const down=new THREE.Vector3(0,-1,0);
// Point the existing fingertip at the instrument's calibrated contact position.
export function setFingerExtended(finger,extended){
 if(finger.userData.extended===extended)return;
 finger.userData.extended=extended;
 if(extended){
  const contactX=finger.position.x>0?.02:-.02;
  const direction=new THREE.Vector3(contactX,-.505,0).sub(finger.position);
  finger.scale.y=direction.length()/finger.userData.length;
  finger.quaternion.setFromUnitVectors(down,direction.normalize());
 }else{
  finger.rotation.copy(finger.userData.restRotation);
  finger.scale.y=1;
 }
}
