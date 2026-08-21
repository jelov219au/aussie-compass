export const jobMoveSurveyQuestions = [
  {
    id: "jobSearchStatus",
    prompt: "최근 3개월 동안 호주에서 새로운 일자리를 알아본 상태는 무엇인가요?",
    options: ["실제로 지원했다", "지원할 준비를 하고 있다", "채용공고만 확인했다", "최근에는 알아보지 않았다"],
  },
  {
    id: "jobType",
    prompt: "현재 또는 가장 최근에 알아본 일자리 유형은 무엇인가요?",
    options: ["한국어 중심의 한인잡", "영어를 사용하는 현지 소규모 업체", "호텔·리테일·물류·사무직 등 회사 단위의 직장", "현재 구직 중이 아니다", "기타 유형"],
  },
  {
    id: "hardestPart",
    prompt: "새로운 일자리를 준비하면서 가장 어려운 부분은 무엇인가요?",
    options: ["채용공고와 내 경력을 연결하는 것", "한국에서의 경력을 자연스러운 영어로 설명하는 것", "이력서에 넣을 성과 문장을 만드는 것", "면접에서 사용할 실제 경력 사례를 정리하는 것", "현재 직장과 새 직장의 조건을 비교하는 것", "특별히 어려운 부분이 없다"],
  },
  {
    id: "mostUsefulResult",
    prompt: "다음 중 실제 지원 전에 가장 받아보고 싶은 결과물은 무엇인가요?",
    options: ["채용공고 요구사항과 내 경력의 근거 매칭표", "내 경력을 바탕으로 만든 이력서 성과 문장", "내 경험을 바탕으로 만든 면접 답변 사례", "지원할 직무에 맞춘 예상 질문과 답변 방향", "현재 직장과 지원할 직장의 조건 비교표", "필요한 결과물이 없다"],
  },
  {
    id: "aiDifference",
    prompt: "위 결과물이 일반적인 무료 AI 답변과 비교해 얼마나 차이가 있을 것 같나요?",
    options: ["분명한 차이가 있을 것 같다", "어느 정도 차이가 있을 것 같다", "별다른 차이가 없을 것 같다", "무료 AI를 사용하지 않아 잘 모르겠다"],
  },
  {
    id: "purchaseLikelihood",
    prompt: "채용공고와 경력을 입력하면 3일 이내에 근거 매칭표, 이력서 문장, 맞춤 면접 자료를 제공하는 서비스가 A$19.90이라면 구매 가능성은 어느 정도인가요?",
    options: ["0–3점 · 구매하지 않을 가능성이 높다", "4–6점 · 상황에 따라 고려할 수 있다", "7–8점 · 실제 지원할 때 구매할 가능성이 있다", "9–10점 · 지금 필요한 공고가 있다면 구매할 가능성이 높다"],
  },
  {
    id: "purchaseBlocker",
    prompt: "구매를 망설이게 하는 가장 큰 이유는 무엇인가요?",
    options: ["무료 AI로도 충분할 것 같다", "가격이 부담된다", "경력과 채용공고를 입력하는 과정이 번거롭다", "결과물의 품질을 믿기 어렵다", "지금 당장 이직이나 구직이 급하지 않다", "특별한 장애 요인이 없다"],
  },
] as const;

export type JobMoveSurveyQuestionId = (typeof jobMoveSurveyQuestions)[number]["id"];
export type JobMoveSurveyAnswers = Record<JobMoveSurveyQuestionId, string>;

export function validateJobMoveSurveyAnswers(value: unknown): value is JobMoveSurveyAnswers {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;

  return jobMoveSurveyQuestions.every(
    (question) => typeof candidate[question.id] === "string" && (question.options as readonly string[]).includes(candidate[question.id] as string),
  );
}
