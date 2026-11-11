import * as THREE from './vendor/three.module.js';

export const HBA1C_EXAMPLE=5.6;
export function createHbA1cDisplay(){
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;const c=canvas.getContext('2d'),texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 const material=new THREE.MeshBasicMaterial({map:texture,toneMapped:false});let mode='idle',value=null;
 function draw(){c.fillStyle='#172126';c.fillRect(0,0,1024,512);c.fillStyle='#ecf5ef';c.textAlign='center';c.font='bold 74px sans-serif';c.fillText('HbA1c',512,90);c.fillStyle='#8fe0b5';c.font='bold 190px monospace';c.fillText(value===null?'--':value.toFixed(1)+'%',512,285);c.fillStyle='#f4e6a0';c.font='bold 58px sans-serif';c.fillText('측정 예시',512,390);c.fillStyle='#d8e3de';c.font='42px sans-serif';c.fillText('실제 검사·진단 아님',512,462);texture.needsUpdate=true}
 return{material,update(next){mode=next;value=mode==='result'?HBA1C_EXAMPLE:null;draw()},reset(){mode='idle';value=null;draw()},get value(){return{mode,label:'HbA1c',value,unit:'%',example:true}}};
}
