"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { createRentalReadyNowHandoff, rentalReadyNowHandoffStorageKey } from "@/lib/rentalReadyNowHandoff";
import { propertyInspectionStorageKey } from "@/lib/rentalApplicationProDeviceStorage";

type Mode = "share" | "rent" | "buy";
type Status = "ok" | "concern";
type Item = { id: string; label: string; hint: string; modes?: Mode[] };
type Group = { title: string; items: Item[] };

const groups: Group[] = [
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
    { id: "rent", label: "정확한 주세와 납부 방식", hint: "주·월 금액, 납부일, 계좌와 영수증 제공 여부" },
    { id: "bills", label: "공과금 포함·분담 기준", hint: "전기·가스·수도·인터넷의 포함 여부와 계산 근거" },
    { id: "bond", label: "보증금 금액과 공식 처리 방식", hint: "현금 전달을 서두르지 말고 관할 지역의 공식 절차 확인" },
    { id: "agreement", label: "서면 계약과 계약 당사자", hint: "이름, 기간, 퇴거 통지, 임대·전대 권한 확인" },
    { id: "extra-fees", label: "추가 비용", hint: "열쇠, 주차, 청소, 가구, 퇴실 관련 비용을 서면 확인" },
    { id: "condition", label: "Condition report·입주 사진", hint: "기존 손상과 오염을 상세히 기록하고 사본 보관", modes: ["rent", "share"] },
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

export function PropertyInspectionChecklist() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("share");
  const [propertyName, setPropertyName] = useState("");
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [notes, setNotes] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [handoffError, setHandoffError] = useState("");

  useEffect(() => { try { const saved = localStorage.getItem(propertyInspectionStorageKey); if (saved) { const data = JSON.parse(saved); setMode(data.mode || "share"); setPropertyName(data.propertyName || ""); setStatuses(data.statuses || {}); setNotes(data.notes || ""); } } catch {} setLoaded(true); }, []);
  useEffect(() => { if (!loaded) return; try { localStorage.setItem(propertyInspectionStorageKey, JSON.stringify({ mode, propertyName, statuses, notes })); } catch {} }, [mode, propertyName, statuses, notes, loaded]);

  const visibleGroups = useMemo(() => groups.map((group) => ({ ...group, items: group.items.filter((item) => !item.modes || item.modes.includes(mode)) })).filter((group) => group.items.length), [mode]);
  const items = visibleGroups.flatMap((group) => group.items);
  const reviewed = items.filter((item) => statuses[item.id]).length;
  const concerns = items.filter((item) => statuses[item.id] === "concern");

  function setStatus(id: string, status: Status) { setStatuses((current) => current[id] === status ? Object.fromEntries(Object.entries(current).filter(([key]) => key !== id)) : { ...current, [id]: status }); }
  function reset() { setPropertyName(""); setStatuses({}); setNotes(""); }
  async function copySummary() {
    const modeName = mode === "share" ? "쉐어하우스" : mode === "rent" ? "일반 렌트" : "구매";
    const text = [`집 방문 체크 — ${propertyName || "이름 미입력"}`, `유형: ${modeName} · 확인 ${reviewed}/${items.length} · 우려 ${concerns.length}`, "", "다시 확인할 항목:", ...(concerns.length ? concerns.map((item) => `- ${item.label}: ${item.hint}`) : ["- 없음"]), notes ? `\n메모:\n${notes}` : "", "\n※ 계약 전 관할 지역의 공식 규정과 전문가 조언을 확인하세요."].join("\n");
    await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800);
  }
  function continueToRentalPack() {
    const handoff = createRentalReadyNowHandoff({ propertyLabel: propertyName, mode, reviewedCount: reviewed, concernCount: concerns.length });
    if (!handoff) return;
    try {
      localStorage.setItem(rentalReadyNowHandoffStorageKey, JSON.stringify(handoff));
      router.push("/rental-application-pro?from=property-inspection-checklist");
    } catch {
      setHandoffError("이 브라우저에서 안전한 이어보기를 준비할 수 없습니다. 요약을 복사해 직접 옮겨 주세요.");
    }
  }

  return <section className="rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-8" aria-labelledby="inspection-heading">
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-sm font-semibold text-gold">방문할 때마다 새로 점검</p><h2 id="inspection-heading" className="mt-2 text-2xl font-semibold text-navy">집 인스펙션 체크리스트</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted">정확한 주소, 출입 비밀번호, 계약서 번호 같은 민감정보는 입력하지 마세요. 작성 내용은 이 브라우저에만 저장됩니다.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={copySummary} className="min-h-11 rounded-lg border border-navy px-4 text-sm font-semibold text-navy hover:bg-surface">{copied ? "복사됨" : "요약 복사"}</button><button type="button" onClick={reset} className="min-h-11 rounded-lg bg-navy px-4 text-sm font-semibold text-white hover:bg-navy-light">새 방문 시작</button></div></div>
    <div className="mt-6 grid gap-4 rounded-2xl bg-surface p-4 sm:grid-cols-[1fr_auto] sm:items-end"><label className="text-sm font-medium text-navy">집 구분명<input value={propertyName} maxLength={60} onChange={(e) => setPropertyName(e.target.value)} placeholder="예: 역 근처 방 A (정확한 주소 제외)" className="mt-2 min-h-11 w-full rounded-lg border border-border bg-white px-3 outline-none focus:border-navy" /></label><div><span className="block text-sm font-medium text-navy">확인 유형</span><div className="mt-2 flex rounded-lg border border-border bg-white p-1">{([['share','쉐어'],['rent','렌트'],['buy','구매']] as const).map(([value,label]) => <button key={value} type="button" onClick={() => setMode(value)} className={`min-h-10 rounded-md px-4 text-sm font-semibold ${mode === value ? "bg-navy text-white" : "text-muted hover:bg-surface"}`}>{label}</button>)}</div></div></div>
    <div className="mt-6 grid gap-4 sm:grid-cols-3"><div className="rounded-xl border border-border p-4"><span className="text-xs text-muted">확인 진행</span><strong className="mt-1 block text-2xl text-navy">{reviewed}/{items.length}</strong></div><div className="rounded-xl border border-border p-4"><span className="text-xs text-muted">괜찮음</span><strong className="mt-1 block text-2xl text-emerald-700">{items.filter((item) => statuses[item.id] === "ok").length}</strong></div><div className={`rounded-xl border p-4 ${concerns.length ? "border-amber-300 bg-amber-50" : "border-border"}`}><span className="text-xs text-muted">다시 확인</span><strong className="mt-1 block text-2xl text-amber-800">{concerns.length}</strong></div></div>
    <div className="mt-8 grid gap-6 lg:grid-cols-2">{visibleGroups.map((group) => <fieldset key={group.title} className="rounded-2xl border border-border p-5"><legend className="px-1 text-lg font-semibold text-navy">{group.title}</legend><div className="mt-2 divide-y divide-border">{group.items.map((item) => <div key={item.id} className="py-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold text-navy">{item.label}</p><p className="mt-1 text-xs leading-5 text-muted">{item.hint}</p></div><div className="flex shrink-0 gap-2" role="group" aria-label={`${item.label} 상태`}><button type="button" aria-pressed={statuses[item.id] === "ok"} onClick={() => setStatus(item.id,"ok")} className={`min-h-10 rounded-lg border px-3 text-xs font-semibold ${statuses[item.id] === "ok" ? "border-emerald-700 bg-emerald-50 text-emerald-800" : "border-border text-muted"}`}>괜찮음</button><button type="button" aria-pressed={statuses[item.id] === "concern"} onClick={() => setStatus(item.id,"concern")} className={`min-h-10 rounded-lg border px-3 text-xs font-semibold ${statuses[item.id] === "concern" ? "border-amber-500 bg-amber-50 text-amber-900" : "border-border text-muted"}`}>다시 확인</button></div></div></div>)}</div></fieldset>)}</div>
    <label className="mt-6 block text-sm font-medium text-navy">방문 메모<textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1500} rows={5} placeholder="질문할 내용, 약속받은 수리, 다시 방문할 시간 등을 기록하세요." className="mt-2 w-full rounded-xl border border-border p-3 leading-6 outline-none focus:border-navy" /></label>
    {mode !== "buy" && <div className="mt-6 border-l-2 border-gold bg-surface p-4 sm:flex sm:items-center sm:justify-between sm:gap-5"><div><p className="text-sm font-semibold text-navy">Rental Pack에서 이어서 준비</p><p className="mt-1 text-xs leading-5 text-muted">집 구분명과 확인·우려 개수만 24시간 동안 이 브라우저에 전달합니다. 방문 메모와 세부 체크 결과는 옮기지 않습니다.</p></div><button type="button" onClick={continueToRentalPack} className="mt-3 min-h-11 shrink-0 bg-navy px-4 text-sm font-semibold text-white sm:mt-0">안전하게 이어보기 →</button></div>}
    {handoffError && <p className="mt-3 text-sm text-red-800" role="alert">{handoffError}</p>}
  </section>;
}
