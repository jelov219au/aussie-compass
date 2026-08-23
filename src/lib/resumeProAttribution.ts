export const resumeProEntries = [
  "article-resume-template",
  "article-job-search-plan",
  "article-achievement-examples",
  "article-cover-letter-checklist",
  "resume-builder-complete",
  "home-premium",
  "pro-finder",
] as const;

export type ResumeProEntry = (typeof resumeProEntries)[number] | "direct";

export function normalizeResumeProEntry(value: unknown): ResumeProEntry {
  return typeof value === "string" && resumeProEntries.some((entry) => entry === value)
    ? value as ResumeProEntry
    : "direct";
}
