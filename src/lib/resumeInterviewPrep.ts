export type InterviewQuestion = {
  id: string;
  focus: string;
  question: string;
  prompt: string;
};

export type StarDraft = {
  competency: string;
  situation: string;
  task: string;
  action: string;
  result: string;
};

type InterviewQuestionInput = {
  company: string;
  role: string;
  keywords: string[];
};

function cleanInline(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function sentence(value: string) {
  const cleaned = cleanInline(value);
  if (!cleaned) return "";
  return /[.!?]$/.test(cleaned) ? cleaned : `${cleaned}.`;
}

export function buildInterviewQuestions({ company, role, keywords }: InterviewQuestionInput): InterviewQuestion[] {
  const companyName = cleanInline(company);
  const roleName = cleanInline(role);
  const rolePhrase = roleName
    ? `the ${roleName} role${companyName ? ` at ${companyName}` : ""}`
    : companyName
      ? `this role at ${companyName}`
      : "this role";
  const focusWords = keywords.filter(Boolean).slice(0, 3);
  const evidencePrompts = [
    "실제 경험 하나를 골라 상황과 내가 한 행동을 구분해서 적어보세요.",
    "업무에서 이 역량을 어떻게 사용했고 무엇이 달라졌는지 정리해보세요.",
    "문제가 생겼을 때 판단한 기준과 결과를 숫자나 변화로 설명해보세요.",
  ];
  const evidenceQuestions = focusWords.map((keyword, index) => ({
    id: `evidence-${index + 1}`,
    focus: keyword,
    question: index === 0
      ? `Can you tell us about a time you demonstrated ${keyword}?`
      : index === 1
        ? `How have you used ${keyword} in your previous work?`
        : `Describe a challenging situation where ${keyword} was important. What did you do?`,
    prompt: evidencePrompts[index],
  }));

  return [
    {
      id: "motivation",
      focus: "지원 동기",
      question: `Tell us about yourself and why you are interested in ${rolePhrase}.`,
      prompt: "경력 전체를 나열하기보다 이 직무와 연결되는 경험, 강점, 지원 이유를 60~90초 분량으로 정리해보세요.",
    },
    ...evidenceQuestions,
    {
      id: "first-weeks",
      focus: "입사 후 적응",
      question: `How would you approach your first few weeks in ${roleName ? `the ${roleName} role` : "this role"}?`,
      prompt: "업무 파악, 팀과의 소통, 안전·절차 확인처럼 실제로 먼저 할 행동을 순서대로 적어보세요.",
    },
    {
      id: "candidate-question",
      focus: "마지막 질문",
      question: `What would you like to ask us about ${companyName || "the team and the role"}?`,
      prompt: "교육 방식, 첫 3개월의 기대치, 팀 구성처럼 합격 전 확인하고 싶은 질문을 2개 준비하세요.",
    },
  ];
}

export function composeStarAnswer(star: StarDraft) {
  const parts = [
    star.situation ? `Situation: ${sentence(star.situation)}` : "",
    star.task ? `Task: ${sentence(star.task)}` : "",
    star.action ? `Action: ${sentence(star.action)}` : "",
    star.result ? `Result: ${sentence(star.result)}` : "",
  ].filter(Boolean);
  return parts.join("\n");
}

export function hasStarContent(star: StarDraft) {
  return Boolean(star.situation.trim() || star.task.trim() || star.action.trim() || star.result.trim());
}
