import {speakStep,hideSpeech} from './center-speech.js?v=cholesterol-2';

let inMuscle=false,wasSeated=false;const dialog=document.querySelector('#dialog');
const greeting='안녕하세요. 어떤 상담을 받고 싶으세요?';
const explanations={inbody:'인바디 측정기는 미세한 전류를 몸에 흘려보내 체수분, 골격근량, 체지방량을 분석하고 몸의 구성 비율을 확인하는 체성분 검사입니다.',posture:'체형분석 검사장비를 이용해 거북목, 척추측만증, 골반 불균형, 족저압 등을 과학적으로 분석하는 방식입니다.'};

function openMuscleGreeting(){
 if(!inMuscle||!wasSeated)return;hideSpeech();window.show('근골격계질환 상담','<section data-muscle-dialogue><p class="eyebrow">가상 안내원</p><p id="muscle-line"></p><div id="muscle-options" class="reception-choices"></div><p class="room-info">검사 절차를 살펴보는 가상 체험입니다. 실제 신체 측정이나 검사 결과를 기록하지 않습니다.</p></section>');
 const line=document.querySelector('#muscle-line'),choices=document.querySelector('#muscle-options');line.textContent=greeting;
 const add=(label,type)=>{const button=document.createElement('button');button.className='chat-choice';button.textContent=label;button.onclick=()=>showExplanation(type);choices.append(button)};add('인바디검사','inbody');add('체형분석검사','posture');choices.firstElementChild?.focus();
}
function showExplanation(type){
 const line=document.querySelector('#muscle-line'),choices=document.querySelector('#muscle-options');line.textContent=explanations[type];choices.replaceChildren();
 if(type==='inbody'){const begin=document.createElement('button');begin.className='btn';begin.textContent='인바디검사 시작';begin.onclick=()=>{dialog.close();document.dispatchEvent(new Event('muscle-inbody-start'));document.querySelector('.world-shell').scrollIntoView({block:'start',behavior:'auto'})};choices.append(begin)}
 const back=document.createElement('button');back.className='btn light';back.textContent='다시 선택하기';back.onclick=openMuscleGreeting;choices.append(back);choices.firstElementChild?.focus();
}
function showStage(message,label,event){document.querySelector('#counsel-status').textContent=message;document.querySelector('#world-status').textContent=message;document.querySelector('#chat-area').hidden=false;document.querySelector('#chat-bubble').textContent=message;document.querySelector('#chat-answer').replaceChildren();const actions=document.querySelector('#chat-choices');actions.replaceChildren();const button=document.createElement('button');button.className='chat-choice';button.textContent=label;button.onclick=()=>document.dispatchEvent(new Event(event));actions.append(button)}
document.addEventListener('counsel-room-change',event=>{inMuscle=event.detail.room?.id==='muscle';wasSeated=false;hideSpeech();if(dialog.open&&document.querySelector('[data-muscle-dialogue]'))dialog.close()});
document.addEventListener('counsel-seat-change',event=>{const newlySeated=event.detail.seated&&!wasSeated;wasSeated=event.detail.seated;if(inMuscle&&newlySeated&&!event.detail.resume)openMuscleGreeting()});
document.addEventListener('muscle-greeting',openMuscleGreeting);
document.addEventListener('muscle-inbody-stage',event=>{
 if(!inMuscle)return;const state=event.detail,invitation='체성분검사를 위해 인바디 측정기 쪽으로 와 주세요. 신발을 벗고 인바디 위에 올라와 주세요. 움직이지 마시고 손잡이를 잡지 마세요. 체중을 측정하겠습니다.';
 const messages={invitation,walking:invitation,'shoes-off':'신발을 벗고 인바디 발판 위에 올라와 주세요.','stepping-on':'인바디 기계 쪽을 바라보며 움직이지 말고 서 주세요.','weight-ready':'움직이지 마시고 손잡이를 잡지 마세요. 체중을 측정하겠습니다.','weight-result':'체중 측정 예시가 화면에 표시되었습니다.','handle-instruction':'손잡이를 양손바닥으로 잡고 양팔을 벌려 겨드랑이가 몸에 닿지 않게 해 주세요. 인바디를 측정하겠습니다.',handles:'손잡이를 잡고 양팔과 겨드랑이 사이를 벌려 주세요.',measuring:'움직이지 말고 잠시 자세를 유지해 주세요. 화면의 값은 모두 측정 예시입니다.',result:'측정 결과가 화면에 표시되었습니다. 모든 값은 측정 예시입니다.',finished:'인바디 측정이 끝났습니다. 손잡이를 놓고 내려오세요.','stepping-off':'인바디 발판에서 내려와 주세요.','shoes-on':'신발을 신고 다시 상담 의자로 돌아가 주세요.','walking-back':'상담 의자로 돌아가 앉아 주세요.',sitting:'상담 의자에 앉아 주세요.',complete:'인바디 측정 동작 체험이 끝났습니다. 편하게 앉아 계세요.',cancelled:'인바디 측정 동작 체험을 중지했습니다.'};
 const done=['complete','cancelled'].includes(state),screenResult=['weight-result','result'].includes(state);speakStep(messages[state]||'',{placement:screenResult?'screen-clear':'auto',persist:state==='result'});showStage(messages[state]||'',done?'상담 다시 선택하기':'측정 체험 중지',done?'muscle-greeting':'muscle-inbody-cancel');document.querySelector('#talk-staff').disabled=!done;
});
document.addEventListener('muscle-inbody-cancel',()=>document.dispatchEvent(new Event('cardio-measurement-cancel')));
