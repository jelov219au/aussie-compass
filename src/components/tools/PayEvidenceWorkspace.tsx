"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type EvidenceStatus = "missing" | "review" | "ready";
type PayPeriod = { id: string; label: string; hours: string; expectedGross: string; payslipGross: string; bankNet: string; note: string };
type PayDraft = { employerLabel: string; employmentType: string; sourceNote: string; periods: PayPeriod[]; evidence: Record<string, EvidenceStatus>; requestDraft: string };

const STORAGE_KEY = "hoju-compass-pay-evidence-pro-v1";
const evidenceItems = [
  { id: "hours", title: "개인 근무시간 기록", detail: "날짜별 시작·종료, 무급 휴게와 실제 수행한 준비·마감 업무를 확인합니다." },
  { id: "roster", title: "Roster·Timesheet", detail: "원본 화면이나 변경 내역을 본인의 안전한 저장소에 보관합니다." },
  { id: "payslip", title: "Payslip", detail: "급여일 뒤 1 working day 안에 받았는지, 급여기간·Gross·Net·공제·Super 표시를 확인합니다." },
  { id: "bank", title: "실제 입금 기록", detail: "은행 Net 입금액은 Payslip의 Net과 비교하고 Gross 금액과 직접 비교하지 않습니다." },
  { id: "basis", title: "적용 기준 근거", detail: "계약, Award·Agreement, Classification과 해당 기간 Pay guide의 출처를 기록합니다." },
  { id: "messages", title: "고용주와 주고받은 내용", detail: "질문한 날짜, 답변과 정정 약속을 시간순으로 보관합니다." },
] as const;
const initialDraft: PayDraft = { employerLabel: "", employmentType: "Casual", sourceNote: "", periods: [], evidence: {}, requestDraft: "" };
const statusLabels: Record<EvidenceStatus, string> = { missing: "없음·확인 전", review: "확인 필요", ready: "준비 완료" };
const inputClass = "mt-1.5 min-h-11 w-full border border-border bg-white px-3 py-2 text-sm text-navy outline-none focus:border-navy focus:ring-2 focus:ring-navy/15";

function newPeriod(): PayPeriod { return { id: crypto.randomUUID(), label: "", hours: "", expectedGross: "", payslipGross: "", bankNet: "", note: "" }; }
function safeNumber(value: string) { const number = Number(value); return Number.isFinite(number) && number >= 0 ? number : 0; }
function difference(period: PayPeriod) { return safeNumber(period.expectedGross) - safeNumber(period.payslipGross); }
function safeFileName(value: string) { return value.trim().replace(/[^a-z0-9가-힣]+/gi, "-").replace(/^-|-$/g, "").slice(0, 42) || "pay-evidence"; }

