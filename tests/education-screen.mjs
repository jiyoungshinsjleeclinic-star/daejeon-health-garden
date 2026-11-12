import assert from 'node:assert/strict';
import {containRect} from '../education-screen.js';

const landscape=containRect(960,720,960,720);
assert.deepEqual(landscape,{x:0,y:0,width:960,height:720});
const portrait=containRect(540,960,960,540);
assert.deepEqual(portrait,{x:328.125,y:0,width:303.75,height:540});
console.log('Education screen: media is contained without distortion.');
