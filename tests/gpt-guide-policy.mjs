import assert from 'node:assert/strict';
import {containsSensitiveData,normalizeGuideQuestion,normalizeGuideRoom,GUIDE_SYSTEM_PROMPT} from '../gpt-guide-policy.js';

assert.equal(normalizeGuideQuestion('  처음   방문 준비물은?  '),'처음 방문 준비물은?');
assert.equal(normalizeGuideQuestion('가'.repeat(700)).length,500);
assert.equal(normalizeGuideRoom('cardio'),'cardio');
assert.equal(normalizeGuideRoom('unknown'),'lobby');
assert(containsSensitiveData('제 전화번호는 010-1234-5678입니다.'));
assert(containsSensitiveData('이메일 test@example.com으로 알려주세요.'));
assert(containsSensitiveData('생년월일: 900101'));
assert(containsSensitiveData('오늘 혈압이 160/100으로 나왔어요.'));
assert(containsSensitiveData('당화혈색소 7.2%입니다.'));
assert(!containsSensitiveData('처음 방문할 때 무엇을 준비하면 되나요?'));
assert(!containsSensitiveData('혈압 검사는 어떻게 진행하나요?'));
assert(GUIDE_SYSTEM_PROMPT.includes('의학적 진단'));
assert(GUIDE_SYSTEM_PROMPT.includes('042-936-9571'));
console.log('GPT guide: privacy filter, room scope, length limit and safety prompt passed.');

