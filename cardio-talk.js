import {speakStep,hideSpeech} from './center-speech.js?v=bp-2';
let inCardio=false,wasSeated=false;
const dialog=document.querySelector('#dialog');
const stopBP=document.createElement('button');stopBP.id='bp-stop';stopBP.className='icon-btn';stopBP.hidden=true;stopBP.type='button';stopBP.title='측정 체험 중지';stopBP.setAttribute('aria-label','측정 체험 중지');stopBP.innerHTML='<i data-lucide="square"></i>';stopBP.onclick=()=>document.dispatchEvent(new Event('cardio-measurement-cancel'));document.querySelector('.world-tools').append(stopBP);window.lucide?.createIcons();
const greeting='안녕하세요. 여기는 뇌심혈관계질환예방 상담실입니다. 어떤 건강상담을 받고 싶으세요?';
const options=['혈압·혈당·콜레스테롤 검사요.','당화혈색소 검사요.','동맥경화 검사요.'];
function openCardioGreeting(){
 if(!inCardio||!wasSeated)return;
 hideSpeech();
 window.show('뇌심혈관 예방상담','<section data-cardio-dialogue><p class="eyebrow">가상 안내원</p><p id="cardio-line"></p><div id="cardio-options" class="reception-choices"></div><p class="room-info">검사 절차를 살펴보는 가상 체험입니다. 실제 신체 측정이나 검사 결과를 기록하지 않습니다.</p></section>');
 document.querySelector('#cardio-line').textContent=greeting;
 const choices=document.querySelector('#cardio-options');
 options.forEach(text=>{const button=document.createElement('button');button.className='chat-choice';button.textContent=text;button.onclick=()=>{
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
