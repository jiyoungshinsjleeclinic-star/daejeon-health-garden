import {INTAKE_SECTIONS,CONSENT_CHECK_ITEMS} from './intake-items.js?v=intake-1';

const dialog=document.querySelector('#dialog');
let checks=new Set();
document.querySelector('#waiting-sofa').onclick=()=>document.dispatchEvent(new Event('waiting-seat-request'));
document.addEventListener('waiting-seated',()=>{
 checks.clear();window.show('대기실 · 상담지 안내','<section data-intake="question"><span class="eyebrow">대기실</span><h2>상담지를 작성하시겠습니까?</h2><p>작성 항목만 확인합니다. 실제 개인정보나 건강정보는 입력하지 않습니다.</p><div class="actions"><button class="btn" id="intake-yes">네</button><button class="btn light" id="intake-no">아니오</button></div></section>');
 document.querySelector('#intake-yes').onclick=showFront;document.querySelector('#intake-no').onclick=()=>dialog.close();
 document.querySelector('#intake-yes').focus({preventScroll:true});
});
function pageShell(page,title){
 window.show('상담지 작성 항목','<section data-intake="'+page+'"><span class="eyebrow">'+(page==='front'?'앞장 · 1 / 2':'뒷장 · 2 / 2')+'</span><h2 tabindex="-1" id="intake-title">'+title+'</h2><p class="intake-note">항목 안내용입니다. 실제 작성·동의·제출은 센터의 현장 서식으로 진행해 주세요.</p><div id="intake-page"></div><div class="actions" id="intake-actions"></div></section>');
 dialog.scrollTop=0;document.querySelector('#intake-title').focus({preventScroll:true});
}
function button(text,fn,primary=false){const b=document.createElement('button');b.type='button';b.className=primary?'btn':'btn light';b.textContent=text;b.onclick=fn;document.querySelector('#intake-actions').append(b)}
function showFront(){
 pageShell('front','상담지 작성 항목');
 const page=document.querySelector('#intake-page');page.className='intake-sections';
 for(const section of INTAKE_SECTIONS){
  const group=document.createElement('section'),title=document.createElement('h3'),list=document.createElement('ul');title.textContent=section.title;
  for(const text of section.items){const item=document.createElement('li');item.textContent=text;list.append(item)}group.append(title,list);page.append(group);
 }
 button('뒷장 · 개인정보 동의서 항목 보기',showBack,true);button('닫기',()=>dialog.close());
}
function showBack(){
 pageShell('back','개인정보 동의서 확인 항목');
 const page=document.querySelector('#intake-page');page.className='intake-consent';
 const note=document.createElement('p');note.className='small';note.textContent='아래는 확인용 체크이며 실제 동의서가 아닙니다. 세부 항목과 필수·선택 여부는 센터 서식에서 확인해 주세요.';page.append(note);
 for(const [index,text] of CONSENT_CHECK_ITEMS.entries()){
  const label=document.createElement('label'),check=document.createElement('input'),span=document.createElement('span');check.type='checkbox';check.checked=checks.has(index);check.onchange=()=>check.checked?checks.add(index):checks.delete(index);span.textContent=text;label.append(check,span);page.append(label);
 }
 button('앞장으로',showFront);button('안내데스크로 가기',()=>{document.dispatchEvent(new Event('intake-reviewed'));dialog.close();document.dispatchEvent(new Event('reception-return'))},true);
}
dialog.addEventListener('close',()=>checks.clear());
