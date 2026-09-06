export type InspectionMode = "share" | "rent" | "buy";
export type InspectionStatus = "ok" | "pending" | "red_flag" | "not_applicable";
export type RentalJurisdictionId = "NSW" | "VIC" | "QLD" | "WA" | "SA" | "TAS" | "ACT" | "NT";
export type RentalRelationship = "tenant" | "co_tenant" | "sub_tenant" | "boarder_lodger_rooming_occupant" | "unsure";
export type InspectionDecision = "apply" | "reject" | "follow_up";
export type InspectionNextAction = "ask_question" | "verify_authority" | "compare_cost_commute" | "prepare_application" | "stop_contact" | "official_help";
export type InspectionRejectReason = "authority_unverified" | "inspection_refused" | "listing_mismatch" | "safety_risk" | "unresolved_condition" | "money_or_bond" | "payment_pressure";
export type EvidenceKind = "ad" | "photo" | "video" | "written_reply" | "condition_report" | "receipt";
export type EvidenceStatus = "have" | "requested" | "none";

type Item = { id: string; label: string; hint: string; modes?: InspectionMode[] };
type Group = { title: string; items: Item[] };

export const inspectionGroups: Group[] = [
  { title: "방과 집 상태", items: [
    { id: "mould", label: "곰팡이·습기·물 얼룩", hint: "어느 방·욕실·주방·공용부인지 구분해 확인" },
    { id: "cracks", label: "균열·누수·들뜬 페인트", hint: "최근 칠한 부분이 문제를 가린 것은 아닌지 질문" },
    { id: "windows", label: "창문·방충망·환기", hint: "직접 열고 닫아 잠금과 외풍 확인" },
    { id: "doors", label: "방문·현관문·잠금장치", hint: "개인 방 잠금 가능 여부와 열쇠 제공 범위" },
    { id: "light", label: "자연광·조명·프라이버시", hint: "낮에도 어두운지, 맞은편에서 방 안이 보이는지 확인" },
    { id: "storage", label: "수납공간과 가구 상태", hint: "포함 가구, 파손, 침대 매트리스 상태 기록" },
    { id: "external-common", label: "외부·발코니·공용부", hint: "공동현관, 복도·리프트, 쓰레기·창고·공용 세탁 공간 확인", modes: ["share", "rent"] },
  ]},
  { title: "물·전기·온도", items: [
    { id: "water", label: "수압과 온수", hint: "샤워와 싱크를 틀어 압력·배수·온수 대기시간 확인" },
    { id: "toilet", label: "화장실·배수·악취", hint: "변기 물 내림, 배수 속도와 하수구 냄새 확인" },
    { id: "power", label: "콘센트 위치와 상태", hint: "그을림·헐거움은 만지지 말고 관리 주체에게 질문" },
    { id: "gas-meter", label: "가스·계량기·안전 스위치", hint: "위치와 관리 주체만 확인하고 냄새·노출 전선은 직접 시험하지 않기", modes: ["share", "rent"] },
    { id: "heating", label: "난방·냉방·단열", hint: "작동 여부, 사용 가능 시간, 예상 비용 확인" },
    { id: "internet", label: "인터넷과 휴대전화 수신", hint: "제공 속도·요금·통신사와 방 안 수신 상태 확인" },
    { id: "appliances", label: "주방·세탁 가전", hint: "냉장고 공간, 화구, 오븐, 세탁기 사용 규칙 확인" },
  ]},
  { title: "안전과 위생", items: [
    { id: "smoke", label: "연기 경보기", hint: "설치 위치와 최근 점검 여부를 묻고 임의로 분리하지 않기" },
    { id: "exit", label: "비상 대피 경로", hint: "현관 외 대피 가능 경로와 창문 개방 여부 확인" },
    { id: "pests", label: "해충 흔적", hint: "바퀴·쥐 배설물, 덫, 싱크대 아래 틈 확인" },
    { id: "security", label: "건물 출입과 주변 보안", hint: "공동현관, 창문 잠금, 밤길과 조명 확인" },
    { id: "parking", label: "주차·자전거 보관", hint: "전용 여부, 허가, 추가 요금과 도난 위험 확인" },
    { id: "hazards", label: "파손·노출 전선·미끄럼 위험", hint: "직접 수리하지 말고 입주 전 조치 내용을 서면 확인" },
  ]},
  { title: "쉐어 생활", items: [
    { id: "people", label: "실제 거주 인원과 방 구성", hint: "광고와 같은지, 거실을 방으로 쓰는 사람이 있는지 확인", modes: ["share"] },
    { id: "bathroom-share", label: "욕실·주방 공유 인원", hint: "출근 시간대 사용 충돌과 청소 방식 질문", modes: ["share"] },
    { id: "house-rules", label: "청소·손님·소음 규칙", hint: "파트너 방문, 파티, 조용한 시간과 공용품 분담 확인", modes: ["share"] },
    { id: "lifestyle", label: "흡연·반려동물·생활 패턴", hint: "교대근무, 재택근무, 알레르기에 영향을 주는 요소", modes: ["share"] },
    { id: "food-storage", label: "냉장고·팬트리 개인 공간", hint: "개인 식품 보관 공간과 공용품 비용 방식", modes: ["share"] },
    { id: "who-manages", label: "수리·갈등 연락 담당자", hint: "집주인, 주 임차인, 에이전트 중 누구와 계약·소통하는지", modes: ["share"] },
  ]},
  { title: "비용과 계약", items: [
    { id: "rent", label: "정확한 주세와 납부 방식", hint: "주·월 금액, 납부일, 계좌와 영수증 제공 여부", modes: ["share", "rent"] },
    { id: "bills", label: "공과금 포함·분담 기준", hint: "전기·가스·수도·인터넷의 포함 여부와 계산 근거", modes: ["share", "rent"] },
    { id: "bond", label: "보증금과 공식 처리 방식", hint: "이 계약 유형에 제도가 적용되는 경우 접수 기관·담당자·영수증을 확인", modes: ["share", "rent"] },
    { id: "agreement", label: "서면 계약과 계약 당사자", hint: "기간, 퇴거 통지, 임대·전대 권한과 계약 형태 확인", modes: ["share", "rent"] },
    { id: "extra-fees", label: "추가 비용", hint: "열쇠, 주차, 청소, 가구, 퇴실 관련 비용을 서면 확인", modes: ["share", "rent"] },
    { id: "condition", label: "Condition report·입주 기록", hint: "이 계약 유형에 적용되는 경우 양식·기한·사진 방식, 아니면 대체 서면 기록 확인", modes: ["rent", "share"] },
    { id: "bylaws-move-in", label: "공용 규칙·주차·이사 예약", hint: "해당되는 경우 by-laws, 주차 권리, 리프트·move-in 예약과 비용 확인", modes: ["share", "rent"] },
    { id: "purchase-price", label: "매매가격과 총 초기 비용", hint: "매매가격 외 세금·전문가 비용 등 초기 비용을 별도로 확인", modes: ["buy"] },
    { id: "ongoing-costs", label: "보유 중 정기 비용", hint: "관리비·strata·rates·보험·수리비의 근거 자료 확인", modes: ["buy"] },
    { id: "contract-review", label: "매매 계약 조건 검토", hint: "계약 조건과 권리·의무는 자격 있는 법률 전문가에게 검토 요청", modes: ["buy"] },
    { id: "inspection-docs", label: "Title·strata·building/pest 자료", hint: "권리·공동관리·건물·해충 자료를 각각 적격 전문가의 확인 대상으로 구분", modes: ["buy"] },
    { id: "building-docs", label: "건물·수리·보험 관련 조사", hint: "전문 건물·해충 검사와 법률 검토가 필요한지 판단", modes: ["buy"] },
  ]},
  { title: "위치와 실제 생활", items: [
    { id: "transport", label: "출퇴근과 대중교통", hint: "평일·주말 운행, 막차와 실제 도보 경로 확인" },
    { id: "noise", label: "도로·이웃·공사 소음", hint: "창문을 닫고 열어 들어보고 다른 시간대도 방문" },
    { id: "shops", label: "장보기·병원·세탁 등", hint: "차 없이 필요한 생활이 가능한지 확인" },
    { id: "risks", label: "침수·산불·지역 위험", hint: "관할 정부 지도와 보험 가능 여부를 별도로 조사", modes: ["rent", "buy"] },
    { id: "future", label: "예정된 공사·개발", hint: "건물과 인근의 공사, 도로·교통 변경 계획 확인" },
  ]},
];

