import type { PayEvidenceDraft as PayDraft, PayEvidencePeriod as PayPeriod, PayEvidenceShift as ShiftEntry, PayEvidenceStatus as EvidenceStatus } from "./payEvidenceCaseArchive";

export const evidenceItems = [
  { id: "hours", title: "개인 근무시간 기록", detail: "날짜별 시작·종료, 무급 휴게와 실제 수행한 준비·마감 업무를 확인합니다." },
  { id: "roster", title: "Roster·Timesheet", detail: "원본 화면이나 변경 내역을 본인의 안전한 저장소에 보관합니다." },
  { id: "payslip", title: "Payslip", detail: "급여일 뒤 1 working day 안에 받았는지, 급여기간·Gross·Net·공제·Super 표시를 확인합니다." },
  { id: "bank", title: "실제 입금 기록", detail: "은행 Net 입금액은 Payslip의 Net과 비교하고 Gross 금액과 직접 비교하지 않습니다." },
  { id: "basis", title: "적용 기준 근거", detail: "계약, Award·Agreement, Classification과 해당 기간 Pay guide의 출처를 기록합니다." },
  { id: "messages", title: "고용주와 주고받은 내용", detail: "질문한 날짜, 답변과 정정 약속을 시간순으로 보관합니다." },
] as const;
export const statusLabels: Record<EvidenceStatus, string> = { missing: "없음·확인 전", review: "확인 필요", ready: "준비 완료" };
export function safeNumber(value: string) { const number = Number(value); return Number.isFinite(number) && number >= 0 ? number : 0; }
export function minutesFromTime(value: string) { const [hours, minutes] = value.split(":").map(Number); return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : null; }
export function shiftHours(shift: ShiftEntry) {
  const start = minutesFromTime(shift.start); const end = minutesFromTime(shift.end);
  if (start === null || end === null) return 0;
  const elapsed = end >= start ? end - start : end + 24 * 60 - start;
  return Math.max(0, elapsed - safeNumber(shift.breakMinutes)) / 60;
}
export function shiftExpectedGross(shift: ShiftEntry) { return shiftHours(shift) * safeNumber(shift.hourlyRate) + safeNumber(shift.allowance); }
export function periodHours(period: PayPeriod) { return period.shifts.length ? period.shifts.reduce((sum, shift) => sum + shiftHours(shift), 0) : safeNumber(period.hours); }
export function periodExpectedGross(period: PayPeriod) { return period.shifts.length ? period.shifts.reduce((sum, shift) => sum + shiftExpectedGross(shift), 0) : safeNumber(period.expectedGross); }
export function difference(period: PayPeriod) { return periodExpectedGross(period) - safeNumber(period.payslipGross); }
export function hasAmount(value: string) { return value.trim() !== ""; }
export function netDifference(period: PayPeriod) { return safeNumber(period.payslipNet) - safeNumber(period.bankNet); }
export function netComparisonLabel(period: PayPeriod) {
  if (!hasAmount(period.payslipNet) || !hasAmount(period.bankNet)) return "Payslip Net과 실제 입금 Net을 모두 입력하세요.";
  const amount = netDifference(period);
  if (Math.abs(amount) < 0.01) return "Payslip Net과 실제 입금 Net이 일치합니다.";
  return amount > 0 ? `실제 입금이 Payslip Net보다 A$${amount.toFixed(2)} 적습니다.` : `실제 입금이 Payslip Net보다 A$${Math.abs(amount).toFixed(2)} 많습니다.`;
}
export function netDifferenceExport(period: PayPeriod) { return hasAmount(period.payslipNet) && hasAmount(period.bankNet) ? netDifference(period).toFixed(2) : "Not comparable"; }
export function recordedAmount(value: string) { return hasAmount(value) ? safeNumber(value).toFixed(2) : "Not recorded"; }
export function recordedNumber(value: string, suffix = "") { return hasAmount(value) ? `${safeNumber(value).toFixed(2)}${suffix}` : "Not recorded"; }
export function recordedAudAmount(value: string, suffix = "") { return hasAmount(value) ? `A$${safeNumber(value).toFixed(2)}${suffix}` : "Not recorded"; }
export function periodHoursExport(period: PayPeriod) { return period.shifts.length ? periodHours(period).toFixed(2) : recordedNumber(period.hours); }
export function periodExpectedGrossExport(period: PayPeriod) { return period.shifts.length ? `A$${periodExpectedGross(period).toFixed(2)}` : recordedAudAmount(period.expectedGross); }
export function grossDifferenceExport(period: PayPeriod) { return (period.shifts.length || hasAmount(period.expectedGross)) && hasAmount(period.payslipGross) ? `A$${difference(period).toFixed(2)}` : "Not comparable"; }
export function safeFileName(value: string) { return value.trim().replace(/[^a-z0-9가-힣]+/gi, "-").replace(/^-|-$/g, "").slice(0, 42) || "pay-evidence"; }
export function csvCell(value: string | number) { return `"${String(value).replaceAll('"', '""')}"`; }

