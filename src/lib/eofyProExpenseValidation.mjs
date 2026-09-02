import { isEofyCalendarDate } from "./eofyProDate.mjs";

export const eofyExpenseDescriptionMaxLength = 300;
export const eofyExpenseNoteMaxLength = 1_000;

/** @param {unknown} value @param {number} maxLength */
function boundedString(value, maxLength) {
  return typeof value === "string" && value.length <= maxLength ? value : null;
}

/** @param {unknown} value @param {number} max */
function validDecimal(value, max) {
  if (typeof value !== "string" || value.trim() !== value || !/^\d{0,7}(?:\.\d{0,2})?$/.test(value)) return false;
  const parsed = Number(value || "0");
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= max;
}

/** @type {Record<keyof import("./eofyProArchive").EofyExpenseRecord, (value: unknown) => boolean>} */
const validators = {
  id: value => Boolean(boundedString(value, 100)),
  category: value => Boolean(boundedString(value, 100)),
  description: value => boundedString(value, eofyExpenseDescriptionMaxLength) !== null,
  date: value => value === "" || isEofyCalendarDate(value),
  amount: value => boundedString(value, 10) !== null && validDecimal(value, 9_999_999.99),
  workUse: value => boundedString(value, 6) !== null && validDecimal(value, 100),
  evidence: value => value === "receipt" || value === "calculation" || value === "missing",
  reimbursed: value => typeof value === "boolean",
  note: value => boundedString(value, eofyExpenseNoteMaxLength) !== null,
};

/** @param {unknown} value @returns {Array<keyof import("./eofyProArchive").EofyExpenseRecord>} */
export function getEofyExpenseArchiveIssues(value) {
  const fields = /** @type {Array<keyof import("./eofyProArchive").EofyExpenseRecord>} */ (Object.keys(validators));
  if (value === null || typeof value !== "object" || Array.isArray(value)) return fields;
  const record = /** @type {Record<string, unknown>} */ (value);
  return fields.filter(field => !validators[field](record[field]));
}

/** @param {unknown} value @returns {number | null} */
export function getEofyAmountCents(value) {
  if (typeof value !== "string" || value === "" || !validators.amount(value)) return null;
  const [whole, fraction = ""] = value.split(".");
  return Number(whole || "0") * 100 + Number(fraction.padEnd(2, "0"));
}
