export const RECEPTION_WELCOME='안녕하세요. 대전근로자건강센터에 오신 것을 환영합니다.';
export const RECEPTION_FLOW={
 start:{text:'안녕하세요. 처음 오셨나요?',choices:[
  {label:'네. 처음이에요.',next:'first'},
  {label:'다녀간 적이 있어요.',next:'returning'},
  {label:'기억이 잘 나지 않아요.',next:'unsure'}
 ]},
 first:{text:'먼저 대기실 의자에 앉아서 상담지를 작성해 주세요.',choices:[{label:'네.',next:'firstDone'}]},
 firstDone:{text:'감사합니다. 작성하신 뒤 접수대에 말씀해 주세요. 실제 상담지는 센터에서 현장 안내에 따라 작성하시면 됩니다.',actions:[{label:'대기실로 가기',action:'waiting'}]},
 returning:{text:'안녕하세요. 저희 센터에 다녀가신 적이 있나요?',choices:[
  {label:'네.',next:'identity'},
  {label:'아니요. 처음이에요.',next:'first'},
  {label:'잘 모르겠어요.',next:'unsure'}
 ]},
 identity:{text:'이름 또는 휴대폰 번호 뒷자리를 알려주시겠어요?',choices:[
  {label:'네. 이름은 대전이예요. (체험용)',next:'services'},
  {label:'번호 뒷자리는 0000이에요. (체험용)',next:'services'},
  {label:'현장 담당자에게 직접 말씀드릴게요.',next:'privateServices'}
 ]},
 services:{text:'아, 네. 다녀가신 적이 있으시군요. 오늘은 어떤 건강상담을 이용하실 건가요?',choices:serviceChoices()},
 privateServices:{text:'네. 실제 방문 이력 확인은 현장 접수 담당자에게 말씀해 주세요. 오늘은 어떤 건강상담을 이용하실 건가요?',choices:serviceChoices()},
 unsure:{text:'괜찮습니다. 방문하신 적이 있는지는 현장 접수 담당자가 확인해 드릴 수 있어요. 오늘은 어떤 상담을 원하시나요?',choices:[{label:'처음 방문하는 절차를 안내받고 싶어요.',next:'first'},...serviceChoices()]},
 cardio:{text:'그럼 우선 5분 정도 대기실에 앉아 쉬신 뒤, 자동혈압계로 혈압을 측정해 주세요. 실제 기기 이용은 현장 담당자의 안내를 따라 주세요.',choices:[{label:'네. 알겠어요.',next:'cardioDone'},{label:'혈압계는 어디에 있나요?',next:'bloodpressure'}]},
 bloodpressure:{text:'자동혈압계는 접수대 앞 양쪽에 있습니다. 오른쪽 기기는 뇌심혈관질환 예방상담실 문 앞쪽에 있어요. 먼저 5분 정도 앉아 쉬신 뒤 현장 안내에 따라 이용해 주세요.',choices:[{label:'네. 알겠어요.',next:'cardioDone'}]},
 cardioDone:{text:'네. 편안히 쉬시고, 측정 후에는 결과를 현장 담당자에게 보여 주세요. 이 가상 공간에서는 혈압을 측정하거나 결과를 만들지 않습니다.',actions:[{label:'대기실로 가기',action:'waiting'},{label:'자동혈압계 위치 보기',action:'bloodpressure'}]},
 muscle:{text:'근골격계질환 상담을 안내해 드릴게요. 불편한 부위와 상담하고 싶은 내용을 담당자에게 말씀해 주세요.',choices:[{label:'네. 알겠어요.',next:'muscleDone'}]},
 muscleDone:{text:'실제 상담 가능 시간과 담당자는 현장 접수대에서 확인해 주세요.',actions:[{label:'근골격계질환 상담실 둘러보기',action:'muscle'}]},
 stress:{text:'직무스트레스와 심리상담 이용을 원하시는군요. 상담 분야와 담당자, 가능한 일정은 현장 접수대에서 확인해 주세요.',choices:[{label:'네. 알겠어요.',next:'stressDone'}]},
 stressDone:{text:'마음이 불편한 점이나 상담하고 싶은 주제를 편한 만큼 담당자에게 말씀해 주세요.',actions:[{label:'심리상담 안내 둘러보기',action:'stress'}]},
 environment:{text:'작업환경컨설팅을 안내받고 싶으시군요. 사업장의 업종과 작업 내용, 궁금한 점을 담당자에게 말씀해 주세요.',choices:[{label:'네. 알겠어요.',next:'environmentDone'}]},
 environmentDone:{text:'실제 상담 방법과 일정은 센터에 확인해 주세요. 여기서는 별도의 가상 안내 공간을 둘러볼 수 있습니다.',actions:[{label:'작업환경컨설팅 안내 둘러보기',action:'environment'}]},
 general:{text:'어떤 상담이 맞을지 함께 알아보실 수 있어요. 원하는 도움과 방문 목적을 현장 접수 담당자에게 말씀해 주세요.',choices:[{label:'네. 알겠어요.',next:'generalDone'}]},
 generalDone:{text:'이용 가능한 상담 분야와 준비사항을 담당자가 안내해 드립니다.',actions:[{label:'종합상담실 둘러보기',action:'general'}]}
};
function serviceChoices(){return [
 {label:'뇌심혈관계질환 예방상담을 받아보고 싶어요.',next:'cardio'},
 {label:'근골격계질환 상담을 받고 싶어요.',next:'muscle'},
 {label:'직무스트레스·심리상담이 궁금해요.',next:'stress'},
 {label:'작업환경컨설팅을 받고 싶어요.',next:'environment'},
 {label:'어떤 상담을 받을지 잘 모르겠어요.',next:'general'}
]}

export function inReceptionFront(x,z,desk){
 return Math.abs(x-desk.x)<desk.width/2-.3&&z>desk.z+.75&&z<desk.z+1.85;
}
export function isReceptionApproach({x,z,moving,dz,entering=false,room,dialogOpen},desk){
 return room==='lobby'&&!dialogOpen&&moving&&(dz<-.15||entering)&&inReceptionFront(x,z,desk);
}
export function outsideReceptionArea(x,z,desk){
 return Math.abs(x-desk.x)>desk.width/2+1||z>desk.z+3.3||z<desk.z-1;
}
