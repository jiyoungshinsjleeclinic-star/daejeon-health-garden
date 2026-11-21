const MEASUREMENT_ID='G-9K2LH06SM9';
const CONSENT_KEY='health-garden-analytics-consent';
const SESSION_KEY='health-garden-session-counted';
let enabled=false;

function gtag(){window.dataLayer.push(arguments)}

function send(name){
 if(!enabled)return;
 gtag('event',name,{transport_type:'beacon'});
}

function loadAnalytics(){
 if(enabled)return;
 enabled=true;window.dataLayer=window.dataLayer||[];window.gtag=gtag;
 gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
 gtag('js',new Date());
 gtag('config',MEASUREMENT_ID,{send_page_view:true,anonymize_ip:true,allow_google_signals:false,allow_ad_personalization_signals:false,transport_type:'beacon'});
 const script=document.createElement('script');script.async=true;script.src=`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;document.head.append(script);
 if(!sessionStorage.getItem(SESSION_KEY)){sessionStorage.setItem(SESSION_KEY,'1');send('virtual_center_visit')}
}

function clearAnalyticsCookies(){
 for(const item of document.cookie.split(';')){
  const name=item.split('=')[0].trim();if(!name.startsWith('_ga'))continue;
  for(const path of ['/','/daejeon-health-garden/'])document.cookie=`${name}=; Max-Age=0; path=${path}; SameSite=Lax`;
 }
}

const banner=document.createElement('section');banner.className='analytics-consent';banner.hidden=true;banner.setAttribute('role','dialog');banner.setAttribute('aria-labelledby','analytics-title');banner.innerHTML=`<div><strong id="analytics-title">익명 이용 통계</strong><p>일·월·년별 체험 실적을 확인하기 위해 방문과 체험 횟수만 Google Analytics로 집계합니다. 이름, 연락처, 상담 답변과 검사 예시값은 수집하지 않습니다.</p></div><div class="analytics-actions"><button type="button" class="btn light" data-analytics-deny>거부</button><button type="button" class="btn" data-analytics-accept>동의</button></div>`;
document.body.append(banner);

function showConsent(){banner.hidden=false}
function hideConsent(){banner.hidden=true}

banner.querySelector('[data-analytics-accept]').onclick=()=>{localStorage.setItem(CONSENT_KEY,'granted');loadAnalytics();hideConsent()};
banner.querySelector('[data-analytics-deny]').onclick=()=>{localStorage.setItem(CONSENT_KEY,'denied');if(enabled)gtag('consent','update',{analytics_storage:'denied'});enabled=false;clearAnalyticsCookies();hideConsent()};

const settings=document.createElement('button');settings.type='button';settings.className='analytics-settings';settings.textContent='이용 통계 설정';settings.onclick=showConsent;document.querySelector('.footer')?.append(settings);

if(localStorage.getItem(CONSENT_KEY)==='granted')loadAnalytics();else if(localStorage.getItem(CONSENT_KEY)!=='denied')showConsent();

document.addEventListener('counsel-room-change',event=>{if(event.detail?.room)send('space_entry')});
document.addEventListener('muscle-inbody-start',()=>send('experience_start'));
document.addEventListener('cardio-waist-start',()=>send('experience_start'));
document.addEventListener('muscle-inbody-stage',event=>{if(event.detail==='complete')send('experience_complete')});
for(const name of ['cardio-waist-stage','cardio-height-stage','cardio-bp-stage','cardio-glucose-stage','cardio-cholesterol-stage','cardio-hba1c-stage','cardio-arterial-stage'])document.addEventListener(name,event=>{if(event.detail==='complete')send('experience_step_complete')});
