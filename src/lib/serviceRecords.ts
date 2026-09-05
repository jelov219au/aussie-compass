import { amount } from "./personalPlans";
export const costFields = [["callout", "출장비"], ["labour", "인건비"], ["materials", "자재비"], ["other", "기타 비용"]] as const;
export const quoteChecks = [
  ["writtenScope", "작업 범위가 서면으로 명확함", "포함·제외 작업과 추가 비용 조건"],
  ["abnChecked", "ABN 상태 확인", "ABN Lookup에서 업체명과 활성 상태 확인"],
  ["licenceChecked", "필요 면허 확인", "직종과 주·준주에 적용되는 등록·면허"],
  ["insuranceChecked", "보험 여부 확인", "업무에 적합한 보험 보유 여부"],
  ["timelineConfirmed", "시작·완료 일정 확인", "지연 시 연락 및 일정 변경 방식"],
  ["warrantyConfirmed", "보증·사후조치 확인", "문제 발생 시 수정 범위와 연락 방법"],
] as const;
export type CostKey = typeof costFields[number][0];
type CheckKey = typeof quoteChecks[number][0];
export type Quote = { id: string; provider: string; gstIncluded: boolean; mode?: "items" | "total"; directTotal?: string } & Record<CostKey, string> & Record<CheckKey, boolean>;
export function newQuote(id: string): Quote { return { id, provider: "", callout: "", labour: "", materials: "", other: "", gstIncluded: false, writtenScope: false, abnChecked: false, licenceChecked: false, insuranceChecked: false, timelineConfirmed: false, warrantyConfirmed: false }; }
const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown, max: number) => typeof v === "string" && v.length <= max && !/[\u0000-\u001f]/.test(v);
const numericDraft = (v: unknown) => typeof v === "string" && v.length <= 32 && (v.trim() === "" || amount(v) !== null);
export function quoteResult(q: Quote) {
  const entries = q.mode === "total" ? [q.directTotal ?? ""] : costFields.map(([key]) => q[key]);
  const valid = entries.map(amount).filter((v): v is number => v !== null);
  return { total: valid.reduce((sum, n) => sum + n, 0), known: valid.length, complete: valid.length === entries.length };
}
export function quoteSummary(quotes: Quote[]) {
  return ["서비스 견적 비교", ...quotes.map((q, i) => { const result = quoteResult(q); return `${i + 1}. ${q.provider || "업체명 미입력"}: ${result.known ? `$${result.total.toFixed(2)} / ${result.complete ? "입력 금액 합계" : "확인된 항목 소계 · 남은 비용 미확인"}` : "금액 미입력"} / GST ${q.gstIncluded ? "포함 확인" : "미확인"} / 작업 범위 ${q.writtenScope ? "서면 확인" : "미확인"}`; }), "작업 범위·GST·추가 비용 조건이 같아야 비교할 수 있습니다. 체크는 품질 점수가 아닙니다."].join("\n");
}
export function parseQuotes(raw: string): Quote[] | null {
  try {
    const value: unknown = JSON.parse(raw); if (!Array.isArray(value) || value.length < 2 || value.length > 3) return null;
    const ids = new Set(), keys = ["id", "provider", "gstIncluded", "mode", "directTotal", ...costFields.map(([key]) => key), ...quoteChecks.map(([key]) => key)];
    for (const q of value) {
      if (!obj(q) || Object.keys(q).some(key => !keys.includes(key)) || !text(q.id, 200) || !q.id || ids.has(q.id) || !text(q.provider, 60)
        || typeof q.gstIncluded !== "boolean" || quoteChecks.some(([key]) => typeof q[key] !== "boolean") || costFields.some(([key]) => !numericDraft(q[key]))
        || (q.mode !== undefined && q.mode !== "items" && q.mode !== "total") || (q.directTotal !== undefined && !numericDraft(q.directTotal))) return null;
      ids.add(q.id);
    } return value as Quote[];
  } catch { return null; }
}
export const serializeQuotes = (value: Quote[]) => { const raw = JSON.stringify(value); return parseQuotes(raw) ? raw : null; };
export const serviceCategories = ["Plumbing", "Electrical", "Cleaning", "Removalist", "Locksmith", "Pest control", "Appliance repair", "Other"];
export const serviceStates = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];
export type PriceRecord = { id: string; category: string; state: string; period: string; timing: string; status: string; itemised: boolean; confirmedTotal?: boolean } & Record<CostKey, number>;
export const priceTotal = (item: PriceRecord) => costFields.reduce((sum, [key]) => sum + item[key], 0);
export const validMonth = (value: unknown) => typeof value === "string" && /^(?!0000)\d{4}-(0[1-9]|1[0-2])$/.test(value);
export function parsePrices(raw: string): PriceRecord[] | null {
  try {
    const value: unknown = JSON.parse(raw); if (!Array.isArray(value) || value.length > 500) return null;
    const ids = new Set(), keys = ["id", "category", "state", "period", "timing", "status", "itemised", "confirmedTotal", ...costFields.map(([key]) => key)];
    for (const item of value) {
      if (!obj(item) || Object.keys(item).some(key => !keys.includes(key)) || !text(item.id, 200) || !item.id || ids.has(item.id)
        || !serviceCategories.includes(String(item.category)) || typeof item.category !== "string" || !serviceStates.includes(String(item.state)) || typeof item.state !== "string"
        || (item.period !== "" && !validMonth(item.period)) || (item.timing !== "standard" && item.timing !== "afterhours") || (item.status !== "quote" && item.status !== "completed")
        || typeof item.itemised !== "boolean" || (item.confirmedTotal !== undefined && typeof item.confirmedTotal !== "boolean")
        || costFields.some(([key]) => typeof item[key] !== "number" || amount(item[key]) === null)) return null;
      ids.add(item.id);
    } return value as PriceRecord[];
  } catch { return null; }
}
export const serializePrices = (value: PriceRecord[]) => { const raw = JSON.stringify(value); return parsePrices(raw) ? raw : null; };
export function priceGroups(records: PriceRecord[]) {
  const groups = new Map<string, PriceRecord[]>();
  for (const item of records) {
    if (item.confirmedTotal !== true || !validMonth(item.period)) continue;
    const key = JSON.stringify([item.category, item.state, item.period, item.timing, item.status]);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return [...groups].map(([key, items]) => { const sorted = items.map(priceTotal).sort((a, b) => a - b), middle = Math.floor(sorted.length / 2); return { key, sample: items[0], count: items.length, median: sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2, min: sorted[0], max: sorted[sorted.length - 1] }; });
}
