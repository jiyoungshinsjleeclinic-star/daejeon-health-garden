import * as THREE from './vendor/three.module.js';

const segments={0:'abcedf',1:'bc',2:'abged',3:'abgcd',4:'fgbc',5:'afgcd',6:'afgecd',7:'abc',8:'abcdefg',9:'abfgcd','-':'g'};
export function createBPDisplay(){
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=640;const c=canvas.getContext('2d');
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 const material=new THREE.MeshBasicMaterial({map:texture,toneMapped:false});
 const buttonCanvas=document.createElement('canvas');buttonCanvas.width=256;buttonCanvas.height=128;const bc=buttonCanvas.getContext('2d');bc.fillStyle='#2478bc';bc.fillRect(0,0,256,128);bc.fillStyle='#fff';bc.font='bold 90px sans-serif';bc.textAlign='center';bc.textBaseline='middle';bc.fillText('시작',128,64);const buttonTexture=new THREE.CanvasTexture(buttonCanvas);buttonTexture.colorSpace=THREE.SRGBColorSpace;const buttonMaterial=new THREE.MeshBasicMaterial({map:buttonTexture,toneMapped:false});
 let value={mode:'idle',pressure:0,systolic:null,diastolic:null,pulse:null};
 function number(text,x,y,size){
  const w=size*.54,h=size,t=size*.095;
  for(const ch of String(text)){
   const lit=segments[ch]||'';
   for(const [key,px,py,pw,ph] of [['a',t,0,w-2*t,t],['g',t,h/2-t/2,w-2*t,t],['d',t,h-t,w-2*t,t],['f',0,t,t,h/2-1.5*t],['b',w-t,t,t,h/2-1.5*t],['e',0,h/2+t/2,t,h/2-1.5*t],['c',w-t,h/2+t/2,t,h/2-1.5*t]]){c.fillStyle=lit.includes(key)?'#ff323b':'#2b2024';c.fillRect(x+px,y+py,pw,ph)}
   x+=w+size*.16;
  }
 }
 function draw(){
  c.fillStyle='#10171b';c.fillRect(0,0,1024,640);c.fillStyle='#f6df88';c.font='bold 30px sans-serif';c.fillText('가상 혈압 측정',44,48);
  c.fillStyle='#fff';c.font='26px sans-serif';c.fillText(value.mode==='inflating'?'가압 예시':'최고혈압 SYS',44,110);c.fillText('최저혈압 DIA',545,110);
  number(value.mode==='inflating'?value.pressure:value.systolic??'---',44,145,155);number(value.diastolic??'---',545,145,155);
  c.fillStyle='#c6d0d1';c.font='24px sans-serif';c.fillText('mmHg',375,330);c.fillText('mmHg',875,330);c.fillText('맥박 PULSE',545,380);
  number(value.pulse??'---',545,405,115);c.fillStyle='#c6d0d1';c.font='24px sans-serif';c.fillText('bpm',880,520);
  c.fillStyle='#f9de8b';c.font='bold 29px sans-serif';c.fillText('가상 예시 · 실제 측정값 아님',44,587);texture.needsUpdate=true;
 }
 return{material,buttonMaterial,update(next){value={...value,...next};draw()},get value(){return{...value}},reset(){value={mode:'idle',pressure:0,systolic:null,diastolic:null,pulse:null};draw()}};
}
