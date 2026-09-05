import { todayDate, validDate } from "@/lib/lifeReminders";
import { RAIL_WORK_ALERT_MAX_AREAS, type RailWorkAlertSupportedState } from "@/lib/railWorkAlerts";

export type CheckId = "official" | "dates" | "alternative" | "accessibility";
export type WatchArea = { id: string; label: string; place: string; state: RailWorkAlertSupportedState; lastCheckedAt: string; checks: Record<CheckId, boolean>; reviewStartedAt?: string };
export const EMPTY_CHECKS: Record<CheckId, boolean> = { official: false, dates: false, alternative: false, accessibility: false };
export const CHECKS: { id: CheckId; label: string }[] = [
  { id: "official", label: "공식 공지 원문 열기" }, { id: "dates", label: "시작·종료 날짜 다시 확인" },
  { id: "alternative", label: "대체 버스·우회 경로 확인" }, { id: "accessibility", label: "접근성·막차 영향 여부 확인" },
];
const boundedText = (value: unknown, max: number) => typeof value === "string" && value.trim().length > 0 && value.length <= max && !/[\u0000-\u001f\u007f]/.test(value);
export function parseWatchAreas(raw: string): WatchArea[] | null {
  try {
    const items: unknown = JSON.parse(raw); if (!Array.isArray(items) || items.length > RAIL_WORK_ALERT_MAX_AREAS) return null;
    const ids = new Set();
    for (const a of items) {
      if (!a || typeof a !== "object" || Array.isArray(a) || Object.keys(a).some(key => !["id", "label", "place", "state", "lastCheckedAt", "checks", "reviewStartedAt"].includes(key))
        || typeof a.id !== "string" || !/^[a-zA-Z0-9_-]{1,200}$/.test(a.id) || ids.has(a.id) || !boundedText(a.label, 40) || !boundedText(a.place, 80) || !["NSW", "VIC", "QLD"].includes(a.state)
        || !(a.lastCheckedAt === "" || validDate(a.lastCheckedAt)) || (a.reviewStartedAt !== undefined && !validDate(a.reviewStartedAt)) || !a.checks || typeof a.checks !== "object" || Array.isArray(a.checks)
        || Object.keys(a.checks).length !== CHECKS.length || CHECKS.some(check => typeof a.checks[check.id] !== "boolean")) return null;
      ids.add(a.id);
    }
    return items as WatchArea[];
  } catch { return null; }
}
export const serializeWatchAreas = (areas: WatchArea[]) => { const raw = JSON.stringify(areas); return parseWatchAreas(raw) ? raw : null; };
export const checkedCount = (area: WatchArea) => CHECKS.filter(check => area.checks[check.id] === true).length;
export const startRailReview = (area: WatchArea, today = todayDate()): WatchArea => ({ ...area, checks: { ...EMPTY_CHECKS }, reviewStartedAt: today });
export const canCompleteRailReview = (area: WatchArea, today = todayDate()) => area.reviewStartedAt === today && checkedCount(area) === CHECKS.length;
export const completeRailReview = (area: WatchArea, today = todayDate()): WatchArea | null => canCompleteRailReview(area, today) ? { ...area, lastCheckedAt: today } : null;
export const railMapHref = (area: WatchArea) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${area.place} ${area.state} Australia railway station`)}`;
