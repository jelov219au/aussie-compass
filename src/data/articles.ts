export type Article = {
  slug: string;
  title: string;
  socialTitle: string;
  description: string;
  category: string;
  readingTime: string;
  publishedAt: string;
  updatedAt?: string;
  quickSummary: string[];
  toolHref: string;
  toolLabel: string;
  sections: Array<{ heading: string; paragraphs?: string[]; bullets?: string[] }>;
  sources?: Array<{ label: string; href: string; summary: string }>;
};

export type ArticleTopicId = "start" | "work" | "home" | "money";

export const articleTopicCategories: Record<ArticleTopicId, string[]> = {
  start: ["호주 취업", "영문 이력서", "도착 행정", "구직 안전"],
  work: ["급여 확인", "직장 권리", "고용 형태", "첫 직장"],
  home: ["집 구하기", "차량 구매"],
  money: ["저축과 생활비", "생활비"],
};

export const articles: Article[] = [
  {
    slug: "australia-job-search-plan",
    title: "호주 구직, 지원서를 꾸준히 관리하는 방법",
    socialTitle: "A practical Australian job search routine",
    description: "공고 저장부터 지원, 후속 연락과 면접 준비까지 놓치지 않는 간단한 구직 루틴을 소개합니다.",
    category: "호주 취업",
    readingTime: "5분",
    publishedAt: "2026-08-13",
    updatedAt: "2026-08-17",
    quickSummary: ["지원할 때 공고 원문과 제출한 이력서 버전을 함께 보관하기", "지원 완료와 다음 확인 날짜를 한 세트로 기록하기", "면접 결과와 개선점을 다음 지원서에 바로 반영하기"],
    toolHref: "/job-application-tracker",
    toolLabel: "구직 지원 트래커 사용하기",
    sections: [
      { heading: "지원 건수보다 다음 행동이 중요합니다", paragraphs: ["여러 공고에 지원하다 보면 어느 회사에 어떤 이력서를 보냈는지 쉽게 잊게 됩니다. 회사명과 직무뿐 아니라 다음에 해야 할 행동을 함께 기록하면 구직 활동이 막연한 기다림에서 관리 가능한 프로젝트로 바뀝니다."] },
      { heading: "공고를 발견했을 때 기록할 항목", bullets: ["회사명과 정확한 직무명", "공고 원문 링크와 마감일", "지원에 사용할 이력서 버전", "담당자 이름이나 연락처가 공개된 경우 해당 정보", "공고에서 반복되는 핵심 역량과 표현"] },
      { heading: "지원 후에는 날짜를 정하세요", paragraphs: ["지원 완료만 기록하고 끝내기보다 결과를 확인할 날짜나 후속 연락을 검토할 날짜를 정하세요. 면접이 잡히면 장소, 준비 자료와 질문 목록을 메모해 두는 것이 좋습니다."], bullets: ["지원 당일: 공고와 제출 자료 보관", "면접 전: 회사와 직무 조사", "면접 후: 감사 연락과 답변 복기", "결과 수신 후: 다음 지원에 적용할 개선점 기록"] },
      { heading: "개인정보는 필요한 만큼만", paragraphs: ["구직 기록에는 민감한 신분증 번호, 여권 정보, 비자 문서 원본을 저장하지 않는 편이 안전합니다. Hoju Compass 트래커는 입력 내용을 서버로 보내지 않고 현재 브라우저에만 저장합니다."] },
    ],
    sources: [
      { label: "Workforce Australia — Register to get started", href: "https://www.workforceaustralia.gov.au/individuals/coaching/how-to/introduction", summary: "구직 프로필, Job alert와 공고 저장 기능을 활용해 지원 과정을 관리하는 공식 고용서비스 안내입니다. Hoju Compass에서는 특정 정부 지원 의무와 무관하게 공고·지원일·다음 행동을 개인 기록으로 연결하는 방법을 설명합니다." },
      { label: "Fair Work Ombudsman — Workplace privacy", href: "https://www.fairwork.gov.au/tools-and-resources/best-practice-guides/workplace-privacy", summary: "이력서, 연락처, 추천인과 학력 기록도 개인정보에 해당할 수 있음을 설명합니다. 지원 기록을 관리할 때 여권·TFN·은행정보 같은 민감한 자료를 불필요하게 함께 저장하지 말아야 하는 근거가 됩니다." },
    ],
  },
  {
    slug: "english-resume-achievement-examples",
    title: "호주 영문 이력서에서 경력을 성과로 바꾸는 법",
    socialTitle: "Turn experience into resume achievements",
    description: "단순 업무 나열을 구체적이고 읽기 쉬운 영문 성과 문장으로 바꾸는 기본 공식을 확인하세요.",
    category: "영문 이력서",
    readingTime: "6분",
    publishedAt: "2026-08-13",
    updatedAt: "2026-08-17",
    quickSummary: ["책임을 나열하는 대신 행동과 결과를 한 문장에 담기", "강한 동사 뒤에 업무 규모·빈도·대상을 붙이기", "면접에서 설명할 수 없는 숫자나 성과는 만들지 않기"],
    toolHref: "/resume-builder",
    toolLabel: "영문 이력서 만들기",
    sections: [
      { heading: "업무보다 행동과 결과를 보여주세요", paragraphs: ["Responsible for customer service처럼 책임만 적으면 지원자의 강점이 잘 드러나지 않습니다. 무엇을 했고, 어떤 환경에서, 어떤 결과를 만들었는지를 한 문장에 담아 보세요."] },
      { heading: "문장 기본 공식", bullets: ["강한 동사로 시작: Delivered, Managed, Prepared, Trained, Resolved", "업무의 대상이나 규모 추가", "가능하면 숫자나 빈도 포함", "팀이나 고객에게 생긴 긍정적인 결과 설명"] },
      { heading: "업무별 예시", bullets: ["Delivered friendly service to more than 100 customers per shift.", "Prepared high-volume coffee orders while maintaining quality and presentation.", "Trained new team members in POS and closing procedures.", "Resolved customer requests promptly and professionally.", "Maintained accurate stock records and reduced avoidable waste."] },
      { heading: "숫자를 억지로 만들 필요는 없습니다", paragraphs: ["정확한 수치를 모르면 만들어 내지 마세요. high-volume, during busy periods, consistently처럼 사실에 맞는 범위에서 업무 환경과 일관성을 설명할 수 있습니다. 면접에서 구체적으로 설명할 수 있는 내용만 이력서에 넣는 것이 중요합니다."] },
    ],
    sources: [
      { label: "Workforce Australia — Resume planner", href: "https://www.workforceaustralia.gov.au/content/online-learning/course/what-needs-to-be-in-your-resume/assets/Resume%20planner.pdf", summary: "이력서에 경력뿐 아니라 기술, 교육, 자격과 실제 성취를 정리하도록 돕는 공식 작성 자료입니다. 각 경험을 지원 직무와 연결하고, 본인이 설명할 수 있는 구체적인 사례를 고르는 데 활용할 수 있습니다." },
      { label: "Fair Work Ombudsman — Recruitment application tips", href: "https://www.fairwork.gov.au/about-us/careers/our-recruitment-process", summary: "직무 설명에 맞춰 이력서를 조정하고, 역할의 기준을 다룰 때 구체적인 업무 사례를 제시하라는 지원 팁을 안내합니다. 한 기관의 채용 절차 예시이므로 모든 호주 고용주의 형식이 같다는 뜻은 아닙니다." },
    ],
  },
  {
    slug: "emergency-fund-australia-guide",
    title: "호주 생활 비상금 목표를 정하는 현실적인 방법",
    socialTitle: "Set a realistic emergency fund in Australia",
    description: "월 생활비를 기준으로 비상금 목표를 세우고 부담 없는 주기로 꾸준히 모으는 방법을 설명합니다.",
    category: "저축과 생활비",
    readingTime: "5분",
    publishedAt: "2026-08-13",
    updatedAt: "2026-08-17",
    quickSummary: ["여행비가 아니라 예상 밖의 필수 지출을 위한 별도 자금으로 보기", "한 달 필수 생활비를 먼저 계산한 뒤 목표를 단계적으로 키우기", "급여일 자동이체와 별도 계좌로 저축을 반복 가능한 습관으로 만들기"],
    toolHref: "/savings-goal-calculator",
    toolLabel: "비상금 프로젝트 시작하기",
    sections: [
      { heading: "비상금은 예상하지 못한 비용을 위한 돈입니다", paragraphs: ["차량 수리, 갑작스러운 이동, 의료비나 일시적인 소득 감소처럼 미리 계획하기 어려운 상황에 대비하는 별도 자금입니다. 일상 소비나 예정된 여행 비용과 분리하면 필요할 때 판단하기 쉽습니다."] },
      { heading: "먼저 한 달의 필수 생활비를 계산하세요", bullets: ["주거비와 공과금", "기본 식료품", "출퇴근 교통비", "보험과 필수 의료비", "최소 통신비와 정기 결제"] },
      { heading: "목표는 단계적으로", paragraphs: ["처음부터 큰 금액을 목표로 하면 시작하기 어려울 수 있습니다. 1차로 작은 완충 자금을 만들고, 이후 한 달치 필수 지출, 마지막으로 여러 달을 버틸 수 있는 금액으로 확장해 보세요. MoneySmart는 일반적인 목표로 약 3개월치 지출을 안내합니다."] },
      { heading: "꾸준함을 만드는 방법", bullets: ["급여일 직후 자동 이체 설정", "생활비 계좌와 분리", "매주 또는 격주로 완료 기록", "목표의 25%·50%·75% 지점 확인", "예상치 못한 인출 후에도 다시 시작"] },
    ],
    sources: [{ label: "MoneySmart — Save for an emergency fund", href: "https://moneysmart.gov.au/saving/save-for-an-emergency-fund", summary: "비상금 규모를 정하는 방법, 별도 저축계좌와 자동이체를 활용하는 방법을 안내합니다. Hoju Compass에서는 이를 호주 생활의 주거비·교통비·비자비처럼 실제 지출 항목에 맞춰 풀어 설명했습니다." }],
  },
  {
    slug: "first-payslip-checklist-australia",
    title: "호주 첫 Payslip, 10분 안에 확인할 항목",
    socialTitle: "Check your first Australian payslip",
    description: "첫 급여가 들어왔을 때 근무시간, 시급, Casual Loading, 세금과 Super를 차근차근 대조하는 방법입니다.",
    category: "급여 확인",
    readingTime: "6분",
    publishedAt: "2026-08-16",
    updatedAt: "2026-08-17",
    quickSummary: ["통장 입금액보다 Pay period·시급·시간·수당부터 대조하기", "로스터와 출퇴근 기록을 Payslip과 같은 기간으로 맞춰 보기", "차이가 있으면 날짜·시간·예상액을 표로 정리해 서면 문의하기"],
    toolHref: "/payslip-guide",
    toolLabel: "Payslip 항목 확인하기",
    sections: [
      { heading: "통장 금액만 확인하면 놓치는 것이 있습니다", paragraphs: ["은행에 입금된 금액은 세금과 공제 후 금액인 Net Pay입니다. 정확한 급여를 확인하려면 Payslip의 근무기간, 시급, 시간, Loading과 Penalty, 공제 내역을 실제 근무 기록과 함께 봐야 합니다."] },
      { heading: "가장 먼저 볼 기본 정보", bullets: ["내 이름과 고용주 이름·ABN", "급여 지급일과 Pay period", "Gross Pay와 Net Pay", "기본 시급과 계산된 근무시간", "Casual Loading, 주말·공휴일 Penalty, Allowance가 별도로 표시됐는지", "PAYG 원천징수와 Super 정보"] },
      { heading: "내 기록과 한 줄씩 대조하세요", paragraphs: ["로스터와 출퇴근 기록을 열고 일반 근무, 주말, 공휴일, 휴식시간을 나눠 Payslip과 비교하세요. 첫 급여부터 같은 방식으로 확인하면 반복되는 누락을 빠르게 발견할 수 있습니다."], bullets: ["Roster 또는 근무시간 캡처 보관", "계약서의 고용 형태와 시급 확인", "적용 Award와 Classification 확인", "Payslip PDF와 실제 입금 내역 함께 보관"] },
      { heading: "차이가 있다면 먼저 사실을 정리하세요", paragraphs: ["누락된 날짜와 시간, 예상 시급, Payslip에 표시된 금액을 표로 정리한 뒤 고용주나 Payroll 담당자에게 서면으로 문의하세요. 해결되지 않으면 Fair Work Ombudsman의 공식 안내를 확인할 수 있습니다. Payslip은 급여일로부터 1 working day 이내에 제공돼야 합니다."] },
    ],
    sources: [{ label: "Fair Work Ombudsman — Pay slips", href: "https://www.fairwork.gov.au/pay-and-wages/paying-wages/pay-slips", summary: "Payslip을 언제 받아야 하는지, 고용주·직원 정보와 시급·시간·수당·공제·Super 중 무엇이 표시돼야 하는지 확인할 수 있습니다. 공식 기준은 급여일로부터 1 working day 이내 제공입니다." }],
  },
  {
    slug: "australia-rental-scam-red-flags",
    title: "호주 렌트·쉐어하우스 계약 전 사기 신호 9가지",
    socialTitle: "Rental scam red flags before paying",
    description: "집을 직접 확인하기 전에 보증금이나 개인정보를 요구받았을 때 점검할 위험 신호와 안전한 확인 순서를 정리합니다.",
    category: "집 구하기",
    readingTime: "7분",
    publishedAt: "2026-08-16",
    updatedAt: "2026-08-17",
    quickSummary: ["방문이나 실시간 확인 전에 돈부터 요구하면 일단 멈추기", "주소·사진·게시자·계좌 명의를 서로 다른 경로로 교차 확인하기", "주세·공과금·Bond·퇴거 조건을 서면으로 받은 뒤 송금하기"],
    toolHref: "/property-inspection-checklist",
    toolLabel: "집 방문 체크리스트 열기",
    sections: [
      { heading: "급한 마음을 이용하는 제안을 경계하세요", paragraphs: ["집이 부족하거나 입주일이 가까우면 확인 전에 돈부터 보내고 싶어질 수 있습니다. 하지만 실제 주소가 존재한다는 사실만으로 게시자가 그 집을 빌려줄 권한이 있다는 뜻은 아닙니다."] },
      { heading: "멈추고 확인해야 할 신호", bullets: ["집을 보여주지 못한다며 선입금을 요구함", "시세보다 지나치게 저렴하고 오늘 바로 결정하라고 재촉함", "해외 체류 중이라며 열쇠를 택배로 보내겠다고 함", "계약 상대의 이름과 입금 계좌 명의가 다름", "주소나 사진을 검색했더니 다른 가격·연락처의 광고가 나옴", "정식 계약 내용 없이 현금이나 송금 서비스만 요구함", "검증 전 여권 전체 사본이나 은행 정보를 이메일로 요구함", "수리·공과금·Bond 부담 주체를 적어주지 않음", "질문에 답하지 않고 메시지를 다른 앱으로 옮기려 함"] },
      { heading: "돈을 보내기 전 확인 순서", bullets: ["가능하면 직접 방문하고 내부와 열쇠 접근을 확인", "주소, 게시자 이름, 이메일과 사진을 각각 검색", "임대인·에이전트·기존 세입자 중 누구와 계약하는지 확인", "주세와 공과금, Bond, 최소 거주기간, 퇴거 통지를 서면으로 받기", "해당 주의 Bond 납부·등록 절차와 영수증 확인", "송금 전 계약 상대와 계좌 명의를 다시 대조"] },
      { heading: "신분증은 필요한 범위만 제출하세요", paragraphs: ["렌트 신청 과정에서 신원 확인 자료가 필요할 수 있지만, 상대방과 절차를 검증하기 전에 민감한 전체 문서를 보내지는 마세요. TFN, 은행 비밀번호, 카드 보안번호는 주거 계약 확인에 필요하지 않습니다. 의심스러운 광고나 송금 피해는 Scamwatch와 해당 결제기관에 신속히 알리세요."] },
    ],
    sources: [{ label: "Scamwatch — Looking for rental properties online?", href: "https://www.scamwatch.gov.au/about-us/news-and-alerts/looking-for-rental-properties-online-watch-out-for-scams", summary: "실제 집 주소와 광고 사진을 도용하고, 집을 보여줄 수 없다며 선입금을 요구하는 전형적인 렌트 사기 수법을 설명합니다. 직접 Inspection, 주소·이름·이메일 검색, 송금 전 상대 확인이 핵심입니다." }],
  },
  {
    slug: "used-car-ppsr-purchase-day-checklist",
    title: "호주 중고차 구매 당일, PPSR부터 송금까지",
    socialTitle: "Used-car purchase day checklist",
    description: "개인 판매자에게 중고차를 살 때 VIN, PPSR, 등록 상태와 영수증을 어떤 순서로 확인할지 정리합니다.",
    category: "차량 구매",
    readingTime: "7분",
    publishedAt: "2026-08-16",
    updatedAt: "2026-08-17",
    quickSummary: ["차체와 등록 서류의 VIN을 먼저 일치시키기", "구매 당일 정부 PPSR 검색 결과와 인증서를 보관하기", "PPSR과 별도로 정비 상태·등록·보험·명의이전을 확인하기"],
    toolHref: "/used-car-comparison",
    toolLabel: "중고차 첫 1년 비용 비교하기",
    sections: [
      { heading: "광고 가격이 전체 비용은 아닙니다", paragraphs: ["차량 가격 외에도 등록 이전 비용, 보험, Rego, 정비, 타이어와 연료비가 필요합니다. 후보를 비교할 때는 구매가가 아니라 첫 1년 총비용을 함께 보는 편이 안전합니다."] },
      { heading: "PPSR은 번호판이 아니라 VIN으로 검색합니다", paragraphs: ["호주 정부 PPSR 차량 검색은 금융 이해관계가 등록돼 있는지 확인하고, 도난 또는 폐차 기록 정보가 함께 표시될 수 있습니다. 온라인 self-service 검색 비용은 현재 A$2이며, 결과 인증서는 보관해 두세요."], bullets: ["차체와 등록 서류의 VIN이 같은지 직접 대조", "구매 당일 또는 하루 전에 최신 PPSR 검색", "검색 결과의 make, model, colour가 차량과 맞는지 확인", "인증서 파일과 검색 시간을 보관"] },
      { heading: "PPSR만으로 확인되지 않는 것", bullets: ["정확한 미상환 금융 금액", "이전 소유자 전체 기록", "주행거리 조작 여부", "미납 벌금", "엔진·변속기·차체의 실제 상태"] },
      { heading: "송금 전 마지막 순서", paragraphs: ["PPSR과 별도로 독립적인 사전 점검을 받고, 해당 주의 공식 등록 조회와 명의이전 절차를 확인하세요. 판매자 신원, VIN, 차량 가격, 날짜가 들어간 영수증을 준비하고 실제 차량과 열쇠를 인수하는 흐름에 맞춰 결제하세요."], bullets: ["보험 시작 시점을 차량 인수 전에 맞추기", "명의이전 책임과 제출 기한 확인", "예비 열쇠와 정비 기록 인수", "광고, 대화, 영수증과 PPSR 인증서 백업"] },
    ],
    sources: [{ label: "Australian Government PPSR — Used vehicle search", href: "https://www.ppsr.gov.au/searching/do-used-car-or-vehicle-search", summary: "VIN으로 차량의 등록된 금융 이해관계와 도난·폐차 관련 기록을 조회하는 정부 서비스입니다. 결과가 차량 상태 보증은 아니므로 독립적인 차량 점검과 주별 Rego 조회를 함께 해야 합니다." }],
  },
  {
    slug: "unpaid-trial-shift-australia-guide",
    title: "호주 무급 Trial Shift, 어디까지 괜찮을까?",
    socialTitle: "When is an unpaid trial shift legal?",
    description: "카페·레스토랑·매장에서 요청받은 무급 트라이얼이 단순한 기술 확인인지 실제 근무인지 구분할 질문을 정리합니다.",
    category: "직장 권리",
    readingTime: "6분",
    publishedAt: "2026-08-16",
    updatedAt: "2026-08-17",
    quickSummary: ["무급 Trial은 필요한 기술을 짧게 보여주는 범위인지 확인하기", "실제 고객 업무·청소·마감으로 이어지면 시간과 업무를 기록하기", "시작 전 종료 시간·평가자·유급 전환 기준을 서면으로 묻기"],
    toolHref: "/underpayment-guide",
    toolLabel: "미지급 급여 대응 순서 확인하기",
    sections: [
      { heading: "Trial이라는 이름만으로 무급이 되는 것은 아닙니다", paragraphs: ["Fair Work Ombudsman은 무급 트라이얼을 채용 대상자가 직무에 필요한 기술을 보여주는 과정으로 설명합니다. 필요한 기술을 확인하는 범위를 넘거나, 필요 이상으로 길어지거나, 직접적인 감독 없이 실제 업무를 수행한다면 임금이 지급돼야 할 수 있습니다."] },
      { heading: "시작 전에 확인할 질문", bullets: ["어떤 기술을 보여줘야 하나요?", "시작·종료 시간은 언제인가요?", "누가 옆에서 직접 평가하나요?", "고객 응대, 청소, 마감처럼 평가와 무관한 업무도 하나요?", "트라이얼이 무급이라는 점을 미리 명확하게 안내했나요?", "추가 시간이 필요하면 그 시간부터 어떤 시급으로 지급하나요?"] },
      { heading: "실제 근무에 가까운 신호", bullets: ["정규 로스터의 빈자리를 채우도록 함", "여러 날 또는 여러 차례 무급 출근을 요구함", "혼자 고객을 응대하거나 매장을 운영하게 함", "기술 확인과 무관한 청소·재고·마감 업무를 계속 시킴", "못 나오는 날 대체 인력을 직접 구하라고 함", "채용 여부와 관계없이 사업에 실질적인 노동을 제공함"] },
      { heading: "기록은 짧게라도 남겨두세요", paragraphs: ["공고, 트라이얼 요청 메시지, 날짜와 시간, 수행한 업무와 함께 일한 사람을 기록하세요. 합리적인 기술 시연을 넘었다고 생각되면 고용주에게 지급 기준을 서면으로 묻고, 해결되지 않으면 Fair Work의 공식 안내를 확인하세요. 상황마다 판단이 달라질 수 있으므로 이 글만으로 임금 지급 여부를 단정하지는 마세요."] },
    ],
    sources: [{ label: "Fair Work Ombudsman — Unpaid trials", href: "https://www.fairwork.gov.au/starting-employment/unpaid-work/unpaid-trials", summary: "합법적인 무급 기술 시연과 임금을 받아야 할 수 있는 실제 근무를 구분하는 기준을 설명합니다. 필요한 기술 확인에 필요한 시간, 직접 감독 여부, 사업에 실질적인 노동을 제공했는지가 중요합니다." }],
  },
  {
    slug: "abn-employee-or-contractor-australia",
    title: "‘ABN으로 일하세요’라고 들었을 때 확인할 것",
    socialTitle: "Employee or contractor? Check before using an ABN",
    description: "ABN과 Invoice가 있다는 이유만으로 Contractor가 되는 것은 아닙니다. Employee와 Contractor를 구분할 때 확인할 관계와 위험 신호를 살펴봅니다.",
    category: "고용 형태",
    readingTime: "8분",
    publishedAt: "2026-08-16",
    updatedAt: "2026-08-17",
    quickSummary: ["ABN이나 계약서 제목 하나로 Contractor가 결정되는 것은 아님", "업무 통제·도구·사업 위험·대체 가능성 등 실제 관계를 함께 보기", "제시 금액에서 세금·보험·장비·무급 휴가 비용까지 빼서 비교하기"],
    toolHref: "/salary-calculator",
    toolLabel: "제시 금액을 급여 기준과 비교하기",
    sections: [
      { heading: "ABN 하나로 고용 형태가 결정되지는 않습니다", paragraphs: ["직원이 될지 독립 Contractor가 될지는 계약 제목이나 ABN 보유 여부 하나만으로 결정되지 않습니다. Fair Work는 계약 내용과 실제 관계의 성격, 업무 수행 방식 등 여러 요소를 함께 살펴야 한다고 안내합니다."] },
      { heading: "관계를 확인하는 질문", bullets: ["업무 시간과 장소를 누가 결정하나요?", "일하는 방법을 누가 지시하고 감독하나요?", "도구·차량·재료와 보험을 누가 준비하나요?", "정해진 시급을 받나요, 결과물이나 견적에 따라 비용을 청구하나요?", "잘못된 작업을 내 비용으로 고쳐야 하는 사업상 위험이 있나요?", "다른 고객을 자유롭게 받을 수 있나요?", "다른 사람에게 일을 맡기거나 Subcontract할 수 있나요?", "휴가, Super, Workers compensation 같은 책임이 계약에 어떻게 적혀 있나요?"] },
      { heading: "주의해서 봐야 할 상황", bullets: ["기존 Employee와 같은 일을 하면서 ABN과 Invoice만 요구받음", "고용주가 정한 고정 시간·장소에서 지속적으로 일함", "내 고객이나 사업 위험은 없는데 모든 책임만 Contractor에게 넘김", "Employee로 일하던 사람을 해고하거나 위협한 뒤 같은 일을 Contractor로 전환함", "계약서를 읽을 시간이나 독립적인 조언을 받을 기회를 주지 않음"] },
      { heading: "서명 전 비용 구조까지 계산하세요", paragraphs: ["진짜 Contractor라면 청구 금액에서 세금, 보험, 장비, 무급 휴가, 회계 비용과 미지급 Invoice 위험까지 감당해야 할 수 있습니다. 제시 금액을 Employee 시급과 단순 비교하지 말고 전체 비용을 계산하세요. 관계가 불분명하거나 실제 업무가 계약과 다르면 Fair Work 안내와 독립적인 법률·세무 조언을 확인하는 편이 안전합니다."] },
    ],
    sources: [
      { label: "Fair Work Ombudsman — Independent contractors", href: "https://www.fairwork.gov.au/find-help-for/independent-contractors/independent-contractors", summary: "Employee와 Contractor 관계를 판단할 때 계약뿐 아니라 실제 업무 관계 전체를 살펴야 한다는 기준과 각 형태의 일반적인 차이를 확인할 수 있습니다." },
      { label: "Fair Work Ombudsman — Sham contracting", href: "https://www.fairwork.gov.au/find-help-for/independent-contractors/sham-contracting", summary: "실제로는 Employee인 사람을 Contractor로 잘못 표시해 권리와 비용 책임을 넘기는 행위, 해고 후 같은 업무를 Contractor로 강요하는 위험 신호를 설명합니다." },
    ],
  },
  {
    slug: "casual-income-budget-australia",
    title: "Casual 수입이 매주 다를 때 생활비 예산 짜는 법",
    socialTitle: "Budgeting with irregular casual income",
    description: "가장 많이 번 주가 아니라 낮은 수입 구간을 기준으로 렌트, 정기결제, 비상금과 자유 지출을 나누는 방법입니다.",
    category: "생활비",
    readingTime: "6분",
    publishedAt: "2026-08-16",
    updatedAt: "2026-08-17",
    quickSummary: ["가장 많이 번 주가 아니라 낮게 받은 주의 Net Pay로 고정비를 보기", "정기 청구액을 주간 몫으로 나눠 Bills 계좌에 미리 옮기기", "좋은 주의 추가 수입을 다음 저수입 주·비상금·목표에 배정하기"],
    toolHref: "/cost-of-living-calculator",
    toolLabel: "내 주간·월간 생활비 계산하기",
    sections: [
      { heading: "한 번의 좋은 급여를 기준으로 계약하지 마세요", paragraphs: ["Casual 근무는 주마다 시간이 달라질 수 있습니다. 최근 몇 주의 평균만 보기보다 낮게 들어온 주에도 감당할 수 있는 필수 지출을 먼저 확인하면 렌트나 할부처럼 고정된 약속을 정할 때 여유가 생깁니다."] },
      { heading: "수입을 세 가지 숫자로 보세요", bullets: ["낮은 주: 근무시간이 줄었을 때 실제로 받은 Net Pay", "평균 주: 최근 여러 Pay cycle의 보통 수입", "좋은 주: 추가 Shift와 Penalty가 포함된 수입"] },
      { heading: "낮은 주 수입으로 우선 배정할 항목", bullets: ["렌트와 기본 공과금", "식료품과 출퇴근 교통", "보험·통신·의료처럼 중단하기 어려운 비용", "곧 청구될 연간·분기 비용의 주간 몫", "최소한의 비상금 적립"] },
      { heading: "좋은 주의 돈에는 미리 역할을 주세요", paragraphs: ["추가로 번 금액을 모두 자유 지출로 보지 말고 다음 저수입 주, 큰 청구서, 저축 목표로 나눠두세요. MoneySmart는 별도 계좌와 작은 단위의 bill smoothing을 활용하는 방법을 안내합니다."], bullets: ["Bills 계좌: 정기 비용의 주간 몫 이동", "Buffer 계좌: 근무시간 감소 대비", "Goal 계좌: 비자비·항공권·차량·교육비", "Spending 계좌: 남은 범위에서 자유 지출"] },
    ],
    sources: [{ label: "MoneySmart — Managing on a casual income", href: "https://moneysmart.gov.au/budgeting/managing-on-a-casual-income", summary: "불규칙한 수입에서 필수비용을 먼저 확보하고, 큰 청구서를 작은 주기로 나누며, 높은 수입이 들어온 시기에 완충 자금을 만드는 방법을 안내합니다." }],
  },
  {
    slug: "tfn-application-after-arrival-australia",
    title: "호주 TFN 신청 방법: 워홀·학생비자 도착 후 체크리스트",
    socialTitle: "Apply for an Australian TFN after arrival",
    description: "외국 여권 소지자가 호주 도착 후 TFN 신청 자격과 준비 정보, 28일 처리 흐름, 취업 중 대기 방법과 번호 보안을 확인하는 상세 가이드입니다.",
    category: "도착 행정",
    readingTime: "9분",
    publishedAt: "2026-08-16",
    updatedAt: "2026-08-17",
    quickSummary: ["호주 안에서 유효한 대상 비자를 보유했는지 확인한 뒤 ATO의 외국 여권 소지자용 경로 이용하기", "여권 정보와 연락처·우편 주소를 정확히 준비하고 접수 정보를 보관하기", "일반적으로 28일 처리 기간을 예상하고 번호를 받으면 고용주·은행 등 필요한 곳에만 제공하기"],
    toolHref: "/arrival-checklist",
    toolLabel: "첫 30일 정착 체크리스트 열기",
    sections: [
      { heading: "TFN은 한 번 받으면 계속 사용하는 개인 번호입니다", paragraphs: ["Tax file number(TFN)는 ATO가 세금과 Super 시스템에서 개인을 식별할 때 사용하는 번호입니다. 보통 9자리이며 직장이나 이름이 바뀌거나 다른 주로 이사하고 해외로 나가더라도 같은 번호를 유지합니다. 과거에 호주에서 일하거나 공부하며 TFN을 받은 적이 있다면 새 번호를 다시 신청하지 말고 ATO 온라인 서비스, 이전 Income statement·Notice of assessment 또는 Super 기록에서 기존 번호를 먼저 찾으세요.", "TFN 신청은 무료입니다. 광고를 통해 신청 대행비를 요구하거나 구직 등록을 위해 TFN 전체를 먼저 보내라고 하는 서비스는 공식 신청 경로와 구분해야 합니다."] },
      { heading: "외국 여권 소지자용 온라인 신청 자격부터 확인하세요", paragraphs: ["ATO의 Individual Auto Registration(IAR)은 호주 안에 있는 영주 이민자 또는 임시 방문자가 이용하는 온라인 신청 경로입니다. 신청 시점에 호주에 있어야 하고, 여권이나 여행 문서에 연결된 대상 비자가 있어야 합니다.", "호주 밖에 있거나 IAR 대상 조건을 충족하지 못하면 신청 방식이 달라질 수 있습니다. 검색 결과의 비공식 양식으로 바로 들어가기보다 ATO의 Apply for a TFN 안내에서 본인 상황에 맞는 경로를 선택하세요. 호주 시민은 외국 여권 소지자용 IAR을 이용하지 않습니다."], bullets: ["Permanent resident visa", "근로 권한이 있는 비자", "Overseas student visa", "호주에 무기한 체류할 수 있는 비자"] },
      { heading: "신청 전에 이 정보를 정확히 맞추세요", paragraphs: ["온라인 신청 정보는 Department of Home Affairs의 여행 문서·비자 정보와 대조될 수 있습니다. 여권에 적힌 표기와 신청서의 철자·순서를 임의로 바꾸지 않는 것이 중요합니다.", "여권번호, 생년월일과 TFN은 Hoju Compass 체크리스트나 공동 메모에 적지 마세요. 이 가이드는 준비 순서만 설명하며 실제 신청 정보는 ATO 공식 화면에만 입력하는 편이 안전합니다."], bullets: ["현재 여권 또는 여행 문서 번호와 발급 국가", "여권에 표시된 영문 이름과 생년월일", "현재 연락 가능한 전화번호와 이메일", "우편을 안정적으로 받을 수 있는 호주 주소", "이미 TFN을 신청하거나 발급받은 적이 있는지 여부", "신청 완료 화면과 접수 관련 정보 보관"] },
      { heading: "신청 뒤에는 일반적으로 최대 28일을 예상하세요", paragraphs: ["ATO는 완성된 신청서와 필요한 신원 자료를 받은 뒤 일반적으로 28일 안에 TFN을 보낸다고 안내합니다. 신청 방식에 따라 입력한 우편 주소 또는 myGov inbox로 받을 수 있습니다. 28일이 지났는데도 받지 못했다면 같은 신청을 반복하기보다 접수 정보를 준비해 ATO에 문의하세요."], bullets: ["이사 예정이면 우편물을 안전하게 받을 주소인지 먼저 확인", "접수 날짜를 달력에 기록하고 28일 뒤 확인 일정 추가", "도착하지 않았다고 새 신청서를 즉시 중복 제출하지 않기", "과거 TFN이 있을 가능성이 있다면 기존 번호 찾기부터 진행"] },
      { heading: "취업이 먼저 시작되면 TFN declaration에서 신청 사실을 알리세요", paragraphs: ["TFN이 도착하기 전 취업했다면 고용주의 정식 Tax file number declaration 절차에서 TFN을 신청했다는 항목을 정확히 선택할 수 있습니다. ATO 안내상 신청 사실을 표시한 직원은 TFN을 제공할 수 있는 28일의 기간이 있으며, 이후에도 번호가 제공되지 않으면 고용주의 원천징수 방식이 달라질 수 있습니다.", "구체적인 원천징수율과 세무상 거주자 여부는 개인 상황에 따라 달라질 수 있으므로, 급여 처리가 이상하면 Payroll과 ATO의 최신 안내를 함께 확인하세요."], bullets: ["채용 메시지나 구직 프로필에 TFN 전체 번호를 적지 않기", "Payroll 또는 정식 onboarding 화면인지 확인한 뒤 제출", "번호를 받은 날짜와 고용주에게 제공한 날짜 기록", "첫 Payslip에서 세금 원천징수 내역 확인"] },
      { heading: "온라인 신청 오류가 나면 입력과 기기 설정부터 확인하세요", paragraphs: ["여권·비자 정보가 Home Affairs 기록과 일치하지 않는다는 오류가 나오면 철자, 여권번호와 비자 연결 상태를 다시 확인하세요. ATO는 IAR에서 해당 오류가 발생하는 한 원인으로 기기의 시간대가 호주 시간대로 설정되지 않은 경우를 안내하고 있습니다. 시간대를 바꾼 뒤 다시 시도해도 해결되지 않으면 ATO의 온라인 서비스 문제 해결 안내에서 대체 신청 경로를 확인하세요."] },
      { heading: "받은 번호는 필요한 기관에만 제공하세요", paragraphs: ["ATO는 현재 고용주, 은행, 등록 세무사처럼 TFN을 실제로 필요로 하는 상대인지 확인한 뒤 제공하라고 안내합니다. ATO는 회신 이메일, SMS 또는 SNS를 통해 TFN이나 은행정보를 보내라고 요구하지 않습니다."], bullets: ["메신저로 접근한 채용 담당자에게 TFN 사진을 보내지 않기", "집주인·쉐어하우스 운영자·일반 서비스 업체에는 제공하지 않기", "휴대폰 메모나 지갑에 번호를 그대로 보관하지 않기", "유출·도용이 의심되면 ATO의 공식 신원 보호 연락 경로 이용"] },
      { heading: "TFN과 ABN은 역할이 다릅니다", paragraphs: ["TFN은 개인 세금 기록에 쓰이고 ABN은 사업 활동을 식별합니다. 고용주가 ABN 발급과 Invoice 제출을 요구한다고 해서 실제 관계가 자동으로 Contractor가 되는 것은 아닙니다. 업무 시간·통제·도구·사업 위험 등 실제 일하는 방식을 함께 확인하고, 불분명하면 Employee와 Contractor 가이드를 확인하세요."] },
    ],
    sources: [
      { label: "ATO — Permanent migrants and temporary visitors TFN application", href: "https://www.ato.gov.au/individuals-and-families/tax-file-number/apply-for-a-tfn/foreign-passport-holders-permanent-migrants-and-temporary-visitors-tfn-application", summary: "호주 안에 있는 영주 이민자·임시 방문자의 IAR 신청 자격, 대상 비자, 무료 신청과 대체 신청 방식을 안내하는 공식 페이지입니다." },
      { label: "ATO — What is a tax file number?", href: "https://www.ato.gov.au/individuals-and-families/tax-file-number/what-is-a-tax-file-number", summary: "TFN이 평생 유지되는 개인 식별번호라는 점, 기존 번호를 찾는 위치, 일반적인 28일 처리 기간과 미수령 시 문의 절차를 설명합니다." },
      { label: "ATO — Tax file number declaration", href: "https://www.ato.gov.au/forms-and-instructions/tfn-declaration", summary: "취업 시 TFN declaration을 온라인 또는 서면으로 작성하는 절차와 고용주의 관련 의무를 확인하는 공식 시작 페이지입니다." },
      { label: "ATO — Help and support for online services", href: "https://www.ato.gov.au/online-services/online-services-for-individuals-and-sole-traders/ato-online-services-and-mygov/help-and-support-for-online-services-individuals", summary: "TFN 온라인 신청과 IAR에서 발생할 수 있는 오류, Home Affairs 정보 불일치와 기기 시간대 설정 등 공식 문제 해결 항목을 제공합니다." },
      { label: "ATO — Protect your personal identifying information", href: "https://www.ato.gov.au/online-services/scams-cyber-safety-and-identity-protection/protect-your-information/how-to-protect-yourself", summary: "TFN을 제공해도 되는 상대를 확인하고, 이메일·SMS·SNS를 이용한 개인정보 요구와 사칭 메시지로부터 번호를 보호하는 방법을 안내합니다." },
    ],
  },
  {
    slug: "australia-sim-esim-setup-guide",
    title: "호주 유심·eSIM 개통 방법: 워홀·유학생 첫 통신 체크리스트",
    socialTitle: "Set up your first Australian SIM or eSIM",
    description: "호주 도착 후 선불·후불 요금제, 신분 확인, eSIM 호환성, 커버리지, 번호 이동과 SIM 교체 사기를 순서대로 확인하는 상세 가이드입니다.",
    category: "도착 행정",
    readingTime: "9분",
    publishedAt: "2026-08-17",
    updatedAt: "2026-08-17",
    quickSummary: ["도착 초기에는 약정·초과요금 부담이 적은 Prepaid와 장기 사용에 맞는 Postpaid의 결제 구조부터 비교하기", "가격표가 아니라 Critical Information Summary에서 데이터·유효기간·자동충전·로밍·해지 비용 확인하기", "기존 번호를 옮길 때는 먼저 해지하지 말고, 갑자기 통신이 끊기면 SIM swap 가능성을 생각해 통신사와 은행에 즉시 연락하기"],
    toolHref: "/arrival-checklist",
    toolLabel: "첫 30일 정착 체크리스트 열기",
    sections: [
      { heading: "도착 당일에는 연락 가능한 번호를 먼저 만드세요", paragraphs: ["호주 전화번호는 구직 연락, 은행·정부 서비스 인증, 집 Inspection과 학교 안내에 자주 사용됩니다. 공항에서 급하게 장기 계약을 고르기보다 숙소와 주요 생활권에서 쓸 수 있는 짧은 기간의 서비스를 먼저 마련하고 실제 사용량을 확인한 뒤 다음 요금제를 결정해도 됩니다.", "이 글은 특정 통신사를 추천하지 않습니다. 같은 통신망을 사용하는 상품도 요금, 고객지원, 데이터 속도 제한과 커버리지 안내가 다를 수 있으므로 판매처 설명이 아니라 통신사의 공식 문서를 확인하세요."] },
      { heading: "Prepaid와 Postpaid는 결제 시점부터 다릅니다", paragraphs: ["ACCC는 Prepaid를 서비스를 사용하기 전에 먼저 결제하는 방식, Postpaid를 대부분 월 사용 뒤 청구서를 받는 방식으로 설명합니다. 호주 체류 기간, 데이터 사용량과 매달 감당할 수 있는 비용을 기준으로 선택하세요."], bullets: ["Prepaid: 먼저 충전하고 정해진 기간·데이터를 사용", "Postpaid: 월별 청구와 초과 사용 비용 가능성 확인", "SIM-only: 기존 휴대폰을 사용하고 통신 서비스만 계약", "Handset plan: 서비스와 단말기 할부가 별도 기간인지 확인", "장기 약정: 조기 종료 시 남은 단말기 금액과 해지 비용 확인"] },
      { heading: "광고보다 Critical Information Summary를 읽으세요", paragraphs: ["호주 통신사는 각 상품과 요금제의 Critical Information Summary(CIS)를 제공해야 합니다. ACMA는 CIS에서 포함·제외 항목, 비용, 최소 계약기간, 국내·국제 로밍과 민원 방법을 확인할 수 있다고 안내합니다."], bullets: ["한 번 충전으로 사용할 수 있는 기간과 갱신 날짜", "기본 데이터와 소진 뒤 차단·속도 제한·추가 과금 방식", "호주 국내 통화·SMS와 13·1300·1800 번호 포함 여부", "한국 등 국제전화 포함 국가와 분량", "Auto recharge·Direct debit 기본 설정 여부", "국제 로밍 활성화와 하루·MB당 비용", "해지·번호 이동·단말기 잔액 비용"] },
      { heading: "SIM과 eSIM은 휴대폰 호환성을 먼저 확인하세요", paragraphs: ["eSIM은 물리 카드를 넣는 대신 기기에 통신 프로필을 내려받는 방식입니다. 모든 휴대폰과 통신사가 같은 eSIM 방식을 지원하는 것은 아니므로 모델명, 호주 주파수·네트워크 지원과 잠금 여부를 선택한 통신사에 확인하세요.", "해외에서 가져온 휴대폰이나 오래된 기기는 데이터가 되더라도 호주 네트워크에서 Triple Zero 긴급통화를 지원하지 못할 수 있습니다. ACMA는 통신사가 Triple Zero 통화를 지원할 수 없는 기기에 서비스를 제공할 수 없다고 안내하므로, IMEI·모델 확인 도구가 있다면 개통 전에 이용하세요."], bullets: ["정확한 제조사·모델번호와 eSIM 지원 여부", "다른 통신사 SIM 사용이 가능한 Unlocked 기기인지", "물리 SIM과 eSIM을 동시에 쓸 때 기본 통화·데이터 회선", "QR 코드·활성화 정보는 공개하거나 재사용하지 않기", "기기 변경 시 eSIM 이전·재발급 절차와 비용"] },
      { heading: "Prepaid도 개통할 때 본인 확인이 필요합니다", paragraphs: ["ACMA에 따르면 선불 이동통신 서비스를 활성화할 때 통신사는 고객의 이름, 생년월일과 집 주소를 받고 신분을 확인해야 합니다. 문서를 직접 보거나 정부 문서 확인 서비스, 기존 계정 또는 금융거래 같은 허용된 방법을 이용할 수 있습니다.", "여권 전체 사본을 일반 이메일이나 판매자의 개인 메신저로 보내지 말고 통신사의 공식 앱·웹사이트·매장 절차를 이용하세요. 인정되는 해외 여권과 추가 자료는 사업자마다 다를 수 있으므로 구매 전에 확인하는 편이 안전합니다."], bullets: ["여권에 적힌 정확한 영문 이름과 생년월일", "현재 호주 주소 또는 통신사가 인정하는 주소 정보", "본인이 접근 가능한 이메일과 결제수단", "개통 완료 후 등록된 이름과 연락처 확인", "여권번호·계정 비밀번호·인증 코드는 개인 메모나 공동 체크리스트에 저장하지 않기"] },
      { heading: "가격보다 집·학교·직장의 커버리지를 보세요", paragraphs: ["ACCC는 통신사마다 지리적 커버리지와 수신 품질이 같지 않으므로 공식 커버리지 지도에 우편번호를 입력해 확인하라고 안내합니다. 지도는 예상 범위이므로 건물 내부, 지하, 산간 지역과 이동 경로에서는 실제 품질이 다를 수 있습니다."], bullets: ["임시 숙소와 장기 거주 후보 주소", "학교·직장과 자주 이용할 교통 노선", "지역 이동·농장 근무 예정지", "실내 수신과 Wi-Fi Calling 지원 여부", "불만족 시 취소·환불 조건이 있는지 CIS에서 확인"] },
      { heading: "기존 번호를 옮길 때는 먼저 해지하지 마세요", paragraphs: ["통신사를 바꾸면서 번호를 유지하는 것을 Porting이라고 합니다. ACMA는 활성 상태의 번호만 이동할 수 있으므로 기존 서비스를 먼저 해지하지 말라고 안내합니다. 새 통신사가 이동 절차를 진행하고, 본인 확인을 위해 기존 번호로 SMS 인증코드를 보내거나 전화를 걸 수 있습니다.", "일반적인 모바일 번호 이동은 보통 3시간 정도 걸릴 수 있지만 상황에 따라 더 오래 걸릴 수 있습니다. 기존 계정의 이름·생년월일과 새 신청 정보가 맞는지 확인하고, 이동이 끝날 때까지 기존 SIM을 사용할 수 있게 보관하세요."], bullets: ["새 통신사가 번호 이동을 지원하는지 먼저 확인", "기존 번호와 서비스가 활성 상태인지 확인", "기존 계정 명의와 신청 정보 일치", "SMS 인증코드를 요청한 새 통신사 화면에만 입력", "완료 안내 뒤 통화·SMS·은행 인증 수신 테스트", "이전 통신사의 마지막 청구서와 단말기 잔액 확인"] },
      { heading: "개통 직후 자동결제와 데이터 설정을 점검하세요", paragraphs: ["SIM이 작동하면 호주 번호를 무조건 모든 계정에 등록하기보다 은행, 고용주, 학교처럼 필요한 곳부터 차례로 변경하세요. 이전 한국 번호가 인증에 필요하다면 해지 전에 이중 SIM 설정과 로밍 수신 비용을 확인하세요."], bullets: ["통신사 앱 로그인과 강한 비밀번호 설정", "Auto recharge·Direct debit 금액과 날짜 확인", "모바일 데이터 사용 경고와 한도 설정", "국제 로밍은 필요할 때만 활성화", "Voicemail·Wi-Fi Calling과 긴급통화 지원 확인", "번호 변경 대상 목록을 만들고 은행·정부·고용 순으로 업데이트"] },
      { heading: "갑자기 신호가 사라지면 SIM swap을 의심하세요", paragraphs: ["SIM swap 또는 불법 번호 이동은 범죄자가 통신사에 본인인 것처럼 접근해 피해자의 번호를 자신이 가진 SIM으로 옮기는 수법입니다. 이후 은행·이메일·정부 서비스의 SMS 인증번호까지 받을 수 있습니다.", "예고 없이 통화와 문자가 동시에 끊기거나 번호 이동 알림을 받았다면 휴대폰을 반복 재부팅하며 기다리지 말고 다른 전화로 통신사에 즉시 연락하세요. 은행과 중요 계정의 비밀번호도 바꾸고 승인하지 않은 거래를 확인하세요."], bullets: ["통신사에 번호 이동·SIM 변경 중지와 계정 보호 요청", "은행·카드사에 계정 탈취 가능성 즉시 알림", "이메일·myGov 등 핵심 계정 비밀번호 변경", "가능한 서비스는 인증 앱·Passkey 같은 별도 인증수단 확인", "Scamwatch 신고와 신분정보 노출 시 IDCARE 지원 확인"] },
      { heading: "문제가 해결되지 않으면 통신사 민원부터 남기세요", paragraphs: ["요금, 개통, 커버리지와 번호 이동 문제가 생기면 통신사의 공식 민원 절차로 접수번호와 답변 기한을 받으세요. ACMA는 통신사 처리에 만족하지 못하면 Telecommunications Industry Ombudsman(TIO)에 민원을 제기할 수 있다고 안내합니다."], bullets: ["CIS·계약서·주문 확인서와 청구서 보관", "문제 발생 날짜·장소·오류 화면 기록", "통신사 민원 접수번호와 약속된 처리일 기록", "해결되지 않으면 TIO에 사실과 원하는 해결 방법 전달"] },
    ],
    sources: [
      { label: "ACCC — Choosing a mobile phone service", href: "https://www.accc.gov.au/consumers/telecommunications-and-internet/choosing-a-mobile-phone-service", summary: "Prepaid·Postpaid 결제 방식, 데이터와 추가 서비스, 공식 커버리지 지도, 번호 이동과 해지 비용을 비교하는 소비자 안내입니다." },
      { label: "ACMA — Critical Information Summaries", href: "https://www.acma.gov.au/choosing-right-product-or-plan", summary: "모든 통신 상품의 CIS에서 포함·제외 항목, 비용, 최소 계약기간, 로밍과 민원 방법을 확인할 수 있다고 설명합니다." },
      { label: "ACMA — ID checks for prepaid mobiles", href: "https://www.acma.gov.au/id-checks-prepaid-mobiles", summary: "선불 서비스를 활성화할 때 필요한 이름·생년월일·주소 정보와 통신사가 사용할 수 있는 신분 확인 방식을 안내합니다." },
      { label: "ACMA — Keep or transfer your phone number", href: "https://www.acma.gov.au/keep-or-port-your-phone-number", summary: "활성 번호만 이동할 수 있다는 점, 기존 회선을 먼저 해지하지 않는 순서, 추가 본인 확인과 일반적인 처리 시간을 설명합니다." },
      { label: "ACMA — Choose your mobile service carefully", href: "https://www.acma.gov.au/choose-your-mobile-service-carefully", summary: "기존 휴대폰의 통신망·Triple Zero 호환성과 CIS를 확인하고 계약 조건을 이해한 뒤 가입하도록 안내합니다." },
      { label: "Scamwatch — Account or identity takeover scams", href: "https://www.scamwatch.gov.au/types-of-scams/account-or-identity-takeover-scams", summary: "범죄자가 번호를 새 SIM으로 옮겨 SMS 인증번호를 가로채는 방식과 은행 연락·비밀번호 변경 등 피해 대응을 설명합니다." },
      { label: "ACMA — Complain to your phone or internet provider", href: "https://www.acma.gov.au/how-complain-your-telco", summary: "통신사에 먼저 민원을 제기하고 해결되지 않으면 Telecommunications Industry Ombudsman에 에스컬레이션하는 절차를 안내합니다." },
    ],
  },
  {
    slug: "australia-bank-account-opening-guide",
    title: "호주 은행 계좌 개설 방법: 워홀·학생비자 첫 계좌 체크리스트",
    socialTitle: "Open your first Australian bank account safely",
    description: "호주 도착 후 첫 거래 계좌를 열 때 신원 확인, 계좌 수수료, 급여 입금, TFN, PayID와 예금자 보호를 순서대로 점검하는 상세 가이드입니다.",
    category: "도착 행정",
    readingTime: "9분",
    publishedAt: "2026-08-17",
    updatedAt: "2026-08-17",
    quickSummary: ["급여와 생활비에 쓸 Transaction account를 먼저 정하고 월·ATM·해외거래·Overdraft 수수료 비교하기", "은행이 안내한 신원 확인 절차에 여권·호주 주소·연락처를 준비하되 로그인 정보와 인증번호는 누구에게도 보내지 않기", "계좌 개설 뒤 급여 정보·보안 알림·TFN·PayID를 차례로 설정하고 예금자 보호는 브랜드가 아닌 ADI 단위로 확인하기"],
    toolHref: "/arrival-checklist",
    toolLabel: "첫 30일 정착 체크리스트 열기",
    sections: [
      { heading: "처음에는 Transaction account부터 확인하세요", paragraphs: ["호주에서 급여를 받고 렌트·교통·식비를 결제할 때는 일상 거래용 Transaction account가 기본입니다. Savings account는 남는 돈을 분리해 이자를 받기 위한 계좌이므로, 두 상품의 목적과 출금 조건을 섞어 보지 않는 편이 좋습니다.", "이 글은 특정 은행이나 상품을 추천하지 않습니다. 비교 사이트의 순위만 믿기보다 각 금융기관의 공식 상품 설명서와 수수료표를 열어 본인의 사용 방식에 맞는지 확인하세요."], bullets: ["급여 입금과 카드 결제에 쓸 Transaction account", "비상금·목표 자금을 분리할 Savings account", "실물 Debit card 발급과 배송·수령 방법", "Apple Pay·Google Pay 등 필요한 모바일 결제 지원 여부"] },
      { heading: "무료 계좌라는 표현보다 실제 비용을 비교하세요", paragraphs: ["MoneySmart는 거래 계좌를 비교할 때 월 계좌관리비뿐 아니라 ATM, 해외거래, 지점 업무, 수표와 Overdraft 수수료까지 확인하라고 안내합니다. 월 수수료가 없더라도 해외 온라인 결제나 다른 은행 ATM 이용이 잦으면 비용이 생길 수 있습니다."], bullets: ["월 계좌관리비와 면제 조건", "자사·타사·해외 ATM 수수료", "해외 통화 결제와 환전 수수료", "잔액 부족·Overdrawn·Dishonour 수수료", "지점 창구와 현금 입금 이용 가능 여부", "실시간 잔액·낮은 잔액·결제 알림 기능"] },
      { heading: "신분 확인 서류는 은행의 최신 안내를 따르세요", paragraphs: ["호주 금융기관은 계좌를 열 때 고객의 신원을 확인해야 합니다. AUSTRAC는 기관과 거래 성격에 따라 요구되는 신분증의 종류와 수가 달라질 수 있으며, 해당 기관이 인정하는 자료를 안내한다고 설명합니다.", "외국 여권 소지자는 보통 여권 영문 이름, 생년월일, 현재 호주 주소와 연락처를 정확히 준비해야 합니다. 비자 정보나 추가 주소 증빙을 요구하는지는 은행마다 다르므로 ‘모두 100-point check가 필요하다’고 단정하지 말고 선택한 은행의 공식 앱·웹사이트·지점에서 확인하세요."], bullets: ["유효한 여권과 여권에 적힌 정확한 영문 이름", "현재 비자와 입국 상태를 확인할 수 있는 정보", "호주 주거 주소와 우편 수령 가능 여부", "호주 전화번호와 본인이 접근 가능한 이메일", "추가 신분증·주소 증빙이 필요한지 공식 채널에서 확인"] },
      { heading: "온라인으로 시작해도 신원 확인이 끝났는지 확인하세요", paragraphs: ["일부 금융기관은 온라인으로 계좌 번호를 먼저 만들 수 있지만, 전자적으로 신원이 확인되지 않으면 지점 방문이나 추가 절차가 필요할 수 있습니다. AUSTRAC 안내상 특정 조건에서는 계좌 개설과 입금 뒤 신원 확인을 마칠 수 있어도, 확인 전에는 출금·송금 같은 서비스가 제한될 수 있습니다.", "검색 광고나 메시지 링크로 신분증을 올리지 말고 주소를 직접 입력한 공식 웹사이트나 공식 앱을 이용하세요. 여권 사본이 꼭 필요하다면 제출 화면의 도메인과 개인정보 처리 안내를 먼저 확인하세요."] },
      { heading: "계좌를 열면 급여용 정보를 정확히 전달하세요", paragraphs: ["고용주가 급여를 입금할 때는 보통 Account name, BSB와 Account number가 필요합니다. 숫자를 한 자리라도 잘못 적으면 지급이 지연될 수 있으므로 은행 앱의 계좌 상세 화면과 Payroll 입력값을 다시 대조하세요."], bullets: ["Account name의 영문 철자 확인", "6자리 BSB와 Account number를 각각 구분", "첫 급여 전 Payroll 화면을 다시 확인", "Payslip의 지급일과 실제 입금 내역 비교", "은행 로그인 비밀번호·PIN·카드 보안번호·일회용 인증번호는 고용주에게 제공하지 않기"] },
      { heading: "TFN은 계좌 개설 필수 서류와 구분하세요", paragraphs: ["TFN이 없어도 신원 확인 조건을 충족하면 계좌를 먼저 열 수 있는 경우가 많습니다. 다만 이자가 발생하는 계좌에 은행이 TFN을 보유하지 않으면 최고 한계세율로 세금을 원천징수할 수 있고, 원천징수된 금액은 세금 신고에서 크레딧으로 반영할 수 있다고 ATO는 안내합니다.", "호주 세법상 거주자 여부와 비거주자의 원천징수 방식은 다를 수 있습니다. TFN을 받았다면 메신저나 이메일이 아니라 은행의 보안 앱·인터넷뱅킹·지점 같은 공식 제출 경로를 이용하고, 본인의 세무상 상태가 불분명하면 ATO 또는 등록 세무사에게 확인하세요."] },
      { heading: "PayID를 만들 때는 표시 이름과 사기를 함께 확인하세요", paragraphs: ["PayID는 전화번호·이메일 같은 기억하기 쉬운 정보를 은행 계좌에 연결해 BSB와 Account number 대신 사용할 수 있게 합니다. 송금 화면에 표시되는 이름은 받는 사람이 맞는지 확인하는 안전장치이므로, 이름이 다르면 송금을 멈추세요.", "돈을 받기 위해 PayID를 ‘Business로 업그레이드’하거나 별도 수수료를 먼저 내라는 메시지는 의심해야 합니다. Scamwatch는 낯선 사람이 돈을 주거나 받기 위해 새 계좌나 PayID를 만들라고 요구하는 경우 사기 또는 자금세탁 신호일 수 있다고 경고합니다."], bullets: ["본인이 관리하는 전화번호·이메일만 연결", "송금 전 화면에 표시되는 수취인 이름 대조", "PayID 활성화·업그레이드 비용을 요구하면 중단", "모르는 사람의 돈을 대신 받아 다른 계좌로 전달하지 않기", "잘못 송금하거나 피해가 의심되면 즉시 은행에 연락"] },
      { heading: "예금자 보호는 은행 브랜드가 아니라 ADI를 확인하세요", paragraphs: ["APRA의 Financial Claims Scheme(FCS)은 호주에서 설립된 승인예금취급기관(ADI)에 예치된 호주달러 예금을 계좌 명의자 1인당, ADI 1곳당 최대 A$250,000까지 보호합니다. Transaction account, Savings account와 Debit card account 등이 포함될 수 있고 계좌 명의자의 국적이나 거주 상태 자체는 보장 여부를 바꾸지 않습니다.", "서로 다른 앱과 브랜드를 사용하더라도 같은 ADI가 운영하면 A$250,000 한도는 합산될 수 있습니다. 큰 금액을 장기간 보관한다면 상품 브랜드가 어느 ADI에 속하는지 APRA의 공식 목록과 금융기관 안내에서 확인하세요."] },
      { heading: "첫 주에 보안 설정과 자동이체 목록을 만드세요", paragraphs: ["계좌를 만든 날부터 거래 알림과 낮은 잔액 알림을 켜고, 은행 비밀번호를 다른 서비스와 겹치지 않게 설정하세요. 정기결제는 급여일과 청구일을 함께 기록하면 잔액 부족으로 인한 수수료를 줄이는 데 도움이 됩니다.", "모르는 거래가 보이면 작은 금액이라도 기다리지 말고 카드 잠금 기능을 사용한 뒤 은행에 즉시 연락하세요. MoneySmart는 명세서와 앱을 정기적으로 확인하고 승인하지 않은 거래를 발견하면 빠르게 은행에 알리라고 안내합니다."], bullets: ["생체 인증·강한 비밀번호·공식 앱 알림 설정", "카드 배송·수령 상태 확인 후 활성화", "렌트·통신·보험 등 자동이체 금액과 날짜 기록", "은행 공식 전화번호와 분실 카드 연락 경로 저장", "계좌 개설 후 1주일 안에 소액 이체로 입력 정보 확인"] },
    ],
    sources: [
      { label: "MoneySmart — Transaction accounts and debit cards", href: "https://moneysmart.gov.au/banking/transaction-accounts-and-debit-cards", summary: "거래 계좌의 용도와 월·ATM·해외거래·Overdraft 등 비교할 수수료, 잔액 알림과 디지털 결제 기능을 설명하는 호주 정부 소비자 금융 안내입니다." },
      { label: "AUSTRAC — Why you might be asked for ID", href: "https://www.austrac.gov.au/general-public/why-you-might-be-asked-id", summary: "은행을 포함한 규제 대상 사업자가 고객 신원을 확인하는 이유와, 인정되는 신분증 종류·수량이 기관과 거래에 따라 달라질 수 있음을 설명합니다." },
      { label: "ATO — Interest income and TFN withholding", href: "https://www.ato.gov.au/api/public/content/0-066bd153-8eec-4c72-9c1b-9ca71bf80ade", summary: "은행에 TFN을 제공하지 않았을 때 이자에서 세금이 원천징수될 수 있고, 해당 금액을 세금 신고에서 크레딧으로 반영할 수 있다는 공식 안내입니다." },
      { label: "APRA — Accounts covered under the Financial Claims Scheme", href: "https://www.apra.gov.au/types-accounts-covered-under-financial-claims-scheme", summary: "호주달러 예금에 대한 FCS 보장 범위와 계좌 명의자 1인당 ADI 1곳당 A$250,000 한도, 국적·거주 상태와 무관한 적용 기준을 안내합니다." },
      { label: "Scamwatch — Methods scammers use", href: "https://www.scamwatch.gov.au/stop-check-protect/help-to-spot-and-avoid-scams/methods-scammers-use", summary: "새 은행 계좌나 PayID 개설을 요구하거나 돈을 옮기게 하는 접근이 사기·자금세탁 신호일 수 있으며, 피해 시 은행에 즉시 연락해야 한다고 안내합니다." },
      { label: "MoneySmart — Unauthorised and mistaken transactions", href: "https://moneysmart.gov.au/banking/unauthorised-and-mistaken-transactions", summary: "은행 앱과 명세서를 확인하고 승인하지 않은 거래나 잘못된 송금을 발견하면 신속히 금융기관에 연락하는 대응 순서를 설명합니다." },
    ],
  },
  {
    slug: "first-job-super-fund-stapled-account-guide",
    title: "호주 첫 직장 Super, 새 계좌를 만들기 전에 확인할 것",
    socialTitle: "Check your super account before starting a new job",
    description: "기존 Super 계좌, Stapled fund와 Standard choice form의 관계를 이해하고 첫 고용 서류에서 중복 계좌를 줄이는 확인 순서를 정리합니다.",
    category: "첫 직장",
    readingTime: "7분",
    publishedAt: "2026-08-16",
    updatedAt: "2026-08-17",
    quickSummary: ["새 직장마다 새 Super 계좌를 만들기 전에 기존 계좌부터 찾기", "Fund 이름·ABN·USI·Member number를 고용 서류와 대조하기", "계좌 통합 전 수수료뿐 아니라 기존 보험과 혜택 손실도 확인하기"],
    toolHref: "/super-guide",
    toolLabel: "Super 기본 구조 확인하기",
    sections: [
      { heading: "새 직장마다 새 Super 계좌가 필요한 것은 아닙니다", paragraphs: ["이미 본인에게 연결된 Super 계좌가 있다면 새 직장에서 그 계좌를 계속 사용할 수 있는지 먼저 확인하세요. 여러 계좌가 생기면 각각 수수료나 보험료가 부과될 수 있어, 계좌를 새로 열기 전에 기존 계좌 정보를 찾아보는 편이 좋습니다."] },
      { heading: "Stapled fund는 직장을 옮겨도 따라가는 기존 계좌입니다", paragraphs: ["직원이 fund를 선택하지 않은 경우 고용주는 ATO에 기존 Stapled super fund 정보를 요청해야 할 수 있습니다. 이는 직장을 바꿀 때마다 불필요한 새 계좌가 만들어지는 일을 줄이기 위한 절차입니다."], bullets: ["myGov에 연결된 ATO 온라인 서비스에서 기존 Super 계좌 확인", "Fund 이름, ABN, USI와 Member number 대조", "이름·생년월일·TFN 정보가 fund 기록과 맞는지 확인"] },
      { heading: "Standard choice form은 ATO가 아니라 고용주에게 냅니다", paragraphs: ["선택 자격이 있고 기존 fund를 지정하려면 myGov의 New employment 절차, ATO 양식 또는 고용주의 payroll 시스템을 이용할 수 있습니다. 온라인 양식에는 고용주 ABN과 고용 형태, 고용주의 default fund 정보가 필요할 수 있습니다."], bullets: ["임시 취업 비자 보유자는 choice-of-fund 자격이 다를 수 있으므로 본인 조건 확인", "양식의 빈칸과 fund 세부 정보가 정확한지 확인", "완성한 선택 양식은 ATO가 아니라 고용주에게 제출", "고용주에게 특정 fund의 투자 조언을 기대하지 않기"] },
      { heading: "합치기 전에 보험과 비용을 먼저 비교하세요", paragraphs: ["여러 Super 계좌를 합치면 수수료를 줄일 수 있지만 기존 계좌에 연결된 보험이나 혜택을 잃을 수도 있습니다. 이 글은 특정 fund를 추천하지 않습니다. 통합 전에는 각 fund의 수수료, 보험, 투자 옵션과 본인의 체류 계획을 확인하세요."] },
    ],
    sources: [
      { label: "ATO — Superannuation standard choice form", href: "https://www.ato.gov.au/forms-and-instructions/superannuation-standard-choice-form", summary: "기존 Super fund를 고용주에게 지정할 때 사용하는 공식 양식과 제출 대상을 안내합니다. 완성된 양식은 ATO가 아니라 고용주에게 제출합니다." },
      { label: "ATO — Offer employees a choice of super fund", href: "https://www.ato.gov.au/businesses-and-organisations/super-for-employers/setting-up-super-for-your-business/offer-employees-a-choice-of-super-fund", summary: "직원이 fund를 선택할 수 있는 경우, 고용주가 choice 절차와 stapled fund 확인을 어떻게 처리하는지 설명합니다. 본인의 선택 자격과 고용주의 의무를 함께 이해하는 데 유용합니다." },
    ],
  },
  {
    slug: "australia-job-scam-red-flags",
    title: "호주 구직 중 만나는 가짜 채용 제안, 사기 신호 8가지",
    socialTitle: "Eight warning signs of an Australian job scam",
    description: "WhatsApp·Telegram으로 갑자기 온 고수익 제안, 선입금·가상자산 충전과 신분증 요구를 멈추고 확인하는 방법입니다.",
    category: "구직 안전",
    readingTime: "7분",
    publishedAt: "2026-08-16",
    updatedAt: "2026-08-17",
    quickSummary: ["지원하지 않은 고수익 메신저 제안은 회사 공식 채널로 다시 검증하기", "일을 시작하거나 수익을 찾기 위해 선입금·충전을 요구하면 중단하기", "이미 송금했다면 은행 연락·비밀번호 변경·신고를 동시에 진행하기"],
    toolHref: "/help-directory",
    toolLabel: "사기 신고와 도움 연락처 확인하기",
    sections: [
      { heading: "돈을 벌기 위해 먼저 돈을 내라고 하면 멈추세요", paragraphs: ["Scamwatch는 적은 노력으로 높은 수익을 약속하면서 일을 시작하려면 돈을 내라고 하는 제안을 대표적인 구직 사기로 안내합니다. 처음에 작은 금액을 지급해 신뢰하게 만든 뒤 더 큰 충전금이나 수수료를 요구할 수도 있습니다."] },
      { heading: "가짜 채용 제안에서 자주 보이는 신호", bullets: ["지원하지 않았는데 WhatsApp, Telegram, Signal이나 문자로 갑자기 연락함", "경력·자격·추천인 확인이나 정식 면접 없이 바로 채용함", "집에서 간단한 작업만 하면 높은 수익을 준다고 함", "업무를 시작하거나 수익을 출금하려면 선입금·PayID·가상자산 충전을 요구함", "개인 계좌로 돈을 받아 다른 계좌나 가상자산 지갑으로 보내라고 함", "대신 물건을 구매하거나 택배를 받아 다시 보내라고 함", "회사 공식 이메일이 아닌 개인 주소와 메신저만 사용함", "검증하기 전에 여권, 운전면허증, 은행 계좌나 카드 정보를 요구함"] },
      { heading: "회사 이름보다 연락 경로를 검증하세요", paragraphs: ["사기범은 실제 회사와 유명 채용회사의 이름을 도용할 수 있습니다. 메시지에 적힌 번호로만 확인하지 말고 회사 공식 웹사이트에서 직접 찾은 전화번호나 이메일로 채용 담당자의 이름과 공고를 확인하세요."], bullets: ["회사명과 recruiter 이름에 scam을 붙여 검색", "공식 채용 페이지에 같은 직무가 올라왔는지 확인", "도메인 철자와 이메일 주소가 공식 사이트와 같은지 대조", "급하게 결정하라는 요구에서 잠시 멈추고 주변 사람에게 보여주기"] },
      { heading: "이미 돈이나 정보를 보냈다면 빠르게 움직이세요", bullets: ["은행이나 카드 제공사에 즉시 연락해 거래 중지 가능성 확인", "이메일·은행·정부 서비스 비밀번호 변경", "가짜 회사와 연락 중단", "광고가 올라온 플랫폼과 Scamwatch에 신고", "신분증 정보가 넘어갔다면 IDCARE 지원 확인"], paragraphs: ["개인 계좌로 다른 사람의 돈을 옮기는 money mule 역할은 본인이 범죄 구조를 몰랐더라도 심각한 문제가 될 수 있습니다. 의심되는 송금 업무는 즉시 중단하고 공식 도움을 받으세요."] },
    ],
    sources: [{ label: "Scamwatch — Jobs and employment scams", href: "https://www.scamwatch.gov.au/types-of-scams/jobs-and-employment-scams", summary: "가짜 채용 담당자, 간단한 온라인 작업, 선입금·가상자산 충전, money mule 제안처럼 반복되는 구직 사기 유형과 피해 후 대응 방법을 안내합니다." }],
  },
];

export function getArticle(slug: string) { return articles.find((article) => article.slug === slug); }

export function getArticleTopic(category: string): ArticleTopicId {
  return (Object.entries(articleTopicCategories).find(([, categories]) => categories.includes(category))?.[0] ?? "start") as ArticleTopicId;
}

export function getRelatedArticles(slug: string, limit = 2) {
  const current = getArticle(slug);
  if (!current) return [];

  const currentTopic = getArticleTopic(current.category);
  const candidates = articles.filter((article) => article.slug !== slug);
  const sameTopic = candidates.filter((article) => getArticleTopic(article.category) === currentTopic);
  const otherTopics = candidates.filter((article) => getArticleTopic(article.category) !== currentTopic);

  return [...sameTopic, ...otherTopics].slice(0, limit);
}