export const evidenceKinds: Array<{ id: EvidenceKind; label: string }> = [
  { id: "ad", label: "광고" },
  { id: "photo", label: "사진" },
  { id: "video", label: "영상" },
  { id: "written_reply", label: "서면 답변" },
  { id: "condition_report", label: "Condition report" },
  { id: "receipt", label: "영수증" },
];

export type Inspection = {
  version: 2;
  mode: InspectionMode;
  propertyName: string;
  statuses: Record<string, InspectionStatus>;
  notes: string;
  reviewNeeded: string[];
  jurisdiction: RentalJurisdictionId | "";
  relationship: RentalRelationship | "";
  officialChecked: boolean;
  evidence: Partial<Record<EvidenceKind, EvidenceStatus>>;
  decision: InspectionDecision | "";
  nextAction: InspectionNextAction | "";
  rejectReason: InspectionRejectReason | "";
  followUpQuestion: string;
  followUpRole: string;
  followUpDate: string;
};

export const emptyInspection: Inspection = {
  version: 2,
  mode: "share",
  propertyName: "",
  statuses: {},
  notes: "",
  reviewNeeded: [],
  jurisdiction: "",
  relationship: "",
  officialChecked: false,
  evidence: {},
  decision: "",
  nextAction: "",
  rejectReason: "",
  followUpQuestion: "",
  followUpRole: "",
  followUpDate: "",
};

