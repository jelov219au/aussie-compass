"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { createRentalReadyNowHandoff, rentalReadyNowHandoffStorageKey } from "@/lib/rentalReadyNowHandoff";
import { propertyInspectionStorageKey } from "@/lib/rentalApplicationProDeviceStorage";
import { emptyInspection, inspectionSummary, parseInspection, serializeInspection, visibleInspectionGroups, type InspectionMode as Mode, type InspectionStatus as Status } from "@/lib/propertyInspection";
import { useLocalPlan } from "@/lib/useLocalPlan";
import { TaxStorageNotice as LocalStorageNotice } from "./TaxStorageNotice";

export function PropertyInspectionChecklist() {
  const router = useRouter();
  const { data, update, storage, saveState } = useLocalPlan(propertyInspectionStorageKey, emptyInspection, parseInspection, serializeInspection, { initial: "아직 저장한 방문 없음", reset: "방문 초기화" });
  const { mode, propertyName, statuses, notes } = data;
  const [copied, setCopied] = useState(false);
  const [copyFallback, setCopyFallback] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [handoffError, setHandoffError] = useState("");
  const setMode = (mode: Mode) => update(current => ({ ...current, mode }));
  const setPropertyName = (propertyName: string) => update(current => ({ ...current, propertyName }));
  const setNotes = (notes: string) => update(current => ({ ...current, notes }));
  const visibleGroups = useMemo(() => visibleInspectionGroups(mode), [mode]);
  const items = visibleGroups.flatMap((group) => group.items);
  const reviewed = items.filter((item) => statuses[item.id]).length;
  const concerns = items.filter((item) => statuses[item.id] === "concern");

  function setStatus(id: string, status: Status) {
    if (storage === "loading" || !items.some(item => item.id === id) || !["ok", "concern"].includes(status)) return;
    update(current => ({ ...current, statuses: current.statuses[id] === status ? Object.fromEntries(Object.entries(current.statuses).filter(([key]) => key !== id)) : { ...current.statuses, [id]: status } }));
  }
  function reset() {
    if (storage === "loading") return;
    if ((propertyName || notes || Object.keys(statuses).length) && !window.confirm("한 번에 한 집만 보관합니다. 먼저 요약을 따로 보관했나요? 새 방문을 시작하면 현재 집 구분명·체크·메모를 빈 기록으로 바꿉니다.")) return;
    update({ mode, propertyName: "", statuses: {}, notes: "" }); setCopied(false); setCopyFallback(null); setHandoffError(""); setMessage("화면을 새 방문으로 바꿨습니다. 실제 저장 반영 여부는 위 상태를 확인하세요.");
  }
  async function copySummary() {
    const summary = inspectionSummary(data);
    try { await navigator.clipboard.writeText(summary); setCopyFallback(null); setCopied(true); setMessage("요약을 복사했습니다. 다른 집으로 바꾸기 전에 따로 보관하세요."); window.setTimeout(() => setCopied(false), 1800); }
    catch { setCopied(false); setCopyFallback(summary); setMessage("복사하지 못했습니다. 아래 동일한 요약을 선택해 수동으로 보관하세요."); }
  }
  function continueToRentalPack() {
    if (storage === "loading" || !parseInspection(JSON.stringify(data))) return;
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
    <LocalStorageNotice storageKey={propertyInspectionStorageKey} storage={storage} saveState={saveState} />
    <p className="mt-3 text-sm leading-6 text-muted">한 번에 한 집만 저장합니다. 구분명만 바꿔도 기존 체크와 메모는 그대로 남습니다. 다른 집을 볼 때는 요약을 먼저 보관하고 새 방문을 시작하세요.</p>
    {message && <p role="status" className="mt-3 text-sm leading-6 text-navy">{message}</p>}
    {copyFallback !== null && <label className="mt-3 block text-sm text-navy">수동으로 보관할 방문 요약<textarea readOnly value={copyFallback} rows={8} onFocus={event => event.target.select()} className="mt-2 w-full rounded-lg border border-border p-3" /></label>}
    <fieldset disabled={storage === "loading"} className="min-w-0"><legend className="sr-only">집 방문 기록 입력</legend>
    <div className="mt-6 grid gap-4 rounded-2xl bg-surface p-4 sm:grid-cols-[1fr_auto] sm:items-end"><label className="text-sm font-medium text-navy">집 구분명<input value={propertyName} maxLength={60} onChange={(e) => setPropertyName(e.target.value)} placeholder="예: 역 근처 방 A (정확한 주소 제외)" className="mt-2 min-h-11 w-full rounded-lg border border-border bg-white px-3 outline-none focus:border-navy" /></label><div><span className="block text-sm font-medium text-navy">확인 유형</span><div className="mt-2 flex rounded-lg border border-border bg-white p-1">{([['share','쉐어'],['rent','렌트'],['buy','구매']] as const).map(([value,label]) => <button key={value} type="button" onClick={() => setMode(value)} className={`min-h-11 rounded-md px-4 text-sm font-semibold ${mode === value ? "bg-navy text-white" : "text-muted hover:bg-surface"}`}>{label}</button>)}</div></div></div>
    <div className="mt-6 grid gap-4 sm:grid-cols-3"><div className="rounded-xl border border-border p-4"><span className="text-xs text-muted">확인 진행</span><strong className="mt-1 block text-2xl text-navy">{reviewed}/{items.length}</strong></div><div className="rounded-xl border border-border p-4"><span className="text-xs text-muted">괜찮음</span><strong className="mt-1 block text-2xl text-emerald-700">{items.filter((item) => statuses[item.id] === "ok").length}</strong></div><div className={`rounded-xl border p-4 ${concerns.length ? "border-amber-300 bg-amber-50" : "border-border"}`}><span className="text-xs text-muted">다시 확인</span><strong className="mt-1 block text-2xl text-amber-800">{concerns.length}</strong></div></div>
    <p className="mt-4 rounded-xl bg-surface p-4 text-sm leading-7 text-navy">{concerns.length ? `다시 확인할 우려 ${concerns.length}개` : "아직 우려 표시 없음"} · 미확인 {items.length - reviewed}개. 안전 판정이 아니며, 미확인 전기·구조 위험은 다른 괜찮음 항목으로 상쇄되지 않습니다.</p>
    <div className="mt-8 grid gap-6 lg:grid-cols-2">{visibleGroups.map((group) => <fieldset key={group.title} className="rounded-2xl border border-border p-5"><legend className="px-1 text-lg font-semibold text-navy">{group.title}</legend><div className="mt-2 divide-y divide-border">{group.items.map((item) => <div key={item.id} className="py-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold text-navy">{item.label}</p><p className="mt-1 text-xs leading-5 text-muted">{item.hint}</p></div><div className="flex shrink-0 gap-2" role="group" aria-label={`${item.label} 상태`}><button type="button" aria-pressed={statuses[item.id] === "ok"} onClick={() => setStatus(item.id,"ok")} className={`min-h-11 rounded-lg border px-3 text-xs font-semibold ${statuses[item.id] === "ok" ? "border-emerald-700 bg-emerald-50 text-emerald-800" : "border-border text-muted"}`}>괜찮음</button><button type="button" aria-pressed={statuses[item.id] === "concern"} onClick={() => setStatus(item.id,"concern")} className={`min-h-11 rounded-lg border px-3 text-xs font-semibold ${statuses[item.id] === "concern" ? "border-amber-500 bg-amber-50 text-amber-900" : "border-border text-muted"}`}>다시 확인</button></div></div></div>)}</div></fieldset>)}</div>
    <label className="mt-6 block text-sm font-medium text-navy">방문 메모<textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1500} rows={5} placeholder="질문할 내용, 약속받은 수리, 다시 방문할 시간 등을 기록하세요." className="mt-2 w-full rounded-xl border border-border p-3 leading-6 outline-none focus:border-navy" /></label>
    </fieldset>
    {mode !== "buy" && <div className="mt-6 border-l-2 border-gold bg-surface p-4 sm:flex sm:items-center sm:justify-between sm:gap-5"><div><p className="text-sm font-semibold text-navy">Rental Pack에서 이어서 준비</p><p className="mt-1 text-xs leading-5 text-muted">집 구분명과 확인·우려 개수만 24시간 동안 이 브라우저에 전달합니다. 방문 메모와 세부 체크 결과는 옮기지 않습니다.</p></div><button type="button" onClick={continueToRentalPack} className="mt-3 min-h-11 shrink-0 bg-navy px-4 text-sm font-semibold text-white sm:mt-0">안전하게 이어보기 →</button></div>}
    {handoffError && <p className="mt-3 text-sm text-red-800" role="alert">{handoffError}</p>}
  </section>;
}
