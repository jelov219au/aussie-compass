export type LeavingTaskStatus = "todo" | "waiting" | "done";

export type LeavingDependencyDraft = {
  statuses: Record<string, LeavingTaskStatus>;
  settlements: Array<{
    id: string;
    kind: string;
    label: string;
    status: "expected" | "followup" | "received";
  }>;
};

export type LeavingDependencyReview = {
  bankDependencies: string[];
  pendingSettlementIds: string[];
  daspPrerequisites: string[];
  accessContinuityReady: boolean;
  bankMarkedDoneTooEarly: boolean;
  daspMarkedDoneTooEarly: boolean;
  totalFlags: number;
};

const bankDependencyIds = ["final-pay", "bond", "utilities", "dasp", "tax"];
const daspPrerequisiteIds = ["departed", "visa", "super"];

export function assessLeavingDependencies(draft: LeavingDependencyDraft): LeavingDependencyReview {
  const bankDependencies = bankDependencyIds.filter((id) => draft.statuses[id] !== "done");
  const pendingSettlementIds = draft.settlements
    .filter((settlement) => settlement.status !== "received")
    .map((settlement) => settlement.id);
  const daspPrerequisites = daspPrerequisiteIds.filter((id) => draft.statuses[id] !== "done");
  const accessContinuityReady = draft.statuses.access === "done";
  const bankMarkedDoneTooEarly = draft.statuses.bank === "done"
    && (bankDependencies.length > 0 || pendingSettlementIds.length > 0 || !accessContinuityReady);
  const daspMarkedDoneTooEarly = draft.statuses.dasp === "done" && daspPrerequisites.length > 0;

  return {
    bankDependencies,
    pendingSettlementIds,
    daspPrerequisites,
    accessContinuityReady,
    bankMarkedDoneTooEarly,
    daspMarkedDoneTooEarly,
    totalFlags: bankDependencies.length
      + pendingSettlementIds.length
      + daspPrerequisites.length
      + (accessContinuityReady ? 0 : 1)
      + (bankMarkedDoneTooEarly ? 1 : 0)
      + (daspMarkedDoneTooEarly ? 1 : 0),
  };
}
