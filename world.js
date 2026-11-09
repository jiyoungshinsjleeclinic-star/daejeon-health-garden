import * as THREE from './vendor/three.module.js';
import {makeDevice} from './center-models.js';
import {CENTER_PLAN,planPortal} from './center-plan.js';
const host=document.querySelector('#world'),status=document.querySelector('#world-status');
try { init(); } catch(e) { status.textContent='3D 공간을 불러오지 못했어요. 아래 체험 메뉴는 그대로 이용할 수 있습니다.';host.classList.add('failed');console.error(e); }
function init(){
let buildRoot;
let viewMode='follow',yaw=0,pitch=.15;const indoorParts=[],worldLabels=[];let obstacles=[],cameraSolids=[],navGrid=null,pathfinder=null,pathQueue=[],pathRequest=0,doorCooldown=0;
const scene=new THREE.Scene();scene.background=new THREE.Color('#e7f1ed');
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;renderer.setClearColor('#e7f1ed');host.prepend(renderer.domElement);renderer.domElement.setAttribute('aria-label','캐릭터로 산책하는 가상의 건강센터');renderer.domElement.setAttribute('role','img');renderer.domElement.tabIndex=0;
const camera=new THREE.PerspectiveCamera(62,1,.08,200);const look=new THREE.Vector3(0,0,0);let zoom=1,angle=0;const base=new THREE.Vector3(20,27,32);
scene.add(new THREE.HemisphereLight(0xffffff,0x86a99a,2.6));const sun=new THREE.DirectionalLight(0xfff3d9,3.2);sun.position.set(-12,24,12);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-24,right:24,top:24,bottom:-24});sun.shadow.normalBias=.03;scene.add(sun);
const mat=c=>new THREE.MeshStandardMaterial({color:c,roughness:.85});const mats={green:mat('#5f8f77'),dark:mat('#2c6656'),white:mat('#f1f2f0'),wood:mat('#c5a77e'),pink:mat('#d78f9f'),blue:mat('#92bac9'),yellow:mat('#e2c66f'),leaf:mat('#70a487'),floor:mat('#e5e7e6'),skin:mat('#f4ccaa')};
function box(w,h,d,x,y,z,m,parent=buildRoot){const a=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),typeof m==='string'?mat(m):m);a.position.set(x,y,z);a.castShadow=true;a.receiveShadow=true;parent.add(a);return a}
function cylinder(r,h,x,y,z,m,parent=buildRoot){const a=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,24),typeof m==='string'?mat(m):m);a.position.set(x,y,z);a.castShadow=true;a.receiveShadow=true;parent.add(a);return a}
function sphere(r,x,y,z,m,parent=buildRoot){const a=new THREE.Mesh(new THREE.SphereGeometry(r,16,12),m);a.position.set(x,y,z);a.castShadow=true;parent.add(a);return a}
function label(text,x,y,z,color='#305d4e',w=3.5){const canvas=document.createElement('canvas');canvas.width=768;canvas.height=160;const c=canvas.getContext('2d');c.fillStyle='#fffdf6';c.beginPath();c.roundRect(6,6,756,148,26);c.fill();c.strokeStyle='#d4e3d6';c.lineWidth=6;c.stroke();c.fillStyle=color;c.textAlign='center';c.textBaseline='middle';c.font='bold 46px sans-serif';c.fillText(text,384,80);const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;const a=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthTest:true}));a.scale.set(w,w*160/768,1);a.position.set(x,y,z);a.userData.labelScale=a.scale.clone();worldLabels.push(a);buildRoot.add(a);return a}
function plant(x,z,scale=1){const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(scale);buildRoot.add(g);cylinder(.35,.5,0,.25,0,mats.white,g);cylinder(.08,1.3,0,1,0,mats.wood,g);for(let i=0;i<5;i++){const leaf=sphere(.45,Math.cos(i*2)*.28,1.3+i*.15,Math.sin(i*2)*.28,mats.leaf,g);leaf.scale.set(.8,1.3,.8)}return g}
function chair(x,z,color){const g=new THREE.Group();g.position.set(x,0,z);buildRoot.add(g);box(1.4,.3,1.3,0,.65,0,color,g);box(1.4,1.15,.25,0,1.2,-.6,color,g);box(.2,.65,1.25,-.7,.95,0,color,g);box(.2,.65,1.25,.7,.95,0,color,g);for(const a of [-.5,.5])for(const b of [-.45,.45])box(.12,.5,.12,a,.25,b,mats.wood,g);return g}
function table(x,z,w=2.5){const g=new THREE.Group();g.position.set(x,0,z);buildRoot.add(g);box(w,.15,1.3,0,1.15,0,mats.wood,g);for(const a of [-w/2+.2,w/2-.2])for(const b of [-.4,.4])box(.12,1.1,.12,a,.55,b,mats.white,g);return g}
function person(color){const g=new THREE.Group();const shirt=mat(color);const legs=[],arms=[];cylinder(.33,.8,0,1.12,0,shirt,g);sphere(.32,0,1.9,0,mats.skin,g);const hair=sphere(.33,0,2.03,-.035,mat('#564a3f'),g);hair.scale.y=.6;for(const x of [-.12,.12])sphere(.025,x,1.92,.295,mats.dark,g);for(const x of [-.17,.17]){const p=new THREE.Group();p.position.set(x,.75,0);g.add(p);box(.23,.65,.24,0,-.28,0,mats.dark,p);box(.26,.16,.4,0,-.64,.07,mats.white,p);legs.push(p)}for(const x of [-.43,.43]){const p=new THREE.Group();p.position.set(x,1.5,0);g.add(p);box(.2,.55,.2,0,-.22,0,shirt,p);sphere(.12,0,-.55,0,mats.skin,p);arms.push(p)}buildRoot.add(g);return {g,legs,arms,shirt}}

