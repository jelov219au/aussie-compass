"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import {
  createPayEvidenceCaseArchive,
  MAX_PAY_EVIDENCE_ARCHIVE_BYTES,
  parsePayEvidenceCaseArchive,
  type PayEvidenceCaseArchive,
  type PayEvidenceDraft as PayDraft,
  type PayEvidencePeriod as PayPeriod,
  type PayEvidenceRateBasisType as RateBasisType,
  type PayEvidenceShift as ShiftEntry,
  type PayEvidenceStatus as EvidenceStatus,
} from "@/lib/payEvidenceCaseArchive";

const STORAGE_KEY = "hoju-compass-pay-evidence-pro-v1";
const evidenceItems = [
  { id: "hours", title: "개인 근무시간 기록", detail: "날짜별 시작·종료, 무급 휴게와 실제 수행한 준비·마감 업무를 확인합니다." },
  { id: "roster", title: "Roster·Timesheet", detail: "원본 화면이나 변경 내역을 본인의 안전한 저장소에 보관합니다." },
  { id: "payslip", title: "Payslip", detail: "급여일 뒤 1 working day 안에 받았는지, 급여기간·Gross·Net·공제·Super 표시를 확인합니다." },
  { id: "bank", title: "실제 입금 기록", detail: "은행 Net 입금액은 Payslip의 Net과 비교하고 Gross 금액과 직접 비교하지 않습니다." },
  { id: "basis", title: "적용 기준 근거", detail: "계약, Award·Agreement, Classification과 해당 기간 Pay guide의 출처를 기록합니다." },
  { id: "messages", title: "고용주와 주고받은 내용", detail: "질문한 날짜, 답변과 정정 약속을 시간순으로 보관합니다." },
] as const;
const initialDraft: PayDraft = { employerLabel: "", employmentType: "Unsure", rateBasisType: "unsure", rateBasisCheckedOn: "", sourceNote: "", periods: [], evidence: {}, requestType: "first", requestDraft: "" };
const statusLabels: Record<EvidenceStatus, string> = { missing: "없음·확인 전", review: "확인 필요", ready: "준비 완료" };
const inputClass = "mt-1.5 min-h-11 w-full border border-border bg-white px-3 py-2 text-sm text-navy outline-none focus:border-navy focus:ring-2 focus:ring-navy/15";

function newShift(): ShiftEntry { return { id: crypto.randomUUID(), date: "", start: "", end: "", breakMinutes: "", rateLabel: "", hourlyRate: "", allowance: "", note: "" }; }
function newPeriod(): PayPeriod { return { id: crypto.randomUUID(), label: "", hours: "", expectedGross: "", payslipGross: "", payslipNet: "", bankNet: "", note: "", shifts: [] }; }
function safeNumber(value: string) { const number = Number(value); return Number.isFinite(number) && number >= 0 ? number : 0; }
function minutesFromTime(value: string) { const [hours, minutes] = value.split(":").map(Number); return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : null; }
function shiftHours(shift: ShiftEntry) {
  const start = minutesFromTime(shift.start); const end = minutesFromTime(shift.end);
  if (start === null || end === null) return 0;
  const elapsed = end >= start ? end - start : end + 24 * 60 - start;
  return Math.max(0, elapsed - safeNumber(shift.breakMinutes)) / 60;
}
function shiftExpectedGross(shift: ShiftEntry) { return shiftHours(shift) * safeNumber(shift.hourlyRate) + safeNumber(shift.allowance); }
function periodHours(period: PayPeriod) { return period.shifts.length ? period.shifts.reduce((sum, shift) => sum + shiftHours(shift), 0) : safeNumber(period.hours); }
function periodExpectedGross(period: PayPeriod) { return period.shifts.length ? period.shifts.reduce((sum, shift) => sum + shiftExpectedGross(shift), 0) : safeNumber(period.expectedGross); }
function difference(period: PayPeriod) { return periodExpectedGross(period) - safeNumber(period.payslipGross); }
function hasAmount(value: string) { return value.trim() !== ""; }
function netDifference(period: PayPeriod) { return safeNumber(period.payslipNet) - safeNumber(period.bankNet); }
function netComparisonLabel(period: PayPeriod) {
  if (!hasAmount(period.payslipNet) || !hasAmount(period.bankNet)) return "Payslip Net과 실제 입금 Net을 모두 입력하세요.";
  const amount = netDifference(period);
  if (Math.abs(amount) < 0.01) return "Payslip Net과 실제 입금 Net이 일치합니다.";
  return amount > 0 ? `실제 입금이 Payslip Net보다 A$${amount.toFixed(2)} 적습니다.` : `실제 입금이 Payslip Net보다 A$${Math.abs(amount).toFixed(2)} 많습니다.`;
}
function netDifferenceExport(period: PayPeriod) { return hasAmount(period.payslipNet) && hasAmount(period.bankNet) ? netDifference(period).toFixed(2) : "Not comparable"; }
function recordedAmount(value: string) { return hasAmount(value) ? safeNumber(value).toFixed(2) : "Not recorded"; }
function recordedNumber(value: string, suffix = "") { return hasAmount(value) ? `${safeNumber(value).toFixed(2)}${suffix}` : "Not recorded"; }
function recordedAudAmount(value: string, suffix = "") { return hasAmount(value) ? `A$${safeNumber(value).toFixed(2)}${suffix}` : "Not recorded"; }
function periodHoursExport(period: PayPeriod) { return period.shifts.length ? periodHours(period).toFixed(2) : recordedNumber(period.hours); }
function periodExpectedGrossExport(period: PayPeriod) { return period.shifts.length ? `A$${periodExpectedGross(period).toFixed(2)}` : recordedAudAmount(period.expectedGross); }
function grossDifferenceExport(period: PayPeriod) { return (period.shifts.length || hasAmount(period.expectedGross)) && hasAmount(period.payslipGross) ? `A$${difference(period).toFixed(2)}` : "Not comparable"; }
function safeFileName(value: string) { return value.trim().replace(/[^a-z0-9가-힣]+/gi, "-").replace(/^-|-$/g, "").slice(0, 42) || "pay-evidence"; }
function csvCell(value: string | number) { return `"${String(value).replaceAll('"', '""')}"`; }

