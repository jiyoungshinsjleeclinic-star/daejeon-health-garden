import {speak,hideSpeech} from './center-speech.js?v=speech-7';

const dialog=document.querySelector('#dialog');
const panel=document.querySelector('#counsel-panel');
const talk=document.querySelector('#talk-staff');
const progress=document.createElement('section');
progress.className='omnifit-progress';progress.hidden=true;
progress.innerHTML='<strong>옴니핏 가상 측정</strong><p aria-live="polite"></p><progress max="60" value="0" aria-label="측정 진행률"></progress><button type="button" class="btn light">체험 중지</button>';
panel.append(progress);
const progressText=progress.querySelector('p');
const bar=progress.querySelector('progress');
progress.querySelector('button').onclick=()=>document.dispatchEvent(new Event('omnifit-cancel'));
let inRoom=false,seated=false,pending=false,active=false,remaining=null;

function openPrograms(){
 if(!inRoom||active)return;
 window.show('심리상담 1실','<section data-psychology-programs><h2>어떤 프로그램을 체험하시겠어요?</h2><div class="reception-choices"><button type="button" class="chat-choice" data-fit>스트레스검사(옴니핏)</button><button type="button" class="chat-choice" data-aroma>아로마오일</button></div><button type="button" class="text-btn" data-general>상담 이용 안내</button></section>');
 dialog.querySelector('[data-fit]').onclick=()=>{
  dialog.close();
  document.querySelector('#world').scrollIntoView({block:'start'});
  if(seated)document.dispatchEvent(new Event('omnifit-start'));
  else{pending=true;document.dispatchEvent(new Event('counsel-seat'))}
 };
 dialog.querySelector('[data-aroma]').onclick=openAroma;
 dialog.querySelector('[data-general]').onclick=()=>{dialog.close();document.dispatchEvent(new Event('psychology-general'))};
}

function openAroma(){
 window.show('아로마오일','<section data-psychology-aroma><h2>향을 골라보세요</h2><div class="reception-choices"><button type="button" class="chat-choice" data-oil="lavender">라벤더</button><button type="button" class="chat-choice" data-oil="orange">스위트오렌지</button><button type="button" class="chat-choice" data-oil="mint">페퍼민트</button></div><p data-oil-info role="status"></p><button type="button" class="btn light" data-programs>프로그램 선택으로</button></section>');
 const descriptions={lavender:'라벤더는 부드러운 꽃향이 납니다.',orange:'스위트오렌지는 달콤하고 상큼한 감귤 향이 납니다.',mint:'페퍼민트는 시원하고 상쾌한 허브 향이 납니다.'};
 dialog.querySelectorAll('[data-oil]').forEach(button=>{button.onclick=()=>{
  dialog.querySelector('[data-oil-info]').textContent=descriptions[button.dataset.oil]+' 실제 시향은 센터에서 안내받으실 수 있어요.';
 }});
 dialog.querySelector('[data-programs]').onclick=openPrograms;
}

const instructions={
 intro:'옴니핏은 뇌파와 맥파를 측정하는 기기입니다. 이 신호에서 얻은 지표로 정신적·신체적 스트레스 상태, 집중력, 두뇌 부하도, 스트레스 대처 능력 등을 살펴봅니다. 수면 부족, 운동량, 복용 중인 약과 당일 컨디션이 결과에 영향을 줄 수 있습니다.',
 fit:'이마에 헤드밴드를 쓰고 오른쪽 귓불에 검정색 센서를 끼우겠습니다.',
 quiet:'1분간 진행됩니다! 진행하시는 동안 눈을 감으시고, 말씀을 하지 말아주세요.',
 eyes:'편안히 눈을 감으시고, 자세가 확인되면 시작하겠습니다!',
 measure:'측정을 시작하겠습니다. 눈을 감고 편하게 앉아 주세요.',
 finished:'측정이 끝났습니다. 이제 눈을 뜨세요.',
 remove:'헤드밴드와 귓불 센서를 빼서 책상 위에 놓겠습니다.',
};