const ids = new Set(inspectionGroups.flatMap(group => group.items.map(item => item.id)));
const jurisdictions = new Set<RentalJurisdictionId>(["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"]);
const relationships = new Set<RentalRelationship>(["tenant", "co_tenant", "sub_tenant", "boarder_lodger_rooming_occupant", "unsure"]);
const statuses = new Set<InspectionStatus>(["ok", "pending", "red_flag", "not_applicable"]);
const decisions = new Set<InspectionDecision>(["apply", "reject", "follow_up"]);
const nextActions = new Set<InspectionNextAction>(["ask_question", "verify_authority", "compare_cost_commute", "prepare_application", "stop_contact", "official_help"]);
const rejectReasons = new Set<InspectionRejectReason>(["authority_unverified", "inspection_refused", "listing_mismatch", "safety_risk", "unresolved_condition", "money_or_bond", "payment_pressure"]);
const evidenceIds = new Set<EvidenceKind>(evidenceKinds.map(item => item.id));
const evidenceStatuses = new Set<EvidenceStatus>(["have", "requested", "none"]);
const text = (value: unknown, max: number) => typeof value === "string" && value.length <= max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value);
const date = (value: unknown) => value === "" || (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value));

export function parseInspection(raw: string): Inspection | null {
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const allowed = new Set(["version", "mode", "propertyName", "statuses", "notes", "reviewNeeded", "jurisdiction", "relationship", "officialChecked", "evidence", "decision", "nextAction", "rejectReason", "followUpQuestion", "followUpRole", "followUpDate"]);
    if (Object.keys(value).some(key => !allowed.has(key))
      || !["share", "rent", "buy"].includes(String(value.mode))
      || !text(value.propertyName, 60)
      || !text(value.notes, 1500)
      || !value.statuses || typeof value.statuses !== "object" || Array.isArray(value.statuses)) return null;

    const parsedStatuses: Record<string, InspectionStatus> = {};
    const legacyReviewNeeded = new Set<string>();
    for (const [id, status] of Object.entries(value.statuses)) {
      if (!ids.has(id)) return null;
      if (status === "concern") {
        parsedStatuses[id] = "pending";
        legacyReviewNeeded.add(id);
      } else if (typeof status === "string" && statuses.has(status as InspectionStatus)) {
        parsedStatuses[id] = status as InspectionStatus;
      } else return null;
    }

    const reviewNeeded = value.reviewNeeded ?? [];
    if (!Array.isArray(reviewNeeded) || reviewNeeded.some(id => typeof id !== "string" || !ids.has(id))) return null;
    reviewNeeded.forEach(id => legacyReviewNeeded.add(id as string));

    const jurisdiction = value.jurisdiction ?? "";
    const relationship = value.relationship ?? "";
    const officialChecked = value.officialChecked ?? false;
    const evidence = value.evidence ?? {};
    const decision = value.decision ?? "";
    const nextAction = value.nextAction ?? "";
    const rejectReason = value.rejectReason ?? "";
    const followUpQuestion = value.followUpQuestion ?? "";
    const followUpRole = value.followUpRole ?? "";
    const followUpDate = value.followUpDate ?? "";

    if ((jurisdiction !== "" && (!text(jurisdiction, 3) || !jurisdictions.has(jurisdiction as RentalJurisdictionId)))
      || (relationship !== "" && (!text(relationship, 40) || !relationships.has(relationship as RentalRelationship)))
      || typeof officialChecked !== "boolean"
      || typeof evidence !== "object" || Array.isArray(evidence) || Object.entries(evidence).some(([id, status]) => !evidenceIds.has(id as EvidenceKind) || !evidenceStatuses.has(status as EvidenceStatus))
      || (decision !== "" && (!text(decision, 16) || !decisions.has(decision as InspectionDecision)))
      || (nextAction !== "" && (!text(nextAction, 24) || !nextActions.has(nextAction as InspectionNextAction)))
      || (rejectReason !== "" && (!text(rejectReason, 24) || !rejectReasons.has(rejectReason as InspectionRejectReason)))
      || !text(followUpQuestion, 500)
      || !text(followUpRole, 80)
      || !date(followUpDate)) return null;

    return {
      version: 2,
      mode: value.mode as InspectionMode,
      propertyName: value.propertyName as string,
      statuses: parsedStatuses,
      notes: value.notes as string,
      reviewNeeded: [...legacyReviewNeeded],
      jurisdiction: jurisdiction as RentalJurisdictionId | "",
      relationship: relationship as RentalRelationship | "",
      officialChecked,
      evidence: evidence as Partial<Record<EvidenceKind, EvidenceStatus>>,
      decision: decision as InspectionDecision | "",
      nextAction: nextAction as InspectionNextAction | "",
      rejectReason: rejectReason as InspectionRejectReason | "",
      followUpQuestion: followUpQuestion as string,
      followUpRole: followUpRole as string,
      followUpDate: followUpDate as string,
    };
  } catch { return null; }
}

