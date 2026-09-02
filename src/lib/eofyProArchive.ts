import { getEofyExpenseArchiveIssues } from "./eofyProExpenseValidation.mjs";
export { getEofyExpenseArchiveIssues, getEofyAmountCents, eofyExpenseDescriptionMaxLength, eofyExpenseNoteMaxLength } from "./eofyProExpenseValidation.mjs";

export type EofyStatus = "todo" | "review" | "ready";
export const eofyQuestionLimit = 20;
export const eofyQuestionMaxLength = 500;
export const eofyExpenseLimit = 500;
export const eofyArchiveMaxBytes = 512 * 1024;

export type EofyExpenseRecord = {
  id: string;
  category: string;
  description: string;
  date: string;
  amount: string;
  workUse: string;
  evidence: "receipt" | "calculation" | "missing";
  reimbursed: boolean;
  note: string;
};

export type EofyDraft = {
  taxYear: string;
  incomeStatuses: Record<string, EofyStatus>;
  expenses: EofyExpenseRecord[];
  questions: string[];
};

export type EofyArchive = {
  format: "hoju-compass-eofy-pro-archive";
  version: 1;
  exportedAt: string;
  privacy: {
    receiptFilesIncluded: false;
    credentialsIncluded: false;
  };
  draft: EofyDraft;
};

const statuses = new Set<EofyStatus>(["todo", "review", "ready"]);
const incomeSourceIds = new Set(["employment", "interest", "government", "gig", "complex"]);
const taxYearPattern = /^(\d{4})–(\d{2})$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function boundedString(value: unknown, maxLength: number) {
  return typeof value === "string" && value.length <= maxLength ? value : null;
}

function validTaxYear(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = value.match(taxYearPattern);
  if (!match) return false;
  const start = Number(match[1]);
  return Number(match[2]) === (start + 1) % 100;
}

function parseExpense(value: unknown): EofyExpenseRecord | null {
  if (!isRecord(value) || getEofyExpenseArchiveIssues(value).length) return null;
  return {
    id: value.id as string,
    category: value.category as string,
    description: value.description as string,
    date: value.date as string,
    amount: value.amount as string,
    workUse: value.workUse as string,
    evidence: value.evidence as EofyExpenseRecord["evidence"],
    reimbursed: value.reimbursed as boolean,
    note: value.note as string,
  };
}

function parseDraft(value: unknown): EofyDraft | null {
  if (!isRecord(value) || !validTaxYear(value.taxYear) || !isRecord(value.incomeStatuses)) return null;
  if (!Array.isArray(value.expenses) || value.expenses.length > eofyExpenseLimit || !Array.isArray(value.questions) || value.questions.length > eofyQuestionLimit) return null;

  const incomeStatuses: Record<string, EofyStatus> = {};
  for (const [key, status] of Object.entries(value.incomeStatuses)) {
    if (!incomeSourceIds.has(key) || !statuses.has(status as EofyStatus)) return null;
    incomeStatuses[key] = status as EofyStatus;
  }

  const expenses = value.expenses.map(parseExpense);
  if (expenses.some((expense) => !expense)) return null;
  const ids = new Set(expenses.map((expense) => expense?.id));
  if (ids.size !== expenses.length) return null;

  const questions = value.questions.map((question) => boundedString(question, eofyQuestionMaxLength));
  if (questions.some((question) => question === null)) return null;

  return {
    taxYear: value.taxYear,
    incomeStatuses,
    expenses: expenses as EofyExpenseRecord[],
    questions: questions as string[],
  };
}

export function createEofyArchive(draft: EofyDraft, exportedAt = new Date().toISOString()): EofyArchive {
  const normalized = parseDraft(draft);
  if (!normalized) throw new Error("EOFY draft is not safe to archive.");
  return {
    format: "hoju-compass-eofy-pro-archive",
    version: 1,
    exportedAt,
    privacy: { receiptFilesIncluded: false, credentialsIncluded: false },
    draft: normalized,
  };
}

export function parseEofyArchive(value: unknown): EofyArchive | null {
  if (!isRecord(value)
    || value.format !== "hoju-compass-eofy-pro-archive"
    || value.version !== 1
    || typeof value.exportedAt !== "string"
    || !Number.isFinite(Date.parse(value.exportedAt))
    || !isRecord(value.privacy)
    || value.privacy.receiptFilesIncluded !== false
    || value.privacy.credentialsIncluded !== false) return null;
  const draft = parseDraft(value.draft);
  if (!draft) return null;
  return {
    format: "hoju-compass-eofy-pro-archive",
    version: 1,
    exportedAt: value.exportedAt,
    privacy: { receiptFilesIncluded: false, credentialsIncluded: false },
    draft,
  };
}
