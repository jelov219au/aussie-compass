export type Article = {
  slug: string;
  title: string;
  description: string;
  category: string;
  readingTime: string;
  toolHref: string;
  toolLabel: string;
  sections: Array<{ heading: string; paragraphs?: string[]; bullets?: string[] }>;
};

export const articles: Article[] = [
  {
    slug: "australia-job-search-plan",
    title: "호주 구직, 지원서를 꾸준히 관리하는 방법",
    description: "공고 저장부터 지원, 후속 연락과 면접 준비까지 놓치지 않는 간단한 구직 루틴을 소개합니다.",
    category: "호주 취업",
    readingTime: "5분",
    toolHref: "/job-application-tracker",
    toolLabel: "구직 지원 트래커 사용하기",
    sections: [
      { heading: "지원 건수보다 다음 행동이 중요합니다", paragraphs: ["여러 공고에 지원하다 보면 어느 회사에 어떤 이력서를 보냈는지 쉽게 잊게 됩니다. 회사명과 직무뿐 아니라 다음에 해야 할 행동을 함께 기록하면 구직 활동이 막연한 기다림에서 관리 가능한 프로젝트로 바뀝니다."] },
      { heading: "공고를 발견했을 때 기록할 항목", bullets: ["회사명과 정확한 직무명", "공고 원문 링크와 마감일", "지원에 사용할 이력서 버전", "담당자 이름이나 연락처가 공개된 경우 해당 정보", "공고에서 반복되는 핵심 역량과 표현"] },
      { heading: "지원 후에는 날짜를 정하세요", paragraphs: ["지원 완료만 기록하고 끝내기보다 결과를 확인할 날짜나 후속 연락을 검토할 날짜를 정하세요. 면접이 잡히면 장소, 준비 자료와 질문 목록을 메모해 두는 것이 좋습니다."], bullets: ["지원 당일: 공고와 제출 자료 보관", "면접 전: 회사와 직무 조사", "면접 후: 감사 연락과 답변 복기", "결과 수신 후: 다음 지원에 적용할 개선점 기록"] },
      { heading: "개인정보는 필요한 만큼만", paragraphs: ["구직 기록에는 민감한 신분증 번호, 여권 정보, 비자 문서 원본을 저장하지 않는 편이 안전합니다. Aussie Compass 트래커는 입력 내용을 서버로 보내지 않고 현재 브라우저에만 저장합니다."] },
    ],
  },
  {
    slug: "english-resume-achievement-examples",
    title: "호주 영문 이력서에서 경력을 성과로 바꾸는 법",
    description: "단순 업무 나열을 구체적이고 읽기 쉬운 영문 성과 문장으로 바꾸는 기본 공식을 확인하세요.",
    category: "영문 이력서",
    readingTime: "6분",
    toolHref: "/resume-builder",
    toolLabel: "영문 이력서 만들기",
    sections: [
      { heading: "업무보다 행동과 결과를 보여주세요", paragraphs: ["Responsible for customer service처럼 책임만 적으면 지원자의 강점이 잘 드러나지 않습니다. 무엇을 했고, 어떤 환경에서, 어떤 결과를 만들었는지를 한 문장에 담아 보세요."] },
      { heading: "문장 기본 공식", bullets: ["강한 동사로 시작: Delivered, Managed, Prepared, Trained, Resolved", "업무의 대상이나 규모 추가", "가능하면 숫자나 빈도 포함", "팀이나 고객에게 생긴 긍정적인 결과 설명"] },
      { heading: "업무별 예시", bullets: ["Delivered friendly service to more than 100 customers per shift.", "Prepared high-volume coffee orders while maintaining quality and presentation.", "Trained new team members in POS and closing procedures.", "Resolved customer requests promptly and professionally.", "Maintained accurate stock records and reduced avoidable waste."] },
      { heading: "숫자를 억지로 만들 필요는 없습니다", paragraphs: ["정확한 수치를 모르면 만들어 내지 마세요. high-volume, during busy periods, consistently처럼 사실에 맞는 범위에서 업무 환경과 일관성을 설명할 수 있습니다. 면접에서 구체적으로 설명할 수 있는 내용만 이력서에 넣는 것이 중요합니다."] },
    ],
  },
  {
    slug: "emergency-fund-australia-guide",
    title: "호주 생활 비상금 목표를 정하는 현실적인 방법",
    description: "월 생활비를 기준으로 비상금 목표를 세우고 부담 없는 주기로 꾸준히 모으는 방법을 설명합니다.",
    category: "저축과 생활비",
    readingTime: "5분",
    toolHref: "/savings-goal-calculator",
    toolLabel: "비상금 프로젝트 시작하기",
    sections: [
      { heading: "비상금은 예상하지 못한 비용을 위한 돈입니다", paragraphs: ["차량 수리, 갑작스러운 이동, 의료비나 일시적인 소득 감소처럼 미리 계획하기 어려운 상황에 대비하는 별도 자금입니다. 일상 소비나 예정된 여행 비용과 분리하면 필요할 때 판단하기 쉽습니다."] },
      { heading: "먼저 한 달의 필수 생활비를 계산하세요", bullets: ["주거비와 공과금", "기본 식료품", "출퇴근 교통비", "보험과 필수 의료비", "최소 통신비와 정기 결제"] },
      { heading: "목표는 단계적으로", paragraphs: ["처음부터 큰 금액을 목표로 하면 시작하기 어려울 수 있습니다. 1차로 작은 완충 자금을 만들고, 이후 한 달치 필수 지출, 마지막으로 여러 달을 버틸 수 있는 금액으로 확장해 보세요. MoneySmart는 일반적인 목표로 약 3개월치 지출을 안내합니다."] },
      { heading: "꾸준함을 만드는 방법", bullets: ["급여일 직후 자동 이체 설정", "생활비 계좌와 분리", "매주 또는 격주로 완료 기록", "목표의 25%·50%·75% 지점 확인", "예상치 못한 인출 후에도 다시 시작"] },
    ],
  },
];

export function getArticle(slug: string) { return articles.find((article) => article.slug === slug); }
