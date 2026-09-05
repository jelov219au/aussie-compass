export type PhraseCategory = "essential" | "bank" | "home" | "work" | "health";

export type Phrase = {
  id: string;
  category: PhraseCategory;
  context: string;
  english: string;
  korean: string;
};



export const categories: Array<{ id: PhraseCategory | "saved" | "all"; label: string }> = [
  { id: "all", label: "전체 문장" },
  { id: "essential", label: "먼저 외울 문장" },
  { id: "bank", label: "은행·휴대폰" },
  { id: "home", label: "집·렌트" },
  { id: "work", label: "직장·급여" },
  { id: "health", label: "병원·약국" },
  { id: "saved", label: "저장한 문장" },
];

export const phrases: Phrase[] = [
  { id: "slowly", category: "essential", context: "말이 너무 빠를 때", english: "Sorry, could you say that more slowly?", korean: "죄송하지만 조금 천천히 말씀해 주실 수 있나요?" },
  { id: "different-way", category: "essential", context: "다른 설명이 필요할 때", english: "Could you say that in a different way?", korean: "다른 표현으로 설명해 주실 수 있나요?" },
  { id: "write-down", category: "essential", context: "숫자나 이름을 적어 달라고 할 때", english: "Could you write that down for me?", korean: "그 내용을 적어 주실 수 있나요?" },
  { id: "understood", category: "essential", context: "내가 이해한 내용을 확인할 때", english: "Let me check if I understood correctly.", korean: "제가 제대로 이해했는지 확인해 볼게요." },
  { id: "next-step", category: "essential", context: "다음 행동을 물을 때", english: "What do I need to do next?", korean: "제가 다음으로 무엇을 해야 하나요?" },
  { id: "bank-id", category: "bank", context: "계좌 개설 서류", english: "I’d like to open a transaction account. What ID do I need?", korean: "거래 계좌를 만들고 싶은데 어떤 신분증이 필요한가요?" },
  { id: "bank-fees", category: "bank", context: "계좌 수수료", english: "Are there any monthly, ATM or international transaction fees?", korean: "월 관리비, ATM 또는 해외 결제 수수료가 있나요?" },
  { id: "bank-id-check", category: "bank", context: "신원 확인", english: "Do I need to visit a branch to finish the ID check?", korean: "신원 확인을 끝내려면 지점에 가야 하나요?" },
  { id: "bank-details", category: "bank", context: "계좌 정보", english: "Could you show me where to find my BSB and account number?", korean: "BSB와 계좌번호를 어디에서 확인하는지 보여주실 수 있나요?" },
  { id: "bank-transaction", category: "bank", context: "모르는 거래", english: "I didn’t authorise this transaction. What should I do now?", korean: "제가 승인하지 않은 거래인데 지금 무엇을 해야 하나요?" },
  { id: "rent-inclusions", category: "home", context: "렌트비 포함 항목", english: "Is electricity, gas, water or internet included in the rent?", korean: "전기, 가스, 수도나 인터넷이 렌트비에 포함되나요?" },
  { id: "rent-bond", category: "home", context: "Bond 접수", english: "Who will hold the bond, and how will it be lodged?", korean: "Bond는 누가 보관하고 어떤 방식으로 접수하나요?" },
  { id: "rent-agreement", category: "home", context: "송금 전 계약서", english: "Could you send me the agreement before I pay anything?", korean: "돈을 보내기 전에 계약서를 보내주실 수 있나요?" },
  { id: "rent-condition", category: "home", context: "입주 상태 기록", english: "Could you confirm you received my condition report and photos?", korean: "Condition Report와 사진을 받았는지 확인해 주실 수 있나요?" },
  { id: "rent-notice", category: "home", context: "퇴거 통지", english: "How much notice do I need to give before moving out?", korean: "퇴거 전에 얼마 동안의 통지를 해야 하나요?" },
  { id: "work-rate", category: "work", context: "시급과 등급", english: "Could you confirm my hourly rate and classification in writing?", korean: "시급과 Classification을 글로 확인해 주실 수 있나요?" },
  { id: "work-payslip", category: "work", context: "Payslip 발급", english: "When should I receive my payslip?", korean: "Payslip은 언제 받게 되나요?" },
  { id: "work-hours", category: "work", context: "근무시간과 휴게시간", english: "Which hours and breaks are included here?", korean: "여기에 어떤 근무시간과 휴게시간이 포함됐나요?" },
  { id: "work-difference", category: "work", context: "Roster와 Payslip 차이", english: "I think there may be a difference between my roster and payslip. Could we check it together?", korean: "Roster와 Payslip에 차이가 있는 것 같은데 같이 확인해 볼 수 있을까요?" },
  { id: "work-payroll", category: "work", context: "급여 문의 담당자", english: "Who should I contact if I have a payroll question?", korean: "급여 질문은 누구에게 연락해야 하나요?" },
  { id: "health-interpreter", category: "health", context: "통역 요청", english: "I need a Korean interpreter, please.", korean: "한국어 통역이 필요합니다." },
  { id: "health-form", category: "health", context: "양식 설명", english: "I don’t understand this form. Could you explain this section?", korean: "이 양식을 이해하지 못했는데 이 부분을 설명해 주실 수 있나요?" },
  { id: "health-worse", category: "health", context: "증상이 심해질 때", english: "What should I do if my symptoms get worse?", korean: "증상이 심해지면 어떻게 해야 하나요?" },
  { id: "health-medicine", category: "health", context: "약 이름과 복용법", english: "Could you write down the medicine name and instructions?", korean: "약 이름과 복용 방법을 적어 주실 수 있나요?" },
  { id: "health-avoid", category: "health", context: "복용 중 주의사항", english: "Is there anything I should avoid while taking this medicine?", korean: "이 약을 복용하는 동안 피해야 할 것이 있나요?" },
  {"id":"phone-number","category":"bank","context":"호주 번호·문자 수신","english":"Does this plan include an Australian mobile number and incoming calls and SMS?","korean":"이 요금제에는 호주 휴대전화 번호와 전화·문자 수신이 포함되나요?"},
  {"id":"phone-renewal","category":"bank","context":"다음 자동충전 확인","english":"When is the next recharge, and what will it cost after the promotion ends?","korean":"다음 충전일은 언제이며 할인 기간이 끝나면 얼마인가요?"},
  {"id":"phone-port","category":"bank","context":"기존 번호 유지","english":"I want to keep my current number. What do I need to do before the transfer?","korean":"현재 번호를 유지하고 싶은데 번호 이동 전에 무엇을 해야 하나요?"},
  {"id":"written-confirmation","category":"essential","context":"다음 조치와 날짜를 서면으로 확인","english":"Could you send the agreed next steps and date in writing?","korean":"합의한 다음 조치와 날짜를 글로 보내주실 수 있나요?"},
  {"id":"reference-number","category":"essential","context":"문의 접수번호 받기","english":"Could I have the reference number for this enquiry?","korean":"이 문의의 접수번호를 알려주실 수 있나요?"},
];


export function findPhrases(category: PhraseCategory | "saved" | "all", query: string, savedIds: string[]) {
  const term = query.trim().toLocaleLowerCase();
  return phrases.filter(phrase => (category === "saved" ? savedIds.includes(phrase.id) : category === "all" || phrase.category === category) && (!term || (phrase.context + " " + phrase.english + " " + phrase.korean).toLocaleLowerCase().includes(term)));
}
export function parseSavedPhrases(raw: string): string[] | null {
  try { const value: unknown = JSON.parse(raw); if (!Array.isArray(value) || value.length > phrases.length || value.some(id => typeof id !== "string" || !phrases.some(phrase => phrase.id === id)) || new Set(value).size !== value.length) return null; return value; } catch { return null; }
}
export const serializeSavedPhrases = (ids: string[]) => { const raw = JSON.stringify(ids); return parseSavedPhrases(raw) ? raw : null; };
