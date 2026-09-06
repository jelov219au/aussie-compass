import { departureTasks, taskRoute } from "@/data/departureNextActions";
import { deviceTransferManifest } from "@/data/deviceTransferManifest";
import { departureActionValid, parseDepartureNextAction, type DepartureNextActionState } from "@/lib/departureNextAction";
import { readLocalRecord } from "@/lib/localRecordState";

export type MyCompassSourceState = "empty" | "one_valid" | "multiple_valid" | "invalid_present" | "storage_unavailable";
export type MyCompassApplicability = "applicable" | "not_applicable" | "unconfirmed";
export type MyCompassStatus = "not_started" | "user_checked" | "awaiting_external_confirmation" | "verified_outcome" | "blocked" | "invalid_needs_review";
export type MyCompassDueState = "overdue" | "due_today" | "due_next_7_days" | "later" | "no_comparable_date" | "invalid_date";
export type MyCompassNextAction = "open_start_selector" | "review_in_tool" | "open_official_route_then_return" | "wait_until_recheck" | "repair_local_record" | "no_action_applicable";
export type MyCompassOfficialRoute = { label: string; href: string; checked_on: string } | "none";

export type MyCompassNextActionOutcome = {
  source_state: MyCompassSourceState;
  selected_tool: string | "none";
  applicability: MyCompassApplicability;
  status: MyCompassStatus;
  due_state: MyCompassDueState;
  due_or_recheck: string | "none";
  official_route: MyCompassOfficialRoute;
  tool_return: string;
  next_action: MyCompassNextAction;
};

export type MyCompassDashboardSource = {
  toolId: string;
  href: string;
  active: boolean;
  activityStatus: "not_started" | "user_checked";
};

export type MyCompassActionCandidate = {
  toolId: string;
  applicability: MyCompassApplicability;
  status: Exclude<MyCompassStatus, "invalid_needs_review">;
  dueOrRecheck: string | null;
  officialRoute: MyCompassOfficialRoute;
  toolReturn: string;
  nextAction: Exclude<MyCompassNextAction, "open_start_selector" | "repair_local_record">;
};

export type MyCompassRecordIssue = { toolId: string; title: string; href: string; detail: string; status: "invalid" | "unavailable" };

const departureActionStorageKey = "leaving-departure-next-action-v1";
const officialCheckedOn = "2026-09-07";
const knownStorageKeys = new Set([...deviceTransferManifest.map((record) => record.key), departureActionStorageKey]);

const isoDay = /^\d{4}-\d{2}-\d{2}$/;

function dayNumber(value: string) {
  if (!isoDay.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const timestamp = Date.UTC(year, month - 1, day);
  const date = new Date(timestamp);
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? Math.floor(timestamp / 86_400_000) : null;
}

export function myCompassDueState(value: string | null, now = new Date()): MyCompassDueState {
  if (!value) return "no_comparable_date";
  const due = dayNumber(value);
  if (due === null) return "invalid_date";
  const today = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86_400_000);
  const distance = due - today;
  if (distance < 0) return "overdue";
  if (distance === 0) return "due_today";
  if (distance <= 7) return "due_next_7_days";
  return "later";
}

const duePriority: Record<MyCompassDueState, number> = {
  overdue: 0,
  due_today: 1,
  due_next_7_days: 2,
  later: 3,
  no_comparable_date: 4,
  invalid_date: 5,
};

export function rankMyCompassCandidates(candidates: MyCompassActionCandidate[], now = new Date()) {
  return candidates.map((candidate, index) => ({ candidate, index, due: myCompassDueState(candidate.dueOrRecheck, now) }))
    .sort((left, right) => duePriority[left.due] - duePriority[right.due]
      || (dayNumber(left.candidate.dueOrRecheck ?? "") ?? Number.MAX_SAFE_INTEGER) - (dayNumber(right.candidate.dueOrRecheck ?? "") ?? Number.MAX_SAFE_INTEGER)
      || left.index - right.index)
    .map(({ candidate }) => candidate);
}

