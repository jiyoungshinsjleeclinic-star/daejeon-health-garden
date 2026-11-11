import assert from 'node:assert/strict';
import {PRESENCE_APP_ID,PRESENCE_ROOM_ID,sanitizePresenceState} from '../presence.js';

assert.equal(PRESENCE_APP_ID,'daejeon-health-garden-v1');
assert.equal(PRESENCE_ROOM_ID,'public-center');
const state=sanitizePresenceState({id:'visitor',x:999,z:-999,rotation:'1.5',seated:1,room:'education',gender:'male',color:'#D58A91'});assert(Number.isFinite(state.updatedAt));delete state.updatedAt;assert.deepEqual(state,{id:'visitor',x:30,z:-20,rotation:1.5,seated:true,room:'education',gender:'male',color:'#D58A91'});
const fallback=sanitizePresenceState({room:'unknown',gender:'other',color:'red'});assert.equal(fallback.room,'lobby');assert.equal(fallback.gender,'female');assert.equal(fallback.color,'#669cb4');
console.log('Anonymous multiplayer presence state validation passed.');
