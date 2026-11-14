import assert from 'node:assert/strict';
import {createGuideHandler} from '../api/guide.mjs';

function response(){return{statusCode:0,headers:{},payload:null,setHeader(name,value){this.headers[name]=value},status(value){this.statusCode=value;return this},json(value){this.payload=value;return this},end(){return this}}}
const origin='https://jiyoungshinsjleeclinic-star.github.io';

let res=response();await createGuideHandler({apiKey:''})({method:'POST',headers:{origin},body:{question:'처음 방문 준비물은?',room:'general'}},res);assert.equal(res.statusCode,503);
res=response();await createGuideHandler({apiKey:'test'})({method:'POST',headers:{origin},body:{question:'전화번호는 010-1234-5678입니다.',room:'general'}},res);assert.equal(res.statusCode,400);
let requestBody=null;const fetchImpl=async(url,options)=>{requestBody=JSON.parse(options.body);return{ok:true,status:200,json:async()=>({output_text:'처음 방문 전 센터에 전화로 일정을 확인해 주세요.'})}};
res=response();await createGuideHandler({apiKey:'test',fetchImpl})({method:'POST',headers:{origin},body:{question:'처음 방문할 때 무엇을 준비하나요?',room:'general'}},res);assert.equal(res.statusCode,200);assert.match(res.payload.answer,/전화/);assert.equal(requestBody.model,'gpt-4.1-mini');assert.match(requestBody.input[1].content[0].text,/general/);
res=response();await createGuideHandler({apiKey:'test'})({method:'OPTIONS',headers:{origin},body:{}},res);assert.equal(res.statusCode,204);assert.equal(res.headers['access-control-allow-origin'],origin);
res=response();await createGuideHandler({apiKey:'test'})({method:'POST',headers:{origin:'https://example.com'},body:{question:'센터 이용 방법은?',room:'general'}},res);assert.equal(res.statusCode,403);
console.log('GPT guide API: missing key, privacy block, OpenAI request, answer and CORS passed.');
