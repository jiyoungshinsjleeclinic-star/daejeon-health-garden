import {containsSensitiveData,normalizeGuideQuestion,normalizeGuideRoom} from './gpt-guide-policy.js?v=gpt-1';

const panel=document.querySelector('#counsel-panel'),endpoint=document.querySelector('meta[name="gpt-guide-endpoint"]')?.content?.trim()||'';
const section=document.createElement('section');section.className='gpt-guide';section.hidden=true;section.innerHTML=`<button class="gpt-guide-toggle" type="button" aria-expanded="false"><i data-lucide="message-circle"></i><span>GPT에게 자유롭게 묻기</span></button><div class="gpt-guide-body" hidden><p class="gpt-guide-note">센터 이용에 관한 일반적인 질문만 입력해 주세요. 이름, 연락처, 회사명, 생년월일, 검사 수치는 입력하지 마세요.</p><label class="gpt-guide-label" for="gpt-guide-question">질문</label><textarea id="gpt-guide-question" maxlength="500" rows="3" placeholder="예: 처음 방문할 때 무엇을 준비하면 되나요?"></textarea><label class="gpt-guide-confirm"><input id="gpt-guide-confirm" type="checkbox"> 개인정보나 검사결과를 입력하지 않았습니다.</label><button class="btn gpt-guide-send" type="button">질문 보내기</button><p class="gpt-guide-status" role="status" aria-live="polite"></p><div class="gpt-guide-answer" hidden></div><p class="room-info">GPT의 답변은 일반 안내이며 의료 상담·진단·예약 확정이 아닙니다.</p></div>`;
panel.append(section);window.lucide?.createIcons();

const toggle=section.querySelector('.gpt-guide-toggle'),body=section.querySelector('.gpt-guide-body'),question=section.querySelector('textarea'),confirm=section.querySelector('#gpt-guide-confirm'),send=section.querySelector('.gpt-guide-send'),status=section.querySelector('.gpt-guide-status'),answer=section.querySelector('.gpt-guide-answer');
let room='lobby',controller=null;
function setStatus(message){status.textContent=message}
function reset(){controller?.abort();controller=null;question.value='';confirm.checked=false;answer.hidden=true;answer.textContent='';setStatus('');body.hidden=true;toggle.setAttribute('aria-expanded','false')}
toggle.onclick=()=>{const open=body.hidden;body.hidden=!open;toggle.setAttribute('aria-expanded',String(open));if(open)question.focus()};
document.addEventListener('counsel-room-change',event=>{room=normalizeGuideRoom(event.detail.room?.id);section.hidden=!event.detail.room||!endpoint;reset()});
send.onclick=async()=>{
 const text=normalizeGuideQuestion(question.value);answer.hidden=true;answer.textContent='';
 if(!text){setStatus('질문을 입력해 주세요.');question.focus();return}
 if(!confirm.checked){setStatus('개인정보나 검사결과를 입력하지 않았는지 확인해 주세요.');confirm.focus();return}
 if(containsSensitiveData(text)){setStatus('개인정보로 보이는 내용이 있습니다. 해당 내용을 지운 뒤 다시 질문해 주세요.');question.focus();return}
 if(!endpoint){setStatus('GPT 연결 주소가 아직 설정되지 않았습니다. 현재는 위의 선택형 안내를 이용해 주세요.');return}
 controller?.abort();controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),15000);send.disabled=true;setStatus('GPT 안내원이 답변을 준비하고 있습니다.');
 try{const response=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({question:text,room}),signal:controller.signal,credentials:'omit'});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||'답변을 불러오지 못했습니다.');answer.textContent=String(data.answer||'답변을 불러오지 못했습니다.');answer.hidden=false;setStatus('GPT의 일반 안내입니다.')}
 catch(error){setStatus(error.name==='AbortError'?'응답 시간이 길어 연결을 중지했습니다. 잠시 후 다시 시도해 주세요.':'GPT 안내에 연결하지 못했습니다. 기존 선택형 안내를 이용하거나 센터에 전화해 주세요.')}
 finally{clearTimeout(timeout);controller=null;send.disabled=false}
};