function departureCandidate(value: DepartureNextActionState): MyCompassActionCandidate {
  const task = departureTasks.find((item) => item.id === value.task);
  const valid = departureActionValid(value) && Boolean(task);
  const href = valid && task ? taskRoute(task, value.jurisdiction) : "";
  const applicability = value.task ? value.applicability[value.task] === "not_applicable" || value.status === "not_applicable" ? "not_applicable" : value.applicability[value.task] === "applicable" ? "applicable" : "unconfirmed" : "unconfirmed";
  let status: MyCompassActionCandidate["status"] = "not_started";
  if (value.status === "requested_or_submitted" || value.status === "awaiting_confirmation") status = "awaiting_external_confirmation";
  else if (value.status === "received_or_final_bill_reconciled") status = value.evidence === "receipt_saved" || value.evidence === "copy_saved" ? "verified_outcome" : "user_checked";
  else if (value.status === "blocked_or_disputed") status = "blocked";
  else if (value.task || value.stage) status = "user_checked";
  const officialRoute: MyCompassOfficialRoute = valid && task && /^https:\/\//.test(href)
    ? { label: task.routeLabel, href, checked_on: officialCheckedOn }
    : "none";
  const dueOrRecheck = valid ? value.recheckDate : null;
  const due = myCompassDueState(dueOrRecheck);
  const nextAction: MyCompassActionCandidate["nextAction"] = applicability === "not_applicable"
    ? "no_action_applicable"
    : officialRoute !== "none" && ["overdue", "due_today", "due_next_7_days"].includes(due)
      ? "open_official_route_then_return"
      : status === "awaiting_external_confirmation" && due === "later"
        ? "wait_until_recheck"
        : "review_in_tool";
  return { toolId: "leaving-australia-project", applicability, status, dueOrRecheck, officialRoute, toolReturn: "/leaving-australia-guide", nextAction };
}

export function readMyCompassActionRecords(getStorage: () => Pick<Storage, "getItem"> = () => localStorage) {
  const state = readLocalRecord(departureActionStorageKey, parseDepartureNextAction, getStorage);
  const candidates = state.status === "valid" ? [departureCandidate(state.value)] : [];
  const issues: MyCompassRecordIssue[] = state.status === "invalid" || state.status === "unavailable" ? [{
    toolId: "leaving-australia-project",
    title: "출국 다음 행동",
    href: "/leaving-australia-guide",
    detail: state.status === "unavailable" ? "기기 저장소를 읽지 못했습니다. 원래 도구에서 다시 확인하세요." : "저장 형식을 확인할 수 없습니다. 원문은 그대로 두었습니다.",
    status: state.status,
  }] : [];
  return { candidates, issues };
}

export function countUnknownCompassRecords(storage: Pick<Storage, "length" | "key">) {
  let count = 0;
  try {
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key && /^(?:aussie-compass|hoju-compass)-/.test(key) && !knownStorageKeys.has(key)) count += 1;
    }
    return { count, unavailable: false };
  } catch {
    return { count: 0, unavailable: true };
  }
}

export function deriveMyCompassNextAction({
  sources,
  candidates,
  issues,
  unknownRecordCount,
  storageUnavailable,
  now = new Date(),
}: {
  sources: MyCompassDashboardSource[];
  candidates: MyCompassActionCandidate[];
  issues: MyCompassRecordIssue[];
  unknownRecordCount: number;
  storageUnavailable: boolean;
  now?: Date;
}): MyCompassNextActionOutcome {
  if (storageUnavailable || issues.some((issue) => issue.status === "unavailable")) return {
    source_state: "storage_unavailable", selected_tool: "none", applicability: "unconfirmed", status: "invalid_needs_review", due_state: "no_comparable_date", due_or_recheck: "none", official_route: "none", tool_return: "/data-transfer", next_action: "repair_local_record",
  };
  if (issues.length || unknownRecordCount > 0) {
    const issue = issues[0];
    return {
      source_state: "invalid_present", selected_tool: issue?.toolId ?? "none", applicability: "unconfirmed", status: "invalid_needs_review", due_state: "invalid_date", due_or_recheck: "none", official_route: "none", tool_return: issue?.href ?? "/data-transfer", next_action: "repair_local_record",
    };
  }
  const active = sources.filter((source) => source.active);
  const validToolIds = new Set([...active.map((source) => source.toolId), ...candidates.map((candidate) => candidate.toolId)]);
  if (!validToolIds.size) return {
    source_state: "empty", selected_tool: "none", applicability: "unconfirmed", status: "not_started", due_state: "no_comparable_date", due_or_recheck: "none", official_route: "none", tool_return: "/tools", next_action: "open_start_selector",
  };
  const selected = rankMyCompassCandidates(candidates, now)[0];
  if (selected) return {
    source_state: validToolIds.size === 1 ? "one_valid" : "multiple_valid",
    selected_tool: selected.toolId,
    applicability: selected.applicability,
    status: selected.status,
    due_state: myCompassDueState(selected.dueOrRecheck, now),
    due_or_recheck: selected.dueOrRecheck ?? "none",
    official_route: selected.officialRoute,
    tool_return: selected.toolReturn,
    next_action: selected.nextAction,
  };
  const first = active[0];
  return {
    source_state: validToolIds.size === 1 ? "one_valid" : "multiple_valid",
    selected_tool: first.toolId,
    applicability: "unconfirmed",
    status: first.activityStatus,
    due_state: "no_comparable_date",
    due_or_recheck: "none",
    official_route: "none",
    tool_return: first.href,
    next_action: "review_in_tool",
  };
}