export const serializeInspection = (data: Inspection) => {
  const raw = JSON.stringify(data);
  return parseInspection(raw) ? raw : null;
};

export const visibleInspectionGroups = (mode: InspectionMode) => inspectionGroups
  .map(group => ({ ...group, items: group.items.filter(item => !item.modes || item.modes.includes(mode)) }))
  .filter(group => group.items.length);

export function inspectionDecisionReadiness(data: Inspection) {
  const items = visibleInspectionGroups(data.mode).flatMap(group => group.items);
  const visibleStatuses = items.map(item => data.statuses[item.id]);
  const reviewed = visibleStatuses.filter(Boolean).length;
  const unanswered = visibleStatuses.filter(status => !status).length;
  const pending = visibleStatuses.filter(status => status === "pending").length;
  const redFlags = visibleStatuses.filter(status => status === "red_flag").length;
  const blockers: string[] = [];

  if (data.mode === "buy") blockers.push("구매 점검은 이 임대 신청 판단의 별도 범위입니다.");
  if (!data.propertyName.trim()) blockers.push("정확한 주소 대신 집 별칭을 입력하세요.");
  if (reviewed === 0) blockers.push("점검 항목을 하나 이상 확인하세요.");
  if (!data.jurisdiction) blockers.push("집이 있는 주·준주를 선택하세요.");
  if (!data.relationship) blockers.push("계약 관계를 선택하세요.");
  if (!data.decision) blockers.push("신청·거절·추가 확인 중 하나를 선택하세요.");
  if (!data.nextAction) blockers.push("다음 행동 하나를 선택하세요.");

  if (data.decision === "apply") {
    if (data.relationship === "unsure") blockers.push("계약 관계를 서면으로 확인하기 전에는 신청으로 닫을 수 없습니다.");
    if (!data.officialChecked) blockers.push("선택한 관할의 공식 안내를 확인하세요.");
    if (unanswered > 0 || pending > 0) blockers.push("미확인·답변 대기 항목을 모두 닫으세요.");
    if (redFlags > 0) blockers.push("중단 신호가 남아 있어 신청할 수 없습니다.");
  }
  if (data.decision === "reject" && !data.rejectReason) blockers.push("개인정보가 없는 거절 이유 범주를 선택하세요.");
  if (data.decision === "follow_up") {
    if (!data.followUpQuestion.trim()) blockers.push("담당자에게 보낼 질문을 적으세요.");
    if (!data.followUpRole.trim()) blockers.push("답할 담당 역할을 적으세요.");
    if (!data.followUpDate) blockers.push("다시 확인할 날짜를 정하세요.");
  }

  return { ready: blockers.length === 0, blockers, reviewed, unanswered, pending, redFlags };
}

