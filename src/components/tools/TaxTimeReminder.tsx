"use client";

import { useEffect, useState } from "react";
import { calendarDays, todayDate } from "@/lib/lifeReminders";
import { financialYearLabel, financialYearPeriod } from "@/lib/taxPrepStorage";
import { defaultTaxYear, parseTaxYear, taxTimeCalendar, taxTimeEvents, type TaxTimePurpose } from "@/lib/taxTimeCalendar";

export function TaxTimeReminder({ purpose = "recent-return" }: { purpose?: TaxTimePurpose }) {
  const [year, setYear] = useState(() => String(defaultTaxYear(purpose)));
  const [today, setToday] = useState("");
  const [message, setMessage] = useState("");
  const [fallback, setFallback] = useState<string | null>(null);
  useEffect(() => { const localToday = todayDate(); setToday(localToday); setYear(String(defaultTaxYear(purpose, localToday))); }, [purpose]);
  const validYear = parseTaxYear(year), events = taxTimeEvents(year);
  function download() {
    if (validYear === null) { setMessage("2020~2100 사이의 시작 연도를 정수로 입력하세요."); return; }
    const body = taxTimeCalendar(year);
    try {
      const url = URL.createObjectURL(new Blob([body], { type: "text/calendar;charset=utf-8" }));
      try { const link = document.createElement("a"); link.href = url; link.download = `tax-time-${year}-${validYear + 1}.ics`; link.click(); }
      finally { URL.revokeObjectURL(url); }
      setFallback(null); setMessage("파일 다운로드를 요청했습니다. 달력 앱에서 파일을 가져온 뒤 날짜와 알림을 확인하세요. 달력에 자동 등록하지 않습니다.");
    } catch { setFallback(body); setMessage("파일을 내려받지 못했습니다. 아래 내용을 .ics 텍스트 파일로 보관하거나 미리보기 날짜를 달력에 직접 입력하세요."); }
  }
  return <section className="rounded-2xl border border-gold/40 bg-gold/5 p-6 sm:p-8" aria-labelledby="tax-reminder-heading">
    <p className="text-sm font-semibold text-gold">{purpose === "recent-return" ? "최근 종료된 회계연도의 신고 준비" : "현재 진행 중인 장부의 EOFY 준비"}</p>
    <h2 id="tax-reminder-heading" className="mt-2 text-2xl font-semibold text-navy">EOFY 캘린더 리마인더</h2>
    <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">선택한 회계연도가 끝난 해의 7월 25일과 10월 15일에 자료·진행 상황을 점검하는 파일입니다. 임의의 점검일이며 ATO 기한, Tax ready 상태나 준비 완료를 보장하지 않습니다. 실제 개인 신고 기한은 ATO 또는 등록 세무사에게 확인하세요.</p>
    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end"><label className="text-sm font-medium text-navy">대상 회계연도의 시작 연도<input type="number" min="2020" max="2100" step="1" value={year} aria-invalid={validYear === null} aria-describedby="tax-reminder-year-help" onChange={event => { setYear(event.target.value); setMessage(""); setFallback(null); }} className="mt-2 block min-h-11 w-32 rounded-lg border border-border bg-white px-3" /></label><button type="button" disabled={validYear === null} onClick={download} className="min-h-11 rounded-lg bg-navy px-5 text-sm font-semibold text-white disabled:opacity-40">캘린더 파일 받기</button></div>
    <p id="tax-reminder-year-help" className="mt-2 text-sm text-muted">{validYear === null ? "2020~2100 사이의 시작 연도를 정수로 입력하세요." : `${financialYearLabel(validYear)} · ${financialYearPeriod(validYear)}`}</p>
    {events && <ul className="mt-4 grid gap-3 sm:grid-cols-2" aria-label="생성할 일정 미리보기">{events.map(event => <li key={event.id} className="rounded-lg bg-white p-4"><p className="font-semibold text-navy">{event.date} · {event.title}</p><p className="mt-1 text-xs leading-6 text-muted">{today && calendarDays(event.date, today) < 0 ? "이미 지난 날짜입니다. 지금 자료를 확인하고 필요한 점검일을 달력에서 조정하세요." : "임의의 점검일입니다. 달력 앱에서 알림을 직접 설정하세요."}</p></li>)}</ul>}
    <p className="mt-3 text-xs leading-6 text-muted">다운로드 후 달력 앱에서 가져와야 합니다. 웹·설치형 앱의 파일 처리 방식은 기기마다 다를 수 있습니다.</p>
    {message && <p role="status" className="mt-3 text-sm leading-6 text-navy">{message}</p>}
    {fallback !== null && <label className="mt-3 block text-sm text-navy">따로 보관할 캘린더 내용<textarea readOnly value={fallback} rows={6} onFocus={event => event.target.select()} className="mt-2 w-full rounded-lg border border-border p-3 font-mono text-xs" /></label>}
  </section>;
}