const defs=[...window.COUNSEL_ROOMS,...window.CENTER_SPACES];const lobby=new THREE.Group(),interior=new THREE.Group();scene.add(lobby,interior);interior.visible=false;buildRoot=lobby;

const bounds=CENTER_PLAN.bounds;
function onFloor(x,z){if(z<bounds.minZ||z>bounds.maxZ||x>bounds.maxX)return false;return x>=(z<-.3?-18:z<3.9?-10.8:-14.4)}
const outline=[[-18,-8.5],[18,-8.5],[18,8.8],[-14.4,8.8],[-14.4,3.9],[-10.8,3.9],[-10.8,-.3],[-18,-.3]];
const floorShape=new THREE.Shape();outline.forEach(([x,z],i)=>i?floorShape.lineTo(x,-z):floorShape.moveTo(x,-z));floorShape.closePath();
const tileCanvas=document.createElement('canvas');tileCanvas.width=tileCanvas.height=128;const tileContext=tileCanvas.getContext('2d');tileContext.fillStyle='#e5e8e6';tileContext.fillRect(0,0,128,128);tileContext.strokeStyle='#ccd2cf';tileContext.lineWidth=2;tileContext.strokeRect(0,0,128,128);const tiles=new THREE.CanvasTexture(tileCanvas);tiles.wrapS=tiles.wrapT=THREE.RepeatWrapping;tiles.colorSpace=THREE.SRGBColorSpace;
const tileMat=new THREE.MeshStandardMaterial({color:'#ffffff',map:tiles,roughness:1});
const floor=new THREE.Mesh(new THREE.ExtrudeGeometry(floorShape,{depth:.35,bevelEnabled:false}),[tileMat,mats.green]);floor.rotation.x=-Math.PI/2;floor.position.y=-.35;floor.receiveShadow=true;lobby.add(floor);
box(65,.12,45,0,-.65,0,'#dde7e1');
box(28,.02,2.7,-3,.015,-2,'#d5ddda');
const clickable=[];const roomClickable=[];let activeRoom=null,seated=false,destination=null,seatAfterMove=false;const roomPos=new Map();
function register(object,type,def=null,list=clickable){object.userData.action={type,def};list.push(object)}
function sitPose(p,on){p.legs.forEach(l=>l.rotation.x=on?-Math.PI/2:0);p.arms.forEach(l=>l.rotation.x=on?-.3:0)}
function addDevice(type,x,z,detailed=false){const o=makeDevice(type,x,z,{parent:buildRoot,box,cylinder,sphere,mat,mats});register(o,'facility',{id:type},detailed?roomClickable:clickable);return o}
function deviceTag(name,type,x,z,detailed=false){const sign=label(name,x,2.65,z,'#305d4e',2.8);sign.material.toneMapped=false;register(sign,'facility',{id:type},detailed?roomClickable:clickable)}
function roomDecor(def,detailed){
const gym=def.id==='muscle'&&detailed,w=gym?16:10,d=gym?12:9,doorX=layout[def.id]?.doorX||0;
box(w,.12,d,0,.02,0,gym?'#d8c19c':'#e2e6e5');box(w,3.4,.18,0,1.7,-d/2,mats.white);box(.18,2.6,d,-w/2,1.3,0,mats.white);box(.18,.7,d,w/2,.35,0,mats.white);

for(const [left,right] of [[-w/2,doorX-1.2],[doorX+1.2,w/2]]){const width=right-left;if(width<=0)continue;const x=(left+right)/2;box(width,.8,.18,x,.4,d/2,mats.white);indoorParts.push(box(width,2.6,.18,x,2.1,d/2,mats.white))}
indoorParts.push(box(.18,2.7,d,w/2,2.05,0,mats.white),box(.18,.8,d,-w/2,3,0,mats.white),box(2.4,.6,.18,doorX,3.1,d/2,mats.white));
for(const x of [doorX-1.24,doorX+1.24])box(.12,2.75,.22,x,1.38,d/2,'#84928e');
box(2.6,.13,.24,doorX,2.78,d/2,'#84928e');
const doorLeaf=box(.08,2.5,1.05,doorX-1.12,1.27,d/2-.5,'#cbdcda');
doorLeaf.userData.doorLeaf=true;
const roof=box(w,.12,d,0,3.65,0,new THREE.MeshBasicMaterial({color:'#e7e9e7'}));roof.castShadow=false;indoorParts.push(roof);for(const x of [-2,2]){const light=box(1.8,.04,.6,x,3.55,-1,new THREE.MeshBasicMaterial({color:'#ffffff'}));light.castShadow=false;indoorParts.push(light)}
box(2.4,.07,.8,doorX,.1,d/2-.1,mats.wood);box(2.6,.05,2.5,0,.12,2.4,def.color);
box(2.5,1.4,.06,-2.9,2.3,-4.37,mats.blue);box(.08,1.5,.12,-2.9,2.3,-4.28,mats.white);box(2.6,.1,.3,-2.9,1.55,-4.2,mats.wood);
table(0,0,3.4);box(.75,.04,.6,-.6,1.26,.1,mats.white);box(.35,.07,.55,.7,1.26,0,mats.blue);
const employeeChair=chair(0,-2,mats.green),visitorChair=chair(0,2,mats.blue);visitorChair.rotation.y=Math.PI;
const employee=person('#e8f3ef');employee.g.position.set(0,.13,-2);sitPose(employee,true);
const tag=label('가상 안내 직원',0,2.9,-2,'#305d4e',2.8);tag.material.toneMapped=false;
if(def.id!=='general')plant(-3.9,-3.1,.9);plant(def.id==='education'?-3.8:3.8,3.2,.8);
const shelf=box(2,1.8,.5,3.5,.9,-4.1,mats.wood);for(let i=0;i<5;i++)box(.22,.7,.35,2.8+i*.32,1.05,-4,mats.white);
if(def.id==='cardio'&&detailed){addDevice('inbody',-3,-2.1,true);addDevice('bloodtest',3.1,-2.2,true);deviceTag('체성분 분석기','inbody',-3,-2.1,true);addDevice('bloodpressure',3,1.8,true)}
if(def.id==='general')makeDevice('bed',-3,-2.1,{parent:buildRoot,box,cylinder,sphere,mat,mats});
if(def.id==='muscle'&&detailed){for(let z=-5.8;z<6;z+=.5)box(15.9,.015,.025,0,.09,z,'#c5aa82');for(const [type,x,z,name] of [['bike',-5,-3.2,'실내 자전거'],['treadmill',-5,.5,'걷기 운동기구'],['ceragem',5,-2.5,'세라젬'],['massage',5,2,'안마기'],['weights',0,-4.6,'운동 소도구']]){addDevice(type,x,z,true);deviceTag(name,type,x,z,true)}}
if(def.id==='environment'){box(1.6,1.1,.5,-3.3,.6,-1,mats.green);for(let i=0;i<3;i++)cylinder(.15,.4,-3.8+i*.45,1.4,-1,[mats.yellow,mats.blue,mats.white][i]);box(1.2,1,.05,.3,2.4,-4.35,mats.yellow)}
if(def.id==='stress'||def.id==='trauma'){const sofa=chair(-3.1,-1.4,mat('#deded2'));sofa.scale.x=1.65;cylinder(.7,.6,-2.7,.32,.3,mats.white);plant(3,-2.5,1.2);box(1.7,1.1,.05,.3,2.4,-4.35,def.color)}
if(def.id==='education'){box(3.5,1.7,.08,0,2.5,-4.3,mats.white);box(3.2,1.4,.06,0,2.5,-4.23,mats.dark);for(const x of [-2.7,2.7])for(const z of [-.9,1.6]){table(x,z,1.7);const c=chair(x,z+1,mats.white);c.rotation.y=Math.PI}}
if(detailed){register(visitorChair,'seat',def,roomClickable);register(employee.g,'talk',def,roomClickable);register(tag,'talk',def,roomClickable);const seatTag=label('방문자 의자',0,1.3,2.9,'#305d4e',2.3);seatTag.material.toneMapped=false;register(seatTag,'seat',def,roomClickable)}
}

