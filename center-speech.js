const speech=document.createElement('div');speech.className='cardio-speech';speech.hidden=true;speech.setAttribute('role','status');speech.setAttribute('aria-live','polite');
const speaker=document.createElement('strong'),line=document.createElement('p'),close=document.createElement('button'),content=document.createElement('div');content.className='speech-content';close.className='speech-close';close.type='button';close.setAttribute('aria-label','말풍선 닫기');close.title='말풍선 닫기';close.textContent='×';content.append(speaker,line,close);speech.append(content);
let timer=0,lastText='';
const world=document.querySelector('#world');
world.insertAdjacentElement('afterend',speech);
export function hideSpeech(){clearTimeout(timer);speech.hidden=true;speech.dataset.placement='auto';lastText=''}
export function speak(text,{name='안내원',duration=0,placement='auto'}={}){
 if(text===lastText&&!speech.hidden)return;
 clearTimeout(timer);lastText=text;speaker.textContent=name;line.textContent=text;speech.hidden=false;speech.dataset.hasDialogue='true';speech.dataset.placement=placement;
 if(duration)timer=setTimeout(()=>{speech.hidden=true},duration);
}
export function speakStep(text,{placement='auto',persist=false}={}){speak(text,{duration:persist?0:Math.max(2800,Math.min(6000,text.length*60)),placement})}
close.onclick=hideSpeech;
document.addEventListener('center-speech',e=>{speak(e.detail.text,{name:e.detail.speaker||'안내원'})});
document.addEventListener('counsel-room-change',()=>{hideSpeech();speech.dataset.hasDialogue='false'});
new MutationObserver(()=>{if(document.querySelector('#dialog').open)hideSpeech()}).observe(document.querySelector('#dialog'),{attributes:true,attributeFilter:['open']});
