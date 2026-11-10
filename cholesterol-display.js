import * as THREE from './vendor/three.module.js';

export const CHOLESTEROL_EXAMPLE=168;
export function createCholesterolDisplay(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;const c=canvas.getContext('2d');
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 const material=new THREE.MeshBasicMaterial({map:texture,toneMapped:false});let mode='idle',value=null;
 function draw(){
  c.fillStyle='#d9e4df';c.fillRect(0,0,1024,1024);c.fillStyle='#233b34';c.textAlign='center';
  c.font='bold 72px sans-serif';c.fillText(mode==='code-check'?'CODE 025':'콜레스테롤',512,130);
  c.font='bold 300px monospace';c.fillText(value===null?'--':String(value),512,470);
  c.font='bold 86px sans-serif';c.fillText(value===null?'검사 준비':'mg/dL',512,610);
  c.fillStyle='#245043';c.font='bold 72px sans-serif';c.fillText('측정 예시',512,800);
  c.font='54px sans-serif';c.fillText('실제 검사·진단 아님',512,915);texture.needsUpdate=true;
 }
 return{material,update(next){mode=next;value=mode==='result'?CHOLESTEROL_EXAMPLE:null;draw()},reset(){mode='idle';value=null;draw()},get value(){return{mode,value,unit:'mg/dL',example:true}}};
}