function normaliseDraft(value: Partial<PayDraft>): PayDraft {
  return {
    ...initialDraft,
    ...value,
    requestType: value.requestType === "followup" ? "followup" : "first",
    rateBasisType: ["award", "agreement", "contract", "other"].includes(value.rateBasisType ?? "") ? value.rateBasisType as RateBasisType : "unsure",
    rateBasisCheckedOn: /^\d{4}-\d{2}-\d{2}$/.test(value.rateBasisCheckedOn ?? "") ? value.rateBasisCheckedOn ?? "" : "",
    periods: Array.isArray(value.periods) ? value.periods.map((period) => ({ ...newPeriod(), ...period, shifts: Array.isArray(period.shifts) ? period.shifts.map((shift) => ({ ...newShift(), ...shift })) : [] })) : [],
    evidence: value.evidence ?? {},
  };
}

export function PayEvidenceWorkspace() {
  const [draft, setDraft] = useState<PayDraft>(initialDraft);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [pendingArchive, setPendingArchive] = useState<PayEvidenceCaseArchive | null>(null);
  const [saveStatus, setSaveStatus] = useState<"loading" | "pending" | "saved" | "failed" | "blocked">("loading");
  const [storageBlocked, setStorageBlocked] = useState(false);
  const initialized = useRef(false);
  const saveTimer = useRef<number | null>(null);
  const lastSavedDraft = useRef<PayDraft | null>(null);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const restored = normaliseDraft(JSON.parse(saved));
        lastSavedDraft.current = restored;
        setDraft(restored);
      }
      setSaveStatus("saved");
    } catch {
      setStorageBlocked(true);
      setSaveStatus("blocked");
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded || storageBlocked || lastSavedDraft.current === draft) return;
    setSaveStatus("pending");
    const timer = window.setTimeout(() => {
      saveTimer.current = null;
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
        lastSavedDraft.current = draft;
        setSaveStatus("saved");
      } catch { setSaveStatus("failed"); }
    }, 350);
    saveTimer.current = timer;
    return () => { window.clearTimeout(timer); if (saveTimer.current === timer) saveTimer.current = null; };
  }, [draft, loaded, storageBlocked]);

  const persistDraft = (nextDraft: PayDraft) => {
    if (!loaded || storageBlocked) {
      setMessage("저장 원본을 확인할 수 없어 교체하지 않았습니다. 현재 화면을 백업하고 저장 권한·원본을 확인한 뒤 다시 열어 주세요.");
      return false;
    }
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    saveTimer.current = null;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextDraft));
      lastSavedDraft.current = nextDraft;
      setSaveStatus("saved");
      return true;
    } catch {
      setSaveStatus("failed");
      setMessage("브라우저에 저장하지 못했습니다. 현재 화면, 저장 원본과 검토한 백업은 유지했습니다. 저장 공간·권한을 확인한 뒤 다시 시도하세요.");
      return false;
    }
  };

  const evidenceReady = evidenceItems.filter((item) => draft.evidence[item.id] === "ready").length;
  const reviewCount = evidenceItems.filter((item) => draft.evidence[item.id] === "review").length;
  const rateBasisReady = draft.rateBasisType !== "unsure"
    && Boolean(draft.sourceNote.trim())
    && /^\d{4}-\d{2}-\d{2}$/.test(draft.rateBasisCheckedOn)
    && draft.evidence.basis === "ready";
  const estimatedDifference = useMemo(() => draft.periods.reduce((sum, period) => sum + Math.max(0, difference(period)), 0), [draft.periods]);
  const { netMismatchCount, incompleteNetCount } = useMemo(() => draft.periods.reduce((counts, period) => {
    const hasPayslipNet = hasAmount(period.payslipNet);
    const hasBankNet = hasAmount(period.bankNet);
    if (hasPayslipNet !== hasBankNet) counts.incompleteNetCount += 1;
    if (hasPayslipNet && hasBankNet && Math.abs(netDifference(period)) >= 0.01) counts.netMismatchCount += 1;
    return counts;
  }, { netMismatchCount: 0, incompleteNetCount: 0 }), [draft.periods]);
  const shiftCount = useMemo(() => draft.periods.reduce((sum, period) => sum + period.shifts.length, 0), [draft.periods]);
  const calculatedHours = useMemo(() => draft.periods.reduce((sum, period) => sum + periodHours(period), 0), [draft.periods]);
  const incompleteShiftCount = useMemo(() => draft.periods.flatMap((period) => period.shifts).filter((shift) => !shift.date || !shift.start || !shift.end || safeNumber(shift.hourlyRate) <= 0).length, [draft.periods]);
  const progress = Math.round((evidenceReady / evidenceItems.length) * 100);

  const updatePeriod = <K extends keyof PayPeriod>(id: string, key: K, value: PayPeriod[K]) => setDraft((current) => ({ ...current, periods: current.periods.map((period) => period.id === id ? { ...period, [key]: value } : period) }));
  const updateShift = <K extends keyof ShiftEntry>(periodId: string, shiftId: string, key: K, value: ShiftEntry[K]) => setDraft((current) => ({ ...current, periods: current.periods.map((period) => period.id === periodId ? { ...period, shifts: period.shifts.map((shift) => shift.id === shiftId ? { ...shift, [key]: value } : shift) } : period) }));
  const makeRequest = () => {
    const periodNames = draft.periods.map((period) => period.label.trim()).filter(Boolean).join(", ") || "the pay periods listed in my records";
    const amountLine = estimatedDifference > 0 && rateBasisReady
      ? `Using the rate basis I recorded and checked on ${draft.rateBasisCheckedOn}, my preliminary comparison shows a gross difference of A$${estimatedDifference.toFixed(2)} before tax. Please verify the applicable instrument, classification and rates.`
      : estimatedDifference > 0
        ? "I made a preliminary comparison, but I have not confirmed the applicable instrument, classification and dated rate source, so I am not presenting the difference as verified."
        : "I would like to confirm that the recorded hours and gross pay are correct.";
    const firstRequest = `Subject: Request to review pay records\n\nHi Payroll/Manager,\n\nI am reviewing my time and pay records for ${periodNames}. ${amountLine}\n\nCould you please check the hours, pay rates, penalties, allowances and deductions used for these periods, and provide the relevant time and wage records if available? I can share my period-by-period calculation without sensitive bank or tax details.\n\nPlease let me know the outcome in writing and how any correction will be shown on a payslip.\n\nThank you.`;
    const followupRequest = `Subject: Follow-up on pay record review\n\nHi Payroll/Manager,\n\nI am following up on my request to review the pay records for ${periodNames}. ${amountLine}\n\nCould you please confirm when the review will be completed and provide the hours, pay rates, penalties, allowances and deductions used for these periods? If a correction is required, please also confirm when it will be paid and how it will appear on the corrected payslip.\n\nI would appreciate a written response by a reasonable date so I can keep my records up to date.\n\nThank you.`;
    setDraft((current) => ({ ...current, requestDraft: current.requestType === "followup" ? followupRequest : firstRequest }));
  };
  const copyRequest = async () => {
    if (!draft.requestDraft) return;
    try { await navigator.clipboard.writeText(draft.requestDraft); setMessage("영문 확인 요청문을 복사했습니다."); } catch { setMessage("복사할 수 없습니다. 내용을 직접 선택해 복사하세요."); }
  };
  const saveFile = (contents: string, fileName: string, type: string) => {
    const url = URL.createObjectURL(new Blob([contents], { type }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = fileName; anchor.click(); URL.revokeObjectURL(url);
  };
  const downloadSummary = () => {
    const lines = [
      "HOJU COMPASS — PAY EVIDENCE PREPARATION SUMMARY",
      `Employer label: ${draft.employerLabel || "Not set"}`,
      `Employment type noted: ${draft.employmentType}`,
      `Rate basis type: ${draft.rateBasisType}`,
      `Rate basis checked on: ${draft.rateBasisCheckedOn || "Not set"}`,
      `Basis/source note: ${draft.sourceNote || "Not set"}`,
      `Share readiness: ${rateBasisReady ? "READY — dated rate basis recorded" : "NOT READY — confirm type, date, source note and evidence status"}`,
      `User-entered estimated gross difference: A$${estimatedDifference.toFixed(2)}`,
      "",
      "PAY PERIODS",
      ...(draft.periods.length ? draft.periods.flatMap((period) => [
        `- ${period.label || "Untitled"} | Hours ${periodHoursExport(period)} | Expected gross ${periodExpectedGrossExport(period)} | Payslip gross ${recordedAudAmount(period.payslipGross)} | Payslip net ${recordedAmount(period.payslipNet)} | Bank net ${recordedAmount(period.bankNet)} | User-entered gross comparison ${grossDifferenceExport(period)} | Payslip-to-bank net difference ${netDifferenceExport(period)}`,
        ...period.shifts.map((shift) => `  Shift ${shift.date || "Date not set"} ${shift.start || "--:--"}–${shift.end || "--:--"} | Break ${recordedNumber(shift.breakMinutes, " min")} | Hours ${shiftHours(shift).toFixed(2)} | ${shift.rateLabel || "Rate"} ${recordedAudAmount(shift.hourlyRate, "/h")} | Allowance ${recordedAudAmount(shift.allowance)} | Expected A$${shiftExpectedGross(shift).toFixed(2)} | ${shift.note || "No note"}`),
        `  Note: ${period.note || "None"}`,
      ]) : ["- None recorded"]),
      "",
      "EVIDENCE READINESS",
      ...evidenceItems.map((item) => `- [${statusLabels[draft.evidence[item.id] ?? "missing"]}] ${item.title}`),
      "",
      "REQUEST DRAFT",
      draft.requestDraft || "Not created",
      "",
      "This summary records user-entered figures only. It does not determine an Award, Classification, entitlement, underpayment, tax, superannuation or legal outcome. Do not include TFN, bank account, passport or visa numbers.",
    ];
    saveFile(lines.join("\r\n"), `${safeFileName(draft.employerLabel)}-pay-evidence.txt`, "text/plain;charset=utf-8");
    setMessage("급여기간별 기록과 증빙 상태를 텍스트 파일로 저장했습니다.");
  };
  const downloadCsv = () => {
    const header = ["Rate basis type", "Rate basis checked on", "Rate basis/source note", "Share readiness", "Pay period", "Shift date", "Start", "End", "Unpaid break minutes", "Calculated hours", "Rate label", "Hourly rate AUD", "Allowance AUD", "Expected shift gross AUD", "Payslip period gross AUD", "Payslip period net AUD", "Bank net AUD", "User-entered gross comparison AUD", "Payslip-to-bank net difference AUD", "Shift note", "Period note"];
    const basisColumns = [draft.rateBasisType, draft.rateBasisCheckedOn, draft.sourceNote, rateBasisReady ? "READY" : "NOT READY"];
    const rows = draft.periods.flatMap((period) => period.shifts.length
      ? period.shifts.map((shift) => [...basisColumns, period.label, shift.date, shift.start, shift.end, safeNumber(shift.breakMinutes), shiftHours(shift).toFixed(2), shift.rateLabel, safeNumber(shift.hourlyRate).toFixed(2), safeNumber(shift.allowance).toFixed(2), shiftExpectedGross(shift).toFixed(2), safeNumber(period.payslipGross).toFixed(2), hasAmount(period.payslipNet) ? safeNumber(period.payslipNet).toFixed(2) : "", hasAmount(period.bankNet) ? safeNumber(period.bankNet).toFixed(2) : "", difference(period).toFixed(2), netDifferenceExport(period), shift.note, period.note])
      : [[...basisColumns, period.label, "", "", "", "", periodHours(period).toFixed(2), "Manual period total", "", "", periodExpectedGross(period).toFixed(2), safeNumber(period.payslipGross).toFixed(2), hasAmount(period.payslipNet) ? safeNumber(period.payslipNet).toFixed(2) : "", hasAmount(period.bankNet) ? safeNumber(period.bankNet).toFixed(2) : "", difference(period).toFixed(2), netDifferenceExport(period), "", period.note]]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    saveFile(`\uFEFF${csv}`, `${safeFileName(draft.employerLabel)}-pay-periods.csv`, "text/csv;charset=utf-8");
    setMessage("급여기간과 Shift 계산표를 CSV 파일로 저장했습니다.");
  };
  const downloadCaseArchive = () => {
    try {
      const archive = createPayEvidenceCaseArchive(draft);
      saveFile(JSON.stringify(archive, null, 2), `${safeFileName(draft.employerLabel)}-pay-evidence-case.json`, "application/json;charset=utf-8");
      setMessage("현재 사건 전체를 버전이 표시된 JSON 백업으로 저장했습니다.");
    } catch {
      setMessage("현재 기록이 너무 크거나 안전한 형식이 아니어서 백업하지 못했습니다. 긴 메모를 줄인 뒤 다시 시도하세요.");
    }
  };
  const reviewCaseArchive = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setPendingArchive(null);
    if (!file) return;
    if (file.size > MAX_PAY_EVIDENCE_ARCHIVE_BYTES) {
      setMessage("백업 파일이 허용 크기인 512KB를 초과해 현재 기록은 변경하지 않았습니다.");
      return;
    }
    try {
      const result = parsePayEvidenceCaseArchive(await file.text());
      if (!result.ok) {
        setMessage(`${result.error} 현재 기록은 변경하지 않았습니다.`);
        return;
      }
      setPendingArchive(result.archive);
      setMessage("백업을 읽었습니다. 아래 요약을 검토한 뒤 교체 여부를 선택하세요.");
    } catch {
      setMessage("백업 파일을 읽을 수 없어 현재 기록은 변경하지 않았습니다.");
    }
  };
  const restoreCaseArchive = () => {
    if (!pendingArchive) return;
    const nextDraft = normaliseDraft(pendingArchive.case);
    if (!persistDraft(nextDraft)) return;
    setDraft(nextDraft);
    setPendingArchive(null);
    setMessage("검토한 백업을 이 브라우저에 저장한 뒤 현재 Pay Evidence 기록을 교체했습니다.");
  };

  return <div>
    <section className="mb-6 border border-border bg-surface p-4" aria-label="Pay 기록 저장 상태">
      <p role="status" className="text-sm leading-6 text-navy">{saveStatus === "loading" ? "저장 기록을 확인하고 있습니다." : saveStatus === "blocked" ? "원본 보호 중 · 저장 기록을 읽지 못해 자동 저장과 복원을 멈췄습니다. 현재 화면을 JSON으로 백업하고 저장 권한·원본을 확인한 뒤 다시 열어 주세요." : saveStatus === "failed" ? "저장 실패 · 변경 내용이 아직 이 브라우저에 저장되지 않았습니다." : saveStatus === "pending" ? "변경 내용을 저장하고 있습니다. 완료 전 화면을 닫지 마세요." : "이 브라우저의 저장 상태를 확인했습니다."}</p>
      {saveStatus === "failed" && <button type="button" onClick={() => { if (persistDraft(draft)) setMessage("현재 화면을 이 브라우저에 저장했습니다. 검토 중인 백업은 그대로 유지됩니다."); }} className="mt-3 min-h-11 border border-navy px-4 text-sm font-semibold text-navy">현재 화면 저장 다시 시도</button>}
    </section>
    <section className="mb-8 grid border-y border-navy/20 sm:grid-cols-2 xl:grid-cols-4" aria-label="급여 기록 요약">
      <div className="border-b border-border px-4 py-5 sm:border-r xl:border-b-0"><p className="text-xs font-semibold text-muted">등록한 Shift</p><p className="mt-2 font-mono text-2xl text-navy">{shiftCount}개</p></div>
      <div className="border-b border-border px-4 py-5 xl:border-b-0 xl:border-r"><p className="text-xs font-semibold text-muted">계산한 근무시간</p><p className="mt-2 font-mono text-2xl text-navy">{calculatedHours.toFixed(2)}h</p></div>
      <div className="border-b border-border px-4 py-5 sm:border-b-0 sm:border-r"><p className="text-xs font-semibold text-muted">확인할 Gross 차이</p><p className="mt-2 font-mono text-2xl text-navy">A${estimatedDifference.toFixed(2)}</p></div>
      <div className="px-4 py-5"><p className="text-xs font-semibold text-muted">입력 보완이 필요한 Shift</p><p className={`mt-2 font-mono text-2xl ${incompleteShiftCount ? "text-red-700" : "text-navy"}`}>{incompleteShiftCount}개</p></div>
    </section>
    <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,0.95fr)_minmax(32rem,1.05fr)]">
    <div className="space-y-8">
      <section className="border-t border-navy/20 pt-6" aria-labelledby="pay-case-heading"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Case label</p><h2 id="pay-case-heading" className="mt-2 text-2xl font-semibold text-navy">급여 확인 기준</h2><p className="mt-3 text-sm leading-6 text-muted">회사 실명 대신 별칭을 사용할 수 있습니다. 이 화면은 적용 Award나 Classification을 선택해 주지 않습니다.</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-navy">직장 별칭<input className={inputClass} value={draft.employerLabel} onChange={(event) => setDraft((current) => ({ ...current, employerLabel: event.target.value }))} placeholder="예: 카페 A" /></label><label className="text-sm font-medium text-navy">고용 형태 메모<select className={inputClass} value={draft.employmentType} onChange={(event) => setDraft((current) => ({ ...current, employmentType: event.target.value as PayDraft["employmentType"] }))}><option>Unsure</option><option>Casual</option><option>Part-time</option><option>Full-time</option><option>Contractor — status needs checking</option></select></label><label className="text-sm font-medium text-navy">요율 근거 종류<select className={inputClass} value={draft.rateBasisType} onChange={(event) => setDraft((current) => ({ ...current, rateBasisType: event.target.value as RateBasisType }))}><option value="unsure">아직 모름</option><option value="award">Award</option><option value="agreement">Enterprise Agreement</option><option value="contract">Contract 또는 서면 고용조건</option><option value="other">기타 공식 근거</option></select></label><label className="text-sm font-medium text-navy">근거 확인 날짜<input type="date" className={inputClass} value={draft.rateBasisCheckedOn} onChange={(event) => setDraft((current) => ({ ...current, rateBasisCheckedOn: event.target.value }))} /></label><label className="text-sm font-medium text-navy sm:col-span-2">적용 기준·출처 메모<textarea className={`${inputClass} min-h-24 resize-y`} value={draft.sourceNote} onChange={(event) => setDraft((current) => ({ ...current, sourceNote: event.target.value }))} placeholder="예: Restaurant Award, Classification Level 2, Fair Work PACT에서 2026-08-30 확인" /></label></div><div aria-live="polite" className={`mt-4 border-l-2 px-4 py-3 text-sm leading-6 ${rateBasisReady ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-amber-500 bg-amber-50 text-amber-950"}`}><strong>{rateBasisReady ? "공유 기준 준비 완료" : "공유 기준 확인 필요"}</strong><p className="mt-1">{rateBasisReady ? "근거 종류, 확인 날짜, 출처 메모와 증빙 상태가 함께 기록됐습니다." : "요율 근거 종류·확인 날짜·출처 메모를 입력하고 아래 ‘적용 기준 근거’를 준비 완료로 표시해야 Gross 비교값을 공유 준비 완료로 봅니다."}</p></div><div className="mt-5 flex flex-wrap gap-3"><a href="https://calculate.fairwork.gov.au/" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center border border-navy px-4 text-sm font-semibold text-navy">Fair Work PACT 열기 ↗</a><Link href="/award-guide" className="inline-flex min-h-11 items-center border-b-2 border-gold px-1 text-sm font-semibold text-navy">무료 Award 가이드</Link></div></section>

      <section className="border border-border bg-white p-5 sm:p-7" aria-labelledby="evidence-heading"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Evidence readiness</p><h2 id="evidence-heading" className="mt-2 text-xl font-semibold text-navy">증빙 준비 현황</h2></div><div className="text-right"><p className="font-mono text-3xl text-navy">{progress}%</p><p className="text-xs text-muted">{evidenceReady}/{evidenceItems.length} 준비 완료</p></div></div><div className="mt-5 h-1.5 bg-surface"><div className="h-full bg-gold transition-all" style={{ width: `${progress}%` }} /></div><ol className="mt-6 divide-y divide-border border-y border-navy/20">{evidenceItems.map((item, index) => { const status = draft.evidence[item.id] ?? "missing"; return <li key={item.id} className="py-5"><div className="grid gap-3 sm:grid-cols-[2rem_1fr_8rem]"><span className="font-mono text-xs text-gold">{String(index + 1).padStart(2, "0")}</span><div><h3 className="font-semibold text-navy">{item.title}</h3><p className="mt-2 text-sm leading-6 text-muted">{item.detail}</p></div><label className="text-xs font-medium text-muted">상태<select className="mt-1 min-h-10 w-full border border-border bg-white px-2 text-sm text-navy" value={status} onChange={(event) => setDraft((current) => ({ ...current, evidence: { ...current.evidence, [item.id]: event.target.value as EvidenceStatus } }))}><option value="missing">없음·확인 전</option><option value="review">확인 필요</option><option value="ready">준비 완료</option></select></label></div></li>; })}</ol></section>
    </div>

    <div className="space-y-8">
      <section className="border border-border bg-white p-5 shadow-sm sm:p-7" aria-labelledby="period-heading">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Period comparison</p><h2 id="period-heading" className="mt-2 text-xl font-semibold text-navy">Shift부터 급여기간까지 계산</h2></div><div className="text-right"><p className="font-mono text-2xl text-navy">A${estimatedDifference.toFixed(2)}</p><p className="text-xs text-muted">확인할 Gross 차이 합계</p></div></div>
        <p className="mt-4 border-l-2 border-gold pl-3 text-xs leading-5 text-muted">내가 확인한 시급을 Shift별로 입력하면 근무시간과 기대 Gross를 자동으로 합산합니다. 이 계산은 Award·Classification이나 법적 미지급액을 판정하지 않습니다.</p>
        <div className="mt-5 space-y-5">
          {draft.periods.map((period, index) => <article key={period.id} className="border border-border p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-xs text-gold">PERIOD {String(index + 1).padStart(2, "0")}</p><p className="mt-1 text-xs text-muted">{period.shifts.length ? `${period.shifts.length}개 Shift 자동 계산` : "총액 직접 입력도 가능"}</p></div><button type="button" onClick={() => setDraft((current) => ({ ...current, periods: current.periods.filter((item) => item.id !== period.id) }))} className="min-h-9 text-xs font-medium text-muted hover:text-red-700">기간 삭제</button></div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label className="text-xs font-medium text-navy sm:col-span-2 lg:col-span-3">급여기간 별칭<input className={inputClass} value={period.label} onChange={(event) => updatePeriod(period.id, "label", event.target.value)} placeholder="예: 7월 1–14일" /></label>
              {!period.shifts.length && <><label className="text-xs font-medium text-navy">총 근무시간 직접 입력<input type="number" min="0" step="0.25" className={inputClass} value={period.hours} onChange={(event) => updatePeriod(period.id, "hours", event.target.value)} /></label><label className="text-xs font-medium text-navy">기대 Gross 직접 입력 A$<input type="number" min="0" step="0.01" className={inputClass} value={period.expectedGross} onChange={(event) => updatePeriod(period.id, "expectedGross", event.target.value)} /></label></>}
              <label className="text-xs font-medium text-navy">Payslip Gross A$<input type="number" min="0" step="0.01" className={inputClass} value={period.payslipGross} onChange={(event) => updatePeriod(period.id, "payslipGross", event.target.value)} /></label>
              <label className="text-xs font-medium text-navy">Payslip Net A$<input type="number" min="0" step="0.01" className={inputClass} value={period.payslipNet} onChange={(event) => updatePeriod(period.id, "payslipNet", event.target.value)} /></label>
              <label className="text-xs font-medium text-navy">은행 입금 Net A$<input type="number" min="0" step="0.01" className={inputClass} value={period.bankNet} onChange={(event) => updatePeriod(period.id, "bankNet", event.target.value)} /></label>
              <p aria-live="polite" className={`text-xs leading-5 sm:col-span-2 lg:col-span-3 ${hasAmount(period.payslipNet) && hasAmount(period.bankNet) && Math.abs(netDifference(period)) >= 0.01 ? "text-red-700" : "text-muted"}`}>{netComparisonLabel(period)}</p>
            </div>

            <div className="mt-5 border-t border-border pt-4">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-semibold text-navy">Shift 계산표</h3><p className="mt-1 text-xs text-muted">자정을 넘긴 Shift도 종료시각을 다음 날로 계산해요.</p></div><button type="button" onClick={() => updatePeriod(period.id, "shifts", [...period.shifts, newShift()])} className="min-h-10 border-b-2 border-gold text-xs font-semibold text-navy">+ Shift 추가</button></div>
              <div className="mt-4 space-y-3">{period.shifts.map((shift, shiftIndex) => <div key={shift.id} className="bg-surface p-4">
                <div className="flex items-center justify-between"><p className="font-mono text-[0.68rem] text-gold">SHIFT {String(shiftIndex + 1).padStart(2, "0")}</p><button type="button" onClick={() => updatePeriod(period.id, "shifts", period.shifts.filter((item) => item.id !== shift.id))} className="min-h-8 text-xs text-muted hover:text-red-700">삭제</button></div>
                <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <label className="text-xs font-medium text-navy">근무일<input type="date" className={inputClass} value={shift.date} onInput={(event) => updateShift(period.id, shift.id, "date", event.currentTarget.value)} /></label>
                  <label className="text-xs font-medium text-navy">시작<input type="time" className={inputClass} value={shift.start} onInput={(event) => updateShift(period.id, shift.id, "start", event.currentTarget.value)} /></label>
                  <label className="text-xs font-medium text-navy">종료<input type="time" className={inputClass} value={shift.end} onInput={(event) => updateShift(period.id, shift.id, "end", event.currentTarget.value)} /></label>
                  <label className="text-xs font-medium text-navy">무급 휴게(분)<input type="number" min="0" step="1" className={inputClass} value={shift.breakMinutes} onChange={(event) => updateShift(period.id, shift.id, "breakMinutes", event.target.value)} /></label>
                  <label className="text-xs font-medium text-navy">요율 이름<input className={inputClass} value={shift.rateLabel} onChange={(event) => updateShift(period.id, shift.id, "rateLabel", event.target.value)} placeholder="예: Saturday" /></label>
                  <label className="text-xs font-medium text-navy">확인한 시급 A$<input type="number" min="0" step="0.01" className={inputClass} value={shift.hourlyRate} onChange={(event) => updateShift(period.id, shift.id, "hourlyRate", event.target.value)} /></label>
                  <label className="text-xs font-medium text-navy">Allowance A$<input type="number" min="0" step="0.01" className={inputClass} value={shift.allowance} onChange={(event) => updateShift(period.id, shift.id, "allowance", event.target.value)} /></label>
                  <label className="text-xs font-medium text-navy sm:col-span-2">근거·메모<input className={inputClass} value={shift.note} onChange={(event) => updateShift(period.id, shift.id, "note", event.target.value)} placeholder="예: Roster 캡처 보관" /></label>
                </div>
                <p className="mt-3 text-xs font-semibold text-navy">{shiftHours(shift).toFixed(2)}시간 · 기대 Gross A${shiftExpectedGross(shift).toFixed(2)}</p>
              </div>)}</div>
            </div>

            <div className="mt-5 grid gap-3 border-t border-border pt-4 sm:grid-cols-[1fr_auto]"><label className="text-xs font-medium text-navy">이 기간 확인 메모<textarea className={`${inputClass} min-h-20 resize-y`} value={period.note} onChange={(event) => updatePeriod(period.id, "note", event.target.value)} placeholder="예: 토요일 요율이 빠진 것으로 보여 PACT 결과와 대조 필요" /></label><div className="self-end border-l-2 border-gold pl-4 text-sm"><p className="text-xs text-muted">{periodHours(period).toFixed(2)}시간 · 기대 A${periodExpectedGross(period).toFixed(2)}</p><p className={`mt-1 font-semibold ${difference(period) > 0 ? "text-red-700" : "text-navy"}`}>Gross 차이 A${difference(period).toFixed(2)}</p></div></div>
          </article>)}
        </div>
        <button type="button" onClick={() => setDraft((current) => ({ ...current, periods: [...current.periods, newPeriod()] }))} className="mt-5 min-h-11 border-b-2 border-gold text-sm font-semibold text-navy">+ 급여기간 추가</button>
      </section>

      <section className="border border-border bg-white p-5 shadow-sm sm:p-7" aria-labelledby="request-heading">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Written request</p><h2 id="request-heading" className="mt-2 text-xl font-semibold text-navy">상황에 맞는 영문 급여 문의</h2></div><button type="button" onClick={copyRequest} disabled={!draft.requestDraft} className="min-h-11 border-b-2 border-gold text-sm font-semibold text-navy disabled:opacity-35">텍스트 복사</button></div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2" role="group" aria-label="문의 유형">
          <button type="button" aria-pressed={draft.requestType === "first"} onClick={() => setDraft((current) => ({ ...current, requestType: "first" }))} className={`min-h-12 border px-4 text-left text-sm font-semibold ${draft.requestType === "first" ? "border-navy bg-navy text-white" : "border-border text-navy"}`}>처음 확인을 요청할 때</button>
          <button type="button" aria-pressed={draft.requestType === "followup"} onClick={() => setDraft((current) => ({ ...current, requestType: "followup" }))} className={`min-h-12 border px-4 text-left text-sm font-semibold ${draft.requestType === "followup" ? "border-navy bg-navy text-white" : "border-border text-navy"}`}>답변이 없어 다시 물을 때</button>
        </div>
        <button type="button" onClick={makeRequest} className="mt-4 min-h-11 bg-navy px-4 text-sm font-semibold text-white">선택한 문의문 만들기</button>
        <label className="sr-only" htmlFor="pay-request-draft">영문 급여 확인 요청문</label><textarea id="pay-request-draft" className={`${inputClass} mt-5 min-h-72 resize-y font-serif leading-7`} value={draft.requestDraft} onChange={(event) => setDraft((current) => ({ ...current, requestDraft: event.target.value }))} placeholder="급여기간을 기록한 뒤 문의 유형을 선택하세요." />
        <div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={downloadSummary} className="min-h-11 bg-navy px-4 text-sm font-semibold text-white">전체 요약 TXT</button><button type="button" onClick={downloadCsv} className="min-h-11 border border-navy px-4 text-sm font-semibold text-navy">Shift 계산표 CSV</button></div>
        <p className="mt-2 text-xs leading-5 text-muted">원본 Payslip·은행자료·TFN은 파일에 포함하지 않습니다.</p><p className="mt-4 min-h-5 text-xs leading-5 text-muted" aria-live="polite">{message}</p>
      </section>

      <section className="border border-border bg-white p-5 shadow-sm sm:p-7" aria-labelledby="case-archive-heading">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Portable case archive</p>
        <h2 id="case-archive-heading" className="mt-2 text-xl font-semibold text-navy">사건 전체 백업·복원</h2>
        <p className="mt-3 text-sm leading-6 text-muted">회사 별칭, 요율 근거, 급여기간, Shift, 증빙 상태와 문의문을 하나의 버전형 JSON에 담아 다른 기기에서도 이어갈 수 있습니다. 원본 Payslip·은행 파일, TFN, 계좌번호, 여권·비자 정보는 담지 마세요.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={downloadCaseArchive} className="min-h-11 bg-navy px-4 text-sm font-semibold text-white">현재 사건 JSON 백업</button>
          <label className="inline-flex min-h-11 cursor-pointer items-center border border-navy px-4 text-sm font-semibold text-navy">백업 파일 검토<input type="file" accept="application/json,.json" onChange={reviewCaseArchive} className="sr-only" /></label>
        </div>
        <p className="mt-3 text-xs leading-5 text-muted">파일을 선택해도 즉시 복원하지 않습니다. 형식·크기·항목 수를 검사하고 아래 요약을 보여준 뒤, 별도 확인 버튼을 눌러야 현재 기록이 교체됩니다.</p>
        {pendingArchive && <div className="mt-5 border-l-2 border-gold bg-surface px-4 py-4" aria-live="polite">
          <p className="text-sm font-semibold text-navy">복원 전 검토</p>
          <dl className="mt-3 grid gap-2 text-xs leading-5 text-muted sm:grid-cols-2">
            <div><dt className="font-semibold text-navy">직장 별칭</dt><dd>{pendingArchive.case.employerLabel || "설정 안 됨"}</dd></div>
            <div><dt className="font-semibold text-navy">백업 시각</dt><dd>{new Date(pendingArchive.exportedAt).toLocaleString("ko-KR", { timeZone: "Australia/Sydney" })}</dd></div>
            <div><dt className="font-semibold text-navy">급여기간·Shift</dt><dd>{pendingArchive.case.periods.length}개 · {pendingArchive.case.periods.reduce((sum, period) => sum + period.shifts.length, 0)}개</dd></div>
            <div><dt className="font-semibold text-navy">요율 근거</dt><dd>{pendingArchive.case.rateBasisType} · {pendingArchive.case.rateBasisCheckedOn || "확인 날짜 없음"}</dd></div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={restoreCaseArchive} className="min-h-11 bg-navy px-4 text-sm font-semibold text-white">현재 기록을 이 백업으로 교체</button>
            <button type="button" onClick={() => { setPendingArchive(null); setMessage("백업 검토를 취소해 현재 기록을 유지했습니다."); }} className="min-h-11 border border-navy px-4 text-sm font-semibold text-navy">취소하고 현재 기록 유지</button>
          </div>
        </div>}
      </section>

      <section className="bg-navy p-5 text-white sm:p-7" aria-labelledby="pay-review-heading"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Review before sharing</p><h2 id="pay-review-heading" className="mt-2 text-xl font-semibold">보내기 전 마지막 확인</h2><p className="mt-4 text-sm leading-6 text-white/70">증빙 확인 필요 {reviewCount}개 · 급여기간 {draft.periods.length}개 · 입력 보완 Shift {incompleteShiftCount}개 · Net 불일치 {netMismatchCount}개 · Net 입력 미완성 {incompleteNetCount}개</p><p className="mt-3 text-xs leading-5 text-white/55">Gross 비교값은 미지급액 판정이 아니며, Net 불일치는 Payslip Net과 실제 입금액의 기록 차이만 보여줍니다. Award·Agreement·Classification과 해당 시점의 요율은 Fair Work PACT 또는 전문가에게 확인하세요.</p></section>
    </div>
    </div>
  </div>;
}
