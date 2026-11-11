export const EDUCATION_TOPICS=[
 '성인 심폐소생술 및 제세동기 교육',
 '뇌심혈관계질환 예방교육',
 '근골격계질환 교육(테이핑교육)',
 '근육이완을 위한 스트레칭 교육',
 '소음성 난청예방과 청력보호구 착용 실습교육',
 '직무스트레스 예방교육',
 '트라우마 심리교육'
];
export const EDUCATION_PHONE='042-936-9571';

if(typeof document!=='undefined'){
 let inEducation=false;
 function openContact(topic){
  window.show('담당자에게 연락하기','<section data-education-contact><p class="eyebrow">선택한 교육</p><h2 id="education-selected"></h2><p>교육 일정과 신청 가능 여부는 담당자에게 전화로 문의해 주세요.</p><a class="phone" href="tel:0429369571">042-936-9571</a><div class="actions"><a class="btn" href="tel:0429369571">담당자에게 전화하기 ↗</a><button class="btn light" id="education-back" type="button">교육 목록으로</button></div><p class="small">이 화면에서는 교육 신청이나 예약을 접수하지 않습니다.</p></section>');
  document.querySelector('#education-selected').textContent=topic;
  document.querySelector('#education-back').onclick=openEducationMenu;
 }
 function openEducationMenu(){
  if(!inEducation)return;
  window.show('교육실 안내','<section data-education-menu><p class="eyebrow">가상 교육 안내원</p><h2>안녕하세요. 여기는 교육실입니다.</h2><p class="education-question">원하시는 교육이 있으신가요?</p><div id="education-options" class="education-options"></div><p class="small">교육 항목을 선택하면 담당자 연락처를 안내합니다.</p></section>');
  const options=document.querySelector('#education-options');
  EDUCATION_TOPICS.forEach((topic,index)=>{const button=document.createElement('button');button.type='button';button.className='chat-choice';button.textContent=`${index+1}. ${topic}`;button.onclick=()=>openContact(topic);options.append(button)});
  options.firstElementChild?.focus();
 }
 document.addEventListener('counsel-room-change',event=>{inEducation=event.detail.room?.id==='education';if(inEducation)queueMicrotask(openEducationMenu)});
 document.addEventListener('counsel-seat-change',event=>{if(inEducation&&event.detail.seated&&!event.detail.resume)queueMicrotask(openEducationMenu)});
 document.addEventListener('education-greeting',openEducationMenu);
}
