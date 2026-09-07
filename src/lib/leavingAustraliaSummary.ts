import { assessLeavingDependencies } from "./leavingAustraliaDependencies";
import { assessLeavingOutcome } from "./leavingAustraliaOutcome";
import { describeLeavingAmount, formatLeavingCents, summarizeLeavingAmounts } from "./leavingAustraliaProAmounts";
import type { DepartureDraft, TaskStatus, SettlementStatus } from "./leavingAustraliaProStorage";

export const tasks = [
  { id: "final-pay", phase: "출국 전", title: "최종 급여·Payslip", detail: "마지막 급여일, 미사용 휴가와 고용주 Super 납입 시점을 서면 자료로 확인합니다." },
  { id: "income", phase: "출국 전", title: "Income statement·세금 자료", detail: "해외에서도 myGov와 ATO에 안전하게 접근할 수 있는지 확인하고 기록을 보관합니다." },
  { id: "bond", phase: "출국 전", title: "퇴거·Bond 반환", detail: "Condition report, 사진, 열쇠 반납과 관할 공식 Bond 청구 상태를 확인합니다." },
  { id: "utilities", phase: "출국 전", title: "전기·가스·인터넷 종료", detail: "최종 검침, 종료일, 장비 반납과 마지막 청구서 수령 방법을 기록합니다." },
  { id: "bank", phase: "출국 전", title: "호주 계좌 유지·해지 순서", detail: "Bond, 급여, 세금 또는 DASP 지급 방법을 확인하기 전에 계좌를 닫지 않습니다." },
  { id: "access", phase: "출국 전", title: "전화번호·2단계 인증", detail: "호주 번호 해지 전에 은행·myGov·이메일의 복구 수단을 해외에서 사용할 방법으로 바꿉니다." },
  { id: "super", phase: "출국 전", title: "모든 Super 계정 확인", detail: "펀드명과 연락처, 마지막 납입 여부를 본인의 안전한 기록에서 확인합니다." },
  { id: "departed", phase: "출국 후", title: "실제 출국 확인", detail: "DASP는 호주를 떠난 뒤에만 제출할 수 있습니다." },
  { id: "visa", phase: "출국 후", title: "모든 임시비자 종료 확인", detail: "DASP 제출에는 보유한 모든 임시비자가 더 이상 유효하지 않아야 합니다. 비자 취소 결정은 별도로 신중히 확인하세요." },
  { id: "dasp", phase: "출국 후", title: "DASP 신청·확인 메일", detail: "ATO 공식 시스템에서 신청하고 제출 확인과 지급 명세를 보관합니다." },
  { id: "tax", phase: "출국 후", title: "마지막 Tax return 일정", detail: "대부분 6월 30일 뒤 해외에서도 신고할 수 있습니다. 조기 신고 대상은 ATO 조건을 확인합니다." },
] as const;
export const taskTitles = new Map<string, string>(tasks.map((task) => [task.id, task.title]));

export const taskLabels: Record<TaskStatus, string> = { todo: "준비 전", waiting: "요청·신청함 / 결과 대기", done: "결과·근거 대조 완료" };
export const settlementLabels: Record<SettlementStatus, string> = { expected: "받을 예정", followup: "요청·신청함 / 확인 필요", received: "실제 수령·최종 청구 대조 완료" };

