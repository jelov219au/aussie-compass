import type { DepartureDraft } from "./leavingAustraliaProStorage";

export const leavingTaskIds = [
  "final-pay", "income", "bond", "utilities", "bank", "access", "super", "departed", "visa", "dasp", "tax",
] as const;

export const leavingMoneyTaskSettlementKinds: Partial<Record<(typeof leavingTaskIds)[number], string>> = {
  "final-pay": "Final pay",
  bond: "Bond",
  utilities: "Utility credit",
  dasp: "DASP",
  tax: "Tax refund",
};

export type LeavingOutcomeAssessment = {
  departureBasisReady: boolean;
  missingApplicabilityIds: string[];
  urgentTaskIds: string[];
  moneyTasksWithoutSettlement: string[];
  incompleteDoneIds: string[];
  moneyTasksWithoutReceivedSettlement: string[];
  completedTaskIds: string[];
  closedTaskIds: string[];
  firstOutcomeIssues: string[];
  firstOutcomeReady: boolean;
  progress: number;
};

const hasText = (value: string | undefined) => Boolean(value?.trim());

export function assessLeavingOutcome(draft: DepartureDraft, currentReview: boolean): LeavingOutcomeAssessment {
  const departureBasisReady = hasText(draft.departureDate)
    || (draft.applicability?.departed === "applicable" && draft.statuses.departed === "done" && hasText(draft.taskNotes?.departed?.completionNote));
  const missingApplicabilityIds = leavingTaskIds.filter((id) => draft.applicability?.[id] === undefined);
  const applicableIds = leavingTaskIds.filter((id) => draft.applicability?.[id] === "applicable");
  const urgentTaskIds = applicableIds.filter((id) => {
    const note = draft.taskNotes?.[id];
    return hasText(note?.nextAction) && hasText(note?.followUpOn);
  });
  const settlementFor = (id: (typeof leavingTaskIds)[number]) => {
    const kind = leavingMoneyTaskSettlementKinds[id];
    return kind ? draft.settlements.filter((settlement) => settlement.kind === kind && hasText(settlement.label)) : [];
  };
  const applicableMoneyIds = applicableIds.filter((id): id is keyof typeof leavingMoneyTaskSettlementKinds => id in leavingMoneyTaskSettlementKinds);
  const moneyTasksWithoutSettlement = applicableMoneyIds.filter((id) => settlementFor(id).length === 0);
  const doneIds = applicableIds.filter((id) => draft.statuses[id] === "done");
  const incompleteDoneIds = doneIds.filter((id) => !hasText(draft.taskNotes?.[id]?.completionNote));
  const moneyTasksWithoutReceivedSettlement = doneIds.filter((id) => {
    if (!(id in leavingMoneyTaskSettlementKinds)) return false;
    return !settlementFor(id).some((settlement) => settlement.status === "received");
  });
  const invalidDone = new Set([...incompleteDoneIds, ...moneyTasksWithoutReceivedSettlement]);
  const completedTaskIds = doneIds.filter((id) => !invalidDone.has(id));
  const closedTaskIds = leavingTaskIds.filter((id) => draft.applicability?.[id] === "not_applicable" || completedTaskIds.includes(id));
  const firstOutcomeIssues = [
    ...(!departureBasisReady ? ["출국 예정일을 입력하거나 실제 출국을 완료 근거와 함께 기록해 주세요."] : []),
    ...(missingApplicabilityIds.length ? [`적용 여부를 선택하지 않은 작업이 ${missingApplicabilityIds.length}개 있습니다.`] : []),
    ...(!urgentTaskIds.length ? ["적용되는 작업 하나 이상에 다음 행동과 다시 확인할 날을 함께 기록해 주세요."] : []),
    ...(moneyTasksWithoutSettlement.length ? [`적용되는 금액 업무 ${moneyTasksWithoutSettlement.length}개에 정산 종류와 별칭을 기록해 주세요.`] : []),
    ...(!currentReview ? ["현재 기록의 출국 정리 의존성을 검토해 주세요."] : []),
  ];
  const rawProgress = Math.round((closedTaskIds.length / leavingTaskIds.length) * 100);
  const progress = rawProgress === 100 && !currentReview ? 99 : rawProgress;

  return {
    departureBasisReady,
    missingApplicabilityIds,
    urgentTaskIds,
    moneyTasksWithoutSettlement,
    incompleteDoneIds,
    moneyTasksWithoutReceivedSettlement,
    completedTaskIds,
    closedTaskIds,
    firstOutcomeIssues,
    firstOutcomeReady: firstOutcomeIssues.length === 0,
    progress,
  };
}
