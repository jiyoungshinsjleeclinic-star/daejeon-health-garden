import * as THREE from './vendor/three.module.js';

export const GLUCOSE_EXAMPLE=92;
export function createGlucoseDisplay(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;const c=canvas.getContext('2d');
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 const material=new THREE.MeshBasicMaterial({map:texture,toneMapped:false});let mode='idle',value=null;
 function draw(){
  c.fillStyle='#dce7df';c.fillRect(0,0,1024,1024);c.fillStyle='#233e35';c.textAlign='center';c.font='bold 90px sans-serif';c.fillText('혈당',512,130);
  c.font='bold 330px monospace';c.fillText(value===null?'--':String(value),512,480);c.font='bold 100px sans-serif';c.fillText('mg/dL',512,625);
  c.fillStyle='#244f42';c.font='bold 70px sans-serif';c.fillText('측정값은 예시입니다',512,805);c.font='56px sans-serif';c.fillText('실제 검사·진단 아님',512,915);texture.needsUpdate=true;
 }
 return{material,update(next){mode=next;value=mode==='result'?GLUCOSE_EXAMPLE:null;draw()},reset(){mode='idle';value=null;draw()},get value(){return{mode,value,unit:'mg/dL',example:true}}};
}
