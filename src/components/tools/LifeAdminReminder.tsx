"use client";
import { useState, type FormEvent } from "react";
import { addDays, allowedLeadDays, calendarDays, displayDate, parseReminders, reminderCalendar, serializeReminders, validDate, type Reminder } from "@/lib/lifeReminders";
import { useLocalPlan } from "@/lib/useLocalPlan";
const initial: Reminder[] = [];
const presets = [
  { title: "비자 만료 확인", category: "비자", leadDays: 90 }, { title: "여권 만료 확인", category: "신분증", leadDays: 180 },
  { title: "렌트 계약 갱신 결정", category: "주거", leadDays: 45 }, { title: "차량 Rego 갱신", category: "차량", leadDays: 30 },
  { title: "보험 갱신·비교", category: "보험", leadDays: 30 }, { title: "자격증·교육 갱신", category: "일", leadDays: 30 },
];
const inputClass = "mt-2 min-h-12 w-full min-w-0 border border-border bg-white px-3 text-sm font-normal text-navy outline-none focus:border-gold";
export function LifeAdminReminder() {
  const { data: items, update: setItems, storage, saveState, reset } = useLocalPlan("aussie-compass-life-reminders-v1", initial, parseReminders, serializeReminders, { initial: "아직 저장한 일정 없음", reset: "일정과 저장본을 초기화했습니다" });
  const [title, setTitle] = useState(""), [category, setCategory] = useState("생활"), [date, setDate] = useState(""), [leadDays, setLeadDays] = useState(30), [note, setNote] = useState(""), [status, setStatus] = useState("");
  const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date));
  const preparation = validDate(date) ? addDays(date, -leadDays) : null;
  function addReminder(event: FormEvent) {
    event.preventDefault();
    const item: Reminder = { id: crypto.randomUUID(), title: title.trim(), category: category.trim() || "생활", date, leadDays, note: note.trim(), createdAt: new Date().toISOString() };
    if (!parseReminders(JSON.stringify([item]))) { setStatus("일정 이름과 실제 존재하는 날짜, 준비 기간을 확인하세요. 메모는 300자까지 입력할 수 있습니다."); return; }
    if (items.length >= 200) { setStatus("최대 200건입니다. 필요한 기록을 따로 보관한 후 정리하세요."); return; }
    setItems(current => [...current, item]); setTitle(""); setNote(""); setDate(""); setStatus("일정을 화면에 추가했습니다. 저장 상태를 확인하세요. 휴대폰 알림은 아직 설정되지 않았습니다.");
  }
  function downloadCalendar(records: Reminder[], filename: string) {
    try {
      const body = reminderCalendar(records), url = URL.createObjectURL(new Blob([body], { type: "text/calendar;charset=utf-8" }));
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url);
      setStatus("준비 시작일의 종일 일정 파일을 만들었습니다. 캘린더 앱에서 날짜를 확인하고 알림 시간을 직접 설정하세요.");
    } catch { setStatus("캘린더 파일을 만들지 못했습니다. 아래 준비 시작일을 캘린더 앱에 직접 입력하세요."); }
  }
  return <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(22rem,1.1fr)]">
    <section aria-labelledby="reminder-form-heading" className="min-w-0">
      <h2 id="reminder-form-heading" className="text-2xl font-semibold text-navy">놓치기 쉬운 날짜를 먼저 적어두세요.</h2><p className="mt-3 text-sm leading-6 text-muted">아래 예시는 시작점입니다. 날짜와 갱신 조건은 발급기관·계약서의 최신 내용을 확인하세요. 현재 브라우저에만 저장되며 푸시 알림을 보내지 않습니다.</p>
      <p role="status" className="mt-3 text-sm text-navy">{saveState}</p>{storage === "blocked" && <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm leading-6 text-amber-900">기존 저장본을 읽거나 확인하지 못했습니다. 원문을 보존하고 자동 저장을 중지했습니다. 화면에 추가한 일정은 저장되지 않으므로 별도로 보관하세요.</p>}
      <div className="mt-5 flex flex-wrap gap-2" aria-label="일정 예시">{presets.map(preset => <button key={preset.title} type="button" disabled={storage === "loading"} onClick={() => { setTitle(preset.title); setCategory(preset.category); setLeadDays(preset.leadDays); setStatus(`${preset.title} 예시를 불러왔습니다. 실제 날짜를 입력하세요.`); }} className="min-h-11 border border-border bg-white px-3 text-sm font-medium text-navy">{preset.title}</button>)}</div>
      <form onSubmit={addReminder} className="mt-7 border-t border-navy/20 pt-6"><fieldset disabled={storage === "loading"}><legend className="sr-only">일정 입력</legend>
        <label className="block text-sm font-semibold text-navy">일정 이름<input value={title} onChange={event => setTitle(event.target.value)} maxLength={80} className={inputClass} /></label>
        <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="min-w-0 text-sm font-semibold text-navy">분류<input value={category} onChange={event => setCategory(event.target.value)} maxLength={30} className={inputClass} /></label><label className="min-w-0 text-sm font-semibold text-navy">실제 날짜<input type="date" value={date} onChange={event => setDate(event.target.value)} className={inputClass} aria-invalid={Boolean(date) && !validDate(date)} /></label></div>
        <label className="mt-5 block text-sm font-semibold text-navy">며칠 전에 준비할까요?<select value={leadDays} onChange={event => setLeadDays(Number(event.target.value))} className={inputClass}>{allowedLeadDays.map(days => <option key={days} value={days}>{days}일 전</option>)}</select></label>
        {preparation && validDate(preparation) && <p className="mt-3 text-sm leading-6 text-navy">준비 시작일 미리보기: {displayDate(preparation)}{calendarDays(preparation) < 0 && " · 준비 시작일이 지났어요"}</p>}
        <label className="mt-5 block text-sm font-semibold text-navy">메모 (선택)<textarea value={note} onChange={event => setNote(event.target.value)} maxLength={300} rows={3} className="mt-2 w-full resize-y border border-border bg-white p-3 text-sm font-normal leading-6 outline-none focus:border-gold" /></label>
        <p className="mt-3 border-l-2 border-gold pl-3 text-xs leading-5 text-muted">여권번호, 비자번호, 차량 VIN, 보험번호 같은 식별정보는 입력하지 마세요. 추가 버튼을 누르기 전의 입력 내용은 저장되지 않습니다.</p>
        <button type="submit" className="mt-5 min-h-12 bg-navy px-5 text-sm font-semibold text-white">이 기기에 일정 저장</button>
      </fieldset></form><p className="mt-3 min-h-5 text-sm leading-6 text-muted" aria-live="polite">{status}</p>
    </section>
    <section aria-labelledby="saved-reminders-heading" className="min-w-0 border-t-2 border-navy bg-white p-5 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4"><h2 id="saved-reminders-heading" className="text-2xl font-semibold text-navy">이 화면의 일정 · {sorted.length}건</h2>{sorted.length > 0 && <button type="button" onClick={() => downloadCalendar(sorted, "hoju-compass-preparation-dates.ics")} className="min-h-11 border-b-2 border-gold text-sm font-semibold text-navy">전체 준비일 파일 다운로드</button>}</div>
      <p className="mt-3 text-sm leading-6 text-muted">파일에는 아래 준비 시작일의 종일 일정이 들어갑니다. 실제 마감일은 설명에만 적히며 별도 일정으로 추가되지 않습니다. 다운로드만으로 캘린더 등록이나 휴대폰 알림이 켜지지 않습니다.</p>
      {!sorted.length ? <p className="mt-8 border-y border-border py-8 text-sm text-muted">아직 화면에 추가한 일정이 없습니다.</p> : <ol className="mt-6">{sorted.map(item => {
        const remaining = calendarDays(item.date), prep = addDays(item.date, -item.leadDays), pastPreparation = calendarDays(prep) < 0;
        return <li key={item.id} className="border-t border-border py-5"><div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><span className="break-words text-xs text-muted">{item.category}</span><h3 className="mt-1 break-words text-lg font-semibold text-navy">{item.title}</h3></div><span className={`text-xs font-semibold ${remaining < 0 ? "text-red-700" : "text-muted"}`}>{remaining < 0 ? `${Math.abs(remaining)}일 지남` : remaining === 0 ? "오늘" : `${remaining}일 남음`}</span></div>
          <dl className="mt-3 space-y-1 text-sm"><div><dt className="inline text-muted">내보낼 준비 시작일 </dt><dd className="inline font-medium text-navy">{displayDate(prep)}</dd></div><div><dt className="inline text-muted">실제 날짜 </dt><dd className="inline font-medium text-navy">{displayDate(item.date)}</dd></div></dl>
          {pastPreparation && <p className="mt-3 text-sm leading-6 text-amber-800">준비 시작일이 지났어요. 파일도 이 과거 날짜로 만들어집니다. 필요한 알림은 캘린더 앱에서 직접 조정하세요.</p>}
          {item.note && <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-muted">{item.note}</p>}
          <div className="mt-4 flex flex-wrap gap-5"><button type="button" onClick={() => downloadCalendar([item], `${item.date}-preparation.ics`)} className="min-h-11 border-b border-gold text-xs font-semibold text-navy">준비일 파일 다운로드</button><button type="button" onClick={() => { if (window.confirm("이 일정을 지울까요?")) { setItems(current => current.filter(r => r.id !== item.id)); setStatus("화면에서 일정을 제거했습니다. 저장 상태를 확인하세요."); } }} className="min-h-11 text-xs font-medium text-muted">삭제</button></div>
        </li>;
      })}</ol>}
      <p className="mt-6 border-t border-border pt-4 text-xs leading-6 text-muted">현재 브라우저 저장과 캘린더 파일은 별개입니다. 캘린더 앱에서 파일을 열고 날짜·알림 시간을 확인하세요. 캘린더 계정에 직접 접근하지 않습니다.</p>
      <button type="button" disabled={storage === "loading"} onClick={() => { if (window.confirm("이 브라우저의 모든 일정과 저장본을 지울까요?")) reset(); }} className="mt-4 min-h-11 border border-border px-4 text-sm text-navy">모든 일정 초기화</button>
    </section>
  </div>;
}
