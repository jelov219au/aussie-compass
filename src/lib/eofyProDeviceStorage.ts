import type { EofyDraft } from "./eofyProArchive";

export const eofyProStorageKey = "hoju-compass-eofy-pro-v1";
type DraftStorage = Pick<Storage, "getItem" | "setItem">;
type StorageAccess = () => DraftStorage;
type StoredDraft =
  | { kind: "empty"; original: null }
  | { kind: "ready"; original: string; draft: EofyDraft }
  | { kind: "blocked"; original: string | null };

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

// Local drafts may contain unfinished or over-limit edits that cannot yet be exported.
// Check the shape needed to render safely, without trimming, normalizing or dropping fields.
function isReadableDraft(value: unknown): value is EofyDraft {
  if (!isRecord(value) || typeof value.taxYear !== "string" || !isRecord(value.incomeStatuses)
    || !Array.isArray(value.expenses) || !Array.isArray(value.questions)) return false;
  if (!Object.values(value.incomeStatuses).every(status => status === "todo" || status === "review" || status === "ready")
    || !value.questions.every(question => typeof question === "string")) return false;
  const ids = new Set<string>();
  for (const expense of value.expenses) {
    if (!isRecord(expense) || typeof expense.id !== "string" || !expense.id || ids.has(expense.id)) return false;
    ids.add(expense.id);
    if (!["category", "description", "date", "amount", "workUse", "note"].every(field => typeof expense[field] === "string")
      || typeof expense.reimbursed !== "boolean"
      || typeof expense.evidence !== "string"
      || !["receipt", "calculation", "missing"].includes(String(expense.evidence))) return false;
  }
  return true;
}

export function readEofyDraft(access: StorageAccess): StoredDraft {
  let original: string | null = null;
  try {
    original = access().getItem(eofyProStorageKey);
    if (original === null) return { kind: "empty", original };
    const draft: unknown = JSON.parse(original);
    return isReadableDraft(draft) ? { kind: "ready", original, draft } : { kind: "blocked", original };
  } catch {
    return { kind: "blocked", original };
  }
}

export function writeEofyDraft(access: StorageAccess, draft: EofyDraft): boolean {
  try {
    const serialized = JSON.stringify(draft);
    access().setItem(eofyProStorageKey, serialized);
    return true;
  } catch {
    return false;
  }
}
