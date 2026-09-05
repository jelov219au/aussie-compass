export const visaCostFields = [
  { id: "application", label: "비자 신청비", hint: "Home Affairs Pricing Estimator에서 확인" },
  { id: "medical", label: "신체검사", hint: "Referral letter의 검사 코드로 예약 시 확인" },
  { id: "police", label: "경찰증명서", hint: "요청 국가와 발급·배송 비용" },
  { id: "translation", label: "번역·인증", hint: "비영문 문서와 요구 형식 확인" },
  { id: "biometrics", label: "생체정보", hint: "요청받은 경우 센터·이동 비용 포함" },
  { id: "insurance", label: "건강보험", hint: "해당 비자의 보험 조건 별도 확인" },
  { id: "advice", label: "전문가 도움", hint: "이용하는 경우 등록 여부와 서비스 범위 확인" },
  { id: "travel", label: "이동·기타", hint: "검사 장소 교통, 사진, 우편 등" },
];

export function parseVisaCostStorage(raw: string): Record<string, string> | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    if (Object.values(value).some((item) => typeof item !== "string")) return null;
    return value as Record<string, string>;
  } catch {
    return null;
  }
}

export function summarizeVisaCosts(values: Record<string, string>) {
  let totalCents = 0;
  let entered = 0;
  const errors: Record<string, string> = {};
  for (const { id } of visaCostFields) {
    const raw = (values[id] ?? "").trim();
    if (!raw) continue;
    const amount = Number(raw);
    const cents = Math.round(amount * 100);
    if (!/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(raw) || !Number.isSafeInteger(cents)) {
      errors[id] = "0 이상의 AUD 금액을 소수점 둘째 자리까지 입력하세요.";
      continue;
    }
    entered += 1;
    totalCents += cents;
  }
  return { total: totalCents / 100, entered, errors, totalValid: Number.isSafeInteger(totalCents) };
}
