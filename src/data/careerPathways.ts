type Career = { title: string; korean: string; sector: string; work: string; preparation: string[]; usefulFor: string; searchTerms: string };

const baseCareers: Career[] = [
  { title: "Registered Nurse", korean: "간호사", sector: "Health", work: "병원, 클리닉, 노인 돌봄 등에서 환자를 평가하고 간호 계획과 치료를 수행합니다.", preparation: ["기존 해외 간호 학위와 등록 경로 확인", "AHPRA 등록 요건 확인", "직무별 영어·실습 요건 확인"], usefulFor: "JSA 2025 분석을 출발점으로 삼고 실제 직업·지역별 부족 여부와 확인일을 따로 기록하세요.", searchTerms: "registered nurse nursing 간호 보건 health" },
  { title: "Early Childhood Teacher", korean: "유아교사", sector: "Education", work: "유아의 발달과 학습을 계획하고 가정·교육기관과 협력합니다.", preparation: ["인정되는 교육 과정 확인", "주별 등록·Working with Children 요건", "영어 및 실습 요건"], usefulFor: "2025 JSA 분석과 개별 지역의 채용 공고를 함께 확인하세요.", searchTerms: "early childhood teacher childcare 유아 교육 education" },
  { title: "Secondary School Teacher", korean: "중등교사", sector: "Education", work: "전공 과목을 가르치고 학습 계획, 평가와 학생 지원을 담당합니다.", preparation: ["교원 교육 과정", "주·준주 교사 등록", "전공과 실습 인정 여부"], usefulFor: "지역과 과목에 따라 수요가 크게 달라질 수 있어 주별 확인이 중요합니다.", searchTerms: "secondary school teacher high school 중등 교사 education" },
  { title: "Electrician", korean: "전기 기술자", sector: "Construction & Trades", work: "건물과 설비의 전기 배선, 장비 설치, 검사와 수리를 수행합니다.", preparation: ["호주 견습·자격 경로 확인", "주별 전기 면허", "해외 경력·자격 인정 여부"], usefulFor: "2025 JSA 분석은 당시 노동시장 자료입니다. 현재 근무할 지역과 실제 직무를 따로 확인하세요.", searchTerms: "electrician electrical 전기 기술 trade construction" },
  { title: "Plumber", korean: "배관 기술자", sector: "Construction & Trades", work: "급수, 배수, 가스와 관련 설비를 설치하고 유지·보수합니다.", preparation: ["Certificate·Apprenticeship 경로", "주별 등록과 면허", "가스 작업 등 추가 승인 범위"], usefulFor: "면허 범위가 주마다 다르므로 거주 지역 기준으로 확인해야 합니다.", searchTerms: "plumber plumbing 배관 설비 trade construction" },
  { title: "Carpenter", korean: "목수", sector: "Construction & Trades", work: "건축 현장에서 목재 구조물, 프레임과 내·외장 요소를 제작·설치합니다.", preparation: ["견습·직업교육 과정", "White Card 등 현장 요건", "경력과 기술 평가 가능성 확인"], usefulFor: "건설 경기와 지역에 따라 채용 수요가 달라질 수 있습니다.", searchTerms: "carpenter carpentry 목수 건축 trade construction" },
  { title: "Motor Mechanic", korean: "자동차 정비사", sector: "Automotive", work: "차량의 고장을 진단하고 엔진, 제동과 전기 시스템을 정비합니다.", preparation: ["자동차 정비 직업교육", "주별 수리업 관련 요건", "제조사·전기차 기술 추가 교육"], usefulFor: "세부 전문 분야와 지역에 따라 구인 난이도가 다릅니다.", searchTerms: "motor mechanic automotive 자동차 정비 기술" },
  { title: "Civil Engineer", korean: "토목 엔지니어", sector: "Engineering", work: "도로, 교량, 수자원과 건설 프로젝트를 설계·관리하고 안전성을 검토합니다.", preparation: ["인정 공학 학위", "기술 평가·전문 등록 확인", "현지 기준과 프로젝트 경험"], usefulFor: "공학 분야는 자격만큼 관련 경험과 세부 전문성이 중요합니다.", searchTerms: "civil engineer engineering 토목 엔지니어 건설" },
];

