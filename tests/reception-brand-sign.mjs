import assert from 'node:assert/strict';
import fs from 'node:fs';

const world=fs.readFileSync(new URL('../world.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');

assert(world.includes('function receptionBrandSign()'));
assert(world.includes("c.fillText('대전근로자'"));
assert(world.includes("c.fillText('건강'"));
assert(world.includes("c.fillText('센터'"));
assert(world.includes('receptionBrandSign();'));
assert(world.indexOf('box(11.3,2.8,.15')<world.indexOf('receptionBrandSign();'));
assert(html.includes('world.js?v=reception-sign-1'));

console.log('Reception brand sign placement and cache version: passed.');
