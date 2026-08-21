export const resumeProEntries = [
  "article-job-search-plan",
  "article-achievement-examples",
  "resume-builder-complete",
] as const;

export type ResumeProEntry = (typeof resumeProEntries)[number] | "direct";

export function normalizeResumeProEntry(value: unknown): ResumeProEntry {
  return typeof value === "string" && resumeProEntries.some((entry) => entry === value)
    ? value as ResumeProEntry
    : "direct";
}
