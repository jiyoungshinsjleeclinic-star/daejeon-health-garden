import assert from 'node:assert/strict';
import {RECEPTION_FLOW as flow,RECEPTION_WELCOME,isReceptionApproach,outsideReceptionArea} from '../reception-flow.js';
import {CENTER_PLAN} from '../center-plan.js';

assert(RECEPTION_WELCOME.includes('대전근로자건강센터'));
const reached=new Set();
function visit(id){if(reached.has(id))return;reached.add(id);const n=flow[id];assert(n?.text);assert(n.choices?.length||n.actions?.length);for(const c of n.choices||[]){assert(c.label&&flow[c.next]);visit(c.next)}for(const a of n.actions||[])assert(['waiting','bloodpressure','muscle','stress','environment','general'].includes(a.action))}
visit('start');assert.equal(reached.size,Object.keys(flow).length);
assert.equal(flow.start.choices[0].next,'first');assert(flow.first.text.includes('상담지'));
assert.equal(flow.returning.choices[0].next,'identity');assert(flow.identity.choices[0].label.includes('대전이'));
assert(flow.cardio.text.includes('5분'));assert(flow.cardio.text.includes('자동혈압계'));
assert(flow.cardioDone.actions.some(a=>a.action==='waiting'));
const desk=CENTER_PLAN.reception,near={x:-3.2,z:3.5,moving:true,dz:-1,room:'lobby',dialogOpen:false};
assert(isReceptionApproach(near,desk));
assert(isReceptionApproach({...near,dz:0,entering:true},desk));
for(const change of [{z:4},{moving:false},{room:'cardio'},{dialogOpen:true},{x:15},{dz:0},{dz:1}])assert(!isReceptionApproach({...near,...change},desk));
assert(!outsideReceptionArea(near.x,near.z,desk));assert(outsideReceptionArea(-7,5.5,desk));
console.log(`Reception flow: ${reached.size} reachable states, first/repeat visits, privacy choices and approach boundaries passed.`);
