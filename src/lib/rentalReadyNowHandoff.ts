export const rentalReadyNowHandoffStorageKey = "hoju-compass-rental-ready-now-handoff-v1";
export const rentalReadyNowHandoffLifetimeMs = 24 * 60 * 60 * 1000;

export type RentalReadyNowHandoff = {
  version: 1;
  propertyLabel: string;
  mode: "share" | "rent";
  reviewedCount: number;
  concernCount: number;
  createdAt: number;
};

type HandoffInput = {
  propertyLabel: string;
  mode: "share" | "rent" | "buy";
  reviewedCount: number;
  concernCount: number;
};

function boundedCount(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.min(100, Math.trunc(value))) : 0;
}

function safeLabel(value: string) {
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
}

export function createRentalReadyNowHandoff(input: HandoffInput, nowMs = Date.now()): RentalReadyNowHandoff | null {
  if (input.mode === "buy") return null;
  return {
    version: 1,
    propertyLabel: safeLabel(input.propertyLabel),
    mode: input.mode,
    reviewedCount: boundedCount(input.reviewedCount),
    concernCount: boundedCount(input.concernCount),
    createdAt: nowMs,
  };
}

export function parseRentalReadyNowHandoff(value: string | null, nowMs = Date.now()): RentalReadyNowHandoff | null {
  if (!value) return null;
  try {
    const candidate = JSON.parse(value) as Partial<RentalReadyNowHandoff>;
    const ageMs = nowMs - (candidate.createdAt ?? Number.NaN);
    if (candidate.version !== 1
      || (candidate.mode !== "share" && candidate.mode !== "rent")
      || typeof candidate.propertyLabel !== "string"
      || typeof candidate.reviewedCount !== "number"
      || typeof candidate.concernCount !== "number"
      || !Number.isFinite(ageMs)
      || ageMs < 0
      || ageMs > rentalReadyNowHandoffLifetimeMs) return null;
    return createRentalReadyNowHandoff({
      propertyLabel: candidate.propertyLabel,
      mode: candidate.mode,
      reviewedCount: candidate.reviewedCount,
      concernCount: candidate.concernCount,
    }, candidate.createdAt);
  } catch {
    return null;
  }
}

export function readRentalReadyNowHandoff(storage: Pick<Storage, "getItem">, nowMs = Date.now()) {
  return parseRentalReadyNowHandoff(storage.getItem(rentalReadyNowHandoffStorageKey), nowMs);
}

export function clearRentalReadyNowHandoff(storage: Pick<Storage, "removeItem">) {
  storage.removeItem(rentalReadyNowHandoffStorageKey);
}