export function createLeavingSummary(draft: DepartureDraft): string {
  const outstanding = summarizeLeavingAmounts(draft.settlements);
  const outstandingDisplay = outstanding.pending === 0 ? "미수령 항목 없음" : outstanding.valid === 0 ? "합산 가능한 금액 없음" : formatLeavingCents(outstanding.cents);
  const amountCoverage = `미수령 ${outstanding.pending}건 중 포함 ${outstanding.valid}건 · 미입력 ${outstanding.blank}건 · 입력 중 ${outstanding.incomplete}건 · 오류 ${outstanding.invalid}건 · 수령 완료 ${outstanding.received}건은 소계 제외`;
  const dependencyReview = assessLeavingDependencies(draft);
  const completed = assessLeavingOutcome(draft, false).completedTaskIds.length;
  const settlementLabel = (id: string) => {
    const item = draft.settlements.find((settlement) => settlement.id === id);
    return item ? `${item.kind}: ${item.label || "Untitled"}` : id;
  };
  const lines = [
    "HOJU COMPASS — LEAVING AUSTRALIA PREPARATION SUMMARY",
    `Departure date: ${draft.departureDate || "Not set"}`,
    `Destination label: ${draft.destination || "Not set"}`,
    `Task completion with evidence: ${completed}/${tasks.length}`,
    "",
    "CLOSURE ORDER REVIEW",
    `Review flags: ${dependencyReview.totalFlags}`,
    "BANK CLOSURE DEPENDENCIES",
    ...(dependencyReview.bankDependencies.length
      ? dependencyReview.bankDependencies.map((id) => `- ${taskTitles.get(id) ?? id}`)
      : ["- Task dependencies complete"]),
    ...(dependencyReview.pendingSettlementIds.length
      ? dependencyReview.pendingSettlementIds.map((id) => `- Pending payment: ${settlementLabel(id)}`)
      : ["- No pending payment records"]),
    "",
    "DASP SEQUENCE RECORDS",
    ...(dependencyReview.daspPrerequisites.length
      ? dependencyReview.daspPrerequisites.map((id) => `- ${taskTitles.get(id) ?? id}`)
      : ["- Recorded prerequisites complete"]),
    "",
    `OVERSEAS ACCESS CONTINUITY: ${dependencyReview.accessContinuityReady ? "Recorded complete" : "Needs review"}`,
    `STATUS CONFLICTS: ${dependencyReview.bankMarkedDoneTooEarly || dependencyReview.daspMarkedDoneTooEarly ? "Review task statuses" : "None flagged"}`,
    "These are sequencing flags based on your entries, not a bank-closure, visa, tax, Super or DASP eligibility decision.",
    "",
    "TASKS",
    ...tasks.flatMap((task) => {
      const note = draft.taskNotes?.[task.id];
      return [
        `- [${draft.applicability?.[task.id] === "not_applicable" ? "해당 없음" : taskLabels[draft.statuses[task.id] ?? "todo"]}] ${task.phase} / ${task.title}`,
        ...(note ? [
          `  Next action / question: ${note.nextAction || "Not recorded"}`,
          `  Contact organisation / role: ${note.contact || "Not recorded"}`,
          `  Follow-up date / schedule note (no automatic reminder): ${note.followUpOn || "Not recorded"}`,
          `  User-recorded result / completion evidence: ${note.completionNote || "Not recorded"}`,
        ] : []),
      ];
    }),
    "",
    "EXPECTED PAYMENTS — user-entered tracking amounts only",
    `미수령 유효 입력 소계 · 검증 안 됨: ${outstandingDisplay}`,
    amountCoverage,
    "합계는 유효한 입력만 포함한 소계이며 실제 지급액이나 확정액이 아닙니다. 수령 완료로 표시해도 입력 금액이 검증되지는 않습니다.",
    ...(draft.settlements.length ? draft.settlements.flatMap((item) => [`- ${item.kind}: ${item.label || "Untitled"} | ${settlementLabels[item.status]} | Due ${item.dueDate || "not set"} | ${describeLeavingAmount(item.amount)}${item.status === "received" ? " | 미수령 소계 제외 (수령 완료)" : ""}`, `  Note: ${item.note || "None"}`]) : ["- None recorded"]),
    "",
    "QUESTIONS TO CONFIRM",
    ...(draft.questions.length ? draft.questions.map((item, index) => `${index + 1}. ${item}`) : ["- None recorded"]),
    "",
    "This is a personal preparation summary, not migration, tax, superannuation or legal advice. Amounts are not verified. Do not add TFN, passport, bank, visa or super membership numbers.",
  ];
  return lines.join("\r\n");
}
