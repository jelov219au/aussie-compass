import { validIsoTimestamp } from "@/lib/localRecordState";
import { addDays, foldLine, icsEscape, todayDate } from "@/lib/lifeReminders";
export type StageId = "prepare" | "arrive" | "live" | "depart";
export type ConcernId = "admin" | "work" | "home" | "money" | "safety";
export type RoutePreference = { stage: StageId; concern: ConcernId };
export type SavedPlan = RoutePreference & { stageLabel: string; concernLabel: string; steps: { href: string; title: string }[]; completed: string[]; savedAt: string };
export const routePreferenceKey = "hoju-compass-route-finder-v1";
export const personalPlanKey = "hoju-compass-personal-plan-v1";
export const savedPlanHref = "/?plan=saved#route-finder";
export const routeToolHrefs = ["/visa-preparation-guide", "/arrival-checklist", "/english-phrase-cards", "/career-pathways", "/resume-builder", "/job-application-tracker", "/salary-calculator", "/minimum-wage-guide", "/cost-of-living-calculator", "/public-transport-guide", "/property-inspection-checklist", "/savings-goal-calculator", "/tax-prep-tracker", "/tax-return-guide", "/life-admin-reminder", "/help-directory", "/moving-checklist", "/leaving-australia-guide", "/service-quote-comparator", "/used-car-comparison"];
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === "string" && !!v.trim() && !/[\u0000-\u001f]/.test(v);
function preference(v: unknown): v is RoutePreference & Record<string, unknown> { return object(v) && ["prepare", "arrive", "live", "depart"].includes(v.stage as string) && ["admin", "work", "home", "money", "safety"].includes(v.concern as string); }
export function parseRoutePreference(raw: string): RoutePreference | null {
  try { const v: unknown = JSON.parse(raw); return preference(v) ? { stage: v.stage, concern: v.concern } : null; } catch { return null; }
}
export function parsePersonalPlan(raw: string): SavedPlan | null {
  try {
    const v: unknown = JSON.parse(raw);
    if (!object(v) || !preference(v) || Object.keys(v).some(key => !["stage", "concern", "stageLabel", "concernLabel", "steps", "completed", "savedAt"].includes(key)) || !text(v.stageLabel) || !text(v.concernLabel) || !validIsoTimestamp(v.savedAt)
      || !Array.isArray(v.steps) || !v.steps.length || !Array.isArray(v.completed)) return null;
    const hrefs = new Set<string>();
    for (const step of v.steps) {
      if (!object(step) || Object.keys(step).some(key => !["href", "title"].includes(key)) || typeof step.href !== "string" || !routeToolHrefs.includes(step.href) || hrefs.has(step.href) || !text(step.title)) return null;
      hrefs.add(step.href);
    }
    if (new Set(v.completed).size !== v.completed.length || v.completed.some(href => typeof href !== "string" || !hrefs.has(href))) return null;
    return v as SavedPlan;
  } catch { return null; }
}
export function personalPlanCalendar(plan: SavedPlan, now = new Date()) {
  if (!parsePersonalPlan(JSON.stringify(plan))) throw new Error("Invalid personal plan");
  const date = addDays(todayDate(now), 7), end = addDays(date, 1);
  const remaining = plan.steps.filter(step => !plan.completed.includes(step.href)).map(step => step.title);
  const description = `${plan.stageLabel} · ${plan.concernLabel}\n${plan.completed.length}/${plan.steps.length}개 직접 완료 표시\n남은 단계: ${remaining.join(", ") || "없음"}\n현재 계획의 사본이며 이후 변경은 자동 반영되지 않습니다. 법정 기한 확인을 대신하지 않습니다.\nhttps://hojucompass.com/${savedPlanHref.slice(1)}`;
  const contents = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Hoju Compass//Personal Plan//KO", "CALSCALE:GREGORIAN", "BEGIN:VEVENT", `UID:personal-plan-${date}-${plan.stage}-${plan.concern}@hojucompass.com`, `DTSTAMP:${now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`, `DTSTART;VALUE=DATE:${date.replaceAll("-", "")}`, `DTEND;VALUE=DATE:${end.replaceAll("-", "")}`, "SUMMARY:Hoju Compass 계획 점검", `DESCRIPTION:${icsEscape(description)}`, `URL:https://hojucompass.com${savedPlanHref}`, "END:VEVENT", "END:VCALENDAR"].map(foldLine).join("\r\n") + "\r\n";
  return { date, contents };
}
