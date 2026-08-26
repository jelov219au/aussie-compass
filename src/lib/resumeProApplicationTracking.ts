export const resumeProApplicationStatuses = ["preparing", "ready", "submitted", "follow_up"] as const;

export type ResumeProApplicationStatus = typeof resumeProApplicationStatuses[number];

export const resumeProApplicationStatusLabels: Record<ResumeProApplicationStatus, string> = {
  preparing: "준비 중",
  ready: "제출 준비",
  submitted: "제출 완료",
  follow_up: "후속 확인",
};

export function normaliseResumeProApplicationStatus(value: unknown): ResumeProApplicationStatus {
  return resumeProApplicationStatuses.includes(value as ResumeProApplicationStatus)
    ? value as ResumeProApplicationStatus
    : "preparing";
}

export function normaliseResumeProApplicationDeadline(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    ? value
    : "";
}
