import * as THREE from './vendor/three.module.js';

export const INBODY_EXAMPLES={
 female:{weight:55,water:'30.2 L',protein:'8.1 kg',mineral:'3.1 kg',fatMass:'13.6 kg',bodyFat:'24.7%',muscle:'22.5 kg',segments:'팔·몸통·다리 균형',visceral:'6',ecw:'11.2 L',score:'78점'},
 male:{weight:70,water:'40.5 L',protein:'10.8 kg',mineral:'3.7 kg',fatMass:'15.0 kg',bodyFat:'21.4%',muscle:'31.0 kg',segments:'팔·몸통·다리 균형',visceral:'7',ecw:'14.9 L',score:'80점'}
};

export function createInBodyDisplay(){
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=768;const c=canvas.getContext('2d');
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const material=new THREE.MeshBasicMaterial({map:texture,toneMapped:false});let mode='idle',gender='female';
 function text(value,x,y,size=38,color='#e8f2ed',align='left',weight='600'){c.fillStyle=color;c.textAlign=align;c.font=`${weight} ${size}px sans-serif`;c.fillText(value,x,y)}
 function draw(){
  const data=INBODY_EXAMPLES[gender];c.fillStyle='#152025';c.fillRect(0,0,1024,768);text('InBody 체성분 분석',50,72,48,'#f3f7f4','left','700');text('측정 예시 · 실제 검사 결과 아님',974,70,28,'#f4d88a','right');c.strokeStyle='#547066';c.lineWidth=2;c.beginPath();c.moveTo(50,98);c.lineTo(974,98);c.stroke();
  if(mode==='idle'){text('측정 대기',512,390,82,'#8ecdb2','center','700')}
  else if(mode==='weight'){text('체중',512,245,54,'#dbe8e2','center','700');text(`${data.weight.toFixed(1)} kg`,512,420,150,'#ff5d5d','center','700');text(gender==='female'?'여성 캐릭터 예시':'남성 캐릭터 예시',512,515,34,'#dbe8e2','center')}
  else{
   const rows=[['체수분',data.water,'단백질',data.protein],['무기질',data.mineral,'체지방량',data.fatMass],['체지방률',data.bodyFat,'체중',`${data.weight.toFixed(1)} kg`],['골격근량',data.muscle,'내장지방레벨',data.visceral],['세포외수분',data.ecw,'인바디점수',data.score]];
   rows.forEach((row,i)=>{const y=155+i*92;text(row[0],60,y,30,'#a9c1b7');text(row[1],270,y,40,'#ffffff','left','700');text(row[2],535,y,30,'#a9c1b7');text(row[3],760,y,40,'#ffffff','left','700');c.strokeStyle='#33483f';c.beginPath();c.moveTo(50,y+28);c.lineTo(974,y+28);c.stroke()});
   text('부위별근육분석',60,655,30,'#a9c1b7');text(data.segments,355,655,38,'#8fe0b5','left','700');text('고정된 가상 예시이며 건강 상태를 판정하지 않습니다.',512,728,25,'#f4d88a','center');
  }
  texture.needsUpdate=true;
 }
 return{material,update(next,nextGender=gender){mode=next;gender=nextGender==='male'?'male':'female';draw()},reset(){mode='idle';draw()},get value(){return{mode,gender,...INBODY_EXAMPLES[gender],example:true}}};
}
