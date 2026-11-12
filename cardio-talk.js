import {speakStep,hideSpeech} from './center-speech.js?v=speech-3';
let inCardio=false,wasSeated=false;
const dialog=document.querySelector('#dialog');
const stopBP=document.createElement('button');stopBP.id='bp-stop';stopBP.className='icon-btn';stopBP.hidden=true;stopBP.type='button';stopBP.title='측정 체험 중지';stopBP.setAttribute('aria-label','측정 체험 중지');stopBP.innerHTML='<i data-lucide="square"></i>';stopBP.onclick=()=>document.dispatchEvent(new Event('cardio-measurement-cancel'));document.querySelector('.world-tools').append(stopBP);window.lucide?.createIcons();
const greeting='안녕하세요. 여기는 뇌심혈관계질환예방 상담실입니다. 어떤 건강상담을 받고 싶으세요?';
const options=['혈압·혈당·콜레스테롤 검사요.','당화혈색소 검사요.','동맥경화 검사요.'];
const flows=['standard','hba1c','arterial'];
function openCardioGreeting(){
 if(!inCardio||!wasSeated)return;
 hideSpeech();
 window.show('뇌심혈관 예방상담','<section data-cardio-dialogue><p class="eyebrow">가상 안내원</p><p id="cardio-line"></p><div id="cardio-options" class="reception-choices"></div><p class="room-info">검사 절차를 살펴보는 가상 체험입니다. 실제 신체 측정이나 검사 결과를 기록하지 않습니다.</p></section>');
 document.querySelector('#cardio-line').textContent=greeting;
 const choices=document.querySelector('#cardio-options');
 options.forEach((text,index)=>{const button=document.createElement('button');button.className='chat-choice';button.textContent=text;button.onclick=()=>{
  document.dispatchEvent(new CustomEvent('cardio-flow-select',{detail:flows[index]}));
  document.querySelector('#cardio-line').textContent='혈압·혈당은 기본검사입니다. 처음 방문하셨다면 키와 몸무게, 복부둘레를 재야 합니다. 우선 자리에서 일어나셔서 복부둘레를 재겠습니다.';
  choices.replaceChildren();const begin=document.createElement('button');begin.className='btn';begin.textContent='일어나서 복부둘레 재기';begin.onclick=()=>{dialog.close();document.dispatchEvent(new Event('cardio-waist-start'));document.querySelector('.world-shell').scrollIntoView({block:'start',behavior:'auto'})};choices.append(begin);
  const back=document.createElement('button');back.className='btn light';back.textContent='다시 선택하기';back.onclick=openCardioGreeting;choices.append(back);begin.focus();
 };choices.append(button)});
 choices.firstElementChild?.focus();
}
document.addEventListener('counsel-room-change',e=>{inCardio=e.detail.room?.id==='cardio';wasSeated=false;hideSpeech();stopBP.hidden=true;if(dialog.open&&document.querySelector('[data-cardio-dialogue]'))dialog.close()});
document.addEventListener('counsel-seat-change',e=>{const newlySeated=e.detail.seated&&!wasSeated;wasSeated=e.detail.seated;if(inCardio&&newlySeated&&!e.detail.resume){hideSpeech();openCardioGreeting()}});
document.addEventListener('cardio-greeting',openCardioGreeting);
function showStage(message,label,event){
 document.querySelector('#counsel-status').textContent=message;document.querySelector('#world-status').textContent=message;
 document.querySelector('#chat-area').hidden=false;document.querySelector('#chat-bubble').textContent=message;document.querySelector('#chat-answer').replaceChildren();const actions=document.querySelector('#chat-choices'),hadFocus=actions.contains(document.activeElement);actions.replaceChildren();
 const button=document.createElement('button');button.className='chat-choice';button.textContent=label;button.onclick=()=>document.dispatchEvent(new Event(event));actions.append(button);if(hadFocus)button.focus({preventScroll:true});
}
document.addEventListener('cardio-waist-stage',e=>{
 const messages={standing:'자리에서 일어나 양팔을 어깨높이까지 올립니다.',approaching:'안내원이 방문자 옆으로 이동하고 있습니다.',measuring:'안내원이 줄자로 복부둘레를 재는 모습을 체험하고 있습니다.',returning:'측정 동작이 끝났습니다. 양팔을 내립니다.',complete:'복부둘레 측정 동작 체험을 마쳤습니다. 실제 측정값은 생성되지 않습니다.',cancelled:'복부둘레 측정 동작 체험을 중지했습니다.'};
 const state=e.detail;if(!inCardio)return;speakStep(messages[state]||'');const done=['complete','cancelled'].includes(state);showStage(messages[state]||'',done?'상담 의자로 돌아가기':'측정 체험 중지',done?'counsel-seat':'cardio-waist-cancel');
});
document.addEventListener('cardio-height-stage',e=>{
 if(!inCardio)return;const state=e.detail;
 const invitation='복부둘레 측정은 끝났습니다. 이제 키와 몸무게를 잴게요. 신장·체중 측정기 쪽으로 와 주세요.';
 const shoesOff='신발을 벗고 신장·체중 측정기 위에 올라와 주세요.',straight='정면을 바라보고 바르게 서 주세요.',back='신발을 신으신 뒤 상담 의자에 앉아 주세요.';
 const messages={invitation,walking:invitation,'shoes-off':shoesOff,'stepping-on':shoesOff,ready:straight,'head-down':straight,'head-hold':straight,'head-up':straight,'step-down-request':'내려와 주세요.','stepping-off':'내려와 주세요.','shoes-on':back,'walking-back':back,sitting:back,complete:'신장·체중 측정 동작 체험을 마쳤습니다. 편하게 앉아 계세요.',cancelled:'신장·체중 측정 동작 체험을 중지했습니다.'};
 speakStep(messages[state]||'');
 const done=state==='complete',cancelled=state==='cancelled';
 showStage(messages[state]||'',done?'측정 동작 다시 보기':cancelled?'상담 의자로 돌아가기':'측정 체험 중지',done?'cardio-greeting':cancelled?'counsel-seat':'cardio-measurement-cancel');
});
document.addEventListener('cardio-bp-stage',e=>{
 const state=e.detail,invitation='이제 혈압과 혈당을 먼저 측정하겠습니다. 안내데스크 쪽으로 나가셔서 혈압을 측정하고 오세요.';
 stopBP.hidden=['complete','cancelled'].includes(state);
 const messages={invitation,standing:invitation,'room-out':invitation,'lobby-walk':'안내데스크 옆 자동혈압계 앞으로 와 주세요.','bp-seat':'혈압계 앞 의자에 편하게 앉아 주세요.',rest:'실제 혈압 측정 전에는 5분 이상 편안히 앉아 쉬어 주세요. 지금은 가상 체험입니다.','arm-in':'오른팔을 앞으로 뻗어 팔 삽입구에 넣어 주세요.','press-start':'왼손 검지로 시작 버튼을 눌러 주세요.',inflating:'측정 중에는 움직이거나 말하지 말고 편안히 계세요. 숫자는 가상 예시입니다.',result:'가상 예시 혈압은 118 / 76 mmHg, 맥박은 72회/분입니다. 실제 측정값이나 건강 판정이 아닙니다.','arm-out':'가상 측정이 끝났습니다. 팔을 빼 주세요.','bp-stand':'뇌심혈관계질환예방 상담실로 돌아와 앉아 주세요.','lobby-return':'상담실로 돌아오세요.','room-in':'방문자 의자에 다시 앉아 주세요.','room-seat':'편하게 앉아 주세요.',complete:'혈압 측정 체험을 마치고 돌아오셨습니다. 실제 혈압·혈당 검사는 센터 직원의 안내를 받아 주세요.',cancelled:'혈압 측정 동작 체험을 중지했습니다.'};
 speakStep(messages[state]||'');
 const complete=state==='complete',cancelled=state==='cancelled';showStage(messages[state]||'',complete?'측정 동작 다시 보기':cancelled?'상담 의자로 돌아가기':'측정 체험 중지',complete?'cardio-greeting':cancelled?'counsel-seat':'cardio-measurement-cancel');document.querySelector('#talk-staff').disabled=!(inCardio&&wasSeated&&complete);
});
document.addEventListener('cardio-glucose-stage',e=>{
 if(!inCardio)return;const state=e.detail,invitation='이제 혈당을 측정하겠습니다. 원하시는 손가락을 앞으로 내밀어 주세요.';
 const messages={invitation,'finger-forward':'왼손 검지를 앞으로 내밀어 주세요.',preparing:'편안히 앉아서 손을 그대로 유지해 주세요.',measuring:'잠시만 기다려 주세요. 혈당계 표시를 확인하겠습니다.',result:'혈당계에 92 mg/dL가 표시됩니다. 측정값은 예시입니다. 실제 검사 결과나 건강 판정이 아닙니다.',finishing:'혈당은 측정이 끝났습니다. 계속 앉아 있어 주세요.','staff-back':'혈당은 측정이 끝났습니다. 계속 앉아 있어 주세요.',complete:'혈당은 측정이 끝났습니다. 계속 앉아 있어 주세요.',cancelled:'혈당 측정 동작 체험을 중지했습니다. 편안히 앉아 계세요.'};
 const done=['complete','cancelled'].includes(state);stopBP.hidden=done;speakStep(messages[state]||'');showStage(messages[state]||'',done?'직원과 이야기하기':'측정 체험 중지',done?'cardio-greeting':'cardio-measurement-cancel');document.querySelector('#talk-staff').disabled=!done;
});
document.addEventListener('cardio-cholesterol-stage',e=>{
 if(!inCardio)return;const state=e.detail,invitation='이제 콜레스테롤 측정을 하겠습니다. 편하신 손가락을 보여 주세요.';
 const messages={invitation,'ring-forward':'왼손 네 번째 손가락을 앞으로 내밀어 주세요.','code-check':'측정기와 스트립의 코드 번호가 일치하는지 확인합니다.','strip-insert':'검사용 스트립을 측정기에 삽입합니다.','finger-prep':'손가락 끝을 준비하는 동작입니다. 실제 채혈은 진행하지 않습니다.',sample:'손가락 끝을 스트립에 가볍게 대는 측정 동작을 체험합니다.','waiting':'결과를 기다리고 있습니다. 실제 절차보다 짧게 구성한 가상 체험입니다.','staff-return':'안내원이 기기를 책상에 놓고 자리로 돌아가 앉습니다.','result-total':'총콜레스테롤 측정 예시는 168 mg/dL입니다.','result-triglyceride':'중성지방 측정 예시는 150 mg/dL입니다.','result-ldl':'저밀도지단백콜레스테롤 측정 예시는 60 mg/dL입니다.','result-hdl':'고밀도지단백콜레스테롤 측정 예시는 100 mg/dL입니다. 모든 수치는 실제 검사 결과나 건강 판정이 아닙니다.',complete:'콜레스테롤 측정 체험이 끝났습니다. 계속 의자에 앉아 있어 주세요.',cancelled:'콜레스테롤 측정 동작 체험을 중지했습니다. 편안히 앉아 계세요.'};
 const done=['complete','cancelled'].includes(state),result=state.startsWith('result-'),clear=['code-check','strip-insert','sample','waiting'].includes(state)||result;stopBP.hidden=done;speakStep(messages[state]||'',{placement:clear?'screen-clear':'auto',persist:result});showStage(messages[state]||'',done?'직원과 이야기하기':'측정 체험 중지',done?'cardio-greeting':'cardio-measurement-cancel');document.querySelector('#talk-staff').disabled=!done;
});
document.addEventListener('cardio-hba1c-stage',e=>{
 if(!inCardio)return;const state=e.detail,invitation='이어서 당화혈색소 검사를 하겠습니다. 당화혈색소 검사는 적혈구 내 혈색소에 포도당이 결합한 비율을 측정하여 최근 2~3개월간의 평균적인 혈당 조절상태를 확인하는 검사입니다. 편하신 손가락을 보여 주세요.';
 const messages={invitation,'ring-forward':'왼손 네 번째 손가락을 앞으로 내밀어 주세요.',preparing:'안내원이 손가락 측정 준비를 하고 있습니다. 실제 채혈은 진행하지 않습니다.',measuring:'손가락을 편안히 유지해 주세요. 당화혈색소 측정 동작을 체험하고 있습니다.','staff-return':'측정 동작이 끝나 안내원이 자리로 돌아가 앉습니다.',result:'HbA1c 5.6%가 표시됩니다. 측정 예시 화면이며 실제 검사 결과나 건강 판정이 아닙니다.',complete:'당화혈색소 측정 체험이 끝났습니다. 계속 의자에 앉아 있어 주세요.',cancelled:'당화혈색소 측정 동작 체험을 중지했습니다. 편안히 앉아 계세요.'};
 const done=['complete','cancelled'].includes(state),result=state==='result';stopBP.hidden=done;speakStep(messages[state]||'',{placement:result?'screen-clear':'auto',persist:state==='invitation'||result});showStage(messages[state]||'',done?'직원과 이야기하기':'측정 체험 중지',done?'cardio-greeting':'cardio-measurement-cancel');document.querySelector('#talk-staff').disabled=!done;
});
document.addEventListener('cardio-arterial-stage',e=>{
 if(!inCardio)return;const state=e.detail,invitation='이어서 동맥경화검사를 하겠습니다. 동맥경화 검사는 혈관의 탄력성이 떨어진 정도인 동맥경직도와 혈관 내벽에 찌꺼기가 쌓여 좁아진 정도를 파악하여 심뇌혈관질환의 위험도를 평가하는 검사입니다. 침대 위에 하늘을 보고 누워 주세요.';
 const messages={invitation,standing:'검은 매트 침대로 이동하겠습니다.','walking-bed':'검은 매트 침대 옆으로 와 주세요.','shoes-off':'신발을 벗어 침대 옆에 놓아 주세요.','lying-down':'안내원의자 쪽으로 머리를 두고 하늘을 보며 반듯이 누워 주세요.','staff-standing':'안내원이 자리에서 일어나 검사기 쪽으로 이동합니다.','staff-walking':'안내원이 동맥경화 검사기 쪽으로 이동하고 있습니다.','cuff-arms':'검사기 거치대의 커프를 가져와 양팔에 감습니다.','cuff-legs':'나머지 커프를 가져와 양다리에 감습니다.','wrist-clips':'양 손목에 집게형 센서를 끼웁니다.','question-phone':'핸드폰번호 뒷자리 4자리를 알려 주세요. 가상 체험에서는 입력하거나 저장하지 않습니다.','question-birth':'생년월일을 알려 주세요. 가상 체험에서는 입력하거나 저장하지 않습니다.','question-height':'키가 몇 센티미터인지 알려 주세요. 가상 체험에서는 입력하거나 저장하지 않습니다.',still:'자, 이제 움직이지 마시고 가만히 누워 계세요.',measuring:'동맥경화 측정 중입니다. 화면의 수치는 고정된 가상 예시입니다.',result:'동맥경화 검사 결과 예시 화면입니다. 표시된 수치는 실제 검사 결과나 건강 판정이 아닙니다.','finish-message':'다 끝났습니다. 커프와 센서를 해제하겠습니다.','return-cuffs':'사용한 커프를 검사기 거치대의 원래 위치에 다시 올려놓습니다.','sitting-up':'천천히 일어나서 자리에 앉아 주세요.','shoes-on':'신발을 신어 주세요.','walking-back':'상담 의자로 돌아가 주세요.',sitting:'상담 의자에 앉아 주세요.',complete:'동맥경화 검사 체험이 끝났습니다. 계속 의자에 앉아 있어 주세요.',cancelled:'동맥경화 검사 동작 체험을 중지했습니다. 편안히 앉아 계세요.'};
 const done=['complete','cancelled'].includes(state),result=state==='result',clear=result||['cuff-arms','cuff-legs','return-cuffs','question-phone','question-birth','question-height','still'].includes(state);stopBP.hidden=done;speakStep(messages[state]||'',{placement:clear?'screen-clear':'auto',persist:state==='invitation'||result});showStage(messages[state]||'',done?'직원과 이야기하기':'측정 체험 중지',done?'cardio-greeting':'cardio-measurement-cancel');document.querySelector('#talk-staff').disabled=!done;
});