export function isPayEvidenceRateBasisReady(draft: PayDraft): boolean {
  return draft.rateBasisType !== "unsure"
  && Boolean(draft.sourceNote.trim())
  && /^\d{4}-\d{2}-\d{2}$/.test(draft.rateBasisCheckedOn)
  && draft.evidence.basis === "ready";
}

export function createPayEvidenceRequest(draft: PayDraft): string {
  const rateBasisReady = draft.rateBasisType !== "unsure"
  && Boolean(draft.sourceNote.trim())
  && /^\d{4}-\d{2}-\d{2}$/.test(draft.rateBasisCheckedOn)
  && draft.evidence.basis === "ready";
  const estimatedDifference = draft.periods.reduce((sum, period) => sum + Math.max(0, difference(period)), 0);
  const periodNames = draft.periods.map((period) => period.label.trim()).filter(Boolean).join(", ") || "the pay periods listed in my records";
  const amountLine = estimatedDifference > 0 && rateBasisReady
    ? `Using the rate basis I recorded and checked on ${draft.rateBasisCheckedOn}, my preliminary comparison shows a gross difference of A$${estimatedDifference.toFixed(2)} before tax. Please verify the applicable instrument, classification and rates.`
    : estimatedDifference > 0
      ? "I made a preliminary comparison, but I have not confirmed the applicable instrument, classification and dated rate source, so I am not presenting the difference as verified."
      : "I would like to confirm that the recorded hours and gross pay are correct.";
  const firstRequest = `Subject: Request to review pay records\n\nHi Payroll/Manager,\n\nI am reviewing my time and pay records for ${periodNames}. ${amountLine}\n\nCould you please check the hours, pay rates, penalties, allowances and deductions used for these periods, and provide the relevant time and wage records if available? I can share my period-by-period calculation without sensitive bank or tax details.\n\nPlease let me know the outcome in writing and how any correction will be shown on a payslip.\n\nThank you.`;
  const followupRequest = `Subject: Follow-up on pay record review\n\nHi Payroll/Manager,\n\nI am following up on my request to review the pay records for ${periodNames}. ${amountLine}\n\nCould you please confirm when the review will be completed and provide the hours, pay rates, penalties, allowances and deductions used for these periods? If a correction is required, please also confirm when it will be paid and how it will appear on the corrected payslip.\n\nI would appreciate a written response by a reasonable date so I can keep my records up to date.\n\nThank you.`;
  return draft.requestType === "followup" ? followupRequest : firstRequest;
}

export function createPayEvidenceSummary(draft: PayDraft): string {
  const rateBasisReady = draft.rateBasisType !== "unsure"
  && Boolean(draft.sourceNote.trim())
  && /^\d{4}-\d{2}-\d{2}$/.test(draft.rateBasisCheckedOn)
  && draft.evidence.basis === "ready";
  const estimatedDifference = draft.periods.reduce((sum, period) => sum + Math.max(0, difference(period)), 0);
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
  return lines.join("\r\n");
}

export function createPayEvidenceCsv(draft: PayDraft): string {
  const rateBasisReady = draft.rateBasisType !== "unsure"
  && Boolean(draft.sourceNote.trim())
  && /^\d{4}-\d{2}-\d{2}$/.test(draft.rateBasisCheckedOn)
  && draft.evidence.basis === "ready";
  const header = ["Rate basis type", "Rate basis checked on", "Rate basis/source note", "Share readiness", "Pay period", "Shift date", "Start", "End", "Unpaid break minutes", "Calculated hours", "Rate label", "Hourly rate AUD", "Allowance AUD", "Expected shift gross AUD", "Payslip period gross AUD", "Payslip period net AUD", "Bank net AUD", "User-entered gross comparison AUD", "Payslip-to-bank net difference AUD", "Shift note", "Period note"];
  const basisColumns = [draft.rateBasisType, draft.rateBasisCheckedOn, draft.sourceNote, rateBasisReady ? "READY" : "NOT READY"];
  const rows = draft.periods.flatMap((period) => period.shifts.length
    ? period.shifts.map((shift) => [...basisColumns, period.label, shift.date, shift.start, shift.end, safeNumber(shift.breakMinutes), shiftHours(shift).toFixed(2), shift.rateLabel, safeNumber(shift.hourlyRate).toFixed(2), safeNumber(shift.allowance).toFixed(2), shiftExpectedGross(shift).toFixed(2), safeNumber(period.payslipGross).toFixed(2), hasAmount(period.payslipNet) ? safeNumber(period.payslipNet).toFixed(2) : "", hasAmount(period.bankNet) ? safeNumber(period.bankNet).toFixed(2) : "", difference(period).toFixed(2), netDifferenceExport(period), shift.note, period.note])
    : [[...basisColumns, period.label, "", "", "", "", periodHours(period).toFixed(2), "Manual period total", "", "", periodExpectedGross(period).toFixed(2), safeNumber(period.payslipGross).toFixed(2), hasAmount(period.payslipNet) ? safeNumber(period.payslipNet).toFixed(2) : "", hasAmount(period.bankNet) ? safeNumber(period.bankNet).toFixed(2) : "", difference(period).toFixed(2), netDifferenceExport(period), "", period.note]]);
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  return `\uFEFF${csv}`;
}
