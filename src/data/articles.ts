export type Article = {
  slug: string;
  title: string;
  description: string;
  category: string;
  readingTime: string;
  toolHref: string;
  toolLabel: string;
  sections: Array<{ heading: string; paragraphs?: string[]; bullets?: string[] }>;
  sources?: Array<{ label: string; href: string }>;
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
      { heading: "개인정보는 필요한 만큼만", paragraphs: ["구직 기록에는 민감한 신분증 번호, 여권 정보, 비자 문서 원본을 저장하지 않는 편이 안전합니다. Hoju Compass 트래커는 입력 내용을 서버로 보내지 않고 현재 브라우저에만 저장합니다."] },
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
    sources: [{ label: "MoneySmart — Save for an emergency fund", href: "https://moneysmart.gov.au/saving/save-for-an-emergency-fund" }],
  },
  {
    slug: "first-payslip-checklist-australia",
    title: "호주 첫 Payslip, 10분 안에 확인할 항목",
    description: "첫 급여가 들어왔을 때 근무시간, 시급, Casual Loading, 세금과 Super를 차근차근 대조하는 방법입니다.",
    category: "급여 확인",
    readingTime: "6분",
    toolHref: "/payslip-guide",
    toolLabel: "Payslip 항목 확인하기",
    sections: [
      { heading: "통장 금액만 확인하면 놓치는 것이 있습니다", paragraphs: ["은행에 입금된 금액은 세금과 공제 후 금액인 Net Pay입니다. 정확한 급여를 확인하려면 Payslip의 근무기간, 시급, 시간, Loading과 Penalty, 공제 내역을 실제 근무 기록과 함께 봐야 합니다."] },
      { heading: "가장 먼저 볼 기본 정보", bullets: ["내 이름과 고용주 이름·ABN", "급여 지급일과 Pay period", "Gross Pay와 Net Pay", "기본 시급과 계산된 근무시간", "Casual Loading, 주말·공휴일 Penalty, Allowance가 별도로 표시됐는지", "PAYG 원천징수와 Super 정보"] },
      { heading: "내 기록과 한 줄씩 대조하세요", paragraphs: ["로스터와 출퇴근 기록을 열고 일반 근무, 주말, 공휴일, 휴식시간을 나눠 Payslip과 비교하세요. 첫 급여부터 같은 방식으로 확인하면 반복되는 누락을 빠르게 발견할 수 있습니다."], bullets: ["Roster 또는 근무시간 캡처 보관", "계약서의 고용 형태와 시급 확인", "적용 Award와 Classification 확인", "Payslip PDF와 실제 입금 내역 함께 보관"] },
      { heading: "차이가 있다면 먼저 사실을 정리하세요", paragraphs: ["누락된 날짜와 시간, 예상 시급, Payslip에 표시된 금액을 표로 정리한 뒤 고용주나 Payroll 담당자에게 서면으로 문의하세요. 해결되지 않으면 Fair Work Ombudsman의 공식 안내를 확인할 수 있습니다. Payslip은 급여일로부터 1 working day 이내에 제공돼야 합니다."] },
    ],
    sources: [{ label: "Fair Work Ombudsman — Pay slips and record-keeping", href: "https://www.fairwork.gov.au/pay-and-wages/paying-wages/pay-slips" }],
  },
  {
    slug: "australia-rental-scam-red-flags",
    title: "호주 렌트·쉐어하우스 계약 전 사기 신호 9가지",
    description: "집을 직접 확인하기 전에 보증금이나 개인정보를 요구받았을 때 점검할 위험 신호와 안전한 확인 순서를 정리합니다.",
    category: "집 구하기",
    readingTime: "7분",
    toolHref: "/property-inspection-checklist",
    toolLabel: "집 방문 체크리스트 열기",
    sections: [
      { heading: "급한 마음을 이용하는 제안을 경계하세요", paragraphs: ["집이 부족하거나 입주일이 가까우면 확인 전에 돈부터 보내고 싶어질 수 있습니다. 하지만 실제 주소가 존재한다는 사실만으로 게시자가 그 집을 빌려줄 권한이 있다는 뜻은 아닙니다."] },
      { heading: "멈추고 확인해야 할 신호", bullets: ["집을 보여주지 못한다며 선입금을 요구함", "시세보다 지나치게 저렴하고 오늘 바로 결정하라고 재촉함", "해외 체류 중이라며 열쇠를 택배로 보내겠다고 함", "계약 상대의 이름과 입금 계좌 명의가 다름", "주소나 사진을 검색했더니 다른 가격·연락처의 광고가 나옴", "정식 계약 내용 없이 현금이나 송금 서비스만 요구함", "검증 전 여권 전체 사본이나 은행 정보를 이메일로 요구함", "수리·공과금·Bond 부담 주체를 적어주지 않음", "질문에 답하지 않고 메시지를 다른 앱으로 옮기려 함"] },
      { heading: "돈을 보내기 전 확인 순서", bullets: ["가능하면 직접 방문하고 내부와 열쇠 접근을 확인", "주소, 게시자 이름, 이메일과 사진을 각각 검색", "임대인·에이전트·기존 세입자 중 누구와 계약하는지 확인", "주세와 공과금, Bond, 최소 거주기간, 퇴거 통지를 서면으로 받기", "해당 주의 Bond 납부·등록 절차와 영수증 확인", "송금 전 계약 상대와 계좌 명의를 다시 대조"] },
      { heading: "신분증은 필요한 범위만 제출하세요", paragraphs: ["렌트 신청 과정에서 신원 확인 자료가 필요할 수 있지만, 상대방과 절차를 검증하기 전에 민감한 전체 문서를 보내지는 마세요. TFN, 은행 비밀번호, 카드 보안번호는 주거 계약 확인에 필요하지 않습니다. 의심스러운 광고나 송금 피해는 Scamwatch와 해당 결제기관에 신속히 알리세요."] },
    ],
    sources: [{ label: "Scamwatch — Looking for rental properties online?", href: "https://www.scamwatch.gov.au/about-us/news-and-alerts/looking-for-rental-properties-online-watch-out-for-scams" }],
  },
  {
    slug: "used-car-ppsr-purchase-day-checklist",
    title: "호주 중고차 구매 당일, PPSR부터 송금까지",
    description: "개인 판매자에게 중고차를 살 때 VIN, PPSR, 등록 상태와 영수증을 어떤 순서로 확인할지 정리합니다.",
    category: "차량 구매",
    readingTime: "7분",
    toolHref: "/used-car-comparison",
    toolLabel: "중고차 첫 1년 비용 비교하기",
    sections: [
      { heading: "광고 가격이 전체 비용은 아닙니다", paragraphs: ["차량 가격 외에도 등록 이전 비용, 보험, Rego, 정비, 타이어와 연료비가 필요합니다. 후보를 비교할 때는 구매가가 아니라 첫 1년 총비용을 함께 보는 편이 안전합니다."] },
      { heading: "PPSR은 번호판이 아니라 VIN으로 검색합니다", paragraphs: ["호주 정부 PPSR 차량 검색은 금융 이해관계가 등록돼 있는지 확인하고, 도난 또는 폐차 기록 정보가 함께 표시될 수 있습니다. 온라인 self-service 검색 비용은 현재 A$2이며, 결과 인증서는 보관해 두세요."], bullets: ["차체와 등록 서류의 VIN이 같은지 직접 대조", "구매 당일 또는 하루 전에 최신 PPSR 검색", "검색 결과의 make, model, colour가 차량과 맞는지 확인", "인증서 파일과 검색 시간을 보관"] },
      { heading: "PPSR만으로 확인되지 않는 것", bullets: ["정확한 미상환 금융 금액", "이전 소유자 전체 기록", "주행거리 조작 여부", "미납 벌금", "엔진·변속기·차체의 실제 상태"] },
      { heading: "송금 전 마지막 순서", paragraphs: ["PPSR과 별도로 독립적인 사전 점검을 받고, 해당 주의 공식 등록 조회와 명의이전 절차를 확인하세요. 판매자 신원, VIN, 차량 가격, 날짜가 들어간 영수증을 준비하고 실제 차량과 열쇠를 인수하는 흐름에 맞춰 결제하세요."], bullets: ["보험 시작 시점을 차량 인수 전에 맞추기", "명의이전 책임과 제출 기한 확인", "예비 열쇠와 정비 기록 인수", "광고, 대화, 영수증과 PPSR 인증서 백업"] },
    ],
    sources: [{ label: "Australian Government PPSR — Do a used car or vehicle search", href: "https://www.ppsr.gov.au/searching/do-used-car-or-vehicle-search" }],
  },
];

export function getArticle(slug: string) { return articles.find((article) => article.slug === slug); }
