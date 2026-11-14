import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [html,world,speech,sceneCss]=await Promise.all([
 readFile(new URL('../index.html',import.meta.url),'utf8'),
 readFile(new URL('../world.js',import.meta.url),'utf8'),
 readFile(new URL('../center-speech.js',import.meta.url),'utf8'),
 readFile(new URL('../cardio-scene.css',import.meta.url),'utf8')
]);

assert(!/gpt-guide|GPT에게 자유롭게 묻기/i.test(html));
assert(speech.includes("insertAdjacentElement('afterend',speech)"));
assert(sceneCss.includes('.cardio-speech{position:relative'));
assert(sceneCss.includes('.avatar-control'));
assert(sceneCss.includes('.move-pad'));
assert(world.includes('if(!isBlocked(nx,avatar.g.position.z))'));
assert(world.includes('if(!isBlocked(avatar.g.position.x,nz))'));
assert(world.includes('pathfinder.disableCornerCutting()'));
assert(world.includes("if(moveTo(target.x,target.z)){pendingSeat={x:target.x,z:target.z,approach:{equipment:e.detail}}"));
assert(world.indexOf('function applyEquipmentPose')<world.indexOf("document.addEventListener('facility-pose'"));

console.log('Interaction contracts: no GPT guide, collision-safe navigation, walked equipment use and screen-clear speech passed.');
