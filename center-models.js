import * as THREE from './vendor/three.module.js';
export function makeDevice(type,x,z,{parent,box,cylinder,sphere,mat,mats}){
const g=new THREE.Group();g.position.set(x,0,z);parent.add(g);const b=(w,h,d,x,y,z,m)=>box(w,h,d,x,y,z,m,g),c=(r,h,x,y,z,m)=>cylinder(r,h,x,y,z,m,g),s=(r,x,y,z,m)=>sphere(r,x,y,z,m,g);const metal=mat('#b4bdc0'),black=mat('#333b40'),blue=mat('#498eb5'),cream=mat('#c2c2b5');
function ring(r,t,x,y,z,m){const o=new THREE.Mesh(new THREE.TorusGeometry(r,t,10,28),m);o.position.set(x,y,z);g.add(o);return o}
if(type==='bloodpressure'){b(.8,.1,.7,0,.05,0,metal);c(.09,.85,0,.5,0,metal);b(1.3,.1,.9,0,.95,0,mats.white);b(.9,.35,.65,0,1.2,0,mats.white);ring(.26,.12,.18,1.42,.08,blue);b(.32,.25,.04,-.31,1.45,.34,black);b(.25,.17,.02,-.31,1.47,.37,mats.blue);c(.3,.12,0,.55,1,mats.dark)}
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
return g;
}
