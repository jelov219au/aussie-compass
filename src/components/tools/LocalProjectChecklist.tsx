"use client";

import { useEffect, useMemo, useState } from "react";
import { emptyProjectProgress, projectCalendarDateValid, projectCodec, projectReminderCalendar, type ProjectItem } from "@/lib/localProjectChecklist";
import { todayDate } from "@/lib/lifeReminders";
import { useLocalPlan } from "@/lib/useLocalPlan";
import { TaxStorageNotice as LocalStorageNotice } from "./TaxStorageNotice";

export type ProjectGroup = { title: string; items: ProjectItem[] };

type Props = {
  storageKey: string;
  eyebrow: string;
  title: string;
  description: string;
  groups: ProjectGroup[];
  dateLabel?: string;
  calendarTitle?: string;
};

export function LocalProjectChecklist(props: Props) {
  // Remount the complete state/effect boundary when switching projects. Pending
  // saves are cleaned up and cannot write the previous project's data to a new key.
  return <ProjectChecklist key={props.storageKey} {...props} />;
}

function ProjectChecklist({ storageKey, eyebrow, title, description, groups, dateLabel, calendarTitle }: Props) {
  const items = useMemo(() => groups.flatMap((group) => group.items), [groups]);
  const codec = useMemo(() => projectCodec(items), [items]);
  const { data, update, storage, saveState } = useLocalPlan(storageKey, emptyProjectProgress, codec.parse, codec.serialize, { initial: "아직 저장한 진행 기록 없음", reset: "진행 표시 초기화" });
  const { checked, targetDate } = data;
  const [today, setToday] = useState("");
  const [message, setMessage] = useState("");
  const [calendarFallback, setCalendarFallback] = useState<string | null>(null);
  useEffect(() => { const refresh = () => setToday(todayDate()); refresh(); window.addEventListener("focus", refresh); return () => window.removeEventListener("focus", refresh); }, []);
  const progress = items.length ? Math.round((checked.length / items.length) * 100) : 0;
  function toggle(id: string) {
    if (storage === "loading" || !items.some(item => item.id === id)) return;
    update(current => ({ ...current, checked: current.checked.includes(id) ? current.checked.filter(value => value !== id) : [...current.checked, id] }));
  }
  function resetProgress() {
    if (storage === "loading" || !window.confirm("체크 표시를 모두 비울까요? 선택한 날짜는 유지됩니다. 현재 기록을 따로 보관한 뒤 진행하세요.")) return;
    update(current => ({ ...current, checked: [] })); setMessage("화면의 체크 표시를 비웠습니다. 선택한 날짜는 유지되며 실제 저장 상태는 위 안내를 확인하세요.");
  }
  function downloadReminder() {
    if (storage === "loading" || !calendarTitle || !projectCalendarDateValid(targetDate) || !codec.parse(JSON.stringify(data))) { setMessage("유효한 날짜(0001-01-01~9999-12-30)와 체크 상태를 먼저 확인하세요."); return; }
    let body: string;
    try { body = projectReminderCalendar(storageKey, calendarTitle, data, items); }
    catch { setMessage("캘린더 파일을 만들 수 없습니다. 선택한 날짜와 체크 상태를 확인하세요."); return; }
    let url: string | undefined;
    try {
      url = URL.createObjectURL(new Blob([body], { type: "text/calendar;charset=utf-8" }));
      const link = document.createElement("a"); link.href = url; link.download = `${storageKey}-reminder.ics`; link.click();
      setCalendarFallback(null); setMessage(`${targetDate} 일정 파일의 다운로드를 요청했습니다. 받은 파일을 달력 앱에 가져온 뒤 날짜·남은 항목·알림을 확인하세요. 달력 등록은 아직 확인되지 않았습니다.`);
    } catch { setCalendarFallback(body); setMessage(`파일 다운로드를 시작하지 못했습니다. 아래 내용을 ${storageKey}-reminder.ics 파일로 따로 보관해 가져오세요.`); }
    finally { if (url) URL.revokeObjectURL(url); }
  }

  return <section className="rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-8" aria-labelledby={`${storageKey}-heading`}>
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-sm font-semibold text-gold">{eyebrow}</p><h2 id={`${storageKey}-heading`} className="mt-2 text-2xl font-semibold text-navy">{title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{description}</p></div><div className="min-w-48"><div className="flex justify-between text-sm font-semibold text-navy"><span>{checked.length}/{items.length}</span><span>{progress}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-surface"><div className="h-full bg-gold transition-all" style={{ width: `${progress}%` }} /></div></div></div>
    <LocalStorageNotice storageKey={storageKey} storage={storage} saveState={saveState} />
    <p className="mt-3 text-sm leading-6 text-muted">체크 표시는 본인의 진행 기록이며 기관 접수나 개인 자격의 완료를 뜻하지 않습니다. 체크와 선택한 날짜는 이 브라우저에만 저장됩니다.</p>
    {items.length > 0 && checked.length === items.length && <p className="mt-3 text-sm font-semibold text-navy">이 체크리스트의 항목을 모두 표시했습니다.</p>}
    {message && <p role="status" className="mt-3 text-sm leading-6 text-navy">{message}</p>}
    {calendarFallback !== null && <label className="mt-3 block text-sm text-navy">수동으로 보관할 캘린더 파일<textarea readOnly value={calendarFallback} rows={6} onFocus={event => event.target.select()} className="mt-2 w-full rounded-lg border border-border p-3 font-mono text-xs" /></label>}
    <fieldset disabled={storage === "loading"} className="min-w-0"><legend className="sr-only">{title} 입력</legend>
    {dateLabel && <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-surface p-4 sm:flex-row sm:items-end"><label className="min-w-0 flex-1 text-sm font-medium text-navy">{dateLabel}<input type="date" min="0001-01-01" max="9999-12-30" value={targetDate} onChange={(event) => update(current => ({ ...current, targetDate: event.target.value }))} className="mt-2 min-h-11 w-full min-w-0 rounded-lg border border-border bg-white px-3" /></label>{calendarTitle && <button type="button" disabled={!projectCalendarDateValid(targetDate)} onClick={downloadReminder} className="min-h-11 rounded-lg bg-navy px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">캘린더 리마인더 받기</button>}</div>}
    {dateLabel && <p className="mt-3 text-sm leading-6 text-muted">{targetDate && today && targetDate < today ? "선택한 날짜는 이미 지났습니다. 필요한 점검일인지 다시 확인하세요. " : ""}파일에는 선택한 날짜와 현재 남은 항목이 담깁니다. 받은 파일은 이후 체크 변경을 자동 반영하지 않습니다. 달력 앱에서 직접 가져오고 알림을 설정하세요.</p>}
    <div className="mt-8 grid gap-6 lg:grid-cols-2">{groups.map((group) => <fieldset key={group.title} className="rounded-2xl border border-border p-5"><legend className="px-1 text-lg font-semibold text-navy">{group.title}</legend><div className="mt-2 space-y-2">{group.items.map((item) => <label key={item.id} className="flex cursor-pointer gap-3 rounded-xl p-2 hover:bg-surface"><input type="checkbox" checked={checked.includes(item.id)} onChange={() => toggle(item.id)} className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-gold)]" /><span><span className={`block text-sm font-semibold ${checked.includes(item.id) ? "text-muted line-through" : "text-navy"}`}>{item.label}</span><span className="mt-1 block text-xs leading-5 text-muted">{item.detail}</span></span></label>)}</div></fieldset>)}</div>
    {checked.length > 0 && <button type="button" onClick={resetProgress} className="mt-6 min-h-11 rounded-lg border border-border px-4 text-sm font-semibold text-navy hover:bg-surface">진행 상태 초기화</button>}
    </fieldset>
  </section>;
}
