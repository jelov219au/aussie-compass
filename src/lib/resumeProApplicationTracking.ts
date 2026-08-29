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

type TrackedApplication = {
  id: string;
  company: string;
  role: string;
  updatedAt: string;
  draft: {
    applicationDeadline?: unknown;
    applicationStatus?: unknown;
  };
};

export type ResumeProApplicationPriorityReason = "overdue" | "today" | "upcoming" | "follow_up" | "no_deadline" | "submitted";

export type ResumeProApplicationPriorityItem = {
  application: TrackedApplication;
  deadline: string;
  status: ResumeProApplicationStatus;
  daysFromToday: number | null;
  reason: ResumeProApplicationPriorityReason;
};

const dayMs = 24 * 60 * 60 * 1000;

function dateOrdinal(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function updatedAtOrdinal(value: string) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getResumeProApplicationPrioritySummary(applications: readonly TrackedApplication[], todayValue: string) {
  const today = normaliseResumeProApplicationDeadline(todayValue);
  const statusCounts: Record<ResumeProApplicationStatus, number> = { preparing: 0, ready: 0, submitted: 0, follow_up: 0 };
  const items: ResumeProApplicationPriorityItem[] = applications.map((application) => {
    const status = normaliseResumeProApplicationStatus(application.draft.applicationStatus);
    const deadline = normaliseResumeProApplicationDeadline(application.draft.applicationDeadline);
    const daysFromToday = today && deadline ? Math.round((dateOrdinal(deadline) - dateOrdinal(today)) / dayMs) : null;
    const actionableDeadline = (status === "preparing" || status === "ready") && daysFromToday !== null;
    const reason: ResumeProApplicationPriorityReason = actionableDeadline
      ? daysFromToday < 0 ? "overdue" : daysFromToday === 0 ? "today" : "upcoming"
      : status === "follow_up" ? "follow_up" : status === "submitted" ? "submitted" : "no_deadline";
    statusCounts[status] += 1;
    return { application, deadline, status, daysFromToday, reason };
  });

  const priorityGroup: Record<ResumeProApplicationPriorityReason, number> = { overdue: 0, today: 0, upcoming: 0, follow_up: 1, no_deadline: 2, submitted: 3 };
  const deadlineTieRank: Record<ResumeProApplicationPriorityReason, number> = { today: 0, overdue: 1, upcoming: 2, follow_up: 3, no_deadline: 4, submitted: 5 };
  const statusRank: Record<ResumeProApplicationStatus, number> = { ready: 0, preparing: 1, follow_up: 2, submitted: 3 };
  const priorityItems = [...items].sort((left, right) => {
    const groupDifference = priorityGroup[left.reason] - priorityGroup[right.reason];
    if (groupDifference) return groupDifference;
    if (priorityGroup[left.reason] === 0) {
      const distanceDifference = Math.abs(left.daysFromToday ?? 0) - Math.abs(right.daysFromToday ?? 0);
      if (distanceDifference) return distanceDifference;
      const deadlineTieDifference = deadlineTieRank[left.reason] - deadlineTieRank[right.reason];
      if (deadlineTieDifference) return deadlineTieDifference;
    }
    const statusDifference = statusRank[left.status] - statusRank[right.status];
    if (statusDifference) return statusDifference;
    const updatedDifference = updatedAtOrdinal(right.application.updatedAt) - updatedAtOrdinal(left.application.updatedAt);
    return updatedDifference || left.application.company.localeCompare(right.application.company, "ko-KR") || left.application.id.localeCompare(right.application.id);
  }).slice(0, 3);

  const actionableDeadlines = items.filter((item) => item.daysFromToday !== null && (item.status === "preparing" || item.status === "ready"));
  const nearestDeadline = actionableDeadlines
    .filter((item) => (item.daysFromToday ?? -1) >= 0)
    .sort((left, right) => (left.daysFromToday ?? 0) - (right.daysFromToday ?? 0))[0]
    ?? actionableDeadlines.sort((left, right) => (right.daysFromToday ?? 0) - (left.daysFromToday ?? 0))[0]
    ?? null;

  return { statusCounts, nearestDeadline, priorityItems };
}
