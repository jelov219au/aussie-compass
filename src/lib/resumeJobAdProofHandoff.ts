const proofSummaryKey = "hoju.resumeJobAdProofSummary.v1";
const proofEvidenceKey = "hoju.resumeJobAdProofEvidence.v1";
const proofSummaryLifetimeMs = 30 * 60 * 1000;
const maxResultCount = 12;
const maxTermLength = 80;

export type ResumeJobAdProofTerm = {
  term: string;
  matched: boolean;
};

export type ResumeJobAdProofSummary = {
  matchedCount: number;
  missingCount: number;
  checkedAt: number;
};

export type ResumeJobAdEvidenceHandoff = {
  terms: ResumeJobAdProofTerm[];
  checkedAt: number;
};

function validCount(value: unknown) {
  return Number.isInteger(value) && Number(value) >= 0 && Number(value) <= maxResultCount;
}

export function normaliseResumeJobAdProofTerms(value: unknown): ResumeJobAdProofTerm[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const candidate = item as Partial<Record<keyof ResumeJobAdProofTerm, unknown>>;
    const term = typeof candidate.term === "string" ? candidate.term.replace(/\s+/g, " ").trim().slice(0, maxTermLength) : "";
    const key = term.toLowerCase();
    if (!term || typeof candidate.matched !== "boolean" || seen.has(key)) return [];
    seen.add(key);
    return [{ term, matched: candidate.matched }];
  }).slice(0, maxResultCount);
}

function removeStoredSummary() {
  try {
    window.sessionStorage.removeItem(proofSummaryKey);
    window.sessionStorage.removeItem(proofEvidenceKey);
  } catch {
    // Storage availability must never interrupt the local checker or offer page.
  }
}

export function clearResumeJobAdProofSummary() {
  if (typeof window === "undefined") return;
  removeStoredSummary();
}

export function saveResumeJobAdProofSummary(summary: Pick<ResumeJobAdProofSummary, "matchedCount" | "missingCount"> & { terms: ResumeJobAdProofTerm[] }) {
  if (typeof window === "undefined") return;
  if (!validCount(summary.matchedCount) || !validCount(summary.missingCount)) return;
  if (summary.matchedCount + summary.missingCount < 1 || summary.matchedCount + summary.missingCount > maxResultCount) return;
  const terms = normaliseResumeJobAdProofTerms(summary.terms);
  if (terms.length !== summary.matchedCount + summary.missingCount) return;
  if (terms.filter((item) => item.matched).length !== summary.matchedCount) return;

  try {
    const checkedAt = Date.now();
    window.sessionStorage.setItem(proofSummaryKey, JSON.stringify({
      matchedCount: summary.matchedCount,
      missingCount: summary.missingCount,
      checkedAt,
    } satisfies ResumeJobAdProofSummary));
    window.sessionStorage.setItem(proofEvidenceKey, JSON.stringify({
      terms,
      checkedAt,
    } satisfies ResumeJobAdEvidenceHandoff));
  } catch {
    removeStoredSummary();
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

export function readResumeJobAdEvidenceHandoff(): ResumeJobAdEvidenceHandoff | null {
  if (typeof window === "undefined") return null;
  const summary = readResumeJobAdProofSummary();
  if (!summary) return null;

  try {
    const raw = window.sessionStorage.getItem(proofEvidenceKey);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<ResumeJobAdEvidenceHandoff>;
    const terms = normaliseResumeJobAdProofTerms(value.terms);
    const validTimestamp = Number.isFinite(value.checkedAt) && Number(value.checkedAt) === summary.checkedAt;
    const validTerms = terms.length === summary.matchedCount + summary.missingCount
      && terms.filter((item) => item.matched).length === summary.matchedCount;
    if (!validTimestamp || !validTerms) {
      removeStoredSummary();
      return null;
    }
    return { terms, checkedAt: Number(value.checkedAt) };
  } catch {
    removeStoredSummary();
    return null;
  }
}