type CareerAction = { first: string; documents: string; question: string; links: { label: string; href: string }[] };
const actions: Record<string, CareerAction> = {
  "Registered Nurse": {
    "first": "기존 한국·해외 자격이 있다면 NMBA/Ahpra IQNM Self-check에서 본인 경로를 먼저 확인하세요. 모든 사람에게 호주 교육부터 다시 이수하라고 단정하지 않습니다.",
    "documents": "학위·학교·졸업연도, 간호사 등록 이력과 경력 증빙을 준비하세요.",
    "question": "이 자격과 등록 이력에 적용되는 절차·추가 자료는 무엇인가요? Self-check 결과만으로 등록 완료가 되는 것은 아닙니다.",
    "links": [
      {
        "label": "NMBA IQNM Self-check",
        "href": "https://www.nursingmidwiferyboard.gov.au/Accreditation/IQNM/Self-check-and-Portfolio"
      }
    ]
  },
  "Early Childhood Teacher": {
    "first": "ACECQA 목록에서 정확한 학위·기관을 찾고, 없으면 개별 동등성 평가 경로를 확인하세요. 희망 주의 교사 등록은 별도로 확인합니다.",
    "documents": "학위명·기관·성적표와 연령대별 실습 자료를 준비하세요. 유아교사(ECT)와 educator·childcare worker의 역할을 구분하세요.",
    "question": "이 학위가 ECT 요건에 인정되나요? 목록에 없다면 어떤 개별 평가와 주별 등록이 필요한가요?",
    "links": [
      {
        "label": "ACECQA 인정 자격 확인",
        "href": "https://www.acecqa.gov.au/qualifications-0/are-you-qualified"
      },
      {
        "label": "ACECQA 개별 자격 평가",
        "href": "https://www.acecqa.gov.au/qualifications-0/apply-qualifications-assessment-individuals/early-childhood-qualification-assessment"
      }
    ]
  },
  "Secondary School Teacher": {
    "first": "희망 주·준주의 교사 등록기관에서 학위와 교생 실습 인정 여부를 확인하세요. AITSL의 등록 체계에서 지역 기관 경로를 찾을 수 있습니다.",
    "documents": "전공·교원교육 학위, 성적표와 감독하 실습 기록을 준비하세요.",
    "question": "이 전공과 실습이 해당 주의 등록 조건에 맞나요? 이민용 AITSL skills assessment와 현업 교사 등록은 별도 단계입니다.",
    "links": [
      {
        "label": "AITSL 교사 등록 체계·기관 경로",
        "href": "https://www.aitsl.edu.au/resources/framework-for-teacher-registration-in-australia"
      }
    ]
  },
  "Electrician": {
    "first": "해외 기술 경력에 맞는 TRA 평가 경로와 실제 작업할 주의 전기 면허를 따로 확인하세요.",
    "documents": "교육·자격, 작업 종류와 기간, 고용·경력 증빙을 준비하세요.",
    "question": "내 경로에 OTSR, provisional licence, gap training 또는 감독하 작업이 필요한가요? 해당되는 경로를 확인하고 허가 전 독립 작업이 가능하다고 가정하지 마세요.",
    "links": [
      {
        "label": "TRA 기술 평가와 면허 경로",
        "href": "https://www.tradesrecognitionaustralia.gov.au/licensing"
      }
    ]
  },
  "Plumber": {
    "first": "희망 주와 배관·가스 등 작업 범위를 정한 뒤 TRA 경로와 주별 등록·면허를 따로 확인하세요.",
    "documents": "자격증, 작업 범위·기간과 고용·경력 증빙을 준비하세요.",
    "question": "내 평가 경로와 작업 범위에 필요한 추가 훈련·감독·면허는 무엇인가요? OTSR 등 특정 경로가 모든 사람에게 같다고 가정하지 마세요.",
    "links": [
      {
        "label": "TRA 기술 평가와 면허 경로",
        "href": "https://www.tradesrecognitionaustralia.gov.au/licensing"
      }
    ]
  },
  "Carpenter": {
    "first": "고용직인지 도급·사업인지, 지역과 작업 범위를 정하고 business.gov.au의 건설 산업·ABLIS 경로에서 조건을 찾으세요.",
    "documents": "목공 교육·현장 경력과 작업 범위, 보유 White Card를 정리하세요.",
    "question": "현장 White Card 외에 이 지역·작업·사업 형태에 필요한 면허가 있나요? 모든 목수에게 전국 공통 면허 하나가 필수라고 단정하지 않습니다.",
    "links": [
      {
        "label": "business.gov.au 건설 산업·지역 요건",
        "href": "https://business.gov.au/planning/industry-information/construction-industry"
      }
    ]
  },
  "Motor Mechanic": {
    "first": "고용 정비사 역할인지 수리업체 운영인지 구분하고, 수리 범위에 따른 주별 요건을 확인하세요.",
    "documents": "정비 자격·교육, 수리 경력과 실제 고장 진단 사례를 정리하세요.",
    "question": "이 직원 역할에 필요한 자격과 사업 운영 면허는 각각 무엇인가요? 사업자용 ABLIS는 고용 직원의 개인 자격 전체를 판정하는 도구가 아닙니다.",
    "links": [
      {
        "label": "business.gov.au 사업 면허·허가 경로",
        "href": "https://business.gov.au/Registrations/Register-licences-and-permits"
      }
    ]
  },
  "Civil Engineer": {
    "first": "희망 주와 실제 engineering service의 범위를 정하고 Engineers Australia의 state registration 경로를 확인하세요.",
    "documents": "학위, 관련 프로젝트의 역할·책임과 경력 증빙을 준비하세요.",
    "question": "내 업무 범위에 주별 등록이 필요한가요? 이민 skills assessment 완료와 현업 등록은 같은 결과물이 아닙니다.",
    "links": [
      {
        "label": "Engineers Australia 주별 등록 평가",
        "href": "https://www.engineersaustralia.org.au/credentials/registration/state-registration/assessment-state-registration"
      }
    ]
  }
};
export const careers = baseCareers.map(career => ({ ...career, ...actions[career.title] }));
export const careerSectors = ["전체", ...new Set(careers.map(career => career.sector))];
export function findCareers(query: string, sector = "전체") { const term = query.trim().toLocaleLowerCase(); return careers.filter(career => (sector === "전체" || career.sector === sector) && [career.title, career.korean, career.sector, career.work, ...career.preparation, career.searchTerms, career.first, career.documents, career.question].join(" ").toLocaleLowerCase().includes(term)); }
