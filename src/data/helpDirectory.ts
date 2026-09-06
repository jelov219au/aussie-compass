export type HelpSituationId =
  | "immediate_danger" | "medical_non_emergency" | "mental_health_crisis"
  | "family_sexual_violence" | "housing_homelessness" | "food_essentials"
  | "migration" | "general_legal" | "work_pay" | "interpreter"
  | "poison_exposure" | "debt_scam";

export type HelpAction = { label: string; href: string; kind: "phone" | "web" | "text" | "relay" };
export type HelpSituation = {
  id: HelpSituationId; label: string; service: string; now: string;
  primary: HelpAction; secondary?: HelpAction;
  useWhen: string; notFor: string; availability: string; region: string; eligibility: string;
  connectionFallback: string; languageFallback: string; accessFallback: string; nextService: string;
  source: string; verifiedOn: string; aliases: string[]; needsJurisdiction?: boolean;
};

export const jurisdictions = ["관할 모름", "ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"] as const;
const verifiedOn = "2026-09-07";
const nrs = "다른 청각·언어 접근 방법은 Accesshub/NRS의 현재 연결 방법을 확인하세요.";
const tis = "비긴급이면 TIS 131 450에 전화해 연결하려는 기관명과 번호를 말하세요.";

export const helpSituations: HelpSituation[] = [
  {
    id: "immediate_danger", label: "지금 생명·안전 위험", service: "Triple Zero",
    now: "페이지를 더 읽지 말고 000에 전화해 Police, Fire 또는 Ambulance를 말하세요.",
    primary: { label: "000 전화", href: "tel:000", kind: "phone" },
    secondary: { label: "000 공식 안내", href: "https://www.infrastructure.gov.au/media-communications/phone/triple-zero/how-call-triple-zero-000", kind: "web" },
    useWhen: "생명이 위험하거나 범죄가 진행 중이거나 경찰·소방·구급차가 즉시 필요할 때",
    notFor: "일반 경찰 문의, 비긴급 의료 조언, 행정 문의",
    availability: "24시간 · 000 통화 무료", region: "호주 전역", eligibility: "호주 안의 긴급 상황",
    connectionFallback: "첫 통화가 약 5초 안에 연결되지 않으면 즉시 다시 전화하고, 다음 시도는 최대 60초 기다리세요. 모든 이동통신망이 없으면 000·112 모두 연결되지 않을 수 있습니다. 가능하고 안전하면 유선전화·공중전화·Wi-Fi calling 또는 주변 사람의 도움을 이용하세요.",
    languageFallback: "TIS를 먼저 거치지 마세요. 000에서 Police, Fire 또는 Ambulance를 말하고 연결을 유지해 통역을 요청하세요.",
    accessFallback: "TTY 사용자는 106으로 National Relay Service에 연결할 수 있습니다. " + nrs,
    nextService: "즉시 위험이 아니면 아래 상황 중 하나를 선택하세요.",
    source: "https://www.infrastructure.gov.au/media-communications/phone/triple-zero/how-call-triple-zero-000", verifiedOn,
    aliases: ["000", "응급", "긴급", "경찰", "소방", "구급차", "danger", "emergency"],
  },
  {
    id: "medical_non_emergency", label: "비응급 의료", service: "healthdirect",
    now: "1800 022 222에 전화해 등록 간호사에게 다음 행동을 물어보세요.",
    primary: { label: "1800 022 222 전화", href: "tel:1800022222", kind: "phone" },
    secondary: { label: "healthdirect 공식 안내", href: "https://www.healthdirect.gov.au/how-healthdirect-can-help-you", kind: "web" },
    useWhen: "건강 문제가 있지만 즉시 구급차가 필요한 상황은 아닐 때", notFor: "생명 위협 또는 긴급 의료 상황 — 이 경우 000",
    availability: "24시간 · 무료 서비스(휴대전화 통화료가 들 수 있음)", region: "호주 전역", eligibility: "호주에서 건강 조언이 필요한 사람",
    connectionFallback: "연결되지 않으면 공식 사이트의 service finder로 가까운 진료 경로를 확인하세요.",
    languageFallback: tis, accessFallback: nrs, nextService: "증상이 급격히 악화되거나 생명이 위험해지면 000에 전화하세요.",
    source: "https://www.healthdirect.gov.au/how-healthdirect-can-help-you", verifiedOn,
    aliases: ["의료", "병원", "아픔", "간호사", "health", "doctor"],
  },
  {
    id: "mental_health_crisis", label: "정신건강 위기", service: "Lifeline",
    now: "13 11 14에 전화하거나 0477 13 11 14로 문자해 위기지원 상담원과 연결하세요.",
    primary: { label: "13 11 14 전화", href: "tel:131114", kind: "phone" },
    secondary: { label: "0477 13 11 14 문자", href: "sms:0477131114", kind: "text" },
    useWhen: "감당하기 어렵거나 안전을 유지하기 힘들어 지금 누군가와 이야기해야 할 때", notFor: "즉시 생명 위험 또는 응급 출동 — 이 경우 000",
    availability: "전화·문자·온라인 채팅 24시간", region: "호주 전역", eligibility: "위기지원을 원하는 누구나",
    connectionFallback: "전화가 연결되지 않으면 문자 또는 공식 사이트의 온라인 채팅을 이용하세요.",
    languageFallback: "위기지원은 영어로 제공됩니다. 즉시 위험하지 않고 통역이 필요하면 TIS 131 450에서 연결 가능 여부를 확인하세요.",
    accessFallback: "전화가 어렵다면 문자 또는 온라인 채팅을 이용하세요.", nextService: "즉시 생명 위험이면 연결을 기다리지 말고 000에 전화하세요.",
    source: "https://www.lifeline.org.au/about-us/our-services", verifiedOn,
    aliases: ["정신건강", "마음", "위기", "자살", "lifeline", "상담"],
  },
  {
    id: "family_sexual_violence", label: "가정·성폭력", service: "1800RESPECT",
    now: "1800 737 732로 전화하거나 0458 737 732로 문자해 안전한 다음 단계를 상담하세요.",
    primary: { label: "1800 737 732 전화", href: "tel:1800737732", kind: "phone" },
    secondary: { label: "0458 737 732 문자", href: "sms:0458737732", kind: "text" },
    useWhen: "가정·가족·성폭력의 영향을 받았거나 안전이 걱정될 때", notFor: "지금 위험하거나 범죄가 진행 중인 상황 — 이 경우 000",
    availability: "전화·문자·채팅·영상 24시간", region: "호주 전역", eligibility: "폭력의 영향을 받은 사람과 지원하는 사람",
    connectionFallback: "전화에는 유효한 SIM과 이동통신망 또는 유선전화가 필요합니다. 연결이 어렵다면 안전한 기기에서 문자·채팅·영상을 확인하세요.",
    languageFallback: "상담 연결 뒤 TIS 통역을 요청할 수 있습니다. 즉시 위험하면 TIS를 먼저 거치지 말고 000에 전화하세요.",
    accessFallback: "전화가 어렵다면 문자·채팅·영상 상담을 이용할 수 있습니다.",
    nextService: "통화·문자·브라우저 기록이 기기나 명세에 남을 수 있습니다. 기록 삭제가 위험을 키울 수 있으면 무리하지 마세요.",
    source: "https://1800respect.org.au/calling-1800respect", verifiedOn,
    aliases: ["가정폭력", "성폭력", "폭력", "안전", "1800respect", "domestic violence"],
  },
  {
    id: "housing_homelessness", label: "주거·노숙", service: "Services Australia homelessness hub",
    now: "공식 주거 도움 페이지를 열고 선택한 주·준주의 emergency accommodation 경로를 확인하세요.",
    primary: { label: "주거 도움 공식 페이지", href: "https://www.servicesaustralia.gov.au/homelessness?context=60023", kind: "web" },
    useWhen: "노숙, 임시 숙소·refuge, couch surfing 또는 오늘 안전한 숙소가 없을 때", notFor: "즉시 폭력·생명 위험 — 000, 가정·성폭력 지원 — 1800RESPECT",
    availability: "관할 서비스마다 다름 · 공식 페이지에서 현재 확인", region: "주·준주별 연결", eligibility: "서비스마다 다름 · couch surfing도 주거 불안에 포함될 수 있음",
    connectionFallback: "관할 서비스를 찾지 못하거나 닫혔다면 national hub에서 다른 지역 경로와 food support를 확인하세요.",
    languageFallback: tis, accessFallback: "전화가 어렵다면 official national hub의 웹 경로를 이용하세요.",
    nextService: "오늘 먹을 것·교통·약도 부족하면 Emergency Relief도 함께 확인하세요.",
    source: "https://www.servicesaustralia.gov.au/homelessness?context=60023", verifiedOn,
    aliases: ["주거", "노숙", "렌트", "오늘 잘 곳", "집", "homeless", "housing", "couch surfing"], needsJurisdiction: true,
  },
  {
    id: "food_essentials", label: "음식·생계", service: "DSS Emergency Relief",
    now: "Emergency Relief 공식 페이지에서 가까운 제공기관을 찾고 가능한 도움을 확인하세요.",
    primary: { label: "Emergency Relief 찾기", href: "https://www.dss.gov.au/emergency-support/emergency-relief", kind: "web" },
    useWhen: "재정 위기로 음식, 교통, 약, 의류 또는 공과금 일부 지원이 필요할 때", notFor: "현금이나 즉시 지급이 보장되는 서비스가 아님",
    availability: "제공기관마다 다름 · 공식 페이지에서 현재 확인", region: "호주 전역의 지역 제공기관", eligibility: "지원 종류와 조건은 제공기관마다 다름",
    connectionFallback: "한 기관이 지원하지 않으면 공식 목록의 다른 지역 제공기관을 확인하세요.",
    languageFallback: tis, accessFallback: "웹 이용이 어렵다면 Services Australia에 지역 사회복지 지원 경로를 문의하세요.",
    nextService: "채무·청구서 대응이 필요하면 National Debt Helpline도 확인하세요.",
    source: "https://www.dss.gov.au/emergency-support/emergency-relief", verifiedOn,
    aliases: ["음식", "생계", "밥", "약", "교통", "바우처", "food", "emergency relief"],
  },
  {
    id: "migration", label: "이민·비자", service: "Department of Home Affairs",
    now: "Home Affairs 안내에서 도움 제공자가 등록 migration agent, legal practitioner 또는 exempt person인지 확인하세요.",
    primary: { label: "공인 도움 확인", href: "https://immi.homeaffairs.gov.au/help-support/who-can-help-with-your-application/overview", kind: "web" },
    useWhen: "비자 신청이나 이민 사안에 절차상 도움이 필요할 때", notFor: "이 디렉터리는 비자 결과·자격을 판정하거나 immigration assistance를 제공하지 않음",
    availability: "공식 웹 안내 상시 · 상담시간은 제공자마다 다름", region: "호주 이민 절차", eligibility: "도움을 제공하는 사람의 권한을 공식 안내에서 확인",
    connectionFallback: "링크가 열리지 않으면 Home Affairs 사이트에서 ‘who can help with your application’을 검색하세요.",
    languageFallback: "Home Affairs의 translating and interpreting 안내 또는 TIS 131 450을 확인하세요.",
    accessFallback: "접근성 지원은 Home Affairs accessibility 안내에서 확인하세요.", nextService: "일반 법률 문제라면 주·준주 Legal Aid 경로를 확인하세요.",
    source: "https://immi.homeaffairs.gov.au/help-support/who-can-help-with-your-application/overview", verifiedOn,
    aliases: ["이민", "비자", "migration", "visa", "agent", "home affairs"],
  },
  {
    id: "general_legal", label: "일반 법률", service: "Australian Legal Aid commissions",
    now: "연방 법률지원 안내를 열고 선택한 주·준주의 Legal Aid commission으로 이동하세요.",
    primary: { label: "Legal Aid 관할 찾기", href: "https://www.ag.gov.au/legal-system/legal-assistance-services", kind: "web" },
    useWhen: "법률 정보나 상담, 가능한 대리 지원 경로를 찾을 때", notFor: "모든 상담·대리가 무료이거나 자동 승인되는 서비스가 아님",
    availability: "commission마다 다름 · 공식 페이지에서 현재 확인", region: "주·준주별 Legal Aid commission",
    eligibility: "정보·상담과 representation이 다르며, 대리는 means·merits 등 심사가 있을 수 있음",
    connectionFallback: "담당하지 않으면 해당 commission에 community legal centre 등 다음 기관을 문의하세요.",
    languageFallback: tis, accessFallback: nrs, nextService: "비자 사안의 immigration assistance는 Home Affairs의 authorised help 경로를 확인하세요.",
    source: "https://www.ag.gov.au/legal-system/legal-assistance-services", verifiedOn,
    aliases: ["법률", "법", "legal", "legal aid", "변호사", "상담"], needsJurisdiction: true,
  },
  {
    id: "work_pay", label: "직장·임금", service: "Fair Work Infoline",
    now: "13 13 94에 전화해 workplace rights와 적용되는 공식 정보를 확인하세요.",
    primary: { label: "13 13 94 전화", href: "tel:131394", kind: "phone" },
    secondary: { label: "Fair Work 공식 안내", href: "https://www.fairwork.gov.au/about-us/contact-us/call-us", kind: "web" },
    useWhen: "임금, Award, 해고 또는 근로조건 관련 일반 정보가 필요할 때", notFor: "법률 조언, 세금, 미지급 super 등 모든 직장 문제를 최종 처리하는 기관은 아님",
    availability: "월–금 8:00–17:30 · 공휴일 제외", region: "호주 전역", eligibility: "호주 workplace system 관련 문의",
    connectionFallback: "운영시간 밖이면 공식 사이트의 정보와 문의 경로를 확인하세요.",
    languageFallback: "TIS 131 450에 전화해 Fair Work 13 13 94 연결을 요청할 수 있습니다.", accessFallback: nrs,
    nextService: "담당 범위가 아니면 Fair Work 안내에 따라 세무·super·법률 기관을 확인하세요.",
    source: "https://www.fairwork.gov.au/about-us/contact-us/call-us", verifiedOn,
    aliases: ["직장", "급여", "임금", "award", "해고", "fair work", "pay"],
  },
  {
    id: "interpreter", label: "통역", service: "TIS National",
    now: "131 450에 전화해 언어와 연결하려는 기관명·공식 전화번호를 말하세요.",
    primary: { label: "131 450 전화", href: "tel:131450", kind: "phone" },
    secondary: { label: "TIS 공식 안내", href: "https://www.tisnational.gov.au/Non-English-speakers/Interpreting-services", kind: "web" },
    useWhen: "비긴급 기관 전화에 통역이 필요할 때", notFor: "긴급 상황 — TIS를 먼저 거치지 말고 000",
    availability: "Immediate phone interpreting 24시간", region: "호주 전역",
    eligibility: "대부분 비영어 사용자에게 무료이나 연결 기관이 통역 비용을 받는지에 따라 달라질 수 있음",
    connectionFallback: "해당 언어 통역사가 없으면 다시 전화하도록 안내받을 수 있습니다.",
    languageFallback: "전화 연결 후 ‘Korean’을 말하고 기관명과 번호를 준비하세요.", accessFallback: nrs,
    nextService: "기관 자체 통역 번호가 있으면 그 공식 안내를 먼저 확인하세요.",
    source: "https://www.tisnational.gov.au/Non-English-speakers/Interpreting-services", verifiedOn,
    aliases: ["통역", "한국어", "영어", "번역", "interpreter", "korean", "tis"],
  },
  {
    id: "poison_exposure", label: "중독 노출", service: "Poisons Information Centre",
    now: "증상을 기다리지 말고 13 11 26에 전화해 응급처치 조언을 받으세요.",
    primary: { label: "13 11 26 전화", href: "tel:131126", kind: "phone" },
    secondary: { label: "중독 공식 안내", href: "https://www.healthdirect.gov.au/pesticides", kind: "web" },
    useWhen: "약, 세제, 화학물질 등을 먹거나 피부·눈·호흡으로 노출됐을 때", notFor: "쓰러짐·호흡 문제·경련·심한 알레르기 반응 — 이 경우 000",
    availability: "24시간", region: "호주 전역", eligibility: "중독 노출이 의심되는 사람",
    connectionFallback: "가능하면 용기와 노출 시각을 준비하되 준비 때문에 전화를 늦추지 마세요.",
    languageFallback: tis, accessFallback: nrs, nextService: "증상이 심해지거나 생명 위험이면 000에 전화하세요.",
    source: "https://www.healthdirect.gov.au/pesticides", verifiedOn,
    aliases: ["중독", "약", "세제", "화학물질", "poison", "pesticide"],
  },
  {
    id: "debt_scam", label: "채무·사기", service: "National Debt Helpline",
    now: "채무·청구서는 1800 007 007에 전화하세요. 사기로 돈·금융정보를 잃었다면 먼저 은행에 연락하세요.",
    primary: { label: "1800 007 007 전화", href: "tel:1800007007", kind: "phone" },
    secondary: { label: "Scamwatch 신고", href: "https://www.scamwatch.gov.au/report-a-scam", kind: "web" },
    useWhen: "청구서·대출·채무 대응 순서가 필요하거나 사기 의심 활동을 신고할 때", notFor: "Scamwatch 신고는 경찰 신고가 아님. 현재 범죄·위험이면 000",
    availability: "Debt phone 월–금 9:30–16:30 · live chat 월–금 9:00–20:00", region: "호주 전역",
    eligibility: "financial counselling은 무료 · 복잡한 문제는 지역 서비스로 연결될 수 있음",
    connectionFallback: "전화 운영시간 밖이면 National Debt Helpline live chat 또는 공식 사이트를 이용하세요.",
    languageFallback: tis, accessFallback: "전화가 어렵다면 Debt live chat 또는 Scamwatch 웹 신고를 이용하세요.",
    nextService: "사기로 금전·금융정보를 잃었다면 은행을 먼저 연락하고 ReportCyber·경찰 경로도 상황에 따라 확인하세요.",
    source: "https://ndh.org.au/about-national-debt-helpline/contact-us/", verifiedOn,
    aliases: ["채무", "빚", "청구서", "사기", "scam", "debt", "은행"],
  },
];

export const accessHubUrl = "https://www.accesshub.gov.au/about-the-nrs/nrs-call-numbers-and-links";
