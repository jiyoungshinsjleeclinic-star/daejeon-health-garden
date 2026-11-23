import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const [source,html]=await Promise.all([
 readFile(new URL('../analytics.js',import.meta.url),'utf8'),
 readFile(new URL('../index.html',import.meta.url),'utf8'),
]);

function run(storedChoice,sessionCounted=false){
 const storage=data=>({getItem:key=>data[key]??null,setItem:(key,value)=>{data[key]=value}});
 const localStorage=storage({'health-garden-analytics-consent':storedChoice});
 const sessionStorage=storage({'health-garden-session-counted':sessionCounted?'1':null});
 const window={localStorage,sessionStorage};
 const handlers=new Map(),scripts=[];
 const footer={append(settings){this.settings=settings}};
 const document={
  cookie:'',
  head:{append:script=>scripts.push(script)},
  createElement:tag=>({tag,append(...children){this.children=children}}),
  querySelector:selector=>selector==='.footer'?footer:null,
  addEventListener:(name,handler)=>handlers.set(name,handler),
 };
 runInNewContext(source,{window,document,location:{origin:'https://example.com',pathname:'/garden/',search:'?private=yes',hash:'#private'}});
 const events=()=>Array.from(window.dataLayer||[],entry=>Array.from(entry)).filter(entry=>entry[0]==='event');
 return {window,scripts,events,handlers,toggle:footer.settings.children[1]};
}

const fresh=run();
assert.equal(fresh.scripts.length,1);
const configs=Array.from(fresh.window.dataLayer).filter(entry=>entry[0]==='config');
assert.deepEqual(configs.map(entry=>entry[1]),['G-9K2LH06SM9','G-6E8H0DJ413']);
assert(configs.every(entry=>entry[2].page_location==='https://example.com/garden/'&&!entry[2].allow_google_signals));
assert.deepEqual(fresh.events().map(entry=>entry[1]),['virtual_center_visit']);
fresh.handlers.get('counsel-room-change')({detail:{room:{id:'private-room'}}});
assert(fresh.events().at(-1)[1]==='space_entry');
assert(!JSON.stringify(fresh.events()).includes('private-room'));
fresh.toggle.onclick();
fresh.handlers.get('muscle-inbody-start')();
assert.equal(fresh.events().length,2);
assert(configs.every(entry=>fresh.window['ga-disable-'+entry[1]]===true));
fresh.toggle.onclick();
assert.equal(fresh.scripts.length,1);
assert.equal(fresh.events().length,2);
assert.equal(run(undefined,true).events().length,0);
const denied=run('denied');
assert.equal(denied.scripts.length,0);
assert.equal(denied.events().length,0);
assert(!html.includes('googletagmanager.com'));
assert.match(html,/analytics\.js\?v=auto-1/);
console.log('Automatic GA4 initialization, one script, both destinations, and opt-out passed.');
