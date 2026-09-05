export type Reminder = { id: string; title: string; category: string; date: string; leadDays: number; note: string; createdAt: string };
export const allowedLeadDays = [7, 14, 30, 45, 60, 90, 180];
export function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^(?!0000)\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export const todayDate = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
export function calendarDays(value: string, today = todayDate()) { if (!validDate(value) || !validDate(today)) throw new Error("Invalid calendar date"); return (Date.parse(`${value}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000; }
export function addDays(value: string, days: number) { if (!validDate(value) || !Number.isInteger(days)) throw new Error("Invalid calendar date"); return new Date(Date.parse(`${value}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10); }
export const displayDate = (value: string) => new Date(`${value}T00:00:00Z`).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
const text = (v: unknown, max: number) => typeof v === "string" && v.length <= max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v);
export function parseReminders(raw: string): Reminder[] | null {
  try {
    const value: unknown = JSON.parse(raw); if (!Array.isArray(value) || value.length > 200) return null;
    const ids = new Set();
    for (const item of value) {
      if (!item || typeof item !== "object" || Array.isArray(item) || Object.keys(item).some(key => !["id", "title", "category", "date", "leadDays", "note", "createdAt"].includes(key))
        || typeof item.id !== "string" || !/^[a-zA-Z0-9_-]{1,200}$/.test(item.id) || ids.has(item.id) || !text(item.title, 80) || !item.title.trim()
        || !text(item.category, 30) || !item.category.trim() || !text(item.note, 300) || !validDate(item.date) || !allowedLeadDays.includes(item.leadDays)
        || !validDate(addDays(item.date, -item.leadDays)) || typeof item.createdAt !== "string" || !Number.isFinite(Date.parse(item.createdAt)) || new Date(item.createdAt).toISOString() !== item.createdAt) return null;
      ids.add(item.id);
    } return value as Reminder[];
  } catch { return null; }
}
export const serializeReminders = (value: Reminder[]) => { const raw = JSON.stringify(value); return parseReminders(raw) ? raw : null; };
export const icsEscape = (text: string) => text.replace(/\\/g, "\\\\").replace(/\r\n|\r|\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
// RFC 5545 lines are folded on UTF-8 octet boundaries, without splitting a code point.
export function foldLine(line: string) { const encoder = new TextEncoder(); let output = "", length = 0; for (const character of line) { const size = encoder.encode(character).length; if (length + size > 75) { output += "\r\n "; length = 1; } output += character; length += size; } return output; }
export function reminderCalendar(items: Reminder[], now = new Date()) {
  if (!parseReminders(JSON.stringify(items))) throw new Error("Invalid reminders");
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const events = items.flatMap(item => {
    const preparation = addDays(item.date, -item.leadDays);
    return ["BEGIN:VEVENT", `UID:${item.id}@hojucompass.com`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${preparation.replaceAll("-", "")}`, `DTEND;VALUE=DATE:${addDays(preparation, 1).replaceAll("-", "")}`, `SUMMARY:${icsEscape(item.title)} 준비`, `DESCRIPTION:${icsEscape(`실제 일정: ${displayDate(item.date)}\n${item.note}\n준비 시작일의 종일 일정입니다. 캘린더 앱에서 알림을 직접 설정하세요.`)}`, "END:VEVENT"];
  });
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Hoju Compass//Life Admin Reminder//KO", "CALSCALE:GREGORIAN", ...events, "END:VCALENDAR"].map(foldLine).join("\r\n") + "\r\n";
}
