import { safeExternalHttpUrl } from "@/lib/safeNavigation";
import { todayDate, validDate } from "@/lib/lifeReminders";

export type JobStatus = "saved" | "applied" | "interview" | "offer" | "closed";
export type Application = { id: string; company: string; role: string; status: JobStatus; appliedDate: string; nextDate: string; link: string; notes: string; createdAt: string };
export type ApplicationForm = Omit<Application, "id" | "createdAt">;
export const jobStorageKey = "aussie-compass-job-tracker-v1";
export const statusLabels: Record<JobStatus, string> = { saved: "관심 공고", applied: "지원 완료", interview: "면접", offer: "오퍼", closed: "종료" };
export const newJobLimits = { records: 500, company: 160, role: 160, notes: 4000, link: 2048 };
const cleanText = (value: unknown): value is string => typeof value === "string" && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value);
const optionalDate = (value: unknown) => value === "" || validDate(value);
export function parseApplications(raw: string): Application[] | null {
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return null;
    const ids = new Set<string>();
    for (const r of data) {
      if (!r || typeof r !== "object" || Array.isArray(r) || Object.keys(r).some(key => !["id", "company", "role", "status", "appliedDate", "nextDate", "link", "notes", "createdAt"].includes(key))
        || typeof r.id !== "string" || !/^[a-zA-Z0-9_-]{1,200}$/.test(r.id) || ids.has(r.id) || !cleanText(r.company) || !r.company.trim() || !cleanText(r.role) || !r.role.trim()
        || typeof r.status !== "string" || !Object.hasOwn(statusLabels, r.status) || !optionalDate(r.appliedDate) || !optionalDate(r.nextDate) || !cleanText(r.notes) || !cleanText(r.link) || (r.link !== "" && !safeExternalHttpUrl(r.link))
        || typeof r.createdAt !== "string" || !Number.isFinite(Date.parse(r.createdAt)) || new Date(r.createdAt).toISOString() !== r.createdAt) return null;
      ids.add(r.id);
    }
    // Existing counts and text are never truncated. New-edit limits are enforced
    // only at submission, so already stored long records remain recoverable.
    return data as Application[];
  } catch { return null; }
}
export const serializeApplications = (data: Application[]) => { const raw = JSON.stringify(data); return parseApplications(raw) ? raw : null; };
export function applicationFormError(form: ApplicationForm, original?: Application) {
  if (!cleanText(form.company) || !form.company.trim() || !cleanText(form.role) || !form.role.trim()) return "회사명과 직무를 입력해 주세요. 공백만 입력할 수 없습니다.";
  if (typeof form.status !== "string" || !Object.hasOwn(statusLabels, form.status)) return "목록에 있는 진행 상태를 선택해 주세요.";
  if (!optionalDate(form.appliedDate) || !optionalDate(form.nextDate)) return "지원일과 다음 일정은 실제 날짜로 입력하거나 비워 두세요.";
  if (!cleanText(form.notes) || !cleanText(form.link) || (form.link.trim() && !safeExternalHttpUrl(form.link))) return "공고 링크는 http:// 또는 https:// 주소로, 메모는 일반 텍스트로 입력하세요.";
  for (const key of ["company", "role", "notes", "link"] as const) if (form[key].length > newJobLimits[key] && form[key] !== original?.[key]) return `새로 입력·수정하는 회사명·직무는 160자, 메모는 4,000자, 링크는 2,048자까지입니다. 기존의 긴 내용은 수정하지 않으면 그대로 유지됩니다.`;
  return "";
}
export function applicationSchedule(items: Application[], today = todayDate()) {
  const open = items.filter(item => item.nextDate && item.status !== "closed").sort((a, b) => a.nextDate.localeCompare(b.nextDate));
  return { past: open.filter(item => item.nextDate < today), today: open.filter(item => item.nextDate === today), next: open.find(item => item.nextDate > today) ?? null };
}
export function jobBackup(items: Application[], origin: string, now = new Date()) {
  if (!parseApplications(JSON.stringify(items))) throw new Error("Invalid applications");
  return { format: "hoju-compass-device-backup", version: 1, exportedAt: now.toISOString(), sourceOrigin: origin, entries: { [jobStorageKey]: JSON.stringify(items) } };
}
