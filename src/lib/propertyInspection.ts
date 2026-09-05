export type InspectionMode = "share" | "rent" | "buy";
export type InspectionStatus = "ok" | "concern";
type Item = { id: string; label: string; hint: string; modes?: InspectionMode[] };
type Group = { title: string; items: Item[] };

export const inspectionGroups: Group[] = [
  { title: "방과 집 상태", items: [
    { id: "mould", label: "곰팡이·습기·물 얼룩", hint: "창가, 천장, 옷장 안과 욕실 모서리까지 확인" },
    { id: "cracks", label: "균열·누수·들뜬 페인트", hint: "최근 칠한 부분이 문제를 가린 것은 아닌지 질문" },
    { id: "windows", label: "창문·방충망·환기", hint: "직접 열고 닫아 잠금과 외풍 확인" },
    { id: "doors", label: "방문·현관문·잠금장치", hint: "개인 방 잠금 가능 여부와 열쇠 제공 범위" },
    { id: "light", label: "자연광·조명·프라이버시", hint: "낮에도 어두운지, 맞은편에서 방 안이 보이는지 확인" },
    { id: "storage", label: "수납공간과 가구 상태", hint: "포함 가구, 파손, 침대 매트리스 상태 기록" },
  ]},
  { title: "물·전기·온도", items: [
    { id: "water", label: "수압과 온수", hint: "샤워와 싱크를 틀어 압력·배수·온수 대기시간 확인" },
    { id: "toilet", label: "화장실·배수·악취", hint: "변기 물 내림, 배수 속도와 하수구 냄새 확인" },
    { id: "power", label: "콘센트 위치와 상태", hint: "그을림·헐거움은 만지지 말고 관리 주체에게 질문" },
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
    { id: "bond", label: "보증금 금액과 공식 처리 방식", hint: "현금 전달을 서두르지 말고 관할 지역의 공식 절차 확인", modes: ["share", "rent"] },
    { id: "agreement", label: "서면 계약과 계약 당사자", hint: "이름, 기간, 퇴거 통지, 임대·전대 권한 확인", modes: ["share", "rent"] },
    { id: "extra-fees", label: "추가 비용", hint: "열쇠, 주차, 청소, 가구, 퇴실 관련 비용을 서면 확인", modes: ["share", "rent"] },
    { id: "condition", label: "Condition report·입주 사진", hint: "기존 손상과 오염을 상세히 기록하고 사본 보관", modes: ["rent", "share"] },
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


export type Inspection = { mode: InspectionMode; propertyName: string; statuses: Record<string, InspectionStatus>; notes: string };
export const emptyInspection: Inspection = { mode: "share", propertyName: "", statuses: {}, notes: "" };
const ids = new Set(inspectionGroups.flatMap(group => group.items.map(item => item.id)));
const text = (v: unknown, max: number) => typeof v === "string" && v.length <= max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v);
export function parseInspection(raw: string): Inspection | null {
  try { const v = JSON.parse(raw); if (!v || typeof v !== "object" || Array.isArray(v) || Object.keys(v).some(key => !["mode", "propertyName", "statuses", "notes"].includes(key)) || !["share", "rent", "buy"].includes(v.mode) || !text(v.propertyName, 60) || !text(v.notes, 1500) || !v.statuses || typeof v.statuses !== "object" || Array.isArray(v.statuses) || Object.entries(v.statuses).some(([id, status]) => !ids.has(id) || (status !== "ok" && status !== "concern"))) return null; return v as Inspection; } catch { return null; }
}
export const serializeInspection = (data: Inspection) => { const raw = JSON.stringify(data); return parseInspection(raw) ? raw : null; };
export const visibleInspectionGroups = (mode: InspectionMode) => inspectionGroups.map(group => ({ ...group, items: group.items.filter(item => !item.modes || item.modes.includes(mode)) })).filter(group => group.items.length);
export function inspectionSummary(data: Inspection) {
  const items = visibleInspectionGroups(data.mode).flatMap(group => group.items), ok = items.filter(item => data.statuses[item.id] === "ok"), concerns = items.filter(item => data.statuses[item.id] === "concern"), unknown = items.filter(item => !data.statuses[item.id]);
  return ["집 방문 체크 — " + (data.propertyName || "이름 미입력"), "유형: " + ({ share: "쉐어하우스", rent: "일반 렌트", buy: "구매" })[data.mode], "괜찮음 표시 " + ok.length + " · 우려 " + concerns.length + " · 미확인 " + unknown.length, "", "괜찮음으로 표시한 항목:", ...(ok.length ? ok.map(item => "- " + item.label) : ["- 없음"]), "", "다시 확인할 우려:", ...(concerns.length ? concerns.map(item => "- " + item.label + ": " + item.hint) : ["- 아직 우려 표시 없음 · 안전 판정이 아닙니다."]), "", "아직 확인하지 않은 항목:", ...(unknown.length ? unknown.map(item => "- " + item.label) : ["- 없음"]), "", "메모:", data.notes || "없음", "", "이 도구는 한 번에 한 집의 기록만 보관합니다. 미확인 위험은 괜찮음 개수로 상쇄되지 않습니다. 계약 전 관할 규정과 적격 전문가 확인이 필요합니다."].join("\n");
}
