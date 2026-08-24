export type ResumeProStoredApplication<TDraft> = {
  id: string;
  company: string;
  role: string;
  updatedAt: string;
  draft: TDraft;
};

export type ResumeProApplicationStore<TDraft> = {
  activeId: string | null;
  items: Array<ResumeProStoredApplication<TDraft>>;
};

type StorageReader = Pick<Storage, "getItem">;
type StorageWriter = Pick<Storage, "getItem" | "setItem">;

export type ResumeProApplicationReadResult<TDraft> = {
  store: ResumeProApplicationStore<TDraft>;
  status: "empty" | "ok" | "recovered" | "unavailable";
};

const maximumApplications = 30;
const maximumIdLength = 128;
const futureClockToleranceMs = 5 * 60 * 1000;

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normaliseUpdatedAt(value: unknown, nowMs: number) {
  if (typeof value !== "string") return "";
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp) || timestamp < 0 || timestamp > nowMs + futureClockToleranceMs) return "";
  return new Date(timestamp).toISOString();
}

export function normaliseResumeProApplicationStore<TDraft>(
  value: unknown,
  normaliseDraft: (value: unknown) => TDraft,
  identifyDraft: (draft: TDraft) => { company: string; role: string },
  nowMs = Date.now(),
): ResumeProApplicationReadResult<TDraft> {
  const container = record(value);
  const legacyItems = Array.isArray(value) ? value : null;
  const rawItems = legacyItems ?? (Array.isArray(container?.items) ? container.items : null);
  if (!rawItems) return { store: { activeId: null, items: [] }, status: "recovered" };

  let recovered = Boolean(legacyItems);
  const seen = new Set<string>();
  const items: Array<ResumeProStoredApplication<TDraft>> = [];

  for (const rawItem of rawItems) {
    if (items.length >= maximumApplications) {
      recovered = true;
      break;
    }
    const candidate = record(rawItem);
    const id = text(candidate?.id);
    if (!candidate || !id || id.length > maximumIdLength || seen.has(id)) {
      recovered = true;
      continue;
    }

    const draft = normaliseDraft(record(candidate.draft) ?? candidate);
    const draftIdentity = identifyDraft(draft);
    const company = text(candidate.company) || text(draftIdentity.company);
    if (!company) {
      recovered = true;
      continue;
    }
    const role = text(candidate.role) || text(draftIdentity.role) || "지원 직무 미정";
    const updatedAt = normaliseUpdatedAt(candidate.updatedAt, nowMs);
    if (updatedAt !== candidate.updatedAt) recovered = true;

    seen.add(id);
    items.push({ id, company, role, updatedAt, draft });
  }

  const requestedActiveId = text(container?.activeId);
  const activeId = requestedActiveId && seen.has(requestedActiveId) ? requestedActiveId : null;
  if (requestedActiveId && !activeId) recovered = true;

  return {
    store: { activeId, items },
    status: recovered ? "recovered" : "ok",
  };
}

export function readResumeProApplicationStore<TDraft>(
  storage: StorageReader,
  key: string,
  normaliseDraft: (value: unknown) => TDraft,
  identifyDraft: (draft: TDraft) => { company: string; role: string },
  nowMs = Date.now(),
): ResumeProApplicationReadResult<TDraft> {
  try {
    const raw = storage.getItem(key);
    if (!raw) return { store: { activeId: null, items: [] }, status: "empty" };
    try {
      return normaliseResumeProApplicationStore(JSON.parse(raw), normaliseDraft, identifyDraft, nowMs);
    } catch {
      return { store: { activeId: null, items: [] }, status: "recovered" };
    }
  } catch {
    return { store: { activeId: null, items: [] }, status: "unavailable" };
  }
}

export function persistResumeProApplicationStore<TDraft>(
  storage: StorageWriter,
  key: string,
  store: ResumeProApplicationStore<TDraft>,
) {
  try {
    const serialized = JSON.stringify({ activeId: store.activeId, items: store.items.slice(0, maximumApplications) });
    storage.setItem(key, serialized);
    return storage.getItem(key) === serialized;
  } catch {
    return false;
  }
}
