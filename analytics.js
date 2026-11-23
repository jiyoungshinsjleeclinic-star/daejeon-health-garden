const MEASUREMENT_IDS=['G-9K2LH06SM9','G-6E8H0DJ413'];
const CONSENT_KEY='health-garden-analytics-consent';
const SESSION_KEY='health-garden-session-counted';
let enabled=false,loaded=false,visitCounted=false;

function read(storage,key){
 try{return window[storage].getItem(key)}catch{return null}
}
function write(storage,key,value){
 try{window[storage].setItem(key,value)}catch{}
}
function gtag(){window.dataLayer.push(arguments)}
function send(name){
 if(!enabled)return;
 gtag('event',name,{send_to:MEASUREMENT_IDS.join(','),transport_type:'beacon'});
}

function loadAnalytics(){
 enabled=true;
 for(const id of MEASUREMENT_IDS)window['ga-disable-'+id]=false;
 if(!loaded){
  loaded=true;
  window.dataLayer=window.dataLayer||[];
  window.gtag=gtag;
  gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
  gtag('js',new Date());
  for(const id of MEASUREMENT_IDS){
   gtag('config',id,{
    send_page_view:true,
    page_location:location.origin+location.pathname,
    page_referrer:'',
    allow_google_signals:false,
    allow_ad_personalization_signals:false,
    transport_type:'beacon',
   });
  }
  const script=document.createElement('script');
  script.async=true;
  script.src='https://www.googletagmanager.com/gtag/js?id='+MEASUREMENT_IDS[0];
  document.head.append(script);
 }else{
  gtag('consent','update',{analytics_storage:'granted'});
 }
 if(!visitCounted&&!read('sessionStorage',SESSION_KEY)){
  visitCounted=true;
  write('sessionStorage',SESSION_KEY,'1');
  send('virtual_center_visit');
 }
}

function stopAnalytics(){
 enabled=false;
 for(const id of MEASUREMENT_IDS)window['ga-disable-'+id]=true;
 if(loaded)gtag('consent','update',{analytics_storage:'denied'});
 for(const item of document.cookie.split(';')){
  const name=item.split('=')[0].trim();
  if(!name.startsWith('_ga'))continue;
  for(const path of ['/','/daejeon-health-garden/'])
   document.cookie=`${name}=; Max-Age=0; path=${path}; SameSite=Lax`;
 }
}

const settings=document.createElement('div');
settings.className='analytics-settings';
const notice=document.createElement('p');
notice.textContent='방문과 체험 횟수를 Google Analytics로 집계합니다. 이름, 연락처, 상담 답변과 검사 예시값은 집계에 포함하지 않습니다.';
const toggle=document.createElement('button');
toggle.type='button';
function updateToggle(){
 toggle.textContent=enabled?'이용 통계 집계 끄기':'이용 통계 집계 켜기';
}
toggle.onclick=()=>{
 write('localStorage',CONSENT_KEY,enabled?'denied':'granted');
 if(enabled)stopAnalytics();else loadAnalytics();
 updateToggle();
};
settings.append(notice,toggle);
document.querySelector('.footer')?.append(settings);

if(read('localStorage',CONSENT_KEY)!=='denied')loadAnalytics();
updateToggle();

document.addEventListener('counsel-room-change',event=>{if(event.detail?.room)send('space_entry')});
document.addEventListener('muscle-inbody-start',()=>send('experience_start'));
document.addEventListener('cardio-waist-start',()=>send('experience_start'));
document.addEventListener('muscle-inbody-stage',event=>{if(event.detail==='complete')send('experience_complete')});
for(const name of ['cardio-waist-stage','cardio-height-stage','cardio-bp-stage','cardio-glucose-stage','cardio-cholesterol-stage','cardio-hba1c-stage','cardio-arterial-stage'])document.addEventListener(name,event=>{if(event.detail==='complete')send('experience_step_complete')});
