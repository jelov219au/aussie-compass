"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { createRentalReadyNowHandoff, rentalReadyNowHandoffStorageKey } from "@/lib/rentalReadyNowHandoff";
import { propertyInspectionStorageKey } from "@/lib/rentalApplicationProDeviceStorage";
import {
  emptyInspection,
  evidenceKinds,
  inspectionDecisionReadiness,
  inspectionSummary,
  parseInspection,
  serializeInspection,
  visibleInspectionGroups,
  type EvidenceKind,
  type EvidenceStatus,
  type InspectionDecision,
  type InspectionMode as Mode,
  type InspectionNextAction,
  type InspectionRejectReason,
  type InspectionStatus as Status,
  type RentalJurisdictionId,
  type RentalRelationship,
} from "@/lib/propertyInspection";
import { useLocalPlan } from "@/lib/useLocalPlan";
import { RentalJurisdictionPicker } from "./RentalJurisdictionPicker";
import { TaxStorageNotice as LocalStorageNotice } from "./TaxStorageNotice";

const statusOptions: Array<{ value: Status; label: string; active: string }> = [
  { value: "ok", label: "괜찮음", active: "border-emerald-700 bg-emerald-50 text-emerald-800" },
  { value: "pending", label: "답변 대기", active: "border-amber-500 bg-amber-50 text-amber-900" },
  { value: "red_flag", label: "중단 신호", active: "border-red-700 bg-red-50 text-red-800" },
  { value: "not_applicable", label: "해당 없음", active: "border-slate-500 bg-slate-100 text-slate-800" },
];

const relationships: Array<{ value: RentalRelationship; label: string }> = [
  { value: "tenant", label: "Tenant" },
  { value: "co_tenant", label: "Co-tenant" },
  { value: "sub_tenant", label: "Sub-tenant" },
  { value: "boarder_lodger_rooming_occupant", label: "Boarder·lodger·rooming·occupant" },
  { value: "unsure", label: "모르겠음" },
];

const decisions: Array<{ value: InspectionDecision; label: string; detail: string }> = [
  { value: "apply", label: "신청", detail: "모든 항목과 계약·공식 경로를 확인한 뒤 신청 준비" },
  { value: "reject", label: "거절", detail: "중단 신호가 해소되지 않아 신청·서류·송금을 중단" },
  { value: "follow_up", label: "추가 확인", detail: "질문과 담당 역할, 재확인일을 정하고 답변 전까지 멈춤" },
];

const nextActions: Array<{ value: InspectionNextAction; label: string }> = [
  { value: "ask_question", label: "질문 보내기" },
  { value: "verify_authority", label: "계약 상대·권한 확인" },
  { value: "compare_cost_commute", label: "비용·통근 비교" },
  { value: "prepare_application", label: "공식 채널에서 신청 준비" },
  { value: "stop_contact", label: "연락·서류·송금 중단" },
  { value: "official_help", label: "관할 기관에 공식 도움 요청" },
];

const rejectReasons: Array<{ value: InspectionRejectReason; label: string }> = [
  { value: "authority_unverified", label: "계약 상대·임대/전대 권한 미확인" },
  { value: "inspection_refused", label: "방문·실시간 확인 거부" },
  { value: "listing_mismatch", label: "광고와 실제 집·거주 조건 불일치" },
  { value: "safety_risk", label: "전기·가스·구조 등 안전 위험" },
  { value: "unresolved_condition", label: "곰팡이·누수·해충 등 해결 근거 없음" },
  { value: "money_or_bond", label: "비용·공과금·Bond 설명 부족" },
  { value: "payment_pressure", label: "압박 송금·영수증 거부" },
];

const evidenceStatuses: Array<{ value: EvidenceStatus; label: string }> = [
  { value: "have", label: "개인 보관함에 있음" },
  { value: "requested", label: "요청함" },
  { value: "none", label: "없음" },
];

