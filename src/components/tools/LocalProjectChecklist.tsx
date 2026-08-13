"use client";

import { useEffect, useMemo, useState } from "react";

export type ProjectGroup = { title: string; items: Array<{ id: string; label: string; detail: string }> };

type Props = {
  storageKey: string;
  eyebrow: string;
  title: string;
  description: string;
  groups: ProjectGroup[];
  dateLabel?: string;
  calendarTitle?: string;
};

function icsDate(date: string) { return date.replaceAll("-", ""); }
function icsEscape(value: string) { return value.replaceAll("\\", "\\\\").replaceAll("\n", "\\n").replaceAll(",", "\\,").replaceAll(";", "\\;"); }

export function LocalProjectChecklist({ storageKey, eyebrow, title, description, groups, dateLabel, calendarTitle }: Props) {
  const [checked, setChecked] = useState<string[]>([]);
  const [targetDate, setTargetDate] = useState("");
  const [loaded, setLoaded] = useState(false);
  const items = useMemo(() => groups.flatMap((group) => group.items), [groups]);

  useEffect(() => { try { const saved = localStorage.getItem(storageKey); if (saved) { const data = JSON.parse(saved); setChecked(data.checked || []); setTargetDate(data.targetDate || ""); } } catch {} setLoaded(true); }, [storageKey]);
  useEffect(() => { if (!loaded) return; try { localStorage.setItem(storageKey, JSON.stringify({ checked, targetDate })); } catch {} }, [checked, targetDate, loaded, storageKey]);

  const progress = Math.round((checked.length / items.length) * 100);
  function toggle(id: string) { setChecked((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]); }
  function downloadReminder() {
    if (!targetDate || !calendarTitle) return;
    const remaining = items.filter((item) => !checked.includes(item.id)).map((item) => `• ${item.label}`).join("\n");
    const body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Aussie Compass//Project Reminder//KO", "CALSCALE:GREGORIAN", "BEGIN:VEVENT", `UID:${storageKey}-${targetDate}@aussiecompass`, `DTSTART;VALUE=DATE:${icsDate(targetDate)}`, `SUMMARY:${icsEscape(calendarTitle)}`, `DESCRIPTION:${icsEscape(remaining ? `남은 준비 항목\n${remaining}` : "모든 준비 항목을 완료했습니다.")}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const url = URL.createObjectURL(new Blob([body], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `${storageKey}-reminder.ics`; link.click(); URL.revokeObjectURL(url);
  }

  return <section className="rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-8" aria-labelledby={`${storageKey}-heading`}>
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-sm font-semibold text-gold">{eyebrow}</p><h2 id={`${storageKey}-heading`} className="mt-2 text-2xl font-semibold text-navy">{title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{description}</p></div><div className="min-w-48"><div className="flex justify-between text-sm font-semibold text-navy"><span>{checked.length}/{items.length}</span><span>{progress}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-surface"><div className="h-full bg-gold transition-all" style={{ width: `${progress}%` }} /></div></div></div>
    {dateLabel && <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-surface p-4 sm:flex-row sm:items-end"><label className="flex-1 text-sm font-medium text-navy">{dateLabel}<input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-border bg-white px-3" /></label>{calendarTitle && <button type="button" disabled={!targetDate} onClick={downloadReminder} className="min-h-11 rounded-lg bg-navy px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">캘린더 리마인더 받기</button>}</div>}
    <div className="mt-8 grid gap-6 lg:grid-cols-2">{groups.map((group) => <fieldset key={group.title} className="rounded-2xl border border-border p-5"><legend className="px-1 text-lg font-semibold text-navy">{group.title}</legend><div className="mt-2 space-y-2">{group.items.map((item) => <label key={item.id} className="flex cursor-pointer gap-3 rounded-xl p-2 hover:bg-surface"><input type="checkbox" checked={checked.includes(item.id)} onChange={() => toggle(item.id)} className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-gold)]" /><span><span className={`block text-sm font-semibold ${checked.includes(item.id) ? "text-muted line-through" : "text-navy"}`}>{item.label}</span><span className="mt-1 block text-xs leading-5 text-muted">{item.detail}</span></span></label>)}</div></fieldset>)}</div>
    {checked.length > 0 && <button type="button" onClick={() => setChecked([])} className="mt-6 min-h-11 rounded-lg border border-border px-4 text-sm font-semibold text-navy hover:bg-surface">진행 상태 초기화</button>}
  </section>;
}
