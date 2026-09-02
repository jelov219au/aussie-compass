export type TaskStatus = "todo" | "waiting" | "done";
export type SettlementStatus = "expected" | "followup" | "received";
export type Settlement = { id: string; kind: string; label: string; dueDate: string; amount: string; status: SettlementStatus; note: string };
export type DepartureDraft = {
  departureDate: string;
  destination: string;
  statuses: Record<string, TaskStatus>;
  settlements: Settlement[];
  questions: string[];
};

export const leavingStorageKey = "hoju-compass-leaving-pro-v1";
export const leavingArchiveMaxBytes = 1024 * 1024;
const taskIds = ["final-pay", "income", "bond", "utilities", "bank", "access", "super", "departed", "visa", "dasp", "tax"];
type StorageAccess = () => Pick<Storage, "getItem" | "setItem">;
type StoredDraft = { kind: "empty"; original: null }
  | { kind: "ready"; original: string; draft: DepartureDraft }
  | { kind: "blocked"; original: string | null };

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

// Validate only the shape needed by the workspace. Keep unfinished and extra local fields intact.
function isReadableDraft(value: unknown): value is DepartureDraft {
  if (!isRecord(value) || typeof value.departureDate !== "string" || typeof value.destination !== "string"
    || !isRecord(value.statuses) || !Array.isArray(value.settlements) || !Array.isArray(value.questions)
    || !Object.values(value.statuses).every(status => status === "todo" || status === "waiting" || status === "done")
    || !value.questions.every(question => typeof question === "string")) return false;
  const ids = new Set<string>();
  for (const item of value.settlements) {
    if (!isRecord(item) || typeof item.id !== "string" || !item.id || ids.has(item.id)
      || !["kind", "label", "dueDate", "amount", "note"].every(field => typeof item[field] === "string")
      || !["expected", "followup", "received"].includes(String(item.status)) || typeof item.status !== "string") return false;
    ids.add(item.id);
  }
  return true;
}

export function readLeavingDraft(access: StorageAccess): StoredDraft {
  let original: string | null = null;
  try {
    original = access().getItem(leavingStorageKey);
    if (original === null) return { kind: "empty", original };
    const draft: unknown = JSON.parse(original);
    return isReadableDraft(draft) ? { kind: "ready", original, draft } : { kind: "blocked", original };
  } catch { return { kind: "blocked", original }; }
}

// Compare immediately before writing; never silently replace a changed/deleted stored draft.
// localStorage is not transactional, so this is not a guarantee against simultaneous writers.
export function writeLeavingDraft(access: StorageAccess, draft: DepartureDraft, expected: string | null):
  { kind: "saved"; original: string } | { kind: "conflict"; original: string | null } | { kind: "failed" } {
  try {
    const serialized = JSON.stringify(draft);
    const storage = access();
    const original = storage.getItem(leavingStorageKey);
    if (original !== expected) return { kind: "conflict", original };
    storage.setItem(leavingStorageKey, serialized);
    return { kind: "saved", original: serialized };
  } catch { return { kind: "failed" }; }
}

function portableDraft(draft: DepartureDraft): DepartureDraft {
  return {
    departureDate: draft.departureDate, destination: draft.destination,
    statuses: Object.fromEntries(taskIds.filter(id => Object.hasOwn(draft.statuses, id)).map(id => [id, draft.statuses[id]])),
    settlements: draft.settlements.map(item => ({ id: item.id, kind: item.kind, label: item.label, dueDate: item.dueDate, amount: item.amount, status: item.status, note: item.note })),
    questions: [...draft.questions],
  };
}

export type LeavingArchive = { format: "hoju-compass-leaving-pro"; version: 1; draft: DepartureDraft };

export function createLeavingArchive(draft: DepartureDraft): string {
  if (!isReadableDraft(draft)) throw new Error("출국 기록의 형식을 확인해 주세요.");
  const archive: LeavingArchive = { format: "hoju-compass-leaving-pro", version: 1, draft: portableDraft(draft) };
  const text = JSON.stringify(archive, null, 2);
  if (new Blob([text]).size > leavingArchiveMaxBytes) throw new Error("백업이 1 MiB 한도를 넘었습니다. 현재 기록은 그대로 유지됩니다.");
  return text;
}

export function parseLeavingArchive(text: string): DepartureDraft {
  if (new Blob([text]).size > leavingArchiveMaxBytes) throw new Error("1 MiB 이하의 Leaving 백업 파일을 선택해 주세요.");
  let archive: unknown;
  try { archive = JSON.parse(text); } catch { throw new Error("읽을 수 있는 JSON 백업 파일이 아닙니다."); }
  if (!isRecord(archive) || archive.format !== "hoju-compass-leaving-pro" || archive.version !== 1 || !isReadableDraft(archive.draft)) {
    throw new Error("지원하는 Leaving 백업 형식이 아닙니다. 현재 기록은 바뀌지 않았습니다.");
  }
  return portableDraft(archive.draft);
}

// A successful click requests a download; it cannot prove the browser saved a file to disk.
export function requestLeavingDownload(contents: string, filename: string, type: string): boolean {
  let url: string | undefined;
  let anchor: HTMLAnchorElement | undefined;
  let requested = false;
  const revoke = () => { if (url) { try { URL.revokeObjectURL(url); } catch {} } };
  try {
    url = URL.createObjectURL(new Blob([contents], { type }));
    anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    requested = true;
    return true;
  } catch { return false; }
  finally {
    try { anchor?.remove(); } catch {}
    // Keep the URL alive briefly for browsers that consume it after the click returns.
    if (requested) { try { window.setTimeout(revoke, 30_000); } catch { revoke(); } }
    else revoke();
  }
}
