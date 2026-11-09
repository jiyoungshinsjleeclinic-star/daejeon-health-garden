import {RECEPTION_FLOW,RECEPTION_WELCOME} from './reception-flow.js?v=reception-1';

const dialog=document.querySelector('#dialog');
let nodeId='start',history=[];
document.addEventListener('reception-start',()=>{
 if(dialog.open&&document.querySelector('[data-reception]'))return;
 nodeId='start';history=[{role:'guide',text:RECEPTION_WELCOME}];
 window.show('접수 안내','<section data-reception><div class="reception-heading"><div><span class="eyebrow">가상 안내원</span><h2>접수 안내</h2></div><button class="icon-btn" id="reception-restart" title="대화 다시 시작" aria-label="대화 다시 시작"><i data-lucide="rotate-ccw"></i></button></div><p class="reception-privacy">체험용 인물의 선택형 대화입니다. 실제 방문 기록을 조회하지 않으며, 이름·전화번호를 입력받거나 저장하지 않습니다.</p><ol id="reception-history" class="reception-history" aria-label="안내원과의 대화" tabindex="0"></ol><p id="reception-current" class="sr-only" role="status" aria-live="polite"></p><div id="reception-choices" class="reception-choices" aria-label="내방객 응답"></div></section>');
 document.querySelector('#reception-restart').onclick=()=>{history=[{role:'guide',text:RECEPTION_WELCOME}];nodeId='start';advance()};
 window.lucide?.createIcons();advance();document.dispatchEvent(new Event('reception-opened'));
});
function advance(){
 const node=RECEPTION_FLOW[nodeId];history.push({role:'guide',text:node.text});render();
}
function render(){
 const list=document.querySelector('#reception-history'),choices=document.querySelector('#reception-choices');
 list.replaceChildren();choices.replaceChildren();
 for(const line of history){
  const item=document.createElement('li');item.className='reception-line '+line.role;
  const who=document.createElement('strong');who.textContent=line.role==='guide'?'안내원':'내방객';
  const text=document.createElement('p');text.textContent=line.text;item.append(who,text);list.append(item);
 }
 const node=RECEPTION_FLOW[nodeId];document.querySelector('#reception-current').textContent=node.text;
 for(const choice of node.choices||[]){
  const b=document.createElement('button');b.type='button';b.className='chat-choice';b.textContent=choice.label;
  b.onclick=()=>{history.push({role:'visitor',text:choice.label});nodeId=choice.next;advance()};choices.append(b);
 }
 for(const action of node.actions||[]){
  const b=document.createElement('button');b.type='button';b.className='btn light';b.textContent=action.label;
  b.onclick=()=>{const destination=action.action==='waiting'&&nodeId==='firstDone'?'waiting-intake':action.action;dialog.close();if(['waiting','waiting-intake','bloodpressure'].includes(destination))document.dispatchEvent(new CustomEvent('reception-walk',{detail:destination}));else document.dispatchEvent(new CustomEvent('counsel-enter',{detail:destination}))};choices.append(b);
 }
 if(!node.choices?.length){const done=document.createElement('button');done.className='text-btn';done.textContent='대화 마치기';done.onclick=()=>dialog.close();choices.append(done)}
 list.scrollTop=list.scrollHeight;choices.querySelector('button')?.focus({preventScroll:true});
}
dialog.addEventListener('close',()=>{history=[];nodeId='start'});
