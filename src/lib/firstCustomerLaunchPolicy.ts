export const firstCustomerGoWindowMs = 60 * 60 * 1000;
const utcTimestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export type FirstCustomerLaunchDecision = {
  status: "go" | "no_go";
  auditedAt: string;
  approvedAt: string | null;
  validUntil: string | null;
  blockers: readonly string[];
};

export function isFirstCustomerGoCurrent(decision: FirstCustomerLaunchDecision, now = Date.now()) {
  if (decision.status !== "go" || decision.blockers.length > 0) return false;
  if (!decision.approvedAt || !decision.validUntil) return false;
  if (!Number.isFinite(now) || !utcTimestampPattern.test(decision.approvedAt) || !utcTimestampPattern.test(decision.validUntil)) return false;

  const approvedAt = Date.parse(decision.approvedAt);
  const validUntil = Date.parse(decision.validUntil);
  if (!Number.isFinite(approvedAt) || !Number.isFinite(validUntil)) return false;
  if (new Date(approvedAt).toISOString() !== decision.approvedAt || new Date(validUntil).toISOString() !== decision.validUntil) return false;
  if (approvedAt > now || validUntil <= now || validUntil <= approvedAt) return false;
  return validUntil - approvedAt <= firstCustomerGoWindowMs;
}