const layout=CENTER_PLAN.rooms;

defs.forEach(def=>{const pos=layout[def.id];if(!pos){roomPos.set(def.id,{portal:{x:-7,z:4,nx:0,nz:1}});return}
const portal=planPortal(pos);roomPos.set(def.id,{...pos,portal});const group=new THREE.Group();group.position.set(pos.x,0,pos.z);if(pos.side==='left'){group.rotation.y=-Math.PI/2;group.scale.set(pos.depth/10,1,pos.width/9)}else group.scale.set(pos.width/10,1,pos.depth/9);
lobby.add(group);buildRoot=group;roomDecor(def,false);
const name=pos.label||def.name;const sign=label(name,pos.doorX||0,3.04,4.64,'#305d4e',pos.side==='left'?4.5:4);sign.material.toneMapped=false;register(sign,'enter',def);const doorway=box(2.4,2,.8,pos.doorX||0,1,4.5,new THREE.MeshBasicMaterial({visible:false}));register(doorway,'enter',def);buildRoot=lobby});
// The public lobby and the rear corridor meet through the passage left of reception.
const desk=CENTER_PLAN.reception;
box(desk.width,1.2,1,desk.x,.6,desk.z,mats.white);box(desk.width+.15,.12,1.12,desk.x,1.3,desk.z,mats.white);
for(const x of [-3.4,0,3.4]){box(1.4,.65,.1,x,1.65,desk.z-.15,mats.dark);box(.1,.35,.1,x,1.3,desk.z-.15,mats.dark)}
const receptionist=person('#f2f4f1');receptionist.g.position.set(0,0,desk.z-1.1);
register(box(desk.width,2.3,1.15,desk.x,1,desk.z,new THREE.MeshBasicMaterial({visible:false})),'facility',{id:'reception'});
const receptionLabel=label('접수데스크',desk.x,3.1,desk.z,'#305d4e',4);receptionLabel.material.toneMapped=false;register(receptionLabel,'facility',{id:'reception'});
box(11.3,2.8,.15,0,1.4,-.3,mats.white);
const f=CENTER_PLAN.facilities;
for(const key of ['leftBP','rightBP'])addDevice('bloodpressure',f[key].x,f[key].z);
deviceTag('자동혈압계','bloodpressure',f.leftBP.x,f.leftBP.z);deviceTag('자동혈압계','bloodpressure',f.rightBP.x,f.rightBP.z);
for(const type of ['coffee','water'])addDevice(type,f[type].x,f[type].z).rotation.y=Math.PI/2;
deviceTag('커피머신 · 정수기','coffee',f.coffee.x,1);
const sofaMat=mat('#dfddd0'),cushionMat=mat('#e9e6d9');
function sofaSection(w,d,x,z){box(w,.34,d,x,.5,z,sofaMat);box(w,.3,d*.83,x,.78,z+.04,cushionMat);for(const sx of [-w/2+.15,w/2-.15])box(.15,.35,d-.15,x+sx,.2,z,mats.wood)}
sofaSection(6.8,1.35,-10.5,7.5);box(6.8,1,.22,-10.5,1.15,8.15,sofaMat);
sofaSection(1.35,3.4,-13.25,6.2);box(.22,1,3.4,-13.9,1.15,6.2,sofaMat);
for(const x of [-12.8,-11.2,-9.6,-8])box(.06,.01,1.1,x,.94,7.5,sofaMat);
const wt=f.waitingTable;box(2.7,.65,1.3,wt.x,.35,wt.z,'#6f9ca8');box(2.8,.1,1.4,wt.x,.73,wt.z,'#526d74');for(const x of [-.7,0,.7])box(.45,.025,.65,wt.x+x,.8,wt.z,mats.white);
label('대기실',-10.4,2.4,7,'#305d4e',3);
const ent=CENTER_PLAN.entrance,glass=new THREE.MeshStandardMaterial({color:'#b6d2d1',transparent:true,opacity:.2,roughness:.2});
for(const x of [ent.x-1,ent.x+1])box(1.9,2.8,.08,x,1.45,ent.z,glass);
box(4.3,.18,.2,ent.x,3.1,ent.z,mats.dark);const entranceLabel=label('센터 입구',ent.x,3.5,ent.z,'#305d4e',4);entranceLabel.material.toneMapped=false;entranceLabel.userData.mapOnly=true;
// The indented left outline follows the sketch around the waiting area and beverage counter.
for(const [w,d,x,z] of [[.16,4.2,-10.8,1.8],[7.2,.16,-14.4,-.3],[.16,4.9,-14.4,6.35]]){
box(w,.75,d,x,.375,z,mats.white);indoorParts.push(box(w,2.65,d,x,2.075,z,mats.white))}
for(const [w,d,x,z] of [[.16,17.3,18,0.15],[36,.16,0,-8.5],[9.2,.16,-9.8,8.8],[19.2,.16,8.4,8.8]])indoorParts.push(box(w,3.8,d,x,1.9,z,mats.white));
const lobbyRoof=new THREE.Mesh(new THREE.ShapeGeometry(floorShape),new THREE.MeshBasicMaterial({color:'#e7e9e7',side:THREE.DoubleSide}));lobbyRoof.rotation.x=-Math.PI/2;lobbyRoof.position.y=4.5;lobby.add(lobbyRoof);indoorParts.push(lobbyRoof);
for(let x=-12;x<=15;x+=6)for(let z=-6;z<=6;z+=4)if(onFloor(x,z)){const light=box(2,.05,.65,x,4.38,z,new THREE.MeshBasicMaterial({color:'#ffffff'}));light.castShadow=false;indoorParts.push(light)}
buildRoot=scene;const avatar=person('#d58a91');avatar.g.position.set(CENTER_PLAN.entrance.x,0,4);avatar.g.rotation.y=Math.PI;avatar.g.traverse(o=>{if(o.isMesh)o.castShadow=false});let equipmentPose=null;
const marker=new THREE.Mesh(new THREE.RingGeometry(.35,.44,32),new THREE.MeshBasicMaterial({color:'#397b62',side:THREE.DoubleSide}));marker.rotation.x=-Math.PI/2;marker.position.y=.15;marker.visible=false;scene.add(marker);
const desiredCam=camera.position.clone(),desiredLook=new THREE.Vector3();const keys=new Set(),ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),ground=new THREE.Plane(new THREE.Vector3(0,1,0),0);let last=performance.now(),moving=false,initial=true;
function notifySeat(){document.querySelector('#sit').setAttribute('aria-pressed',String(seated));document.dispatchEvent(new CustomEvent('counsel-seat-change',{detail:{seated:seated&&!equipmentPose}}))}
function stand(){if(!seated)return;equipmentPose=null;avatar.g.rotation.x=0;seated=false;avatar.g.position.set(0,0,3.3);sitPose(avatar,false);notifySeat();resize()}
function seat(){if(!activeRoom)return;equipmentPose=null;avatar.g.rotation.x=0;destination=null;seatAfterMove=false;marker.visible=false;keys.clear();seated=true;avatar.g.position.set(0,.13,2);avatar.g.rotation.y=Math.PI;sitPose(avatar,true);status.textContent='방문자 의자에 앉았어요.';notifySeat();resize()}
function cleanupInterior(){for(const list of [indoorParts,worldLabels])for(let i=list.length-1;i>=0;i--)if(list[i].parent===interior)list.splice(i,1);const ownedMaterials=new Set();interior.traverse(o=>{o.geometry?.dispose();if(o.material&&!Object.values(mats).includes(o.material))ownedMaterials.add(o.material)});for(const m of ownedMaterials){m.map?.dispose();m.dispose()}interior.clear();roomClickable.length=0}
function enter(def){initial=true;pathQueue=[];pathRequest++;doorCooldown=performance.now()+1200;equipmentPose=null;avatar.g.rotation.x=0;if(document.querySelector('dialog[open]'))document.querySelector('dialog[open]').close();destination=null;marker.visible=false;keys.clear();seated=false;sitPose(avatar,false);activeRoom=def;lobby.visible=false;interior.visible=true;cleanupInterior();buildRoot=interior;roomDecor(def,true);buildRoot=scene;avatar.g.position.set(layout[def.id]?.doorX||0,0,3.7);avatar.g.rotation.y=Math.PI;zoom=1;angle=0;document.body.dataset.room=def.id;document.querySelectorAll('[data-enter-room]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.enterRoom===def.id)));document.dispatchEvent(new CustomEvent('counsel-room-change',{detail:{room:def,seated:false}}));notifySeat();status.textContent=def.name+'에 들어왔어요.';yaw=0;pitch=.15;rebuildNavigation();applyView();resize()}
function leave(){if(!activeRoom)return;initial=true;pathQueue=[];pathRequest++;doorCooldown=performance.now()+1200;equipmentPose=null;avatar.g.rotation.x=0;const pos=roomPos.get(activeRoom.id)||{x:0,z:0};activeRoom=null;seated=false;destination=null;keys.clear();marker.visible=false;sitPose(avatar,false);lobby.visible=true;interior.visible=false;const portal=pos.portal||{x:-7,z:4,nx:0,nz:1};avatar.g.position.set(portal.x+portal.nx*1.5,0,portal.z+portal.nz*1.5);avatar.g.rotation.y=0;zoom=1;angle=0;document.body.dataset.room='lobby';document.querySelectorAll('[data-enter-room]').forEach(b=>b.setAttribute('aria-pressed','false'));document.dispatchEvent(new CustomEvent('counsel-room-change',{detail:{room:null,seated:false}}));notifySeat();status.textContent='다른 상담실도 천천히 둘러보세요.';yaw=pos.portal?.nx===-1?-Math.PI/2:0;rebuildNavigation();applyView();resize()}
document.addEventListener('counsel-enter',e=>{const def=defs.find(d=>d.id===e.detail);if(def)enter(def)});document.addEventListener('counsel-leave',leave);document.addEventListener('counsel-seat',()=>equipmentPose?seat():seated?stand():seat());
document.querySelector('#sit').onclick=()=>{if(activeRoom){seated?stand():seat()}else status.textContent='상담실에 들어가면 방문자 의자에 앉을 수 있어요.'};

function isBlocked(x,z,r=.3){if(!activeRoom&&!onFloor(x,z))return true;return obstacles.some(b=>x>b.min.x-r&&x<b.max.x+r&&z>b.min.z-r&&z<b.max.z+r)}
function rebuildNavigation(){
renderer.shadowMap.needsUpdate=true;
const root=activeRoom?interior:lobby;root.updateMatrixWorld(true);obstacles=[];cameraSolids=[];
root.traverse(o=>{if(!o.isMesh||o.material?.visible===false)return;const bounds=new THREE.Box3().setFromObject(o);if(bounds.max.y>.35&&bounds.min.y<2&&!o.material.transparent)obstacles.push(bounds);if(bounds.max.y>.35&&bounds.min.y<4.6&&!o.material.transparent)cameraSolids.push(o)});
const gym=activeRoom?.id==='muscle';const minX=activeRoom?(gym?-7.5:-4.6):bounds.minX,minZ=activeRoom?(gym?-5.4:-4):bounds.minZ,maxX=-minX,maxZ=activeRoom?(gym?5.9:4.9):bounds.maxZ;
const step=.4,width=Math.floor((maxX-minX)/step)+1,height=Math.floor((maxZ-minZ)/step)+1;const grid=Array.from({length:height},()=>Array(width).fill(0));
for(const b of obstacles){const x0=Math.max(0,Math.floor((b.min.x-.3-minX)/step)),x1=Math.min(width-1,Math.ceil((b.max.x+.3-minX)/step)),z0=Math.max(0,Math.floor((b.min.z-.3-minZ)/step)),z1=Math.min(height-1,Math.ceil((b.max.z+.3-minZ)/step));for(let z=z0;z<=z1;z++)for(let x=x0;x<=x1;x++)grid[z][x]=1}
if(!activeRoom)for(let z=0;z<height;z++)for(let x=0;x<width;x++)if(!onFloor(minX+x*step,minZ+z*step))grid[z][x]=1;
navGrid={grid,minX,minZ,step,width,height};pathfinder=new window.EasyStar.js();pathfinder.setGrid(grid);pathfinder.setAcceptableTiles([0]);pathfinder.enableDiagonals();pathfinder.disableCornerCutting();pathfinder.setIterationsPerCalculation(10000);pathfinder.enableSync();
}
function moveTo(x,z){
if(seated)stand();const g=navGrid,cell=(x,z)=>[Math.round((x-g.minX)/g.step),Math.round((z-g.minZ)/g.step)];const [sx,sz]=cell(avatar.g.position.x,avatar.g.position.z),[tx,tz]=cell(x,z);
if(tx<0||tz<0||tx>=g.width||tz>=g.height||sx<0||sz<0||sx>=g.width||sz>=g.height||g.grid[tz][tx]!==0){status.textContent='통로의 빈 바닥을 선택해 주세요.';return}
const request=++pathRequest;g.grid[sz][sx]=0;pathfinder.findPath(sx,sz,tx,tz,path=>{if(request!==pathRequest)return;if(!path?.length){status.textContent='이곳까지 이어지는 통로를 찾지 못했어요.';return}pathQueue=path.slice(1).map(p=>new THREE.Vector3(g.minX+p.x*g.step,0,g.minZ+p.y*g.step));destination=pathQueue.shift()||null;marker.position.set(x,.15,z);marker.visible=!!destination});pathfinder.calculate();
}
let drag=null;
renderer.domElement.addEventListener('pointerdown',e=>{if(document.querySelector('dialog[open]'))return;renderer.domElement.focus({preventScroll:true});drag={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:false};renderer.domElement.setPointerCapture(e.pointerId)});
renderer.domElement.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.lastX,dy=e.clientY-drag.lastY;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>6)drag.moved=true;if(drag.moved){if(viewMode==='map'){angle-=dx*.006;resize()}else{yaw-=dx*.006;pitch=THREE.MathUtils.clamp(pitch+dy*.004,-.2,.55)}}drag.lastX=e.clientX;drag.lastY=e.clientY});
renderer.domElement.addEventListener('pointercancel',()=>drag=null);
renderer.domElement.addEventListener('pointerup',e=>{const click=drag&&!drag.moved;drag=null;if(!click||document.querySelector('dialog[open]'))return;const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);const hits=ray.intersectObjects(activeRoom?roomClickable:clickable,true);if(hits.length){let o=hits[0].object;while(o&&!o.userData.action)o=o.parent;const a=o?.userData.action;const at=new THREE.Vector3();o?.getWorldPosition(at);const reachable=viewMode==='map'||activeRoom||avatar.g.position.distanceTo(at)<9;if(!reachable){status.textContent='해당 공간 가까이로 이동해 주세요.';return}if(a?.type==='facility')document.dispatchEvent(new CustomEvent('facility-open',{detail:a.def.id}));else if(a?.type==='enter')enter(a.def);else if(a?.type==='seat')seat();else if(a?.type==='talk'){seat();document.querySelector('#talk-staff').click()}}else{const p=new THREE.Vector3();if(ray.ray.intersectPlane(ground,p))moveTo(p.x,p.z)}});
renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();zoom=THREE.MathUtils.clamp(zoom-e.deltaY*.001,.75,1.6);resize()},{passive:false});
function ignoreKeys(e){return document.querySelector('dialog[open]')||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||(e.target.tagName==='BUTTON'&&e.key==='Enter')}
window.addEventListener('keydown',e=>{if(ignoreKeys(e))return;if(e.key==='Escape'&&activeRoom){leave();return}if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(e.key)){e.preventDefault();keys.add(e.key);destination=null;pathQueue=[];pathRequest++;stand()}if(e.key==='Enter'&&activeRoom){seat();document.querySelector('#talk-staff').click()}});
window.addEventListener('keyup',e=>keys.delete(e.key));window.addEventListener('blur',()=>keys.clear());document.addEventListener('visibilitychange',()=>{keys.clear();last=performance.now()});
document.querySelectorAll('[data-dir]').forEach(b=>{const map={up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'};b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(map[b.dataset.dir]);destination=null;pathQueue=[];pathRequest++;stand()});const end=()=>keys.delete(map[b.dataset.dir]);b.addEventListener('pointerup',end);b.addEventListener('pointercancel',end);b.addEventListener('lostpointercapture',end)});

document.addEventListener('facility-pose',e=>{if(!['ceragem','massage'].includes(e.detail))return;const def=defs.find(d=>d.id==='muscle');if(activeRoom?.id!=='muscle')enter(def);destination=null;keys.clear();equipmentPose=e.detail;seated=true;const bed=e.detail==='ceragem';avatar.g.position.set(5,bed?.65:.13,bed?-2.5:2);avatar.g.rotation.y=0;avatar.g.rotation.x=bed?-Math.PI/2:0;if(bed){avatar.g.position.z=-1.7;sitPose(avatar,false)}else sitPose(avatar,true);notifySeat();status.textContent=(bed?'세라젬':'안마기')+' 가상 자세 체험 · 실제 기기는 작동하지 않습니다.'});

document.querySelectorAll('[data-color]').forEach(b=>b.onclick=()=>{avatar.shirt.color.set(b.dataset.color);document.querySelectorAll('[data-color]').forEach(c=>c.setAttribute('aria-pressed',String(c===b)))});

document.querySelector('#zoom-in').onclick=()=>{zoom=Math.min(1.6,zoom+.15);resize()};document.querySelector('#zoom-out').onclick=()=>{zoom=Math.max(.75,zoom-.15);resize()};
document.querySelector('#rotate').onclick=()=>{if(viewMode==='map')angle+=Math.PI/6;else yaw+=Math.PI/6;resize()};
document.querySelector('#reset-view').onclick=()=>{zoom=1;angle=0;yaw=0;pitch=.15;resize()};
function applyView(){renderer.shadowMap.needsUpdate=true;for(const p of indoorParts)p.visible=viewMode!=='map';avatar.g.visible=viewMode!=='eye';document.body.dataset.cameraMode=viewMode;for(const id of ['follow','eye','map'])document.querySelector('#view-'+id).setAttribute('aria-pressed',String(viewMode===id));camera.fov=viewMode==='map'?40:viewMode==='eye'?70:62;camera.updateProjectionMatrix()}
for(const id of ['follow','eye','map'])document.querySelector('#view-'+id).onclick=()=>{viewMode=id;destination=null;pathQueue=[];pathRequest++;applyView();resize()};
document.querySelector('#fullscreen').onclick=async()=>{const shell=document.querySelector('.world-shell');try{if(document.fullscreenElement)await document.exitFullscreen();else await shell.requestFullscreen()}catch{status.textContent='이 브라우저에서는 전체화면을 지원하지 않습니다.'}};
function updateWalkCamera(){
const a=avatar.g.position,forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));const height=equipmentPose==='ceragem'?1.3:seated?1.5:1.55;
desiredLook.copy(a).add(new THREE.Vector3(0,height,0)).addScaledVector(forward,viewMode==='eye'?3:.9);
if(viewMode==='eye'){desiredCam.copy(a).add(new THREE.Vector3(0,height+.15,0));desiredLook.y+=pitch*4}
else{const distance=(activeRoom?(seated?2.2:3):4.5)/zoom;desiredCam.copy(a).add(new THREE.Vector3(Math.sin(yaw)*distance,(activeRoom?2.05:2.6)+pitch*2,Math.cos(yaw)*distance));if(activeRoom&&seated&&!equipmentPose){desiredLook.set(0,1.8,-1.3);desiredCam.copy(a).add(new THREE.Vector3(2.1,2.1,2.1).applyAxisAngle(new THREE.Vector3(0,1,0),yaw))}const dir=desiredCam.clone().sub(desiredLook),length=dir.length();ray.set(desiredLook,dir.normalize());const hit=ray.intersectObjects(cameraSolids,false).find(h=>h.distance>.45&&h.distance<length);if(hit)desiredCam.copy(desiredLook).addScaledVector(dir,Math.max(.7,hit.distance-.22))}
}
function resize(){const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.fov=viewMode==='eye'?70/zoom:viewMode==='map'?40:62;if(viewMode==='map'){const f=camera.aspect<.85?1.8:camera.aspect<1.2?1.35:1.12;if(activeRoom){const offset=(activeRoom.id==='muscle'?new THREE.Vector3(13,12,17):new THREE.Vector3(9,9,13)).applyAxisAngle(new THREE.Vector3(0,1,0),angle).multiplyScalar((camera.aspect<.85?1.42:1.1)/zoom);desiredLook.set(0,1,0);desiredCam.copy(offset).add(desiredLook)}else{desiredLook.set(0,0,0);desiredCam.copy(base).applyAxisAngle(new THREE.Vector3(0,1,0),angle).multiplyScalar(f/zoom)}}else updateWalkCamera();camera.updateProjectionMatrix();if(initial){camera.position.copy(desiredCam);look.copy(desiredLook);initial=false}}new ResizeObserver(resize).observe(host);
rebuildNavigation();applyView();resize();
const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
function tick(now){requestAnimationFrame(tick);const dt=Math.min((now-last)/1000,.05);last=now;let dx=0,dz=0;moving=false;if(!document.querySelector('dialog[open]')){if(keys.size){const horizontal=Number(keys.has('ArrowRight')||keys.has('d'))-Number(keys.has('ArrowLeft')||keys.has('a'));const vertical=Number(keys.has('ArrowDown')||keys.has('s'))-Number(keys.has('ArrowUp')||keys.has('w'));const v=new THREE.Vector3(horizontal,0,vertical).applyAxisAngle(new THREE.Vector3(0,1,0),viewMode==='map'?Math.PI/4+angle:yaw);dx=v.x;dz=v.z}else if(destination){dx=destination.x-avatar.g.position.x;dz=destination.z-avatar.g.position.z;if(Math.hypot(dx,dz)<.12){destination=pathQueue.shift()||null;if(!destination)marker.visible=false;dx=dz=0}}if(!seated&&Math.hypot(dx,dz)>.01){moving=true;const len=Math.hypot(dx,dz),step=Math.min(3.5*dt,len),maxX=activeRoom?(activeRoom.id==='muscle'?7.2:4.3):18;const nx=THREE.MathUtils.clamp(avatar.g.position.x+dx/len*step,-maxX,maxX),nz=THREE.MathUtils.clamp(avatar.g.position.z+dz/len*step,activeRoom?(activeRoom.id==='muscle'?-5.4:-3.9):bounds.minZ,activeRoom?(activeRoom.id==='muscle'?5.9:4.9):bounds.maxZ);if(!isBlocked(nx,avatar.g.position.z))avatar.g.position.x=nx;if(!isBlocked(avatar.g.position.x,nz))avatar.g.position.z=nz;avatar.g.rotation.y=Math.atan2(dx,dz)}}if(!seated){avatar.legs.forEach((p,i)=>p.rotation.x=moving&&!reduced?Math.sin(now*.012+i*Math.PI)*.5:0);avatar.arms.forEach((p,i)=>p.rotation.x=moving&&!reduced?-Math.sin(now*.012+i*Math.PI)*.35:0)}if(moving&&now>doorCooldown){if(activeRoom){if(avatar.g.position.z>(activeRoom.id==='muscle'?5.65:4.55)&&Math.abs(avatar.g.position.x-(layout[activeRoom.id]?.doorX||0))<1.05)leave()}else{for(const def of defs){const p=roomPos.get(def.id)?.portal;if(layout[def.id]&&p&&Math.hypot(avatar.g.position.x-p.x,avatar.g.position.z-p.z)<.8){enter(def);break}}}}if(viewMode!=='map')updateWalkCamera();camera.position.lerp(desiredCam,reduced?1:Math.min(1,dt*8));look.lerp(desiredLook,reduced?1:Math.min(1,dt*8));camera.lookAt(look);for(const tag of worldLabels){if(!tag.parent)continue;const position=new THREE.Vector3();tag.getWorldPosition(position);tag.visible=viewMode==='map'||(!tag.userData.mapOnly&&position.distanceTo(avatar.g.position)<15&&position.distanceTo(camera.position)>2);tag.scale.copy(tag.userData.labelScale).multiplyScalar(viewMode==='map'?1:.6)}renderer.render(scene,camera);document.body.dataset.worldReady='true';window.healthWorldState={x:avatar.g.position.x,z:avatar.g.position.z,seated,room:activeRoom?.id||'lobby',cameraDistance:camera.position.distanceTo(look),cameraX:camera.position.x,cameraY:camera.position.y,cameraZ:camera.position.z,lookX:look.x,lookY:look.y,lookZ:look.z,fov:camera.fov,pathRemaining:pathQueue.length+(destination?1:0),yaw,viewMode,equipmentPose,ready:true}}requestAnimationFrame(tick);status.textContent='입구 정면 접수데스크에서 산책을 시작해요.';
}
