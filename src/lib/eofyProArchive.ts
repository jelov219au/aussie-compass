import { getEofyExpenseArchiveIssues } from "./eofyProExpenseValidation.mjs";
import { isEofyCalendarDate } from "./eofyProDate.mjs";
export { getEofyExpenseArchiveIssues, getEofyAmountCents, eofyExpenseDescriptionMaxLength, eofyExpenseNoteMaxLength } from "./eofyProExpenseValidation.mjs";

export type EofyStatus = "todo" | "review" | "ready";
export const eofyQuestionLimit = 20;
export const eofyQuestionMaxLength = 500;
export const eofyExpenseLimit = 500;
export const eofyArchiveMaxBytes = 512 * 1024;
export const eofyDocumentLimit = 100;
export const eofyDocumentLabelMaxLength = 120;
export const eofyDocumentNoteMaxLength = 500;

export type EofyDocumentRecord = {
  id: string;
  sourceId: string;
  label: string;
  status: EofyStatus;
  checkedOn: string;
  note: string;
};

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
  // Optional so existing v1 local drafts/backups remain unchanged until edited.
  documents?: EofyDocumentRecord[];
};

export type EofyArchive = {
  format: "hoju-compass-eofy-pro-archive";
  version: 1 | 2;
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

export function getEofyDocumentArchiveIssues(value: EofyDocumentRecord): (keyof EofyDocumentRecord)[] {
  const issues: (keyof EofyDocumentRecord)[] = [];
  if (typeof value.id !== "string" || !value.id || value.id.length > 100) issues.push("id");
  if (!incomeSourceIds.has(value.sourceId)) issues.push("sourceId");
  if (boundedString(value.label, eofyDocumentLabelMaxLength) === null) issues.push("label");
  if (!statuses.has(value.status)) issues.push("status");
  if (value.checkedOn !== "" && !isEofyCalendarDate(value.checkedOn)) issues.push("checkedOn");
  if (boundedString(value.note, eofyDocumentNoteMaxLength) === null) issues.push("note");
  return issues;
}

function parseDocuments(value: unknown): EofyDocumentRecord[] | null {
  if (!Array.isArray(value) || value.length > eofyDocumentLimit) return null;
  const records: EofyDocumentRecord[] = [];
  const ids = new Set<string>();
  for (const item of value) {
    if (!isRecord(item) || getEofyDocumentArchiveIssues(item as EofyDocumentRecord).length || ids.has(item.id as string)) return null;
    const { id, sourceId, label, status, checkedOn, note } = item as EofyDocumentRecord;
    ids.add(id);
    records.push({ id, sourceId, label, status, checkedOn, note });
  }
  return records;
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
  const documents = value.documents === undefined ? undefined : parseDocuments(value.documents);
  if (documents === null) return null;

  return {
    taxYear: value.taxYear,
    incomeStatuses,
    expenses: expenses as EofyExpenseRecord[],
    questions: questions as string[],
    ...(documents === undefined ? {} : { documents }),
  };
}

export function createEofyArchive(draft: EofyDraft, exportedAt = new Date().toISOString()): EofyArchive {
  const normalized = parseDraft(draft);
  if (!normalized) throw new Error("EOFY draft is not safe to archive.");
  return {
    format: "hoju-compass-eofy-pro-archive",
    version: normalized.documents === undefined ? 1 : 2,
    exportedAt,
    privacy: { receiptFilesIncluded: false, credentialsIncluded: false },
    draft: normalized,
  };
}

export function parseEofyArchive(value: unknown): EofyArchive | null {
  if (!isRecord(value)
    || value.format !== "hoju-compass-eofy-pro-archive"
    || (value.version !== 1 && value.version !== 2)
    || typeof value.exportedAt !== "string"
    || !Number.isFinite(Date.parse(value.exportedAt))
    || !isRecord(value.privacy)
    || value.privacy.receiptFilesIncluded !== false
    || value.privacy.credentialsIncluded !== false) return null;
  const draft = parseDraft(value.draft);
  if (!draft) return null;
  if ((value.version === 2) !== (draft.documents !== undefined)) return null;
  return {
    format: "hoju-compass-eofy-pro-archive",
    version: value.version,
    exportedAt: value.exportedAt,
    privacy: { receiptFilesIncluded: false, credentialsIncluded: false },
    draft,
  };
}
