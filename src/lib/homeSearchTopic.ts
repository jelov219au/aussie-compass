const searchTopics = [
  { topic: "tax", terms: ["세금", "택스", "tax", "tfn", "ato", "bas", "gst", "공제", "환급"] },
  { topic: "pay", terms: ["급여", "월급", "시급", "연봉", "임금", "salary", "wage", "payslip", "최저임금"] },
  { topic: "super", terms: ["super", "연금", "dasp"] },
  { topic: "housing", terms: ["집", "주거", "렌트", "쉐어", "보증금", "rent", "bond", "inspection"] },
  { topic: "jobs", terms: ["취업", "구직", "이력서", "이력서 양식", "공고 맞춤", "커버레터", "면접", "일자리", "resume", "resume template", "ATS", "job ad", "cover letter", "selection criteria", "job", "career", "award"] },
  { topic: "arrival", terms: ["도착", "정착", "은행", "유심", "교통", "운전", "bank", "sim", "licence"] },
  { topic: "visa", terms: ["비자", "워홀", "학생", "visa", "working holiday"] },
  { topic: "safety", terms: ["사기", "안전", "응급", "도움", "체불", "scam", "emergency", "underpayment"] },
  { topic: "leaving", terms: ["귀국", "출국", "퇴거", "leaving", "departure"] },
] as const;

export function classifyHomeSearch(value: string) {
  const normalized = value.trim().toLocaleLowerCase("ko-KR");
  // Explicit car intent must not match career or a home inspection.
  if (/중고\s*차|차량\s*(?:구매|검사|비교)|자동차\s*구매|\b(?:used[- ]cars?|buy(?:ing)?(?: a)? car|car inspection|ppsr|carsales)\b/iu.test(normalized)) return "used_car";
  return searchTopics.find(({ terms }) => terms.some((term) => normalized.includes(term)))?.topic ?? "other";
}
