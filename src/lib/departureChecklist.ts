import { validDate } from "@/lib/lifeReminders";
import type { ProjectItem } from "@/lib/localProjectChecklist";

export type DepartureChecklistStatus = "pending" | "action_pending" | "confirmed" | "not_applicable" | "review_needed";
export type DepartureChecklistProgress = {
  version: 2;
  statuses: Record<string, DepartureChecklistStatus>;
  targetDate: string;
};

export const departureChecklistStatuses: Array<{ value: DepartureChecklistStatus; label: string }> = [
  { value: "pending", label: "아직 확인 전" },
  { value: "action_pending", label: "요청·처리 중" },
  { value: "confirmed", label: "결과까지 확인" },
  { value: "not_applicable", label: "해당 없음" },
  { value: "review_needed", label: "기존 체크 · 재확인 필요" },
];

export function emptyDepartureChecklist(items: ProjectItem[]): DepartureChecklistProgress {
  return { version: 2, statuses: Object.fromEntries(items.map((item) => [item.id, "pending"])), targetDate: "" };
}

export function departureChecklistCodec(items: ProjectItem[]) {
  const ids = new Set(items.map((item) => item.id));
  const allowed = new Set(departureChecklistStatuses.map((item) => item.value));
  const complete = (partial: Record<string, DepartureChecklistStatus>) =>
    Object.fromEntries(items.map((item) => [item.id, partial[item.id] ?? "pending"]));

  function parse(raw: string): DepartureChecklistProgress | null {
    try {
      const value = JSON.parse(raw);
      if (!value || typeof value !== "object" || Array.isArray(value)) return null;
      const targetDate = value.targetDate;
      if (!(targetDate === "" || validDate(targetDate))) return null;

      if (Array.isArray(value.checked)) {
        if (Object.keys(value).some((key) => !["checked", "targetDate"].includes(key))
          || new Set(value.checked).size !== value.checked.length
          || value.checked.some((id: unknown) => typeof id !== "string" || !ids.has(id))) return null;
        return {
          version: 2,
          targetDate,
          statuses: complete(Object.fromEntries(value.checked.map((id: string) => [id, "review_needed"]))),
        };
      }

      if (value.version !== 2 || !value.statuses || typeof value.statuses !== "object" || Array.isArray(value.statuses)
        || Object.keys(value).some((key) => !["version", "statuses", "targetDate"].includes(key))
        || Object.keys(value.statuses).some((id) => !ids.has(id))
        || Object.values(value.statuses).some((status) => typeof status !== "string" || !allowed.has(status as DepartureChecklistStatus))) return null;
      return { version: 2, targetDate, statuses: complete(value.statuses as Record<string, DepartureChecklistStatus>) };
    } catch {
      return null;
    }
  }

  return {
    parse,
    serialize: (data: DepartureChecklistProgress) => {
      const raw = JSON.stringify(data);
      return parse(raw) ? raw : null;
    },
  };
}
