import * as THREE from './vendor/three.module.js';

export const ARTERIAL_EXAMPLE={
 rightArm:'126 / 78',leftArm:'124 / 77',rightAnkle:'142 / 80',leftAnkle:'140 / 79',
 rightBapwv:1320,leftBapwv:1295,rightAbi:1.13,leftAbi:1.12
};

export function createArterialDisplay(){
 const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=760;const c=canvas.getContext('2d'),texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 const material=new THREE.MeshBasicMaterial({map:texture,toneMapped:false});let mode='idle';
 function label(text,x,y,size=34,color='#d8e6e1',align='left'){c.fillStyle=color;c.textAlign=align;c.font=`${size}px sans-serif`;c.fillText(text,x,y)}
 function draw(){
  c.fillStyle='#101b20';c.fillRect(0,0,1200,760);label('동맥경화 검사 결과',60,76,48,'#f4f8f5');label('측정 예시 · 실제 검사 및 건강 판정 아님',1140,74,28,'#f1d58c','right');
  c.strokeStyle='#49645d';c.lineWidth=3;c.strokeRect(48,110,1104,235);label('혈압 (mmHg)',76,155,30,'#91d9b5');
  const rows=[['오른팔',ARTERIAL_EXAMPLE.rightArm,80,208],['왼팔',ARTERIAL_EXAMPLE.leftArm,635,208],['오른발목',ARTERIAL_EXAMPLE.rightAnkle,80,295],['왼발목',ARTERIAL_EXAMPLE.leftAnkle,635,295]];
  for(const [name,value,x,y] of rows){label(name,x,y,32);label(value,x+240,y,48,'#ffffff','center')}
  c.strokeRect(48,375,1104,285);label('동맥경직도 baPWV (cm/s)',76,425,30,'#91d9b5');label(`오른쪽  ${ARTERIAL_EXAMPLE.rightBapwv}`,110,495,43,'#ffffff');label(`왼쪽  ${ARTERIAL_EXAMPLE.leftBapwv}`,650,495,43,'#ffffff');
  label('발목상완지수 ABI',76,565,30,'#91d9b5');label(`오른쪽  ${ARTERIAL_EXAMPLE.rightAbi.toFixed(2)}`,110,630,43,'#ffffff');label(`왼쪽  ${ARTERIAL_EXAMPLE.leftAbi.toFixed(2)}`,650,630,43,'#ffffff');
  label(mode==='result'?'고정된 가상 수치입니다.':'검사 준비 중',600,720,30,mode==='result'?'#f1d58c':'#b8c8c2','center');texture.needsUpdate=true;
 }
 draw();
 return{material,update(next){mode=next;draw()},reset(){mode='idle';draw()},get value(){return{mode,...ARTERIAL_EXAMPLE,example:true}}};
}
