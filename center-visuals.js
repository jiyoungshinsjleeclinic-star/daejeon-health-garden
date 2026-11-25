import * as THREE from './vendor/three.module.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';

// Merge only siblings so articulated joints and interactive group roots stay intact.
export function compactMeshes(group){
 for(const child of [...group.children])if(child.isGroup)compactMeshes(child);
 const buckets=new Map();
 for(const child of group.children)if(child.isMesh&&!Array.isArray(child.material)){
  const list=buckets.get(child.material)||[];list.push(child);buckets.set(child.material,list);
 }
 for(const [material,parts] of buckets){
  if(parts.length<2)continue;
  const geometries=parts.map(part=>{part.updateMatrix();return (part.geometry.index?part.geometry.toNonIndexed():part.geometry.clone()).applyMatrix4(part.matrix)});
  const merged=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());if(!merged)continue;
  const o=new THREE.Mesh(merged,material);o.castShadow=o.receiveShadow=true;group.add(o);
  parts.forEach(part=>{part.geometry.dispose();group.remove(part)});
 }
 return group;
}

// Bevels use Three's extrusion geometry; structural walls keep their simple geometry.
export function roundedGeometry(w,h,d,r=.06){
 r=Math.min(r,w*.22,h*.22,d*.22);
 const x=w/2-r,y=h/2-r,c=Math.min(r*.5,x*.5,y*.5),s=new THREE.Shape();
 s.moveTo(-x+c,-y);s.lineTo(x-c,-y);s.quadraticCurveTo(x,-y,x,-y+c);
 s.lineTo(x,y-c);s.quadraticCurveTo(x,y,x-c,y);s.lineTo(-x+c,y);
 s.quadraticCurveTo(-x,y,-x,y-c);s.lineTo(-x,-y+c);s.quadraticCurveTo(-x,-y,-x+c,-y);
 const g=new THREE.ExtrudeGeometry(s,{depth:d-2*r,bevelEnabled:true,bevelThickness:r,bevelSize:r,bevelSegments:4,steps:1,curveSegments:6});
 g.translate(0,0,-d/2+r);g.computeVertexNormals();return g;
}

