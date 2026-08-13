"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Reminder = {
  id: string;
  title: string;
  category: string;
  date: string;
  leadDays: number;
  note: string;
  createdAt: string;
};

const storageKey = "aussie-compass-life-reminders-v1";
const presets = [
  { title: "비자 만료 확인", category: "비자", leadDays: 90 },
  { title: "여권 만료 확인", category: "신분증", leadDays: 180 },
  { title: "렌트 계약 갱신 결정", category: "주거", leadDays: 45 },
  { title: "차량 Rego 갱신", category: "차량", leadDays: 30 },
  { title: "보험 갱신·비교", category: "보험", leadDays: 30 },
  { title: "자격증·교육 갱신", category: "일", leadDays: 30 },
];

function localDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(value: string, days: number) {
  const date = localDate(value);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function daysFromToday(value: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((localDate(value).getTime() - today.getTime()) / 86400000);
}

function displayDate(value: string) {
  return localDate(value).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

function icsEscape(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function calendarEvent(item: Reminder) {
  const alertDate = addDays(item.date, -item.leadDays).replaceAll("-", "");
  const description = [`실제 일정: ${displayDate(item.date)}`, item.note, "Aussie Compass에서 저장한 개인 리마인더입니다."].filter(Boolean).join("\n");
  return ["BEGIN:VEVENT", `UID:${item.id}@aussie-compass`, `DTSTART;VALUE=DATE:${alertDate}`, `SUMMARY:${icsEscape(item.title)} 준비`, `DESCRIPTION:${icsEscape(description)}`, "END:VEVENT"].join("\r\n");
}

function downloadCalendar(items: Reminder[], filename: string) {
  const body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Aussie Compass//Life Admin Reminder//KO", "CALSCALE:GREGORIAN", ...items.map(calendarEvent), "END:VCALENDAR"].join("\r\n");
  const url = URL.createObjectURL(new Blob([body], { type: "text/calendar;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function LifeAdminReminder() {
  const [items, setItems] = useState<Reminder[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("생활");
  const [date, setDate] = useState("");
  const [leadDays, setLeadDays] = useState(30);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
      if (Array.isArray(saved)) setItems(saved);
    } catch {
      setStatus("기존 저장 내용을 읽지 못했습니다. 새 일정은 계속 추가할 수 있습니다.");
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, loaded]);

  const sorted = useMemo(() => [...items].sort((a, b) => a.date.localeCompare(b.date)), [items]);

  function choosePreset(preset: typeof presets[number]) {
    setTitle(preset.title);
    setCategory(preset.category);
    setLeadDays(preset.leadDays);
    setStatus(`${preset.title} 예시를 불러왔습니다. 실제 날짜를 입력하세요.`);
  }

  function addReminder(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !date) {
      setStatus("일정 이름과 실제 날짜를 입력해 주세요.");
      return;
    }
    const item: Reminder = { id: crypto.randomUUID(), title: title.trim(), category: category.trim() || "생활", date, leadDays, note: note.trim(), createdAt: new Date().toISOString() };
    setItems((current) => [...current, item]);
    setTitle("");
    setNote("");
    setDate("");
    setStatus("현재 기기에 일정을 저장했습니다.");
  }

  function removeReminder(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
    setStatus("일정을 삭제했습니다.");
  }

  return <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(22rem,1.1fr)]">
    <section aria-labelledby="reminder-form-heading">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Private calendar planner</p>
      <h2 id="reminder-form-heading" className="mt-2 text-2xl font-semibold text-navy">놓치기 쉬운 날짜를 먼저 적어두세요.</h2>
      <p className="mt-3 text-sm leading-6 text-muted">아래 예시는 시작점입니다. 날짜와 갱신 조건은 반드시 발급기관·계약서의 최신 내용을 확인하세요.</p>
      <div className="mt-5 flex flex-wrap gap-2" aria-label="일정 예시">{presets.map((preset) => <button key={preset.title} type="button" onClick={() => choosePreset(preset)} className="min-h-10 border border-border bg-white px-3 text-sm font-medium text-navy hover:border-gold">{preset.title}</button>)}</div>

      <form onSubmit={addReminder} className="mt-7 border-t border-navy/20 pt-6">
        <label className="block text-sm font-semibold text-navy">일정 이름<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="예: 비자 만료 확인" maxLength={80} className="mt-2 min-h-12 w-full border border-border bg-white px-3 font-normal outline-none focus:border-gold" /></label>
        <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold text-navy">분류<input value={category} onChange={(event) => setCategory(event.target.value)} maxLength={30} className="mt-2 min-h-12 w-full border border-border bg-white px-3 font-normal outline-none focus:border-gold" /></label><label className="block text-sm font-semibold text-navy">실제 날짜<input type="date" value={date} onInput={(event) => setDate(event.currentTarget.value)} onChange={(event) => setDate(event.target.value)} className="mt-2 min-h-12 w-full border border-border bg-white px-3 font-normal outline-none focus:border-gold" /></label></div>
        <label className="mt-5 block text-sm font-semibold text-navy">며칠 전에 준비할까요?<select value={leadDays} onChange={(event) => setLeadDays(Number(event.target.value))} className="mt-2 min-h-12 w-full border border-border bg-white px-3 font-normal outline-none focus:border-gold"><option value={7}>7일 전</option><option value={14}>14일 전</option><option value={30}>30일 전</option><option value={45}>45일 전</option><option value={60}>60일 전</option><option value={90}>90일 전</option><option value={180}>180일 전</option></select></label>
        <label className="mt-5 block text-sm font-semibold text-navy">메모 <span className="font-normal text-muted">(선택)</span><textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={300} rows={3} placeholder="예: 공식 계정에서 조건 확인" className="mt-2 w-full resize-y border border-border bg-white p-3 font-normal leading-6 outline-none focus:border-gold" /></label>
        <p className="mt-3 border-l-2 border-gold pl-3 text-xs leading-5 text-muted">여권번호, 비자번호, 차량 VIN, 보험번호 같은 식별정보는 입력하지 마세요.</p>
        <button type="submit" className="mt-5 min-h-12 bg-navy px-5 text-sm font-semibold text-white hover:bg-navy-light">이 기기에 일정 저장</button>
      </form>
      <p className="mt-3 min-h-5 text-xs text-muted" aria-live="polite">{status}</p>
    </section>

    <section aria-labelledby="saved-reminders-heading" className="border-t-2 border-navy bg-white p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono text-xs text-gold">{String(sorted.length).padStart(2, "0")} SAVED</p><h2 id="saved-reminders-heading" className="mt-2 text-2xl font-semibold text-navy">다가오는 일정</h2></div>{sorted.length > 0 && <button type="button" onClick={() => downloadCalendar(sorted, "aussie-compass-reminders.ics")} className="min-h-11 border-b-2 border-gold text-sm font-semibold text-navy">전체 캘린더 저장</button>}</div>
      {!sorted.length ? <div className="mt-8 border-y border-border py-10 text-center"><p className="font-semibold text-navy">아직 저장한 일정이 없습니다.</p><p className="mt-2 text-sm leading-6 text-muted">왼쪽에서 날짜를 추가하면 가장 가까운 순서로 정리됩니다.</p></div> : <ol className="mt-6">{sorted.map((item, index) => {
        const remaining = daysFromToday(item.date);
        const preparationDate = addDays(item.date, -item.leadDays);
        return <li key={item.id} className="border-t border-border py-5 first:border-navy/20"><div className="flex gap-4"><span className="font-mono text-xs text-gold">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{item.category}</span><h3 className="mt-1 text-lg font-semibold text-navy">{item.title}</h3></div><span className={`text-xs font-semibold ${remaining < 0 ? "text-red-700" : remaining <= item.leadDays ? "text-gold" : "text-muted"}`}>{remaining < 0 ? `${Math.abs(remaining)}일 지남` : remaining === 0 ? "오늘" : `${remaining}일 남음`}</span></div><dl className="mt-3 grid gap-1 text-sm sm:grid-cols-2"><div><dt className="inline text-muted">준비 시작 </dt><dd className="inline font-medium text-navy">{displayDate(preparationDate)}</dd></div><div><dt className="inline text-muted">실제 날짜 </dt><dd className="inline font-medium text-navy">{displayDate(item.date)}</dd></div></dl>{item.note && <p className="mt-3 text-sm leading-6 text-muted">{item.note}</p>}<div className="mt-4 flex gap-5"><button type="button" onClick={() => downloadCalendar([item], `${item.date}-${item.title}.ics`)} className="min-h-10 border-b border-gold text-xs font-semibold text-navy">캘린더에 추가</button><button type="button" onClick={() => removeReminder(item.id)} className="min-h-10 text-xs font-medium text-muted hover:text-red-700">삭제</button></div></div></div></li>;
      })}</ol>}
      <p className="mt-6 border-t border-border pt-4 text-xs leading-5 text-muted">캘린더 파일을 저장한 뒤 휴대폰 캘린더에서 열어 추가하세요. 이 사이트가 푸시 알림을 보내거나 캘린더 계정에 직접 접근하지는 않습니다.</p>
    </section>
  </div>;
}