const modeLabels: Record<InspectionMode, string> = { share: "쉐어하우스", rent: "일반 렌트", buy: "구매" };
const statusLabels: Record<InspectionStatus, string> = { ok: "괜찮음", pending: "답변 대기", red_flag: "중단 신호", not_applicable: "해당 없음" };
const decisionLabels: Record<InspectionDecision, string> = { apply: "신청", reject: "거절", follow_up: "추가 확인" };
const nextActionLabels: Record<InspectionNextAction, string> = { ask_question: "질문 보내기", verify_authority: "계약 권한 확인", compare_cost_commute: "비용·통근 비교", prepare_application: "신청 준비", stop_contact: "연락·송금 중단", official_help: "공식 도움 요청" };

export function inspectionSummary(data: Inspection) {
  const items = visibleInspectionGroups(data.mode).flatMap(group => group.items);
  const byStatus = (status: InspectionStatus) => items.filter(item => data.statuses[item.id] === status);
  const unknown = items.filter(item => !data.statuses[item.id]);
  const evidence = evidenceKinds.filter(item => data.evidence[item.id]);
  return [
    "한 집 방문 결정 — " + (data.propertyName || "별칭 미입력"),
    "유형: " + modeLabels[data.mode],
    "관할: " + (data.jurisdiction || "미선택") + " · 계약 관계: " + (data.relationship || "미선택"),
    `괜찮음 ${byStatus("ok").length} · 답변 대기 ${byStatus("pending").length} · 중단 신호 ${byStatus("red_flag").length} · 해당 없음 ${byStatus("not_applicable").length} · 미확인 ${unknown.length}`,
    "결정: " + (data.decision ? decisionLabels[data.decision] : "미선택"),
    "다음 행동: " + (data.nextAction ? nextActionLabels[data.nextAction] : "미선택"),
    data.decision === "follow_up" ? `추가 확인: ${data.followUpQuestion} · 담당 역할 ${data.followUpRole} · 재확인일 ${data.followUpDate}` : "",
    "",
    "확인할 항목:",
    ...(["pending", "red_flag"] as const).flatMap(status => byStatus(status).map(item => `- [${statusLabels[status]}] ${item.label}: ${item.hint}`)),
    byStatus("pending").length + byStatus("red_flag").length ? "" : "- 없음",
    "",
    "개인 보관 증거 index (파일·URL 미포함):",
    ...(evidence.length ? evidence.map(item => `- ${item.label}: ${data.evidence[item.id]}`) : ["- 없음"]),
    "",
    "메모:",
    data.notes || "없음",
    "",
    "Hoju Compass에는 사진·영상·문서 원문, 정확한 주소, agent 이름을 넣지 않았습니다. 신청 결정은 송금 승인이 아니며 서명·송금 직전 관할 공식 안내를 다시 확인합니다.",
  ].filter((line, index, lines) => line !== "" || lines[index - 1] !== "").join("\n");
}