function surfaceTexture(kind){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d');
 ctx.fillStyle=kind==='wood'?'#d2b78e':'#dddcd8';ctx.fillRect(0,0,256,256);
 if(kind==='wood'){
  for(let i=0;i<110;i++){ctx.strokeStyle=`rgba(102,70,41,${.025+(i%5)*.009})`;ctx.lineWidth=.5+i%3*.35;ctx.beginPath();
   for(let x=0;x<=256;x+=8){const y=(i*2.37+Math.sin(x*.018+i*.7)*(1+i%4))%256;x?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke()}
 }else{for(let i=0;i<256;i+=3){ctx.fillStyle=i%2?'#cccac5':'#eeeae4';ctx.globalAlpha=.22;ctx.fillRect(i,0,1,256);ctx.fillRect(0,i,256,1)}ctx.globalAlpha=1}
 const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;
}

export function makeMaterials(){
 const wood=surfaceTexture('wood'),fabric=surfaceTexture('fabric');
 const m=(color,options={})=>new THREE.MeshPhysicalMaterial({color,roughness:.7,...options});
 return {green:m('#719283',{map:fabric,roughness:.9,sheen:.18,sheenColor:'#d9eee6'}),dark:m('#285c50',{roughness:.52}),white:m('#f3f4f1',{roughness:.4,clearcoat:.08}),wood:m('#ffffff',{map:wood,roughness:.52,clearcoat:.06}),pink:m('#cb8c99',{map:fabric,roughness:.88,sheen:.2,sheenColor:'#f4d8de'}),blue:m('#88acb8',{map:fabric,roughness:.9,sheen:.16,sheenColor:'#dcebed'}),yellow:m('#d8bd6e',{roughness:.62}),leaf:m('#477950',{roughness:.55,clearcoat:.12}),floor:m('#e5e7e6',{roughness:.72}),skin:m('#e6b997',{roughness:.79,clearcoat:0}),metal:m('#b8c0c2',{metalness:.78,roughness:.25}),leather:m('#33383a',{roughness:.5,clearcoat:.16}),fabric:m('#dedbd0',{map:fabric,roughness:.92,sheen:.16,sheenColor:'#ffffff'})};
}

function mesh(parent,geometry,material,x,y,z){const o=new THREE.Mesh(geometry,material);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o}
function ellipsoid(parent,material,x,y,z,sx,sy,sz){const o=mesh(parent,new THREE.SphereGeometry(1,24,18),material,x,y,z);o.scale.set(sx,sy,sz);return o}
function softBox(parent,m,w,h,d,x,y,z,r=.07){return mesh(parent,roundedGeometry(w,h,d,r),m,x,y,z)}
function limb(parent,m,r,length,x,y,z){return mesh(parent,new THREE.CapsuleGeometry(r,Math.max(.01,length-r*2),6,16),m,x,y,z)}

// Elliptical cross sections shape fabric around the body while the joints stay articulated.
function shapedPanel(parent,material,profile,depth,x,y,z){
 const curve=new THREE.SplineCurve(profile.map(([height,radius])=>new THREE.Vector2(radius,height)));
 const rings=curve.getPoints(profile.length*3);
 rings.unshift(new THREE.Vector2(0,profile[0][0]));
 rings.push(new THREE.Vector2(0,profile.at(-1)[0]));
 const geometry=new THREE.LatheGeometry(rings,24);
 geometry.scale(1,1,depth);
 return mesh(parent,geometry,material,x,y,z);
}

export function makePerson(color,parent,mats,options={}){
 const g=new THREE.Group();parent.add(g);const shirt=new THREE.MeshPhysicalMaterial({color,roughness:.93,map:mats.fabric.map,bumpMap:mats.fabric.map,bumpScale:.0014,sheen:.12,sheenColor:'#ffffff'});
 const trousers=new THREE.MeshPhysicalMaterial({color:'#424c51',roughness:.94,map:mats.fabric.map,bumpMap:mats.fabric.map,bumpScale:.0012,sheen:.08,sheenColor:'#aab4b6'}),hair=new THREE.MeshPhysicalMaterial({color:'#392f2b',roughness:.59,clearcoat:.045,clearcoatRoughness:.7});
 const eyes=new THREE.MeshPhysicalMaterial({color:'#252724',roughness:.18,clearcoat:.7}),lip=new THREE.MeshPhysicalMaterial({color:'#ad7667',roughness:.45}),blush=new THREE.MeshPhysicalMaterial({color:'#d89087',roughness:.7,transparent:true,opacity:.38});
 // [온유] 여성일 때만 보이는 재질: 흰 블라우스, 조끼 안쪽 선
 const blouse=new THREE.MeshPhysicalMaterial({color:'#f6f4ee',roughness:.9,map:mats.fabric.map,bumpMap:mats.fabric.map,bumpScale:.001,sheen:.12,sheenColor:'#ffffff'}),vestEdge=new THREE.MeshPhysicalMaterial({color:'#1f3b31',roughness:.7});
 shapedPanel(g,shirt,[[.945,.18],[.965,.243],[1.06,.238],[1.19,.23],[1.34,.28],[1.425,.32],[1.465,.33],[1.49,.288],[1.515,.19],[1.55,.093]],.615,0,0,0);
 ellipsoid(g,trousers,0,.93,0,.245,.135,.17);
 limb(g,mats.skin,.082,.245,0,1.615,0);
 const head=new THREE.Group();
 g.add(head);
 // Build the face in its own coordinates so the eyes, hair and sensors move together.
 head.position.y=1.67;
 head.scale.set(.64,.64,.67);
 shapedPanel(head,mats.skin,[[1.594,.035],[1.626,.098],[1.70,.165],[1.80,.214],[1.89,.233],[1.99,.228],[2.085,.19],[2.14,.10],[2.15,.02]],.94,0,0,.013);
 // 귀(피부색 바깥만)
 for(const x of [-.239,.239]){ellipsoid(head,mats.skin,x,1.86,0,.045,.07,.035)}
 // 볼터치: x ±.239 → ±.125, z .224 → .206 (머리 표면 안쪽으로 맞춤)
 for(const x of [-.125,.125])ellipsoid(head,blush,x,1.82,.206,.05,.028,.006);
 // 남성 머리: 짧은 머리 + 앞머리
 const maleHair=new THREE.Group();head.add(maleHair);
 const cap=mesh(maleHair,new THREE.SphereGeometry(1,28,18,0,Math.PI*2,0,Math.PI*.58),hair,0,1.99,.005);cap.scale.set(.255,.225,.247);
 for(const x of [-.13,0,.13]){const bang=ellipsoid(maleHair,hair,x,1.982,.19,.09,.045,.04);bang.rotation.z=x<0?-.24:x>0?.24:0}
 // [온유] 여성 머리: 옆가르마 앞머리 + 어깨까지 오는 웨이브 단발
 const onyuHair=new THREE.Group();head.add(onyuHair);
 const crown=mesh(onyuHair,new THREE.SphereGeometry(1,28,18,0,Math.PI*2,0,Math.PI*.56),hair,0,1.99,0);crown.scale.set(.245,.235,.248);crown.rotation.x=-.25;
 const fringe=ellipsoid(onyuHair,hair,-.03,2.012,.205,.17,.055,.048);fringe.rotation.z=.22;
 ellipsoid(onyuHair,hair,0,1.8,-.12,.25,.32,.14);
 ellipsoid(onyuHair,hair,0,1.6,-.12,.215,.16,.1);
 for(const s of [-1,1]){
  ellipsoid(onyuHair,hair,s*.215,1.785,-.045,.065,.255,.145);
  ellipsoid(onyuHair,hair,s*.225,1.675,-.055,.053,.155,.115);
  const tip=ellipsoid(onyuHair,hair,s*.232,1.57,-.018,.040,.093,.066);tip.rotation.z=-s*.5;
 }
 // [온유] 눈매: 윗 속눈썹 선 (머리 곡면을 따라 살짝 돌려 배치)
 const onyuFace=new THREE.Group();head.add(onyuFace);
 for(const s of [-1,1]){const lash=limb(onyuFace,eyes,.0038,.105,s*.085,1.916,.2255);lash.rotation.set(0,s*.3,Math.PI/2)}
 const openEyes=new THREE.Group(),closedEyes=new THREE.Group();
 head.add(openEyes,closedEyes);closedEyes.visible=false;
 for(const x of [-.085,.085]){
  // 눈 크기: 흰자 .05×.031, 눈동자 .023×.028
  ellipsoid(openEyes,mats.white,x,1.89,.221,.045,.022,.012);ellipsoid(openEyes,eyes,x,1.889,.234,.020,.020,.009);
  ellipsoid(openEyes,mats.white,x-.005,1.897,.24,.005,.006,.003);
  const lid=ellipsoid(closedEyes,eyes,x,1.886,.231,.041,.005,.004);
  lid.rotation.y=x<0?-.26:.26;
  const brow=softBox(head,hair,.066,.012,.012,x,1.947,.222,.003);brow.rotation.z=x<0?.06:-.06;
 }
 ellipsoid(head,mats.skin,0,1.862,.225,.024,.061,.024);
 ellipsoid(head,mats.skin,0,1.831,.242,.032,.027,.029);
 // 입: 머리 표면보다 앞으로 이동하고 양 끝을 살짝 올림
 ellipsoid(head,lip,0,1.784,.211,.034,.0105,.011);
 for(const side of [-1,1]){const corner=ellipsoid(head,lip,side*.038,1.79,.208,.02,.009,.01);corner.rotation.z=side*.5}
 for(const feature of head.children)feature.position.y-=1.67;
 for(const side of [-1,1]){const collar=softBox(g,mats.white,.085,.105,.02,side*.055,1.49,.18,.012);collar.rotation.z=side*.4}
 // 남성: 셔츠 앞단추
 const maleFront=new THREE.Group();g.add(maleFront);
 softBox(maleFront,shirt,.035,.48,.025,0,1.2,.186,.005);
 for(const y of [1.12,1.27,1.39])ellipsoid(maleFront,mats.white,0,y,.207,.011,.011,.005);
 // [온유] 조끼 V넥: 안쪽 흰 블라우스 + 조끼 가장자리 선
 const onyuFront=new THREE.Group();g.add(onyuFront);
 const vShape=new THREE.Shape();vShape.moveTo(-.09,0);vShape.lineTo(.09,0);vShape.lineTo(0,-.2);vShape.closePath();
 mesh(onyuFront,new THREE.ExtrudeGeometry(vShape,{depth:.03,bevelEnabled:false}),blouse,0,1.51,.172);
 for(const s of [-1,1]){const edge=limb(onyuFront,vestEdge,.007,.21,s*.045,1.405,.2035);edge.rotation.z=-s*.442}
 const upperSleeve=[[-.33,.064],[-.265,.072],[-.135,.085],[-.03,.099],[.032,.085],[.065,.047],[.075,.012]];
 const foreSleeve=[[-.23,.060],[-.18,.065],[-.09,.073],[.005,.069],[.048,.047]];
 const arms=[],legs=[],shoes=[],feet=[],sleeves=[];
 for(const x of [-.355,.355]){
  const arm=new THREE.Group();arm.position.set(x,1.47,0);g.add(arm);
  // 어깨 .092/.115/.095, 위팔 반지름 .072 (길이·관절 위치는 그대로)
  shapedPanel(arm,shirt,upperSleeve,.93,0,0,0);const elbow=new THREE.Group();elbow.position.y=-.3;arm.add(elbow);arm.userData.elbow=elbow;
  // [온유] 흰 블라우스 소매: 팔보다 살짝 크게 덮음 (여성일 때만 표시)
  const sleeveUp=new THREE.Group();arm.add(sleeveUp);shapedPanel(sleeveUp,blouse,upperSleeve,.93,0,0,0).scale.setScalar(1.055);sleeves.push(sleeveUp);
  // 아래팔 반지름 .064, 소매 끝 .14×.15, 손 .068/.092/.054
  shapedPanel(elbow,shirt,foreSleeve,.91,0,0,.012);
  const sleeveLow=new THREE.Group();elbow.add(sleeveLow);shapedPanel(sleeveLow,blouse,foreSleeve,.91,0,0,.012).scale.setScalar(1.055);sleeves.push(sleeveLow);
  softBox(elbow,mats.white,.14,.045,.15,0,-.215,.015,.015);ellipsoid(elbow,mats.skin,0,-.294,.026,.068,.092,.054);const thumb=limb(elbow,mats.skin,.018,.105,x<0?-.065:.065,-.31,.065);thumb.rotation.z=x<0?-.65:.65;
  const finger=new THREE.Group();elbow.add(finger);finger.visible=false;limb(finger,mats.skin,.017,.18,.02,-.415,0);arm.userData.indexFinger=finger;arms.push(arm);
 }
 const upperBody=new THREE.Group();
 upperBody.position.y=.93;
 for(const part of [...g.children]){
  part.position.y-=upperBody.position.y;
  upperBody.add(part);
 }
 g.add(upperBody);
 for(const x of [-.14,.14]){
  const leg=new THREE.Group();leg.position.set(x,.91,0);g.add(leg);shapedPanel(leg,trousers,[[-.445,.083],[-.39,.094],[-.26,.106],[-.11,.119],[.016,.121],[.07,.089]],1.02,0,0,0);
  const knee=new THREE.Group();knee.position.y=-.41;leg.add(knee);shapedPanel(knee,trousers,[[-.367,.077],[-.33,.078],[-.22,.084],[-.12,.097],[-.04,.094],[.012,.087],[.045,.061]],1.01,0,0,0);
  const shoe=new THREE.Group();knee.add(shoe);shoes.push(shoe);
  softBox(shoe,mats.white,.22,.06,.39,0,-.455,.072,.025);softBox(shoe,mats.leather,.205,.135,.35,0,-.38,.065,.045);softBox(shoe,mats.dark,.212,.025,.36,0,-.482,.072,.012);
  for(const z of [.03,.09,.15])softBox(shoe,mats.white,.12,.009,.013,0,-.31,z,.003);
  const foot=new THREE.Group();knee.add(foot);foot.visible=false;feet.push(foot);softBox(foot,mats.skin,.18,.08,.28,0,-.44,.065,.035);
  leg.userData.knee=knee;legs.push(leg);
 }
 compactMeshes(g);
 // 성별 전환: 여성이면 온유 모습(진녹색 조끼·웨이브 단발·흰 소매), 남성이면 기존 모습
 const baseLip=lip.color.clone(),onyuLip=new THREE.Color('#c4766f'),vestGreen=new THREE.Color('#34594a');
 let gender='',savedShirt=null,eyesClosed=false;
 function setEyesClosed(value){
  eyesClosed=Boolean(value);
  openEyes.visible=!eyesClosed;closedEyes.visible=eyesClosed;
  onyuFace.visible=gender==='female'&&!eyesClosed;
 }
 const setGender=value=>{
  const next=value==='female'?'female':'male',female=next==='female';
  if(next!==gender){
   if(female){savedShirt=shirt.color.clone();shirt.color.copy(vestGreen)}
   else if(savedShirt){shirt.color.copy(savedShirt);savedShirt=null}
   lip.color.copy(female?onyuLip:baseLip);gender=next;
  }
  maleHair.visible=maleFront.visible=!female;
  onyuHair.visible=onyuFront.visible=female;
  setEyesClosed(eyesClosed);
  sleeves.forEach(sleeve=>sleeve.visible=female);
 };setGender(options.gender);
 return {g,head,upperBody,shirt,legs,arms,shoes,feet,setGender,setEyesClosed,get gender(){return gender}};
}

export function makeChristmasTree(x,z,scale,parent,mats){
 const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(scale);parent.add(g);
 const green=new THREE.MeshStandardMaterial({color:'#174d32',roughness:.9}),greenLight=new THREE.MeshStandardMaterial({color:'#276746',roughness:.88});
 const red=new THREE.MeshStandardMaterial({color:'#a51f2c',metalness:.28,roughness:.32}),gold=new THREE.MeshStandardMaterial({color:'#d5a632',metalness:.7,roughness:.25}),silver=new THREE.MeshStandardMaterial({color:'#e4e0d5',metalness:.72,roughness:.2});
 const glow=new THREE.MeshStandardMaterial({color:'#fff0ae',emissive:'#ffb52e',emissiveIntensity:3,roughness:.2}),trunk=new THREE.MeshStandardMaterial({color:'#65452d',roughness:1});
 mesh(g,new THREE.CylinderGeometry(.16,.22,.7,18),trunk,0,.35,0);
 const layers=[[1.2,.92,.82],[.98,.78,1.28],[.77,.7,1.72],[.57,.62,2.12],[.38,.55,2.48]];
 layers.forEach(([radius,height,y],i)=>mesh(g,new THREE.ConeGeometry(radius,height,32,1),i%2?greenLight:green,0,y,0));
 for(let i=0;i<34;i++){
  const y=.72+i/33*1.98,angle=i*2.38,radius=(1-(y-.72)/2.35)*.92+.12,material=[red,gold,silver][i%3];
  mesh(g,new THREE.SphereGeometry(i%5===0?.105:.075,12,9),material,Math.cos(angle)*radius,y,Math.sin(angle)*radius);
 }
 for(let i=0;i<46;i++){
  const y=.68+i/45*2.12,angle=i*1.43,radius=(1-(y-.68)/2.38)*1.02+.1;
  mesh(g,new THREE.SphereGeometry(.024,8,6),glow,Math.cos(angle)*radius,y,Math.sin(angle)*radius);
 }
 for(const [radius,y] of [[.88,1.08],[.67,1.6],[.45,2.08]]){const ribbon=mesh(g,new THREE.TorusGeometry(radius,.025,8,48),gold,0,y,0);ribbon.rotation.x=Math.PI/2}
 const starShape=new THREE.Shape();for(let i=0;i<10;i++){const angle=-Math.PI/2+i*Math.PI/5,r=i%2===0?.31:.13,px=Math.cos(angle)*r,py=Math.sin(angle)*r;i?starShape.lineTo(px,py):starShape.moveTo(px,py)}starShape.closePath();
 const star=mesh(g,new THREE.ExtrudeGeometry(starShape,{depth:.065,bevelEnabled:true,bevelSize:.018,bevelThickness:.018,bevelSegments:2}),gold,0,3.02,-.035);star.material=gold;
 function gift(px,pz,w,h,d){softBox(g,red,w,h,d,px,h/2,pz,.045);softBox(g,gold,w*.13,h+.02,d+.015,px,h/2+.01,pz,.015);softBox(g,gold,w+.015,h+.02,d*.13,px,h/2+.01,pz,.015)}
 gift(-.63,.18,.62,.48,.58);gift(.56,.23,.7,.58,.62);gift(-.05,-.54,.72,.38,.52);
 const light=new THREE.PointLight('#ffd17b',1.4,5,2);light.position.set(0,1.75,.2);g.add(light);
 compactMeshes(g);return g;
}

export function makeChair(x,z,color,parent,mats){
 const g=new THREE.Group();g.position.set(x,0,z);parent.add(g);
 softBox(g,color,1.3,.23,1.19,0,.68,0,.1);
 const back=softBox(g,color,1.3,1.03,.21,0,1.23,-.51,.09);back.rotation.x=-.075;
 softBox(g,color,1.13,.7,.09,0,1.29,-.37,.06);
 for(const x of [-.36,0,.36])ellipsoid(g,mats.leather,x,1.3,-.315,.018,.018,.012);
 for(const side of [-1,1]){
  softBox(g,color,.15,.32,1.04,side*.65,.88,-.04,.06);
  for(const depth of [-.4,.4]){const leg=mesh(g,new THREE.CylinderGeometry(.035,.047,.56,10),mats.metal,side*.49,.3,depth);leg.rotation.z=side*-.07}
 }
 return compactMeshes(g);
}

export function makeTable(x,z,w,parent,mats){
 const g=new THREE.Group();g.position.set(x,0,z);parent.add(g);softBox(g,mats.wood,w,.12,1.3,0,1.16,0,.045);
 for(const a of [-w/2+.2,w/2-.2])for(const b of [-.42,.42]){mesh(g,new THREE.CylinderGeometry(.045,.035,1.1,10),mats.metal,a,.55,b);softBox(g,mats.leather,.085,.04,.085,a,.025,b,.01)}
 return compactMeshes(g);
}

export function makePlant(x,z,scale,parent,mats){
 const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(scale);parent.add(g);
 mesh(g,new THREE.CylinderGeometry(.34,.25,.5,20),mats.white,0,.25,0);
 mesh(g,new THREE.CylinderGeometry(.3,.3,.025,20),new THREE.MeshStandardMaterial({color:'#423c32'}),0,.5,0);
 for(let i=0;i<9;i++){
  const angle=i*2.4,height=.85+i%4*.19,end=new THREE.Vector3(Math.cos(angle)*.38,height,Math.sin(angle)*.38),start=new THREE.Vector3(0,.5,0),delta=end.clone().sub(start);
  const stem=mesh(g,new THREE.CylinderGeometry(.012,.016,delta.length(),5),mats.leaf,...start.clone().add(end).multiplyScalar(.5).toArray());stem.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.clone().normalize());
  const leaf=ellipsoid(g,mats.leaf,end.x,end.y,end.z,.13,.32,.035);leaf.rotation.set(Math.sin(angle)*.6,angle,Math.cos(angle)*.6);
 }
 return compactMeshes(g);
}
