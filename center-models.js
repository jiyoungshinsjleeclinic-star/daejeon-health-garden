import * as THREE from './vendor/three.module.js';
import {compactMeshes} from './center-visuals.js?v=bp-1';
import {createBPDisplay} from './bp-display.js?v=bp-1';
import {createGlucoseDisplay} from './glucose-display.js?v=glucose-1';
import {createCholesterolDisplay} from './cholesterol-display.js?v=cholesterol-2';
export function makeDevice(type,x,z,{parent,box,cylinder,sphere,mat,mats}){
const g=new THREE.Group();g.position.set(x,0,z);parent.add(g);const b=(w,h,d,x,y,z,m)=>box(w,h,d,x,y,z,m,g),c=(r,h,x,y,z,m)=>cylinder(r,h,x,y,z,m,g),s=(r,x,y,z,m)=>sphere(r,x,y,z,m,g);const metal=new THREE.MeshStandardMaterial({color:'#b4bdc0',metalness:.8,roughness:.26}),black=mat('#252b2e'),blue=mat('#498eb5'),cream=mat('#bcbfb7');
function ring(r,t,x,y,z,m){const o=new THREE.Mesh(new THREE.TorusGeometry(r,t,10,28),m);o.position.set(x,y,z);g.add(o);return o}
function cable(points,color='#747d83',radius=.015){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const o=new THREE.Mesh(new THREE.TubeGeometry(curve,18,radius,6,false),mat(color));g.add(o);return o}
if(type==='heightweight'){
 b(1.05,.13,1.15,0,.14,.1,mats.white);b(.85,.025,.92,0,.22,.1,black);
 for(const sx of [-.24,.24])b(.17,.01,.48,sx,.239,.12,metal);
 b(.17,2.65,.16,0,1.5,-.42,mats.white);b(.07,2.15,.018,0,1.45,-.326,metal);
 for(let i=0;i<16;i++)b(i%4===0?.06:.03,.012,.01,.01,.6+i*.13,-.313,black);
 const head=new THREE.Group();head.position.y=2.8;g.add(head);head.add(b(.75,.08,.7,0,0,-.05,black));g.userData.heightHead=head;
 b(.19,.3,.06,.14,1.59,-.30,mats.white);b(.135,.15,.012,.14,1.63,-.26,mats.blue);
}
if(type==='arterial'){
 b(1.05,.12,.9,0,.2,0,mats.white);
 for(const sx of [-.42,.42])for(const sz of [-.32,.32]){const wheel=c(.1,.07,sx,.11,sz,black);wheel.rotation.x=Math.PI/2}
 for(const sx of [-.4,.4])c(.025,1.55,sx,.94,-.27,metal);
 for(const y of [.36,.73,1.05])b(.95,.07,.72,0,y,0,mats.white);
 b(.72,.3,.48,0,.56,.03,black);b(.6,.13,.035,0,.58,.29,metal);
 const head=b(.95,.35,.64,0,1.31,.02,mats.white);head.rotation.x=.13;
 b(.62,.2,.027,-.09,1.34,.365,black);b(.5,.12,.012,-.09,1.36,.385,mats.blue);
 for(const [x,color] of [[.33,'#76988c'],[.33,'#b59c62']])c(.035,.018,x,1.51,color==='#76988c'?.06:.2,mat(color));
 b(1.05,.13,.1,0,1.97,-.27,metal);
 for(const [sx,color] of [[-.25,'#73889d'],[.25,'#a27e71']]){
  const cuff=b(.3,.4,.25,sx,1.77,-.19,mat(color));cuff.rotation.z=sx;
  cable([[sx,1.78,-.1],[sx*.9,1.2,.42],[sx,.8,.45],[sx,1.29,.22]],color);
 }
}
if(type==='cholesterol'||type==='glucose'){
 const lipid=type==='cholesterol',w=lipid?.4:.31,d=lipid?.69:.58;
 b(w,.105,d,0,.0525,0,lipid?mats.white:mat('#263241'));
 b(w*.83,.017,d*.7,0,.134,-.03,mat('#29374a'));
 if(lipid&&typeof document!=='undefined'){
  const display=createCholesterolDisplay();display.reset();const screen=new THREE.Mesh(new THREE.PlaneGeometry(w*.69,d*.39),display.material);screen.rotation.x=-Math.PI/2;screen.position.set(0,.157,-d*.12);g.add(screen);g.userData.cholesterolDisplay=display;g.userData.cholesterolScreen=screen;
  const strip=new THREE.Group();strip.visible=false;g.add(strip);const body=new THREE.Mesh(new THREE.BoxGeometry(.055,.012,.28),mats.white);body.position.set(0,.055,d*.56);strip.add(body);const tip=new THREE.Mesh(new THREE.BoxGeometry(.045,.013,.05),black);tip.position.set(0,.056,d*.74);strip.add(tip);g.userData.cholesterolStrip=strip;
 }
 else if(lipid||typeof document==='undefined')b(w*.69,.012,d*.39,0,.148,-d*.12,mat('#93a7ae'));
 else{const display=createGlucoseDisplay();display.reset();const screen=new THREE.Mesh(new THREE.PlaneGeometry(w*.69,d*.39),display.material);screen.rotation.x=-Math.PI/2;screen.position.set(0,.157,-d*.12);g.add(screen);g.userData.glucoseDisplay=display;g.userData.glucoseScreen=screen}
 for(const sx of [-w*.25,0,w*.25])c(.025,.012,sx,.151,d*.22,mats.white);
 b(.06,.015,.04,0,.04,d*.51,black);
 if(!lipid){b(.055,.012,.24,0,.055,.4,mats.white);b(.045,.013,.045,0,.056,.49,black)}
}
if(type==='hba1c'){
 b(.92,.56,.82,0,.28,0,mats.white);b(.83,.53,.045,0,.32,.427,black);
 b(.65,.32,.018,0,.39,.46,mat('#738e99'));b(.28,.045,.025,0,.12,.46,black);
 b(.54,.025,.44,0,.603,-.06,mats.white);b(.18,.02,.13,0,.621,-.06,metal);
 for(let i=0;i<4;i++)b(.013,.08,.045,.467,.22+i*.055,-.12,metal);
}
if(type==='bloodpressure'){
 b(.8,.1,.7,0,.05,0,metal);c(.09,.85,0,.5,0,metal);b(1.5,.1,1.1,0,.95,0,mats.white);
 b(.78,.38,.5,-.34,1.18,-.15,mats.white);b(.78,.1,.7,-.34,1.04,.1,mats.white);b(.72,.65,.07,-.355,1.47,.29,black);
 if(typeof document!=='undefined'){
  const display=createBPDisplay();display.reset();const screen=new THREE.Mesh(new THREE.PlaneGeometry(.66,.55),display.material);screen.position.set(-.355,1.47,.332);g.add(screen);g.userData.bpDisplay=display;g.userData.bpScreen=screen;
  const startLabel=new THREE.Mesh(new THREE.PlaneGeometry(.105,.0525),display.buttonMaterial);startLabel.rotation.x=-Math.PI/2;startLabel.position.set(-.355,1.12,.446);g.add(startLabel);
 }
 b(.67,.46,.89,.35,1.29,0,mats.white);
 const shell=new THREE.Mesh(new THREE.CylinderGeometry(.33,.33,.78,36,1,true),mats.white);shell.rotation.x=Math.PI/2;shell.position.set(.32,1.6,.02);g.add(shell);
 const cuff=new THREE.Mesh(new THREE.CylinderGeometry(.235,.235,.67,36,1,true),new THREE.MeshStandardMaterial({color:'#5c656c',side:THREE.DoubleSide,roughness:1}));cuff.rotation.x=Math.PI/2;cuff.position.set(.32,1.6,.04);g.add(cuff);g.userData.bpCuff=ring(.275,.067,.32,1.6,.43,blue);
 const start=c(.075,.022,-.355,1.105,.446,mat('#257ac0'));ring(.073,.012,-.355,1.12,.446,mat('#65d9ff')).rotation.x=-Math.PI/2;g.userData.bpStart=start;
 b(.22,.025,.15,.02,1.1,.35,black);const stool=c(.3,.12,0,.55/.75,.9,mats.dark);stool.scale.y=1/.75;g.scale.y=.75;
}
if(type==='coffee'){b(1.3,.8,1,0,.4,0,mats.white);b(.95,1.35,.7,0,1.48,0,black);b(.65,.5,.05,0,1.82,.38,mats.dark);b(.45,.1,.2,0,1.4,.45,metal);b(.75,.06,.5,0,.94,.28,black);c(.13,.22,0,1.08,.5,mats.white);b(.4,.18,.5,0,2.22,0,black)}
if(type==='water'){b(.95,2.35,.85,0,1.2,0,mats.white);b(.7,.65,.05,0,1.68,.45,mats.blue);b(.65,.4,.15,0,.9,.4,metal);b(.7,.05,.45,0,.65,.45,metal)}
if(type==='inbody'){b(.95,.13,1.15,0,.1,0,black);for(const sx of [-.27,.27])b(.18,.02,.55,sx,.18,.1,metal);c(.1,1.65,0,.9,-.35,metal);b(.7,.45,.15,0,1.95,-.35,metal);b(.55,.3,.02,0,1.96,-.26,black);for(const sx of [-.65,.65]){const h=b(.07,.75,.07,sx,1.1,-.15,black);h.rotation.z=sx<0?-.65:.65}}
if(type==='bloodtest'){b(1,.12,.7,0,.08,0,mats.white);c(.08,.9,0,.55,0,metal);b(1.3,.1,1,0,1.05,0,mats.white);b(.8,.7,.75,0,1.45,0,mats.white);b(.65,.45,.04,0,1.48,.4,black);b(.52,.3,.02,0,1.5,.43,mats.blue)}
if(type==='bed'){b(1.65,.22,3.3,0,.62,0,mats.wood);for(const sx of [-.68,.68])for(const sz of [-1.4,1.4])b(.16,.55,.16,sx,.28,sz,mats.wood);b(1.5,.2,3.15,0,.83,0,mat('#191b1c'));b(1.05,.16,.65,0,1.01,-1.08,mat('#65574e'))}
if(type==='massage'){b(1.4,.5,2,0,.3,0,cream);b(1.15,.35,1.2,0,.75,0,cream);const back=b(1.3,1.6,.45,0,1.45,-.7,cream);back.rotation.x=-.22;for(const sx of [-.75,.75]){b(.3,.7,1.7,sx,.75,.05,cream);b(.2,.14,1.3,sx,1.14,.05,metal)}const foot=b(1.1,.35,1,0,.58,1.05,cream);foot.rotation.x=.2;b(.85,.25,.25,0,2.1,-.58,cream)}
if(type==='ceragem'){b(1.6,.5,3.3,0,.3,0,mats.white);b(1.45,.18,3.15,0,.65,0,black);b(1.3,.15,.6,0,.8,-1.1,black);b(.55,.08,.5,.95,.85,-.9,mats.white);b(.28,.4,.25,.95,.6,-.9,metal)}
if(type==='bike'){b(1.3,.12,2,0,.1,0,metal);const wheel=c(.4,.35,0,.5,.3,black);wheel.rotation.x=Math.PI/2;c(.08,1.1,0,.7,-.55,metal);b(.6,.17,.5,0,1.2,-.55,black);c(.07,1.6,0,.95,.8,metal);b(.8,.08,.08,0,1.8,.8,black);b(.55,.4,.08,0,1.85,1,black);for(const sx of [-.5,.5])b(.3,.08,.18,sx,.5,0,black)}
if(type==='treadmill'){b(1.4,.2,2.7,0,.16,0,metal);b(1.15,.04,2.3,0,.3,0,black);for(const sx of [-.6,.6]){const p=b(.09,1.3,.1,sx,.9,-.9,metal);p.rotation.x=-.12;b(.1,.07,.8,sx,1.4,-.5,black)}b(1.3,.35,.2,0,1.65,-1,metal);b(.9,.2,.03,0,1.7,-.88,black)}
if(type==='weights'){b(2.5,.12,.9,0,.8,0,mats.wood);for(const sx of [-1,1])b(.12,.75,.7,sx,.4,0,mats.wood);for(let i=0;i<5;i++){const sx=-.9+i*.45;b(.08,.08,.35,sx,1,0,black);for(const sz of [-.18,.18]){const w=c(.12,.1,sx,1,sz,black);w.rotation.x=Math.PI/2}}for(let i=0;i<3;i++){s(.19,-.65+i*.6,.25,.7,black);ring(.13,.04,-.65+i*.6,.49,.7,black)}for(let i=0;i<2;i++)s(.48,-.6+i*1.2,.5,-1,blue)}
if(type==='coffee'){
 b(.84,.8,.025,0,1.35,.365,black);b(.7,.12,.16,0,1.42,.46,metal);
 for(const sx of [-.13,.13])c(.036,.12,sx,1.3,.48,metal);
 for(let i=0;i<8;i++)b(.035,.012,.35,-.3+i*.085,.98,.3,metal);
 ring(.095,.025,.14,1.1,.5,mats.white);
 for(const sx of [-.47,.47])b(.035,1.25,.035,sx,1.48,.36,metal);
 const face=b(.62,.46,.016,0,1.82,.415,new THREE.MeshStandardMaterial({color:'#112a2c',roughness:.22}));
 for(const sx of [-.18,0,.18]){b(.1,.1,.008,sx,1.84,.428,mats.white);b(.12,.012,.008,sx,1.75,.428,mats.blue)}
 b(.48,.17,.48,0,2.27,-.03,new THREE.MeshStandardMaterial({color:'#4b3930',transparent:true,opacity:.8,roughness:.25}));
 b(.52,.035,.52,0,2.37,-.03,black);
 for(let i=0;i<6;i++)b(.2,.017,.012,.32,1.03+i*.065,-.357,metal);
}
if(type==='water'){
 b(.87,1.8,.035,0,1.4,.445,mats.white);b(.72,.42,.025,0,1.76,.478,metal);
 for(const [sx,color] of [[-.23,'#748fa1'],[0,'#b0b6b5'],[.23,'#ae7e78']]){c(.035,.02,sx,2.12,.1,mat(color));b(.09,.07,.02,sx,1.72,.5,mat(color))}
 for(const sx of [-.16,.16]){c(.035,.14,sx,1.15,.5,metal);b(.08,.04,.11,sx,1.08,.51,metal)}
 b(.66,.36,.025,0,.93,.48,black);
 for(let i=0;i<7;i++)b(.025,.012,.32,-.27+i*.09,.69,.48,metal);
 b(.73,.025,.02,0,.4,.44,metal);
}
if(type==='bed'||type==='ceragem'){
 for(const sx of [-.7,.7])b(.012,.012,2.95,sx,type==='bed'?.94:.75,0,metal);
}
if(type==='massage'){
 for(const sx of [-.43,.43]){const cushion=s(.38,sx,1.42,-.41,cream);cushion.scale.set(.55,1.65,.48)}
 for(const sx of [-.28,.28]){const foot=s(.3,sx,.65,1.28,cream);foot.scale.set(.8,.7,1.2)}
 for(let i=0;i<4;i++)b(.9,.014,.012,0,.95+i*.2,-.445,metal);
 b(.17,.3,.045,.83,1.3,.4,black);b(.12,.18,.012,.83,1.34,.43,blue);
}
if(type==='bike'){
 for(const sx of [-.28,.28]){b(.32,.08,.2,sx,.42,.15,black);b(.025,.16,.025,sx,.5,.15,metal)}
 for(const sx of [-.34,.34])b(.12,.1,.48,sx,1.79,.71,black);
 b(.35,.22,.012,0,1.86,1.05,mats.blue);
}
if(type==='treadmill'){
 for(let i=0;i<11;i++)b(.9,.005,.012,0,.327,-.9+i*.18,metal);
 b(.65,.18,.015,0,1.72,-.85,black);for(const sx of [-.45,.45])b(.14,.07,.02,sx,1.64,-.87,mat(sx<0?'#a56968':'#7f9e8c'));
}
return compactMeshes(g);
}
