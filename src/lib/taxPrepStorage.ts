import { todayDate, validDate } from "@/lib/lifeReminders";

export const taxPrepRecordsStorageKey = "hoju-compass-tax-prep-records-v1";
export type RecordKind = "income" | "expense";
export type EvidenceStatus = "saved" | "available" | "missing";
export type TaxRecord = { id: string; date: string; kind: RecordKind; category: string; description: string; amount: number; evidence: EvidenceStatus; createdAt: string };
export const evidenceLabels: Record<EvidenceStatus, string> = { saved: "원본 증빙을 따로 보관함", available: "나중에 받을 수 있음", missing: "미확인·아직 없음" };
export const financialYearStart = (date = todayDate()) => Number(date.slice(0, 4)) - (Number(date.slice(5, 7)) < 7 ? 1 : 0);
export const financialYearLabel = (year: number) => `${year}–${String(year + 1).slice(-2)}`;
export const financialYearPeriod = (year: number) => `${year}-07-01 ~ ${year + 1}-06-30`;
const safeText = (value: unknown, max: number) => typeof value === "string" && value.trim().length > 0 && value.length <= max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value);
export const validRecordDate = (value: unknown): value is string => validDate(value) && value >= "1900-01-01" && value <= "2101-12-31";
export function recordAmount(value: string | number): number | null {
  if (typeof value === "string" && !/^[+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim())) return null;
  const amount = Number(value), cents = Math.round(amount * 100);
  return Number.isFinite(amount) && amount > 0 && Number.isSafeInteger(cents) && cents > 0 ? cents / 100 : null;
}
export function recordTotals(records: TaxRecord[]) {
  let income = 0, expenses = 0;
  for (const record of records) {
    const cents = Math.round(record.amount * 100);
    if (!Number.isSafeInteger(cents) || cents <= 0) return null;
    if (record.kind === "income") income += cents; else expenses += cents;
    if (!Number.isSafeInteger(income) || !Number.isSafeInteger(expenses) || !Number.isSafeInteger(income + expenses)) return null;
  }
  return { income: income / 100, expenses: expenses / 100, missing: records.filter(r => r.evidence === "missing").length, months: new Set(records.map(r => r.date.slice(0, 7))).size };
}
export function parseTaxRecords(raw: string): TaxRecord[] | null {
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data) || data.length > 5000) return null;
    const ids = new Set<string>();
    for (const r of data) {
      if (!r || typeof r !== "object" || Array.isArray(r) || Object.keys(r).some(key => !["id", "date", "kind", "category", "description", "amount", "evidence", "createdAt"].includes(key))
        || typeof r.id !== "string" || !/^[a-zA-Z0-9_-]{1,200}$/.test(r.id) || ids.has(r.id) || !validRecordDate(r.date) || !["income", "expense"].includes(r.kind)
        || !safeText(r.category, 128) || !safeText(r.description, 120) || typeof r.amount !== "number" || recordAmount(r.amount) === null
        || !["saved", "available", "missing"].includes(r.evidence) || typeof r.createdAt !== "string" || !Number.isFinite(Date.parse(r.createdAt)) || new Date(r.createdAt).toISOString() !== r.createdAt) return null;
      ids.add(r.id);
    }
    return recordTotals(data) ? data as TaxRecord[] : null;
  } catch { return null; }
}
export const serializeTaxRecords = (records: TaxRecord[]) => { const raw = JSON.stringify(records); return parseTaxRecords(raw) ? raw : null; };
// Quoting alone does not prevent spreadsheet formulas. Prefix text that could
// be interpreted as a formula, including after leading whitespace or controls.
export function taxCsvCell(value: string | number) {
  const raw = String(value), safe = typeof value === "string" && (/^[\s\u0000-\u0020]*[=+\-@]/.test(raw) || /^[\t\r\n]/.test(raw)) ? `'${raw}` : raw;
  return `"${safe.replaceAll('"', '""')}"`;
}
export function taxRecordsCsv(records: TaxRecord[]) {
  if (!parseTaxRecords(JSON.stringify(records))) throw new Error("Invalid tax records");
  const header = ["date", "type", "category", "description", "amount_aud", "evidence_status"];
  const rows = records.map(r => [r.date, r.kind, r.category, r.description, r.amount.toFixed(2), evidenceLabels[r.evidence]]);
  return `\uFEFF${[header, ...rows].map(row => row.map(taxCsvCell).join(",")).join("\r\n")}`;
}
