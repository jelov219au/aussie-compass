const proofSummaryKey = "hoju.resumeJobAdProofSummary.v1";
const proofSummaryLifetimeMs = 30 * 60 * 1000;
const maxResultCount = 12;

export type ResumeJobAdProofSummary = {
  matchedCount: number;
  missingCount: number;
  checkedAt: number;
};

function validCount(value: unknown) {
  return Number.isInteger(value) && Number(value) >= 0 && Number(value) <= maxResultCount;
}

function removeStoredSummary() {
  try {
    window.sessionStorage.removeItem(proofSummaryKey);
  } catch {
    // Storage availability must never interrupt the local checker or offer page.
  }
}

export function clearResumeJobAdProofSummary() {
  if (typeof window === "undefined") return;
  removeStoredSummary();
}

export function saveResumeJobAdProofSummary(summary: Pick<ResumeJobAdProofSummary, "matchedCount" | "missingCount">) {
  if (typeof window === "undefined") return;
  if (!validCount(summary.matchedCount) || !validCount(summary.missingCount)) return;
  if (summary.matchedCount + summary.missingCount < 1 || summary.matchedCount + summary.missingCount > maxResultCount) return;

  try {
    window.sessionStorage.setItem(proofSummaryKey, JSON.stringify({
      matchedCount: summary.matchedCount,
      missingCount: summary.missingCount,
      checkedAt: Date.now(),
    } satisfies ResumeJobAdProofSummary));
  } catch {
    // The handoff is optional and must fail silently in restricted browsers.
  }
}

export function readResumeJobAdProofSummary(): ResumeJobAdProofSummary | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(proofSummaryKey);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<ResumeJobAdProofSummary>;
    const now = Date.now();
    const validTimestamp = Number.isFinite(value.checkedAt)
      && Number(value.checkedAt) <= now
      && now - Number(value.checkedAt) <= proofSummaryLifetimeMs;
    const validSummary = validCount(value.matchedCount)
      && validCount(value.missingCount)
      && Number(value.matchedCount) + Number(value.missingCount) >= 1
      && Number(value.matchedCount) + Number(value.missingCount) <= maxResultCount;

    if (!validTimestamp || !validSummary) {
      removeStoredSummary();
      return null;
    }

    return {
      matchedCount: Number(value.matchedCount),
      missingCount: Number(value.missingCount),
      checkedAt: Number(value.checkedAt),
    };
  } catch {
    removeStoredSummary();
    return null;
  }
}
