import type { EofyDraft, EofyExpenseRecord } from "@/lib/eofyProArchive";
import { getEofyExpenseArchiveIssues } from "./eofyProExpenseValidation.mjs";

export type EofyHandoffReview = {
  incomeNotReady: string[];
  missingEvidence: string[];
  reimbursed: string[];
  privateUseGaps: string[];
  incompleteDetails: string[];
  flaggedExpenseCount: number;
  totalFlags: number;
};

const incomeSourceIds = ["employment", "interest", "government", "gig", "complex"];

function amount(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function hasIncompleteDetails(expense: EofyExpenseRecord) {
  const workUse = amount(expense.workUse);
  return getEofyExpenseArchiveIssues(expense).length > 0
    || !expense.description.trim()
    || !expense.date
    || amount(expense.amount) <= 0
    || workUse <= 0
    || workUse > 100;
}

function hasPrivateUseGap(expense: EofyExpenseRecord) {
  const workUse = amount(expense.workUse);
  return workUse > 0
    && workUse < 100
    && (expense.evidence !== "calculation" || !expense.note.trim());
}

export function assessEofyHandoff(draft: EofyDraft): EofyHandoffReview {
  const missingEvidence = draft.expenses.filter((expense) => expense.evidence === "missing").map((expense) => expense.id);
  const reimbursed = draft.expenses.filter((expense) => expense.reimbursed).map((expense) => expense.id);
  const privateUseGaps = draft.expenses.filter(hasPrivateUseGap).map((expense) => expense.id);
  const incompleteDetails = draft.expenses.filter(hasIncompleteDetails).map((expense) => expense.id);
  const flaggedExpenses = new Set([...missingEvidence, ...reimbursed, ...privateUseGaps, ...incompleteDetails]);
  const incomeNotReady = incomeSourceIds.filter((id) => draft.incomeStatuses[id] !== "ready");

  return {
    incomeNotReady,
    missingEvidence,
    reimbursed,
    privateUseGaps,
    incompleteDetails,
    flaggedExpenseCount: flaggedExpenses.size,
    totalFlags: incomeNotReady.length + missingEvidence.length + reimbursed.length + privateUseGaps.length + incompleteDetails.length,
  };
}