const reports={
 eeg:{
  title:'뇌파 검사 결과서',
  image:'./assets/omnifit/eeg.png',
  items:[
   ['뇌 건강 점수','100점 척도로 표시되는 기기 요약 점수입니다. 예시 보고서의 참고값은 70점입니다. 수면이나 당일 컨디션의 영향도 함께 살펴봅니다.'],
   ['뇌 활성도','인지 활동에 따른 작업부하를 보여주는 기기 지표입니다. 예시 보고서의 참고 범위는 11.7–19.5 Hz입니다.'],
   ['두뇌 스트레스','예시 보고서에서는 7을 참고 경계로 사용합니다. 수치가 반복해서 높다면 생활 여건과 증상을 상담사에게 함께 설명해 주세요.'],
   ['뇌 좌우 균형','양쪽 뇌파의 상대적 균형입니다. 생활습관, 업무, 측정 조건에 따라 달라질 수 있어 편중이 지속되면 상담 시 확인합니다.'],
   ['집중도','전두부 뇌파로 주의력과 몰입을 추정하는 기기 지표입니다. 레벨 5를 참고해 보고서의 점수 방향을 살펴볼 수 있습니다.'],
  ],
 },
 pulse:{
  title:'맥파 검사 결과서',
  image:'./assets/omnifit/pulse.png',
  items:[
   ['자율신경 균형','기기가 맥파를 분석해 상대적 비율로 보여줍니다. 긴장, 호흡, 자세, 피로 등에 영향을 받으며 균형 범위는 기기 기준과 측정 상황에 따라 해석합니다.'],
   ['심박 간격','맥박 사이의 간격입니다. 간격의 변화로 심박변이도(HRV)를 살펴봅니다.'],
   ['HF','심박변이도의 고주파 성분입니다. 호흡과 관련된 부교감 활동의 영향을 받습니다.'],
   ['LF','심박변이도의 저주파 성분입니다. 여러 조절 작용이 함께 반영되는 지표입니다.'],
   ['전체 주파수 성분(TF)','심박변이도에 포함된 전체 주파수 성분의 크기를 나타냅니다. 단위와 참고값은 실제 기기 보고서에서 확인합니다.'],
   ['HRV 지수','심박 간격의 변동성을 요약한 별도 지표입니다.'],
  ],
 },
};

function showReport(kind){
 const {title,image,items}=reports[kind];
 const heading=kind==='eeg'?'이제 결과 해석을 해드리겠습니다. 먼저 뇌파 분석 항목입니다.':'이어서 맥파 검사 결과 항목입니다.';
 const explanation=items.map(([name,text])=>'<li><strong>'+name+'</strong><p>'+text+'</p></li>').join('');
 window.show('옴니핏 태블릿 · 결과 예시','<section data-omnifit-report><p role="status"><strong>안내원</strong> '+heading+'</p><div class="omnifit-report-grid"><section class="omnifit-tablet"><p class="eyebrow">OMNIFIT 체험 예시</p><h2>'+title+'</h2><img src="'+image+'" alt="'+title+' 예시 사진"></section><section><h3>결과 항목 설명</h3><ul class="omnifit-explanations">'+explanation+'</ul></section></div><p class="small">참고용 결과서 사진입니다. 이번 체험에서 측정한 결과가 아닙니다.</p><div class="actions">'+(kind==='pulse'?'<button type="button" class="btn light" data-eeg>뇌파 결과 다시 보기</button>':'')+'<button type="button" class="btn" data-next>'+ (kind==='eeg'?'맥파 검사 결과 보기':'결과 설명 마치기')+'</button></div></section>');
 dialog.querySelector('[data-eeg]')?.addEventListener('click',()=>showReport('eeg'));
 dialog.querySelector('[data-next]').onclick=()=>{
  if(kind==='eeg'){showReport('pulse');return}
  dialog.close();
  speak('더 자세한 검사 항목도 있습니다. 실제 상담사와 상의해 측정해 보시고, 자세한 설명을 들어보세요.',{placement:'screen-clear'});
 };
}

document.addEventListener('counsel-room-change',event=>{
 inRoom=event.detail.room?.id==='stress';seated=pending=active=false;
 progress.hidden=true;
 dialog.classList.remove('omnifit-report-dialog');
 if(inRoom)queueMicrotask(openPrograms);
});
document.addEventListener('psychology-programs',openPrograms);
document.addEventListener('counsel-seat-change',event=>{
 if(!inRoom)return;
 seated=event.detail.seated;
 if(pending&&seated){pending=false;document.dispatchEvent(new Event('omnifit-start'))}
});
document.addEventListener('omnifit-stage',event=>{
 if(!inRoom)return;
 const {stage,seconds}=event.detail;
 if(stage==='tick'){
  if(seconds!==remaining){remaining=seconds;progressText.textContent='남은 시간 '+seconds+'초';bar.value=60-seconds}
  return;
 }
 if(['cancelled','complete','no-path'].includes(stage)){
  active=false;progress.hidden=true;talk.disabled=!seated;
  if(stage==='complete'){dialog.classList.add('omnifit-report-dialog');showReport('eeg')}
  else if(stage==='no-path')speak('장비를 착용할 수 있는 자리가 필요합니다. 책상 옆 다른 의자를 선택한 뒤 다시 시작해 주세요.');
  else hideSpeech();
  return;
 }
 if(stage==='intro')document.querySelector('#world').scrollIntoView({block:'start'});
 active=true;talk.disabled=true;progress.hidden=false;bar.hidden=stage!=='measure';remaining=null;
 progressText.textContent=stage==='measure'?'남은 시간 60초':stage==='return'?'결과 화면을 준비하고 있어요.':'측정 준비 및 안내';
 if(instructions[stage])speak(instructions[stage],{placement:'screen-clear'});
});
dialog.addEventListener('close',()=>{if(!dialog.open)dialog.classList.remove('omnifit-report-dialog')});
