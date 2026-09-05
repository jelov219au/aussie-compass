import { addDays, foldLine, icsEscape } from "@/lib/lifeReminders";
import { financialYearStart } from "@/lib/taxPrepStorage";

export type TaxTimePurpose = "current-ledger" | "recent-return";
export const defaultTaxYear = (purpose: TaxTimePurpose, today?: string) => financialYearStart(today) - (purpose === "recent-return" ? 1 : 0);
export function parseTaxYear(value: string): number | null {
  if (!/^\d{4}$/.test(value)) return null;
  const year = Number(value);
  return Number.isInteger(year) && year >= 2020 && year <= 2100 ? year : null;
}
export function taxTimeEvents(value: string) {
  const year = parseTaxYear(value);
  if (year === null) return null;
  return [
    { id: `tax-ready-${year}`, date: `${year + 1}-07-25`, title: "택스 리턴 자료 대조 점검", description: "임의로 정한 자료 점검일이며 ATO 기한이나 Tax ready 보장이 아닙니다. 고용주별 Income statement와 은행 등 Pre-fill 자료를 원본 기록과 대조하세요." },
    { id: `tax-agent-${year}`, date: `${year + 1}-10-15`, title: "택스 리턴 진행 상황 점검", description: "임의로 정한 점검일이며 개인 신고 기한이 아닙니다. 직접 신고 또는 등록 세무사 의뢰 상황과 본인에게 적용되는 최신 ATO 기한을 확인하세요." },
  ];
}
export function taxTimeCalendar(value: string, now = new Date()) {
  const events = taxTimeEvents(value);
  if (!events) throw new Error("Invalid tax year");
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Hoju Compass//Tax Time//KO", "CALSCALE:GREGORIAN", ...events.flatMap(event => [
    "BEGIN:VEVENT", `UID:${event.id}@hojucompass.com`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${event.date.replaceAll("-", "")}`, `DTEND;VALUE=DATE:${addDays(event.date, 1).replaceAll("-", "")}`,
    `SUMMARY:${icsEscape(event.title)}`, `DESCRIPTION:${icsEscape(`대상 회계연도: ${value}-${Number(value) + 1}\n${event.description}\n파일을 가져온 뒤 달력 앱에서 일정과 알림을 직접 확인하세요.`)}`, "END:VEVENT",
  ]), "END:VCALENDAR"].map(foldLine).join("\r\n") + "\r\n";
}
