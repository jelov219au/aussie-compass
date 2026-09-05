export const LOCAL_RECORD_UPDATED_EVENT = "hoju-compass:local-record-updated";
export type LocalRecordState<T> = { status: "missing"; raw: null } | { status: "valid"; raw: string; value: T } | { status: "invalid"; raw: string } | { status: "unavailable"; raw: null };

export function readLocalRecord<T>(key: string, parse: (raw: string) => T | null, getStorage: () => Pick<Storage, "getItem"> = () => localStorage): LocalRecordState<T> {
  let raw: string | null;
  try { raw = getStorage().getItem(key); } catch { return { status: "unavailable", raw: null }; }
  if (raw === null) return { status: "missing", raw: null };
  try { const value = parse(raw); return value === null ? { status: "invalid", raw } : { status: "valid", raw, value }; }
  catch { return { status: "invalid", raw }; }
}

export function validIsoTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value) || !Number.isFinite(Date.parse(value))) return false;
  const normalized = value.replace(/(?:\.(\d{1,3}))?Z$/, (_match, fraction: string | undefined) => `.${(fraction ?? "").padEnd(3, "0")}Z`);
  return new Date(value).toISOString() === normalized;
}
export const recordNeedsReview = (state: { status: string }) => state.status === "invalid" || state.status === "unavailable";
export const localRecordIssue = (state: { status: string }) => state.status === "unavailable" ? "기기 저장소를 읽지 못했습니다. 원래 도구에서 다시 확인하세요." : "저장 형식을 확인할 수 없습니다. 원문은 그대로 두었습니다.";
