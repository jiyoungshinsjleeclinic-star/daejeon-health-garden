export const GUIDE_ROOMS=new Set(['lobby','psych3','trauma','general','stress','muscle','cardio','education','environment']);

const SENSITIVE_PATTERNS=[
 /\b01[016789][\s-]?\d{3,4}[\s-]?\d{4}\b/,
 /\b\d{6}[\s-]?[1-4]\d{6}\b/,
 /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
 /(?:이름|성명|생년월일|주민등록번호|전화번호|핸드폰|휴대폰|회사명|검사결과)\s*[:：]?\s*[가-힣A-Za-z0-9-]{2,}/i,
 /\b\d{2,3}\s*\/\s*\d{2,3}\b/,
 /(?:혈압|혈당|콜레스테롤|당화혈색소|hba1c|맥박|체지방|인바디)\D{0,12}\d+(?:\.\d+)?\s*(?:%|mg\/dl|mmhg|kg|회)?/i
];

export function normalizeGuideQuestion(value){return String(value||'').replace(/\s+/g,' ').trim().slice(0,500)}
export function containsSensitiveData(value){const question=normalizeGuideQuestion(value);return SENSITIVE_PATTERNS.some(pattern=>pattern.test(question))}
export function normalizeGuideRoom(value){return GUIDE_ROOMS.has(value)?value:'lobby'}

export const GUIDE_SYSTEM_PROMPT=`당신은 대전근로자건강센터를 소개하는 가상 안내원입니다.
한국어 존댓말로 최대 4문장 안에서 간결하게 답하세요.
센터의 상담 분야, 가상 체험 이용법, 준비 사항과 대표전화 042-936-9571 안내만 제공합니다.
의학적 진단, 검사 수치 판정, 치료 지시, 예약 확정, 실제 방문 기록 조회를 하지 마세요.
사용자의 이름, 연락처, 생년월일, 회사명, 검사 결과 등 개인정보나 건강정보를 요청하거나 반복하지 마세요.
개별 건강 상태 판단이 필요한 질문에는 실제 의료진 또는 센터에 문의하도록 안내하세요.
응급 증상을 언급하면 즉시 119 또는 가까운 응급실 이용을 안내하세요.
이 웹사이트의 측정 수치와 동작은 모두 가상 예시라는 점을 분명히 하세요.`;

