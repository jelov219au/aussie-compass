import { addDays, foldLine, icsEscape, validDate } from "@/lib/lifeReminders";

export type ProjectItem = { id: string; label: string; detail: string };
export type ProjectProgress = { checked: string[]; targetDate: string };
export const emptyProjectProgress: ProjectProgress = { checked: [], targetDate: "" };

export function projectCodec(items: ProjectItem[]) {
  const ids = new Set(items.map(item => item.id));
  function parse(raw: string): ProjectProgress | null {
    try {
      const value = JSON.parse(raw);
      if (!value || typeof value !== "object" || Array.isArray(value)
        || Object.keys(value).some(key => !["checked", "targetDate"].includes(key))
        || !Array.isArray(value.checked) || new Set(value.checked).size !== value.checked.length
        || value.checked.some((id: unknown) => typeof id !== "string" || !ids.has(id))
        || !(value.targetDate === "" || validDate(value.targetDate))) return null;
      return value as ProjectProgress;
    } catch { return null; }
  }
  return { parse, serialize: (data: ProjectProgress) => { const raw = JSON.stringify(data); return parse(raw) ? raw : null; } };
}

export const projectCalendarDateValid = (date: string) => validDate(date) && date < "9999-12-31";
export function projectReminderCalendar(storageKey: string, title: string, data: ProjectProgress, items: ProjectItem[], now = new Date()) {
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(storageKey) || !title.trim() || !projectCodec(items).parse(JSON.stringify(data)) || !projectCalendarDateValid(data.targetDate)) throw new Error("Invalid project reminder");
  const remaining = items.filter(item => !data.checked.includes(item.id)).map(item => `• ${item.label}`).join("\n");
  const description = `${remaining ? `남은 준비 항목\n${remaining}` : "이 체크리스트의 항목을 모두 표시했습니다."}\n선택한 날짜와 현재 체크 상태의 사본입니다. 이후 변경은 자동 반영되지 않습니다. 달력 앱에 가져온 뒤 일정과 알림을 직접 확인하세요.`;
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Hoju Compass//Project Reminder//KO", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
    `UID:${storageKey}-${data.targetDate}@hojucompass.com`, `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${data.targetDate.replaceAll("-", "")}`, `DTEND;VALUE=DATE:${addDays(data.targetDate, 1).replaceAll("-", "")}`,
    `SUMMARY:${icsEscape(title)}`, `DESCRIPTION:${icsEscape(description)}`, "END:VEVENT", "END:VCALENDAR"].map(foldLine).join("\r\n") + "\r\n";
}