export function PropertyInspectionChecklist() {
  const router = useRouter();
  const { data, update, storage, saveState } = useLocalPlan(propertyInspectionStorageKey, emptyInspection, parseInspection, serializeInspection, { initial: "아직 저장한 방문 없음", reset: "방문 초기화" });
  const { mode, propertyName, statuses, notes } = data;
  const [copied, setCopied] = useState(false);
  const [copyFallback, setCopyFallback] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [handoffError, setHandoffError] = useState("");
  const visibleGroups = useMemo(() => visibleInspectionGroups(mode), [mode]);
  const items = visibleGroups.flatMap(group => group.items);
  const readiness = useMemo(() => inspectionDecisionReadiness(data), [data]);
  const counts = useMemo(() => Object.fromEntries(statusOptions.map(option => [option.value, items.filter(item => statuses[item.id] === option.value).length])) as Record<Status, number>, [items, statuses]);
  const canContinueToRentalPack = readiness.ready && data.decision === "apply" && mode !== "buy";

  function setMode(nextMode: Mode) {
    update(current => ({ ...current, mode: nextMode, decision: "", nextAction: "" }));
  }

  function setStatus(id: string, status: Status) {
    if (storage === "loading" || !items.some(item => item.id === id)) return;
    update(current => ({
      ...current,
      statuses: current.statuses[id] === status
        ? Object.fromEntries(Object.entries(current.statuses).filter(([key]) => key !== id))
        : { ...current.statuses, [id]: status },
      reviewNeeded: current.reviewNeeded.filter(itemId => itemId !== id),
    }));
  }

  function setEvidence(kind: EvidenceKind, status: EvidenceStatus | "") {
    update(current => ({
      ...current,
      evidence: status
        ? { ...current.evidence, [kind]: status }
        : Object.fromEntries(Object.entries(current.evidence).filter(([key]) => key !== kind)),
    }));
  }

  function reset() {
    if (storage === "loading") return;
    if ((propertyName || notes || Object.keys(statuses).length) && !window.confirm("한 번에 한 집만 보관합니다. 먼저 완성된 판단 요약을 따로 보관했나요? 새 방문을 시작하면 현재 기록을 빈 기록으로 바꿉니다.")) return;
    update({ ...emptyInspection, mode });
    setCopied(false);
    setCopyFallback(null);
    setHandoffError("");
    setMessage("화면을 새 방문으로 바꿨습니다. 실제 저장 반영 여부는 위 상태를 확인하세요.");
  }

  async function copySummary() {
    if (!readiness.ready) {
      setMessage("결정과 다음 행동을 먼저 완성하세요. 0개 또는 미완성 기록은 판단 요약으로 만들지 않습니다.");
      return;
    }
    const summary = inspectionSummary(data);
    try {
      await navigator.clipboard.writeText(summary);
      setCopyFallback(null);
      setCopied(true);
      setMessage("한 집의 결정과 다음 행동을 복사했습니다. 다른 집으로 바꾸기 전에 따로 보관하세요.");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
      setCopyFallback(summary);
      setMessage("복사하지 못했습니다. 아래 동일한 요약을 선택해 수동으로 보관하세요.");
    }
  }

  function continueToRentalPack() {
    if (!canContinueToRentalPack || storage === "loading" || !parseInspection(JSON.stringify(data))) return;
    const handoff = createRentalReadyNowHandoff({ propertyLabel: propertyName, mode, reviewedCount: readiness.reviewed, concernCount: readiness.pending });
    if (!handoff) return;
    try {
      localStorage.setItem(rentalReadyNowHandoffStorageKey, JSON.stringify(handoff));
      router.push("/rental-application-pro?from=property-inspection-checklist");
    } catch {
      setHandoffError("이 브라우저에서 안전한 이어보기를 준비할 수 없습니다. 완성된 판단 요약을 복사해 직접 옮겨 주세요.");
    }
  }

  return <section className="rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-8" aria-labelledby="inspection-heading">
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div><p className="text-sm font-semibold text-gold-ink">방문할 때마다 한 집씩 결정</p><h2 id="inspection-heading" className="mt-2 text-2xl font-semibold text-navy">집 인스펙션 체크리스트</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted">정확한 주소, agent·집주인 이름, 출입코드, 사진·문서·메시지 원문은 입력하지 마세요. 작성 내용은 서버나 analytics로 보내지 않고 이 브라우저에만 저장합니다.</p></div>
      <div className="flex flex-wrap gap-2"><button type="button" onClick={copySummary} disabled={!readiness.ready || storage === "loading"} className="min-h-11 rounded-lg border border-navy px-4 text-sm font-semibold text-navy hover:bg-surface disabled:cursor-not-allowed disabled:opacity-45">{copied ? "복사됨" : "결정 요약 복사"}</button><button type="button" onClick={reset} className="min-h-11 rounded-lg bg-navy px-4 text-sm font-semibold text-white hover:bg-navy-light">새 방문 시작</button></div>
    </div>
    <LocalStorageNotice storageKey={propertyInspectionStorageKey} storage={storage} saveState={saveState} />
    <p className="mt-3 text-sm leading-6 text-muted">이 한 집 기록은 새 방문 시작이나 브라우저 데이터 삭제 전까지 현재 브라우저에 남습니다. 아래 유료 이어보기용 집계의 24시간 보관과는 별개입니다.</p>
    {message && <p role="status" className="mt-3 text-sm leading-6 text-navy">{message}</p>}
    {copyFallback !== null && <label className="mt-3 block text-sm text-navy">수동으로 보관할 방문 요약<textarea readOnly value={copyFallback} rows={10} onFocus={event => event.target.select()} className="mt-2 w-full rounded-lg border border-border p-3" /></label>}

    <fieldset disabled={storage === "loading"} className="min-w-0"><legend className="sr-only">집 방문 기록 입력</legend>
      <div className="mt-6 grid gap-4 rounded-2xl bg-surface p-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <label className="text-sm font-medium text-navy">집 별칭<input value={propertyName} maxLength={60} onChange={event => update(current => ({ ...current, propertyName: event.target.value }))} placeholder="예: 역 근처 후보 A (주소 제외)" className="mt-2 min-h-11 w-full rounded-lg border border-border bg-white px-3 outline-none focus:border-navy" /></label>
        <div><span className="block text-sm font-medium text-navy">확인 유형</span><div className="mt-2 grid grid-cols-3 rounded-lg border border-border bg-white p-1">{([['share','쉐어'],['rent','렌트'],['buy','구매']] as const).map(([value, label]) => <button key={value} type="button" onClick={() => setMode(value)} className={`min-h-11 rounded-md px-3 text-sm font-semibold ${mode === value ? "bg-navy text-white" : "text-muted hover:bg-surface"}`}>{label}</button>)}</div></div>
      </div>

      {mode === "buy" ? <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-7 text-amber-950">구매 점검 항목은 기존 기록을 위해 유지합니다. 이 결과의 신청·거절·추가 확인 판단과 Rental Pack 이동은 쉐어·렌트 전용입니다.</p> : <section className="mt-6 rounded-2xl border-2 border-navy/10 bg-[#e8efee] p-5" aria-labelledby="contract-context-heading">
        <h3 id="contract-context-heading" className="text-lg font-semibold text-navy">1. 계약 관계와 관할 먼저 확인</h3>
        <p className="mt-2 text-sm leading-7 text-muted">관계를 모르겠으면 `모르겠음`을 선택하고 상대의 임대·전대 권한과 agreement type을 서면으로 물은 뒤 신청·송금을 멈추세요.</p>
        <label className="mt-4 block text-sm font-semibold text-navy">나의 계약 관계<select value={data.relationship} onChange={event => update(current => ({ ...current, relationship: event.target.value as RentalRelationship, officialChecked: false }))} className="mt-2 min-h-12 w-full rounded-xl border-2 border-navy/15 bg-white px-4 text-base text-navy sm:max-w-xl"><option value="">계약 관계를 선택하세요</option>{relationships.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <RentalJurisdictionPicker value={data.jurisdiction} relationship={data.relationship} officialChecked={data.officialChecked} onChange={(jurisdiction: RentalJurisdictionId | "") => update(current => ({ ...current, jurisdiction, officialChecked: false }))} onOfficialCheckedChange={(officialChecked: boolean) => update(current => ({ ...current, officialChecked }))} />
      </section>}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-xl border border-border p-4"><span className="text-xs text-muted">확인 진행</span><strong className="mt-1 block text-2xl text-navy">{readiness.reviewed}/{items.length}</strong></div><div className="rounded-xl border border-emerald-200 p-4"><span className="text-xs text-muted">괜찮음·해당 없음</span><strong className="mt-1 block text-2xl text-emerald-700">{counts.ok + counts.not_applicable}</strong></div><div className={`rounded-xl border p-4 ${counts.pending ? "border-amber-300 bg-amber-50" : "border-border"}`}><span className="text-xs text-muted">답변 대기</span><strong className="mt-1 block text-2xl text-amber-800">{counts.pending}</strong></div><div className={`rounded-xl border p-4 ${counts.red_flag ? "border-red-300 bg-red-50" : "border-border"}`}><span className="text-xs text-muted">중단 신호</span><strong className="mt-1 block text-2xl text-red-800">{counts.red_flag}</strong></div></div>
      <p className="mt-4 rounded-xl bg-surface p-4 text-sm leading-7 text-navy">미확인 {readiness.unanswered}개 · 답변 대기 {counts.pending}개 · 중단 신호 {counts.red_flag}개. 미확인 전기·구조 위험은 다른 괜찮음 항목으로 상쇄되지 않습니다.</p>
      {data.reviewNeeded.length > 0 && <div className="mt-4 rounded-xl border-2 border-amber-400 bg-amber-50 p-4 text-sm leading-7 text-amber-950" role="status"><strong>이전 기록 {data.reviewNeeded.length}개를 `답변 대기`로 복원했습니다.</strong><p>예전의 `다시 확인`에는 단순 미확인과 위험이 섞여 있었습니다. 각 항목을 다시 보고 새 상태를 선택하면 이 안내에서 빠집니다.</p></div>}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">{visibleGroups.map(group => <fieldset key={group.title} className="min-w-0 rounded-2xl border border-border p-4 sm:p-5"><legend className="px-1 text-lg font-semibold text-navy">{group.title}</legend><div className="mt-2 divide-y divide-border">{group.items.map(item => <div key={item.id} className="py-4"><p className="text-sm font-semibold text-navy">{item.label}</p><p className="mt-1 text-xs leading-5 text-muted">{item.hint}</p><div className="mt-3 grid grid-cols-2 gap-2" role="group" aria-label={`${item.label} 상태`}>{statusOptions.map(option => <button key={option.value} type="button" aria-pressed={statuses[item.id] === option.value} onClick={() => setStatus(item.id, option.value)} className={`min-h-11 rounded-lg border px-2 text-xs font-semibold ${statuses[item.id] === option.value ? option.active : "border-border text-muted hover:bg-surface"}`}>{option.label}</button>)}</div></div>)}</div></fieldset>)}</div>

      {mode !== "buy" && <section className="mt-8 rounded-2xl border border-border p-5" aria-labelledby="evidence-index-heading"><h3 id="evidence-index-heading" className="text-lg font-semibold text-navy">2. 개인 보관 증거 index</h3><p className="mt-2 text-sm leading-7 text-muted">촬영 허락을 먼저 받고 개인 공간·신분증·우편물·화면·출입코드를 피하세요. 사진·영상·문서 파일, 파일명, 로컬 경로, cloud URL은 이 도구에 올리거나 적지 않습니다. 개인 보관함에 있는지 여부만 표시합니다.</p><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{evidenceKinds.map(item => <label key={item.id} className="text-sm font-semibold text-navy">{item.label}<select value={data.evidence[item.id] ?? ""} onChange={event => setEvidence(item.id, event.target.value as EvidenceStatus | "")} className="mt-2 min-h-11 w-full rounded-lg border border-border bg-white px-3 text-sm font-normal text-navy"><option value="">상태 선택</option>{evidenceStatuses.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>)}</div></section>}

      <label className="mt-6 block text-sm font-medium text-navy">방문 메모<textarea value={notes} onChange={event => update(current => ({ ...current, notes: event.target.value }))} maxLength={1500} rows={5} placeholder="질문할 내용과 수리 약속을 적되 주소·이름·연락처·문서 원문은 제외하세요." className="mt-2 w-full rounded-xl border border-border p-3 leading-6 outline-none focus:border-navy" /></label>

      {mode !== "buy" && <section className="mt-8 rounded-3xl border-2 border-navy bg-white p-5 sm:p-7" aria-labelledby="inspection-decision-heading"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-ink">무료 first outcome</p><h3 id="inspection-decision-heading" className="mt-2 text-2xl font-semibold text-navy">3. 이 집의 다음 결정을 닫으세요</h3><div className="mt-5 grid gap-3 md:grid-cols-3">{decisions.map(option => <button key={option.value} type="button" aria-pressed={data.decision === option.value} onClick={() => update(current => ({ ...current, decision: option.value, rejectReason: "", followUpQuestion: "", followUpRole: "", followUpDate: "" }))} className={`min-h-24 rounded-2xl border-2 p-4 text-left ${data.decision === option.value ? "border-gold bg-gold/10 text-navy" : "border-navy/10 text-muted hover:border-navy/30"}`}><strong className="block text-base text-navy">{option.label}</strong><span className="mt-1 block text-xs leading-5">{option.detail}</span></button>)}</div>

        {data.decision === "reject" && <label className="mt-5 block text-sm font-semibold text-navy">거절 이유 범주<select value={data.rejectReason} onChange={event => update(current => ({ ...current, rejectReason: event.target.value as InspectionRejectReason }))} className="mt-2 min-h-12 w-full rounded-xl border border-border bg-white px-4 text-sm font-normal"><option value="">개인정보 없는 범주를 선택하세요</option>{rejectReasons.map(reason => <option key={reason.value} value={reason.value}>{reason.label}</option>)}</select></label>}

        {data.decision === "follow_up" && <div className="mt-5 grid gap-4 rounded-2xl bg-surface p-4 md:grid-cols-2"><label className="text-sm font-semibold text-navy md:col-span-2">담당자에게 보낼 질문<textarea value={data.followUpQuestion} maxLength={500} rows={3} onChange={event => update(current => ({ ...current, followUpQuestion: event.target.value }))} placeholder="예: 누수 원인과 수리 완료 증거를 서면으로 보내주실 수 있나요?" className="mt-2 w-full rounded-xl border border-border bg-white p-3 font-normal leading-6" /></label><label className="text-sm font-semibold text-navy">답할 담당 역할<input value={data.followUpRole} maxLength={80} onChange={event => update(current => ({ ...current, followUpRole: event.target.value }))} placeholder="예: property manager (이름 제외)" className="mt-2 min-h-11 w-full rounded-xl border border-border bg-white px-3 font-normal" /></label><label className="text-sm font-semibold text-navy">다시 확인할 날짜<input type="date" value={data.followUpDate} onChange={event => update(current => ({ ...current, followUpDate: event.target.value }))} className="mt-2 min-h-11 w-full rounded-xl border border-border bg-white px-3 font-normal" /></label></div>}

        <label className="mt-5 block text-sm font-semibold text-navy">다음 행동 하나<select value={data.nextAction} onChange={event => update(current => ({ ...current, nextAction: event.target.value as InspectionNextAction }))} className="mt-2 min-h-12 w-full rounded-xl border border-border bg-white px-4 text-sm font-normal"><option value="">다음 행동을 선택하세요</option>{nextActions.map(action => <option key={action.value} value={action.value}>{action.label}</option>)}</select></label>

        <div className={`mt-5 rounded-2xl border-2 p-4 ${readiness.ready ? "border-emerald-500 bg-emerald-50" : "border-amber-300 bg-amber-50"}`} aria-live="polite"><p className="font-semibold text-navy">{readiness.ready ? "한 집 결정이 완성됐어요." : "아직 판단 요약을 만들 수 없어요."}</p>{!readiness.ready && <ul className="mt-2 space-y-1 text-sm leading-6 text-muted">{readiness.blockers.slice(0, 6).map(blocker => <li key={blocker}>· {blocker}</li>)}</ul>}</div>

        {readiness.ready && <div className="mt-5 grid gap-3 sm:grid-cols-2"><Link href="/resources/rental-inspection-to-application-guide" className="inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-navy px-4 py-2 text-center text-sm font-semibold text-navy">무료 신청 전 질문 정리</Link><Link href="/resources/australia-rental-scam-red-flags" className="inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-navy px-4 py-2 text-center text-sm font-semibold text-navy">연락·송금 중단 신호 확인</Link></div>}
      </section>}
    </fieldset>

    {canContinueToRentalPack && <div className="mt-6 border-l-4 border-gold bg-surface p-5 sm:flex sm:items-center sm:justify-between sm:gap-5"><div><p className="text-sm font-semibold text-navy">Rental Pack Pro에서 반복 준비</p><p className="mt-1 text-xs leading-5 text-muted">무료 신청 결정을 마쳤고 여러 증빙의 준비 상태·개인정보 범위·영문 후속을 반복 관리할 때만 사용하세요. 집 별칭과 확인 집계만 24시간 전달합니다. 방문 메모와 세부 체크 결과는 옮기지 않습니다.</p></div><button type="button" onClick={continueToRentalPack} className="mt-3 min-h-11 shrink-0 rounded-lg bg-navy px-4 text-sm font-semibold text-white sm:mt-0">Rental Pack Pro 보기 →</button></div>}
    {handoffError && <p className="mt-3 text-sm text-red-800" role="alert">{handoffError}</p>}
  </section>;
}
