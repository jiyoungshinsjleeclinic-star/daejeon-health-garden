import {containsSensitiveData,GUIDE_SYSTEM_PROMPT,normalizeGuideQuestion,normalizeGuideRoom} from '../gpt-guide-policy.js';

const DEFAULT_ORIGINS=new Set(['https://jiyoungshinsjleeclinic-star.github.io','http://localhost:4173','http://127.0.0.1:4173']);
function allowedOrigin(origin){const configured=String(process.env.GPT_GUIDE_ORIGINS||'').split(',').map(value=>value.trim()).filter(Boolean);return DEFAULT_ORIGINS.has(origin)||configured.includes(origin)}
function send(res,status,payload,origin=''){if(origin&&allowedOrigin(origin))res.setHeader('access-control-allow-origin',origin);res.setHeader('vary','Origin');res.setHeader('content-type','application/json; charset=utf-8');res.status(status).json(payload)}
function outputText(data){if(typeof data?.output_text==='string')return data.output_text.trim();for(const item of data?.output||[])for(const content of item?.content||[])if(content?.type==='output_text'&&content.text)return String(content.text).trim();return''}

export function createGuideHandler({fetchImpl=fetch,apiKey=process.env.OPENAI_API_KEY,model=process.env.OPENAI_MODEL||'gpt-4.1-mini'}={}){return async function handler(req,res){
 const origin=String(req.headers.origin||'');
 if(req.method==='OPTIONS'){if(!allowedOrigin(origin))return send(res,403,{error:'허용되지 않은 출처입니다.'},origin);res.setHeader('access-control-allow-origin',origin);res.setHeader('access-control-allow-methods','POST, OPTIONS');res.setHeader('access-control-allow-headers','content-type');res.setHeader('vary','Origin');return res.status(204).end()}
 if(req.method!=='POST')return send(res,405,{error:'POST 요청만 사용할 수 있습니다.'},origin);
 if(origin&&!allowedOrigin(origin))return send(res,403,{error:'허용되지 않은 출처입니다.'},origin);
 if(Number(req.headers['content-length']||0)>10000)return send(res,413,{error:'질문이 너무 깁니다.'},origin);
 let body=req.body||{};if(typeof body==='string')try{body=JSON.parse(body)}catch{return send(res,400,{error:'올바른 JSON 요청이 아닙니다.'},origin)}
 const question=normalizeGuideQuestion(body.question),room=normalizeGuideRoom(body.room);
 if(!question)return send(res,400,{error:'질문을 입력해 주세요.'},origin);
 if(containsSensitiveData(question))return send(res,400,{error:'개인정보로 보이는 내용을 삭제해 주세요.'},origin);
 if(!apiKey)return send(res,503,{error:'GPT 연결이 아직 설정되지 않았습니다.'},origin);
 try{const response=await fetchImpl('https://api.openai.com/v1/responses',{method:'POST',headers:{authorization:`Bearer ${apiKey}`,'content-type':'application/json'},body:JSON.stringify({model,max_output_tokens:320,input:[{role:'system',content:[{type:'input_text',text:GUIDE_SYSTEM_PROMPT}]},{role:'user',content:[{type:'input_text',text:`현재 공간: ${room}\n질문: ${question}`}]}]})});const data=await response.json();if(!response.ok)throw new Error(`OpenAI ${response.status}`);const answer=outputText(data);if(!answer)throw new Error('Empty response');return send(res,200,{answer},origin)}catch(error){console.error('GPT guide request failed:',error.message);return send(res,502,{error:'GPT 답변을 불러오지 못했습니다.'},origin)}
 }}
export default createGuideHandler();

