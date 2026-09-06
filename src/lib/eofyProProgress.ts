export type EofyProgressInput = {
  incomeReady: number;
  incomeTotal: number;
  expenseCount: number;
  expenseReady: number;
  documentCount: number;
  documentReady: number;
  expensesEmptyConfirmed: boolean;
  documentsEmptyConfirmed: boolean;
  handoffReviewed: boolean;
};

function sydneyYearAndMonth(now: Date) {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney",
    year: "numeric",
    month: "numeric",
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  if (!Number.isInteger(year) || !Number.isInteger(month)) throw new Error("Sydney calendar date is unavailable.");
  return { year, month };
}

export function getMostRecentCompletedEofyStartYear(now = new Date()) {
  const { year, month } = sydneyYearAndMonth(now);
  return month >= 7 ? year - 1 : year - 2;
}

export function formatEofyTaxYear(startYear: number) {
  return `${startYear}\u2013${String(startYear + 1).slice(-2)}`;
}

export function calculateEofyProgress(input: EofyProgressInput) {
  const expenseParts = input.expenseCount || 1;
  const documentParts = input.documentCount || 1;
  const progressParts = input.incomeTotal + expenseParts + documentParts;
  const emptySectionReviewed = input.handoffReviewed;
  const readyParts = input.incomeReady
    + (input.expenseCount ? input.expenseReady : Number(input.expensesEmptyConfirmed || emptySectionReviewed))
    + (input.documentCount ? input.documentReady : Number(input.documentsEmptyConfirmed || emptySectionReviewed));

  if (progressParts === 0) return 0;
  return readyParts === progressParts ? 100 : Math.min(99, Math.round((readyParts / progressParts) * 100));
}
