export function containRect(sourceWidth,sourceHeight,targetWidth,targetHeight,scale=1){
 const fit=Math.min(targetWidth/sourceWidth,targetHeight/sourceHeight)*scale;
 const width=sourceWidth*fit,height=sourceHeight*fit;
 return{x:(targetWidth-width)/2,y:(targetHeight-height)/2,width,height};
}

export function createEducationScreenMedia(THREE,src){
 const canvas=document.createElement('canvas');canvas.width=960;canvas.height=720;
 const context=canvas.getContext('2d');const image=new Image();image.decoding='async';image.src=src;
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;
 let ready=false,updates=0,lastFrame=-Infinity,active=true,frame=0;
 const paint=(now=0)=>{
  if(!image.complete||!image.naturalWidth)return false;
  const phase=now/5200,scale=1.025+Math.sin(phase*Math.PI*2)*.012;
  const rect=containRect(image.naturalWidth,image.naturalHeight,canvas.width,canvas.height,scale);
  context.fillStyle='#151b19';context.fillRect(0,0,canvas.width,canvas.height);
  context.drawImage(image,rect.x+Math.sin(phase*Math.PI*2)*8,rect.y,rect.width,rect.height);
  texture.needsUpdate=true;ready=true;updates++;return true;
 };
 const loop=now=>{if(!active)return;if(now-lastFrame>=33){lastFrame=now;paint(now)}frame=requestAnimationFrame(loop)};
 image.addEventListener('load',()=>paint(performance.now()),{once:true});frame=requestAnimationFrame(loop);
 return{
  texture,
  update(now){if(now-lastFrame<33)return;lastFrame=now;paint(now)},
  stop(){active=false;cancelAnimationFrame(frame);image.src=''},
  snapshot(){return{ready,updates,sourceWidth:image.naturalWidth||0,sourceHeight:image.naturalHeight||0}}
 };
}