export function PayEvidenceWorkspace() {
  const [draft, setDraft] = useState<PayDraft>(initialDraft);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try { const saved = window.localStorage.getItem(STORAGE_KEY); if (saved) setDraft((current) => ({ ...current, ...JSON.parse(saved) })); } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    const timer = window.setTimeout(() => { try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft)); } catch {} }, 350);
    return () => window.clearTimeout(timer);
  }, [draft, loaded]);

  const evidenceReady = evidenceItems.filter((item) => draft.evidence[item.id] === "ready").length;
  const reviewCount = evidenceItems.filter((item) => draft.evidence[item.id] === "review").length;
  const estimatedDifference = useMemo(() => draft.periods.reduce((sum, period) => sum + Math.max(0, difference(period)), 0), [draft.periods]);
  const netMismatchCount = useMemo(() => draft.periods.filter((period) => period.bankNet && safeNumber(period.bankNet) > safeNumber(period.payslipGross) && !period.note.trim()).length, [draft.periods]);
  const progress = Math.round((evidenceReady / evidenceItems.length) * 100);

  const updatePeriod = <K extends keyof PayPeriod>(id: string, key: K, value: PayPeriod[K]) => setDraft((current) => ({ ...current, periods: current.periods.map((period) => period.id === id ? { ...period, [key]: value } : period) }));
  const makeRequest = () => {
    const periodNames = draft.periods.map((period) => period.label.trim()).filter(Boolean).join(", ") || "the pay periods listed in my records";
    const amountLine = estimatedDifference > 0 ? `My own calculation currently shows an estimated gross difference of A$${estimatedDifference.toFixed(2)} before tax.` : "I would like to confirm that the recorded hours and gross pay are correct.";
    setDraft((current) => ({ ...current, requestDraft: `Subject: Request to review pay records\n\nHi Payroll/Manager,\n\nI am reviewing my time and pay records for ${periodNames}. ${amountLine}\n\nCould you please check the hours, pay rates, penalties, allowances and deductions used for these periods, and provide the relevant time and wage records if available? I can share my period-by-period calculation without sensitive bank or tax details.\n\nPlease let me know the outcome in writing and how any correction will be shown on a payslip.\n\nThank you.` }));
  };
  const copyRequest = async () => {
    if (!draft.requestDraft) return;
    try { await navigator.clipboard.writeText(draft.requestDraft); setMessage("영문 확인 요청문을 복사했습니다."); } catch { setMessage("복사할 수 없습니다. 내용을 직접 선택해 복사하세요."); }
  };
  const downloadSummary = () => {
    const lines = [
      "HOJU COMPASS — PAY EVIDENCE PREPARATION SUMMARY",
      `Employer label: ${draft.employerLabel || "Not set"}`,
      `Employment type noted: ${draft.employmentType}`,
      `Basis/source note: ${draft.sourceNote || "Not set"}`,
      `User-entered estimated gross difference: A$${estimatedDifference.toFixed(2)}`,
      "",
      "PAY PERIODS",
      ...(draft.periods.length ? draft.periods.flatMap((period) => [`- ${period.label || "Untitled"} | Hours ${safeNumber(period.hours)} | Expected gross A$${safeNumber(period.expectedGross).toFixed(2)} | Payslip gross A$${safeNumber(period.payslipGross).toFixed(2)} | Bank net A$${safeNumber(period.bankNet).toFixed(2)} | Gross difference A$${difference(period).toFixed(2)}`, `  Note: ${period.note || "None"}`]) : ["- None recorded"]),
      "",
      "EVIDENCE READINESS",
      ...evidenceItems.map((item) => `- [${statusLabels[draft.evidence[item.id] ?? "missing"]}] ${item.title}`),
      "",
      "REQUEST DRAFT",
      draft.requestDraft || "Not created",
      "",
      "This summary records user-entered figures only. It does not determine an Award, Classification, entitlement, underpayment, tax, superannuation or legal outcome. Do not include TFN, bank account, passport or visa numbers.",
    ];
    const url = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${safeFileName(draft.employerLabel)}-pay-evidence.txt`; anchor.click(); URL.revokeObjectURL(url);
    setMessage("급여기간별 기록과 증빙 상태를 텍스트 파일로 저장했습니다.");
  };

  return <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,0.95fr)_minmax(32rem,1.05fr)]">
    <div className="space-y-8">
      <section className="border-t border-navy/20 pt-6" aria-labelledby="pay-case-heading"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Case label</p><h2 id="pay-case-heading" className="mt-2 text-2xl font-semibold text-navy">급여 확인 기준</h2><p className="mt-3 text-sm leading-6 text-muted">회사 실명 대신 별칭을 사용할 수 있습니다. 이 화면은 적용 Award나 Classification을 선택해 주지 않습니다.</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-navy">직장 별칭<input className={inputClass} value={draft.employerLabel} onChange={(event) => setDraft((current) => ({ ...current, employerLabel: event.target.value }))} placeholder="예: 카페 A" /></label><label className="text-sm font-medium text-navy">고용 형태 메모<select className={inputClass} value={draft.employmentType} onChange={(event) => setDraft((current) => ({ ...current, employmentType: event.target.value }))}><option>Casual</option><option>Part-time</option><option>Full-time</option><option>Contractor — status needs checking</option><option>Unsure</option></select></label><label className="text-sm font-medium text-navy sm:col-span-2">적용 기준·출처 메모<textarea className={`${inputClass} min-h-24 resize-y`} value={draft.sourceNote} onChange={(event) => setDraft((current) => ({ ...current, sourceNote: event.target.value }))} placeholder="예: Restaurant Award, Level은 아직 Fair Work PACT에서 재확인 필요" /></label></div><div className="mt-5 flex flex-wrap gap-3"><a href="https://calculate.fairwork.gov.au/" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center border border-navy px-4 text-sm font-semibold text-navy">Fair Work PACT 열기 ↗</a><Link href="/award-guide" className="inline-flex min-h-11 items-center border-b-2 border-gold px-1 text-sm font-semibold text-navy">무료 Award 가이드</Link></div></section>

      <section className="border border-border bg-white p-5 sm:p-7" aria-labelledby="evidence-heading"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Evidence readiness</p><h2 id="evidence-heading" className="mt-2 text-xl font-semibold text-navy">증빙 준비 현황</h2></div><div className="text-right"><p className="font-mono text-3xl text-navy">{progress}%</p><p className="text-xs text-muted">{evidenceReady}/{evidenceItems.length} 준비 완료</p></div></div><div className="mt-5 h-1.5 bg-surface"><div className="h-full bg-gold transition-all" style={{ width: `${progress}%` }} /></div><ol className="mt-6 divide-y divide-border border-y border-navy/20">{evidenceItems.map((item, index) => { const status = draft.evidence[item.id] ?? "missing"; return <li key={item.id} className="py-5"><div className="grid gap-3 sm:grid-cols-[2rem_1fr_8rem]"><span className="font-mono text-xs text-gold">{String(index + 1).padStart(2, "0")}</span><div><h3 className="font-semibold text-navy">{item.title}</h3><p className="mt-2 text-sm leading-6 text-muted">{item.detail}</p></div><label className="text-xs font-medium text-muted">상태<select className="mt-1 min-h-10 w-full border border-border bg-white px-2 text-sm text-navy" value={status} onChange={(event) => setDraft((current) => ({ ...current, evidence: { ...current.evidence, [item.id]: event.target.value as EvidenceStatus } }))}><option value="missing">없음·확인 전</option><option value="review">확인 필요</option><option value="ready">준비 완료</option></select></label></div></li>; })}</ol></section>
    </div>

    <div className="space-y-8">
      <section className="border border-border bg-white p-5 shadow-sm sm:p-7" aria-labelledby="period-heading"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Period comparison</p><h2 id="period-heading" className="mt-2 text-xl font-semibold text-navy">급여기간별 Gross 비교</h2></div><div className="text-right"><p className="font-mono text-2xl text-navy">A${estimatedDifference.toFixed(2)}</p><p className="text-xs text-muted">양수 차이 합계 · 사용자 계산</p></div></div><p className="mt-4 border-l-2 border-gold pl-3 text-xs leading-5 text-muted">기대 Gross와 Payslip Gross만 비교합니다. 은행 입금액은 세금·공제 후 Net이므로 Gross와 직접 비교하지 마세요.</p><div className="mt-5 space-y-4">{draft.periods.map((period, index) => <article key={period.id} className="border border-border p-4"><div className="flex items-start justify-between gap-3"><p className="font-mono text-xs text-gold">PERIOD {String(index + 1).padStart(2, "0")}</p><button type="button" onClick={() => setDraft((current) => ({ ...current, periods: current.periods.filter((item) => item.id !== period.id) }))} className="min-h-9 text-xs font-medium text-muted hover:text-red-700">삭제</button></div><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-xs font-medium text-navy sm:col-span-2">급여기간 별칭<input className={inputClass} value={period.label} onChange={(event) => updatePeriod(period.id, "label", event.target.value)} placeholder="예: 7월 1–14일" /></label><label className="text-xs font-medium text-navy">내 기록 총 근무시간<input type="number" min="0" step="0.25" className={inputClass} value={period.hours} onChange={(event) => updatePeriod(period.id, "hours", event.target.value)} /></label><label className="text-xs font-medium text-navy">내 계산 기대 Gross A$<input type="number" min="0" step="0.01" className={inputClass} value={period.expectedGross} onChange={(event) => updatePeriod(period.id, "expectedGross", event.target.value)} /></label><label className="text-xs font-medium text-navy">Payslip Gross A$<input type="number" min="0" step="0.01" className={inputClass} value={period.payslipGross} onChange={(event) => updatePeriod(period.id, "payslipGross", event.target.value)} /></label><label className="text-xs font-medium text-navy">은행 입금 Net A$<input type="number" min="0" step="0.01" className={inputClass} value={period.bankNet} onChange={(event) => updatePeriod(period.id, "bankNet", event.target.value)} /></label><label className="text-xs font-medium text-navy sm:col-span-2">차이 근거·확인 메모<textarea className={`${inputClass} min-h-20 resize-y`} value={period.note} onChange={(event) => updatePeriod(period.id, "note", event.target.value)} placeholder="예: 토요일 penalty rate가 빠진 것으로 보여 PACT 결과와 대조 필요" /></label></div><p className={`mt-4 text-sm font-semibold ${difference(period) > 0 ? "text-red-700" : "text-muted"}`}>이 기간 Gross 차이: A${difference(period).toFixed(2)}</p></article>)}</div><button type="button" onClick={() => setDraft((current) => ({ ...current, periods: [...current.periods, newPeriod()] }))} className="mt-5 min-h-11 border-b-2 border-gold text-sm font-semibold text-navy">+ 급여기간 추가</button></section>

      <section className="border border-border bg-white p-5 shadow-sm sm:p-7" aria-labelledby="request-heading"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Written request</p><h2 id="request-heading" className="mt-2 text-xl font-semibold text-navy">영문 급여 확인 요청문</h2></div><button type="button" onClick={copyRequest} disabled={!draft.requestDraft} className="min-h-11 border-b-2 border-gold text-sm font-semibold text-navy disabled:opacity-35">텍스트 복사</button></div><button type="button" onClick={makeRequest} className="mt-5 min-h-11 bg-navy px-4 text-sm font-semibold text-white">요청문 만들기</button><label className="sr-only" htmlFor="pay-request-draft">영문 급여 확인 요청문</label><textarea id="pay-request-draft" className={`${inputClass} mt-5 min-h-72 resize-y font-serif leading-7`} value={draft.requestDraft} onChange={(event) => setDraft((current) => ({ ...current, requestDraft: event.target.value }))} placeholder="급여기간을 기록한 뒤 확인 요청문을 만드세요." /><div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={downloadSummary} className="min-h-11 bg-navy px-4 text-sm font-semibold text-white">증빙 요약 저장</button><span className="self-center text-xs text-muted">TXT 파일 · 원본 서류 미포함</span></div><p className="mt-4 min-h-5 text-xs leading-5 text-muted" aria-live="polite">{message}</p></section>

      <section className="bg-navy p-5 text-white sm:p-7" aria-labelledby="pay-review-heading"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Review before sharing</p><h2 id="pay-review-heading" className="mt-2 text-xl font-semibold">현재 검토 요약</h2><p className="mt-4 text-sm leading-6 text-white/70">증빙 확인 필요 {reviewCount}개 · 급여기간 {draft.periods.length}개 · Net 차이 메모 필요 {netMismatchCount}개</p><p className="mt-3 text-xs leading-5 text-white/55">이 도구의 차이는 미지급액 판정이 아닙니다. Award·Agreement·Classification과 해당 시점의 요율은 Fair Work PACT 또는 전문가에게 확인하세요.</p></section>
    </div>
  </div>;
}
