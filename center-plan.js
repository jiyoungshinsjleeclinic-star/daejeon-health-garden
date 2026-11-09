// Relative positions follow the supplied sketch, not surveyed building dimensions.
export const CENTER_PLAN={
 bounds:{minX:-18,maxX:18,minZ:-8.5,maxZ:8.8},
 entrance:{x:-3.2,z:8.8},
 reception:{x:0,z:1.85,width:11.2},
 rooms:{
  psych3:{x:-15,z:-6,width:5.2,depth:4.5,doorX:-1.8,label:'심리상담3'},
  trauma:{x:-8.9,z:-6,width:7,depth:4.5,doorX:-2,label:'심리상담2'},
  general:{x:-1.1,z:-6,width:8.3,depth:4.5,doorX:-.9,label:'종합상담'},
  stress:{x:6.5,z:-6,width:7,depth:4.5,doorX:-.4,label:'심리상담1'},
  muscle:{x:13.7,z:-4.1,width:7.4,depth:8.3,doorX:2,side:'left',label:'근골격계질환 상담실'},
  cardio:{x:8,z:2.15,width:4.6,depth:4.9,doorX:2.2,side:'left',label:'뇌심혈관계질환 예방 상담실'},
  education:{x:13.8,z:4.1,width:7,depth:8.8,doorX:2.6,side:'left',label:'교육실'}
 },
 facilities:{leftBP:{x:-10,z:3.4},rightBP:{x:5.1,z:4.3},coffee:{x:-10,z:1.75},water:{x:-10,z:.45},waitingTable:{x:-9.8,z:5.5}},
 waiting:{x:-13,z:6.6}
};
export function planPortal(room){
 return room.side==='left'
  ?{x:room.x-room.width/2,z:room.z+(room.doorX||0)*room.depth/10,nx:-1,nz:0}
  :{x:room.x+(room.doorX||0)*room.width/10,z:room.z+room.depth/2,nx:0,nz:1};
}

// Local room coordinates; tabletop instruments sit above the consultation desk.
export const CARDIO_EQUIPMENT=[
 {id:'heightweight',name:'신장·체중 측정기',x:-3.85,z:-3.1,y:0},
 {id:'inbody',name:'체성분 분석기',x:-3.1,z:-.8,y:0},
 {id:'bed',name:'검은 매트 침대',x:3.65,z:.3,y:0},
 {id:'arterial',name:'동맥경화 검사기',x:2.55,z:-2.65,y:0},
 {id:'cholesterol',name:'콜레스테롤 측정기',x:-1.08,z:.03,y:1.22},
 {id:'glucose',name:'간이혈당 측정기',x:-.43,z:.04,y:1.22},
 {id:'hba1c',name:'당화혈색소 측정기',x:1,z:-.03,y:1.22}
];
