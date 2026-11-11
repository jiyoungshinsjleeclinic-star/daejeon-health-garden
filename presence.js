import {joinRoom as joinTorrentRoom} from './vendor/trystero-torrent.js';
import {joinRoom as joinNostrRoom} from './vendor/trystero-nostr.js';

export const PRESENCE_APP_ID='daejeon-health-garden-v1';
export const PRESENCE_ROOM_ID='public-center';
const VALID_ROOMS=new Set(['lobby','psych3','trauma','general','stress','muscle','cardio','education','environment']);

export function sanitizePresenceState(value={}){
 const number=(input,min,max,fallback=0)=>Number.isFinite(Number(input))?Math.max(min,Math.min(max,Number(input))):fallback;
 return {
  id:String(value.id||'').slice(0,64),
  x:number(value.x,-30,30),z:number(value.z,-20,20),rotation:number(value.rotation,-Math.PI*4,Math.PI*4),
  seated:!!value.seated,room:VALID_ROOMS.has(value.room)?value.room:'lobby',gender:value.gender==='male'?'male':'female',
  color:/^#[0-9a-f]{6}$/i.test(value.color||'')?value.color:'#669cb4',updatedAt:Date.now()
 };
}

if(typeof document!=='undefined'){
 const styles=document.createElement('link');styles.rel='stylesheet';styles.href='multiplayer.css?v=multiplayer-1';document.head.append(styles);
 const id=sessionStorage.getItem('health-garden-presence-id')||crypto.randomUUID();sessionStorage.setItem('health-garden-presence-id',id);
 const peers=new Map(),peerClients=new Map(),rooms=[],senders=[];let localState=sanitizePresenceState({id});
 const channel='BroadcastChannel'in window?new BroadcastChannel(PRESENCE_APP_ID):null;
 const hud=document.querySelector('.world-hud>div'),avatarControl=document.querySelector('.avatar-control');
 if(hud){hud.querySelector('strong').textContent='건강정원 · 함께 하는 산책';const line=document.createElement('p');line.id='presence-count';line.title='이름이나 건강정보 없이 임시 위치와 캐릭터 외형만 공유합니다.';line.textContent='실시간 방문자 · 나 포함 1명';hud.append(line)}
 if(avatarControl){const group=document.createElement('div');group.className='gender-switch';group.role='group';group.setAttribute('aria-label','캐릭터 선택');for(const [gender,symbol,label]of[['male','♂','남자 캐릭터'],['female','♀','여자 캐릭터']]){const button=document.createElement('button');button.className='icon-btn gender-symbol';button.dataset.gender=gender;button.title=label;button.setAttribute('aria-label',label);button.setAttribute('aria-pressed',String((localStorage.getItem('health-garden-gender')||'female')===gender));button.textContent=symbol;button.onclick=()=>{group.querySelectorAll('button').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));document.dispatchEvent(new CustomEvent('avatar-gender-change',{detail:gender}))};group.append(button)}avatarControl.prepend(group)}
 const publishCount=()=>{const count=1+peers.size;const line=document.querySelector('#presence-count');if(line)line.textContent=rooms.length?`실시간 방문자 · 나 포함 ${count}명`:count>1?`기기 내 방문자 · 나 포함 ${count}명`:`함께 보기 꺼짐 · 나만 표시`;document.dispatchEvent(new CustomEvent('presence-count',{detail:{count}}));window.healthPresence={id,count,connected:rooms.length>0,transports:rooms.length}};
 function receive(raw,transportId){const state=sanitizePresenceState(raw);if(!state.id||state.id===id)return;peers.set(state.id,{state,lastSeen:Date.now()});if(transportId)peerClients.set(transportId,state.id);document.dispatchEvent(new CustomEvent('presence-update',{detail:{id:state.id,state}}));publishCount()}
 channel?.addEventListener('message',event=>receive(event.data));
 function connect(joinRoom,name,options={}){try{const room=joinRoom({appId:PRESENCE_APP_ID,relayRedundancy:3,...options},PRESENCE_ROOM_ID),action=room.makeAction('pose'),send=action[0];rooms.push(room);senders.push(send);action[1]((data,peerId)=>receive(data,`${name}:${peerId}`));room.onPeerJoin(peerId=>{if(localState.id)send(localState,peerId)});room.onPeerLeave(peerId=>peerClients.delete(`${name}:${peerId}`))}catch(error){console.warn(`${name} 실시간 방문자 연결을 시작하지 못했습니다.`,error)}}
 function startExternal(){if(rooms.length)return;connect(joinTorrentRoom,'torrent');connect(joinNostrRoom,'nostr',{relayUrls:['wss://relay.damus.io','wss://nos.lol','wss://relay.primal.net']});localStorage.setItem('health-garden-presence-consent','yes');publishCount()}
 function openConsent(){window.show('실시간 함께 보기','<section data-presence-consent><h2>다른 방문자와 함께 둘러볼까요?</h2><p>켜면 다른 접속자에게 임시 접속 ID, 현재 공간, 캐릭터 위치·방향·성별·색상·착석 상태가 전달됩니다. 이름, 연락처, 상담 내용은 공유하지 않습니다.</p><p class="small">접속 연결에는 공개 WebTorrent·Nostr 신호 서버를 사용하며 연결 메타데이터가 해당 서비스에 전달될 수 있습니다. 캐릭터 상태는 WebRTC로 방문자끼리 직접 교환합니다.</p><div class="actions"><button class="btn" id="presence-allow" type="button">함께 보기 켜기</button><button class="btn light" id="presence-decline" type="button">나만 보기</button></div></section>');document.querySelector('#presence-allow').onclick=()=>{startExternal();document.querySelector('dialog[open]')?.close()};document.querySelector('#presence-decline').onclick=()=>{localStorage.setItem('health-garden-presence-consent','no');document.querySelector('dialog[open]')?.close()}}
 const toggle=document.createElement('button');toggle.className='icon-btn presence-toggle';toggle.type='button';toggle.title='실시간 함께 보기 설정';toggle.setAttribute('aria-label','실시간 함께 보기 설정');toggle.innerHTML='<i data-lucide="users"></i>';toggle.onclick=openConsent;avatarControl?.append(toggle);window.lucide?.createIcons();
 if(localStorage.getItem('health-garden-presence-consent')==='yes')startExternal();else if(!localStorage.getItem('health-garden-presence-consent'))setTimeout(openConsent,400);
 document.addEventListener('presence-local-state',event=>{localState=sanitizePresenceState({...event.detail,id});channel?.postMessage(localState);for(const send of senders)try{send(localState)}catch{}});
 setInterval(()=>{const stale=Date.now()-15000;for(const [clientId,peer]of peers)if(peer.lastSeen<stale){peers.delete(clientId);document.dispatchEvent(new CustomEvent('presence-leave',{detail:{id:clientId}}))}publishCount()},5000);
 addEventListener('pagehide',()=>{channel?.close();rooms.forEach(room=>room.leave())},{once:true});publishCount();
}
