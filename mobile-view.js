const shell=document.querySelector('.world-shell');
const tools=document.querySelector('.world-tools'),more=document.querySelector('#world-more-tools');
const picker=document.querySelector('#mobile-room-picker'),mobile=matchMedia('(max-width:800px), (max-width:1100px) and (max-height:500px), (max-width:1100px) and (pointer:coarse)');
let frame=0;
function expandTools(expanded){tools.dataset.expanded=String(expanded);more.setAttribute('aria-expanded',String(expanded))}
more.onclick=()=>expandTools(tools.dataset.expanded!=='true');
document.querySelector('#world-extra-tools').addEventListener('click',e=>{if(e.target.closest('button'))expandTools(false)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&tools.dataset.expanded==='true'&&!document.querySelector('dialog[open]')){expandTools(false);more.focus();e.preventDefault();e.stopPropagation()}},true);
new MutationObserver(()=>{if(document.querySelector('#dialog').open)expandTools(false)}).observe(document.querySelector('#dialog'),{attributes:true,attributeFilter:['open']});
const shortNames={cardio:'뇌심혈관 예방상담',muscle:'근골격계질환 상담',environment:'작업환경컨설팅 · 가상'};
for(const button of document.querySelectorAll('[data-enter-room]')){const option=document.createElement('option');option.value=button.dataset.enterRoom;option.textContent=shortNames[option.value]||button.textContent.trim();picker.append(option)}
picker.onchange=()=>{expandTools(false);if(picker.value==='lobby')document.dispatchEvent(new Event('counsel-leave'));else document.dispatchEvent(new CustomEvent('counsel-enter',{detail:picker.value}))};
document.addEventListener('counsel-room-change',e=>{picker.value=e.detail.room?.id||'lobby';scheduleMeasure()});
document.querySelector('#mobile-reception').onclick=()=>document.dispatchEvent(new Event('reception-start'));
document.querySelector('#mobile-waiting').onclick=()=>document.dispatchEvent(new Event('waiting-seat-request'));
function measure(){
 frame=0;const height=Math.round(window.visualViewport?.height||innerHeight);
 const top=document.fullscreenElement?0:Math.round(shell.getBoundingClientRect().top+scrollY);
 document.documentElement.style.setProperty('--mobile-viewport-height',height+'px');
 shell.style.setProperty('--mobile-scene-height',Math.max(180,height-top-4)+'px');
 if(!mobile.matches)expandTools(false);
}
function scheduleMeasure(){if(!frame)frame=requestAnimationFrame(measure)}
new ResizeObserver(scheduleMeasure).observe(document.querySelector('header'));
new ResizeObserver(scheduleMeasure).observe(document.querySelector('.welcome'));
window.addEventListener('resize',scheduleMeasure);window.visualViewport?.addEventListener('resize',scheduleMeasure);
document.addEventListener('fullscreenchange',scheduleMeasure);mobile.addEventListener('change',scheduleMeasure);
measure();
