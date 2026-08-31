export type EofyStatus = "todo" | "review" | "ready";

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
const evidenceKinds = new Set<EofyExpenseRecord["evidence"]>(["receipt", "calculation", "missing"]);
const incomeSourceIds = new Set(["employment", "interest", "government", "gig", "complex"]);
const taxYearPattern = /^(\d{4})–(\d{2})$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const decimalPattern = /^\d{0,7}(?:\.\d{0,2})?$/;

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

function validDecimal(value: unknown, max: number) {
  if (typeof value !== "string" || !decimalPattern.test(value)) return false;
  const parsed = Number(value || "0");
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= max;
}

function parseExpense(value: unknown): EofyExpenseRecord | null {
  if (!isRecord(value)) return null;
  const id = boundedString(value.id, 100);
  const category = boundedString(value.category, 100);
  const description = boundedString(value.description, 300);
  const date = boundedString(value.date, 10);
  const amount = boundedString(value.amount, 10);
  const workUse = boundedString(value.workUse, 6);
  const note = boundedString(value.note, 1_000);
  if (!id || !category || description === null || date === null || amount === null || workUse === null || note === null) return null;
  if (date && !datePattern.test(date)) return null;
  if (!validDecimal(amount, 9_999_999.99) || !validDecimal(workUse, 100)) return null;
  if (!evidenceKinds.has(value.evidence as EofyExpenseRecord["evidence"]) || typeof value.reimbursed !== "boolean") return null;
  return {
    id,
    category,
    description,
    date,
    amount,
    workUse,
    evidence: value.evidence as EofyExpenseRecord["evidence"],
    reimbursed: value.reimbursed,
    note,
  };
}

function parseDraft(value: unknown): EofyDraft | null {
  if (!isRecord(value) || !validTaxYear(value.taxYear) || !isRecord(value.incomeStatuses)) return null;
  if (!Array.isArray(value.expenses) || value.expenses.length > 500 || !Array.isArray(value.questions) || value.questions.length > 20) return null;

  const incomeStatuses: Record<string, EofyStatus> = {};
  for (const [key, status] of Object.entries(value.incomeStatuses)) {
    if (!incomeSourceIds.has(key) || !statuses.has(status as EofyStatus)) return null;
    incomeStatuses[key] = status as EofyStatus;
  }

  const expenses = value.expenses.map(parseExpense);
  if (expenses.some((expense) => !expense)) return null;
  const ids = new Set(expenses.map((expense) => expense?.id));
  if (ids.size !== expenses.length) return null;

  const questions = value.questions.map((question) => boundedString(question, 500));
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
