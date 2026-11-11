import assert from 'node:assert/strict';
import {EDUCATION_TOPICS,EDUCATION_PHONE} from '../education-talk.js';
assert.equal(EDUCATION_TOPICS.length,7);assert.deepEqual(EDUCATION_TOPICS,['성인 심폐소생술 및 제세동기 교육','뇌심혈관계질환 예방교육','근골격계질환 교육(테이핑교육)','근육이완을 위한 스트레칭 교육','소음성 난청예방과 청력보호구 착용 실습교육','직무스트레스 예방교육','트라우마 심리교육']);assert.equal(EDUCATION_PHONE,'042-936-9571');console.log('Education menu: seven requested topics and the center phone number passed.');
