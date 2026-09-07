import { getEofyAmountCents, getEofyDocumentArchiveIssues, type EofyDraft, type EofyStatus } from "@/lib/eofyProArchive";
import { assessEofyHandoff } from "@/lib/eofyProHandoff";

export const eofyIncomeSources = [
  { id: "employment", title: "모든 고용주의 Income statement", detail: "myGov의 ATO 서비스에서 각 고용주 자료가 Tax ready인지 확인합니다." },
  { id: "interest", title: "은행 이자와 공동계좌", detail: "사용 빈도가 낮은 계좌와 공동계좌의 이자도 Pre-fill과 대조합니다." },
  { id: "government", title: "정부 지급금·수당", detail: "신고 대상 여부와 Pre-fill 내용을 ATO 원문에서 확인합니다." },
  { id: "gig", title: "부업·플랫폼·현금 소득", detail: "고용소득과 별도로 받은 금액과 관련 기록을 빠뜨리지 않습니다." },
  { id: "complex", title: "투자·가상자산·임대·해외 소득", detail: "해당된다면 거래·환율·비용 자료를 분리하고 전문가 상담 필요 여부를 확인합니다." },
];
export const eofyStatusLabels: Record<EofyStatus, string> = { todo: "확인 전", review: "확인 필요", ready: "준비 완료" };
export const eofyEvidenceLabels = { receipt: "영수증·인보이스", calculation: "계산·사용기록", missing: "증빙 확인 필요" } as const;

function recordedAmountLabel(value: string) {
  const cents = getEofyAmountCents(value);
  return cents === null ? (value ? `Unvalidated input: ${value}` : "Not set") : `A$${(cents / 100).toFixed(2)}`;
}

export function createEofyPreparationSummary(draft: EofyDraft) {
  const incomeSources = eofyIncomeSources;
  const statusLabels = eofyStatusLabels;
  const evidenceLabels = eofyEvidenceLabels;
  const handoffReview = assessEofyHandoff(draft);
  const amounts = draft.expenses.map((expense) => getEofyAmountCents(expense.amount));
  const amountTotals = { cents: amounts.reduce<number>((sum, cents) => sum + (cents ?? 0), 0), excluded: amounts.filter((cents) => cents === null).length };
  const candidateTotal = amountTotals.cents / 100;
  const documents = draft.documents ?? [];
  const documentArchiveIssues = documents.map(getEofyDocumentArchiveIssues);
  const documentsToReview = documents.filter((item, index) => item.status !== "ready" || !item.label.trim() || !item.checkedOn || documentArchiveIssues[index].length);
  const expenseLabel = (id: string) => {
    const index = draft.expenses.findIndex((expense) => expense.id === id);
    const expense = draft.expenses[index];
    return expense ? `${index + 1}. ${expense.category} — ${expense.description || "No description"}` : id;
  };
  const expenseReviewLines = (title: string, ids: string[]) => [
    title,
    ...(ids.length ? ids.map((id) => `- ${expenseLabel(id)}`) : ["- None flagged"]),
    "",
  ];
  const emptySectionReviewLabel = (section: "expenses" | "documents") => draft.emptySections?.[section]
    ? "User confirmed none / not applicable"
    : "Covered by the current accountant-handoff review";
  const lines = [
    `HOJU COMPASS — EOFY PACK ${draft.taxYear}`,
    "Preparation summary only — not a tax return or deduction calculation",
    "",
    "ACCOUNTANT HANDOFF READINESS REVIEW",
    `Review flags: ${handoffReview.totalFlags} across ${handoffReview.flaggedExpenseCount} expense candidate(s)`,
    "",
    "INCOME SOURCES NOT READY",
    ...(handoffReview.incomeNotReady.length
      ? handoffReview.incomeNotReady.map((id) => `- ${incomeSources.find((source) => source.id === id)?.title ?? id}`)
      : ["- None flagged"]),
    "",
    ...expenseReviewLines("MISSING EVIDENCE", handoffReview.missingEvidence),
    ...expenseReviewLines("REIMBURSED ITEMS — KEEP SEPARATE FOR REVIEW", handoffReview.reimbursed),
    ...expenseReviewLines("PRIVATE-USE CALCULATION GAPS", handoffReview.privateUseGaps),
    ...expenseReviewLines("INCOMPLETE RECORD DETAILS", handoffReview.incompleteDetails),
    "These are preparation flags, not findings about deductibility or tax treatment.",
    "",
    "INCOME SOURCES",
    ...incomeSources.map((source) => `- [${statusLabels[draft.incomeStatuses[source.id] ?? "todo"]}] ${source.title}`),
    "",
    `INDIVIDUAL DOCUMENT RECORDS (${documents.length}; ${documentsToReview.length} to review)`,
    "User-recorded preparation status only; not confirmation of ATO Tax ready or tax treatment.",
    ...(documents.length ? documents.flatMap((item, index) => [
      `${index + 1}. ${item.label || "No document label"} | ${incomeSources.find(source => source.id === item.sourceId)?.title ?? item.sourceId}`,
      `   Status: ${statusLabels[item.status]} | Checked on (user entry): ${item.checkedOn || "Not recorded"}`,
      `   Next check / question: ${item.note || "Not recorded"}`,
      ...(documentArchiveIssues[index].length ? ["   Archive validation: review this record before JSON backup"] : []),
    ]) : ["- None recorded", `- Zero-record status: ${emptySectionReviewLabel("documents")}`]),
    "",
    `EXPENSE CANDIDATES (${draft.expenses.length})`,
    ...draft.expenses.flatMap((expense, index) => [
      `${index + 1}. ${expense.category} — ${expense.description || "No description"}`,
      `   Date: ${expense.date || "Not set"} | Amount recorded: ${recordedAmountLabel(expense.amount)} | Work-use note: ${expense.workUse || "Not set"}%`,
      `   Evidence: ${evidenceLabels[expense.evidence]} | Reimbursed: ${expense.reimbursed ? "Yes — review before claiming" : "No"}`,
      expense.note ? `   Note: ${expense.note}` : "",
    ].filter(Boolean)),
    ...(!draft.expenses.length ? [`- None recorded`, `- Zero-record status: ${emptySectionReviewLabel("expenses")}`] : []),
    "",
    `TOTAL VALID RECORDED CANDIDATE SPEND: A$${candidateTotal.toFixed(2)}`,
    `AMOUNT ENTRIES EXCLUDED FROM TOTAL: ${amountTotals.excluded} (blank or unvalidated; original input retained above)`,
    "This is not the deductible amount. Eligibility, private-use portions, reimbursements and special substantiation rules must be checked separately.",
    "",
    "QUESTIONS FOR MYTAX OR A REGISTERED TAX AGENT",
    ...(draft.questions.length ? draft.questions.map((question) => `- ${question}`) : ["- None added"]),
    "",
    "Do not add TFN, bank account numbers, myGov credentials or receipt images to this file.",
  ];
  return lines.join("\r\n");
}
