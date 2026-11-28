import * as THREE from './vendor/three.module.js';

const digits = ['thumb','index','middle','ring','little'];
const identity = new THREE.Quaternion();

// The equipment controllers retain their calibrated contact points. The visible
// skeleton uses the landmarks and phalanx weights from each fitted Blender mesh.
export function articulate(rig, names, pivots, rest) {
  const nodes = {torso:rig.upperBody, head:rig.head};
  const inverse = new Map(rest);
  const roots = [], updates = [];
  const point = name => new THREE.Vector3().fromArray(pivots[name]);
  function joint(name,parent,position) {
    const bone = new THREE.Bone();
    const bind = new THREE.Matrix4().makeTranslation(position.x,position.y,position.z);
    const local = inverse.get(parent).clone().multiply(bind);
    local.decompose(bone.position,bone.quaternion,bone.scale);
    parent.add(bone);
    nodes[name] = bone;
    inverse.set(bone,bind.invert());
    return bone;
  }
  for (const i of [0,1]) {
    const arm = rig.arms[i], hand = arm.userData;
    nodes['leg'+i] = rig.legs[i];
    nodes['knee'+i] = rig.legs[i].userData.knee;
    const collar = joint('clavicle'+i,rig.upperBody,point('clavicle'+i));
    roots.push(collar);
    const shoulder = joint('arm'+i,collar,point('arm'+i));
    const elbowAtRest = new THREE.Vector3().setFromMatrixPosition(rest.get(hand.elbow).clone().invert());
    const elbow = joint('elbow'+i,shoulder,elbowAtRest);
    const flexors = [];
    for (const [d,digit] of digits.entries()) {
      let parent = elbow;
      const landmarks = ['','Mid','Tip','End'].map(s=>point(digit+s+i));
      // Curl toward the palm. The thumb opposes the fingers across the palm.
      const direction = d ? new THREE.Vector3(i?-1:1,0,0) :
        point('ring'+i).sub(landmarks[0]).normalize();
      const joints = ['','Mid','Tip'].map((s,j)=>{
        const bone = joint(digit+s+i,parent,landmarks[j]);
        parent = bone;
        const axis = landmarks[j+1].clone().sub(landmarks[j]).cross(direction).normalize();
        return {bone,axis};
      });
      const control = hand[digit+'Finger'];
      flexors.push({d,joints,control,curl:0,tip:landmarks[3].clone().sub(landmarks[2])});
    }
    const armRest = arm.position.clone();
    const socketRest = shoulder.position.clone();
    const displaced = new THREE.Vector3();
    const target = new THREE.Vector3(), tip = new THREE.Vector3();
    const from = new THREE.Vector3(), to = new THREE.Vector3();
    const rotation = new THREE.Quaternion(), inverseRotation = new THREE.Quaternion();
    const shoulderStart = new THREE.Quaternion(), elbowStart = new THREE.Quaternion();
    let lastTime, contact, pointing=false, contactAmount=0;
    updates.push(now=>{
      const dt = lastTime===undefined ? 1/60 : Math.min(.1,(now-lastTime)/1000);
      lastTime=now;
      const lift=Math.min(1,Math.abs(arm.rotation.z)/1.57);
      collar.quaternion.copy(identity).slerp(arm.quaternion,.12+.16*lift);
      shoulder.quaternion.copy(collar.quaternion).invert().multiply(arm.quaternion);
      shoulder.position.copy(socketRest).add(displaced.copy(arm.position).sub(armRest));
      elbow.quaternion.copy(hand.elbow.quaternion);
      const writing = Math.max(0, hand.indexFinger.userData.restRotation.x-hand.indexFinger.rotation.x);
      const grip = Math.max(writing, arm.userData.grip || 0);
      for (const finger of flexors) {
        const {control,d,joints} = finger;
        const action = control ? Math.max(0,control.userData.restRotation.x-control.rotation.x) : writing;
        const relaxed = .035 + .023*d;
        const target = control?.userData.extended ? -.16 :
          Math.min(1.1, relaxed + Math.max(action,grip*(d===0?.48:.62+.07*d)));
        finger.curl += (target-finger.curl)*(-Math.expm1(-16*dt));
        for (const [j,{bone,axis}] of joints.entries())
          bone.quaternion.setFromAxisAngle(axis,finger.curl*[.56,.87,.47][j]);
      }

      // Aim the two arm segments at the existing sensor or pencil contact. Each
      // correction is a rotation, so the finger and forearm retain their lengths.
      const extended=flexors.find(f=>f.control?.userData.extended);
      const requested=extended || (writing>.01 ? flexors[1] : null);
      if(requested){contact=requested;pointing=Boolean(extended)}
      const desired=extended ? 1 : THREE.MathUtils.smoothstep(writing,0,.5);
      contactAmount+=(desired-contactAmount)*(-Math.expm1(-24*dt));
      if(contact && contactAmount>.001){
        target.set(pointing ? Math.sign(contact.control.position.x)*.02 : 0,
          pointing ? -.505 : -.30,0);
        target.applyQuaternion(hand.elbow.quaternion).add(hand.elbow.position)
          .applyQuaternion(arm.quaternion).add(arm.position)
          .sub(collar.position).applyQuaternion(inverseRotation.copy(collar.quaternion).invert())
          .sub(shoulder.position);
        tip.copy(contact.tip);
        for(let j=2;j>=0;j--){
          const knuckle=contact.joints[j].bone;
          tip.applyQuaternion(knuckle.quaternion).add(knuckle.position);
        }
        shoulderStart.copy(shoulder.quaternion);
        elbowStart.copy(elbow.quaternion);
        for(let step=0;step<5;step++){
          from.copy(tip).applyQuaternion(elbow.quaternion).normalize();
          to.copy(target).applyQuaternion(inverseRotation.copy(shoulder.quaternion).invert())
            .sub(elbow.position).normalize();
          elbow.quaternion.premultiply(rotation.setFromUnitVectors(from,to));
          from.copy(tip).applyQuaternion(elbow.quaternion).add(elbow.position)
            .applyQuaternion(shoulder.quaternion).normalize();
          shoulder.quaternion.premultiply(rotation.setFromUnitVectors(from,to.copy(target).normalize()));
        }
        const amount=contactAmount;
        shoulder.quaternion.slerp(shoulderStart,1-amount);
        elbow.quaternion.slerp(elbowStart,1-amount);
      }
    });
  }
  const bones = names.map(name=>nodes[name]);
  const skeleton = new THREE.Skeleton(bones,bones.map(b=>inverse.get(b)));
  // Evaluate before Three updates descendants, including in the shadow pass.
  const update = rig.upperBody.updateMatrixWorld;
  rig.upperBody.updateMatrixWorld = function(force) {
    const now=performance.now();
    for(const apply of updates)apply(now);
    update.call(this,force);
  };
  return {skeleton,dispose(){
    rig.upperBody.updateMatrixWorld=update;
    for(const root of roots)root.removeFromParent();
    skeleton.dispose();
  }};
}
