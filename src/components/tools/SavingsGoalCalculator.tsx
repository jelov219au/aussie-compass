"use client";

import { useMemo, useState } from "react";
import { amount, frequencyLabels, money, parseSavings, periods, savingsErrors, savingsResult, serializeSavings, type SavingsData, type SavingsFrequency } from "@/lib/personalPlans";
import { useLocalPlan } from "@/lib/useLocalPlan";

const STORAGE_KEY = "aussie-compass-savings-goal-v1";
const initialData: SavingsData = { goalName: "Emergency fund", target: 10000, starting: 1000, contribution: 150, frequency: "weekly", annualRate: 0, targetMonths: 12, mode: "timeline", checkIns: [] };
const inputClass = "mt-1.5 min-h-11 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-navy outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/15";
const escapeCalendarText = (value: string) => value.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");

export function SavingsGoalCalculator() {
  const { data, update, reset, storage, saveState } = useLocalPlan(STORAGE_KEY, initialData, parseSavings, serializeSavings);
  const [checkInAmount, setCheckInAmount] = useState("");
  const [message, setMessage] = useState("");
  const result = savingsResult(data);
  const errors = savingsErrors(data);
  const target = amount(data.target), starting = amount(data.starting);
  const progress = target !== null && target > 0 && starting !== null ? Math.min(100, starting / target * 100) : null;
  const setField = <K extends keyof SavingsData>(field: K, value: SavingsData[K]) => update(current => ({ ...current, [field]: value }));
  const nextSavingsDate = useMemo(() => {
    const base = data.checkIns[0]?.date ? new Date(data.checkIns[0].date) : new Date();
    if (data.frequency === "monthly") base.setMonth(base.getMonth() + 1);
    else base.setDate(base.getDate() + (data.frequency === "fortnightly" ? 14 : 7));
    return base;
  }, [data.checkIns, data.frequency]);
  const recordSaving = () => {
    const deposited = amount(checkInAmount);
    if (deposited === null || deposited <= 0) { setMessage("실제로 저축한 금액을 0보다 큰 유효한 숫자로 입력하세요."); return; }
    if (starting === null || starting + deposited > 1e12) { setMessage("현재 모은 금액을 먼저 확인하세요. 합계는 1조 AUD 이하여야 합니다."); return; }
    update(current => ({ ...current, starting: starting + deposited, checkIns: [{ id: `saving-${crypto.randomUUID()}`, amount: deposited, date: new Date().toISOString() }, ...current.checkIns].slice(0, 100) }));
    setCheckInAmount("");
    setMessage(`${money(deposited)} 기록을 화면에 반영했습니다. 저장 상태도 확인하세요.`);
  };
  const downloadReminder = () => {
    const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const rule = data.frequency === "monthly" ? "FREQ=MONTHLY" : data.frequency === "fortnightly" ? "FREQ=WEEKLY;INTERVAL=2" : "FREQ=WEEKLY";
    const content = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Hoju Compass//Savings Reminder//KO", "BEGIN:VEVENT", `UID:savings-${crypto.randomUUID()}@hojucompass.com`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(nextSavingsDate)}`, `RRULE:${rule}`, `SUMMARY:${escapeCalendarText(data.goalName || "Savings goal")} 저축하기`, `DESCRIPTION:Hoju Compass에서 저축 진행 상황을 기록하세요. ${escapeCalendarText(window.location.href)}`, "DURATION:PT15M", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/calendar;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "hoju-compass-savings-reminder.ics"; anchor.click(); URL.revokeObjectURL(url);
    setMessage("반복 리마인더 파일을 만들었습니다. 캘린더에서 열어 날짜를 확인하고 추가하세요.");
  };
  const numberField = (field: "target" | "starting" | "contribution" | "targetMonths" | "annualRate", label: string) => <label className={`text-sm font-medium text-navy ${field === "annualRate" ? "sm:col-span-2" : ""}`}>{label}<input className={inputClass} inputMode={field === "targetMonths" ? "numeric" : "decimal"} value={data[field]} onChange={event => setField(field, event.target.value)} aria-invalid={Boolean(errors[field])} aria-describedby={errors[field] ? `savings-error-${field}` : undefined} />{errors[field] && <span id={`savings-error-${field}`} className="mt-1 block text-xs font-normal text-rose-700">{errors[field]}</span>}</label>;

  return <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.72fr)]">
    <section className="min-w-0 rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7" aria-labelledby="savings-input-heading">
      <h2 id="savings-input-heading" className="text-xl font-semibold text-navy">저축 목표 설정</h2>
      <p className="mt-2 text-sm leading-6 text-muted">처음 보이는 목표 $10,000·현재 $1,000·매주 $150은 계산용 예시입니다. 권장 저축액이나 평균 금액이 아닙니다. 저장본이 있으면 본인의 값으로 불러옵니다.</p>
      <p className="mt-2 text-sm font-medium text-navy" role="status">{saveState}</p>
      {storage === "blocked" && <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm leading-6 text-amber-900">기존 저장본을 읽거나 확인하지 못해 원본을 그대로 두었습니다. 화면은 예시이며 변경해도 자동 저장하지 않습니다. 기존 자료를 따로 보관한 뒤 필요할 때만 초기화하세요.</p>}
      <p className="mt-2 text-xs leading-5 text-muted">현재 브라우저에만 저장됩니다. 빈칸이나 잘못된 값이 있으면 마지막 정상 저장본을 유지합니다. 숨겨진 계산 방식의 입력도 포함하므로 저장 보류 시 두 방식을 확인하세요. 미완료 변경은 새로고침하면 사라집니다.</p>
      <fieldset disabled={storage === "loading"}>
        <legend className="sr-only">저축 계획 입력과 기록</legend>
        <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl bg-surface p-1" role="group" aria-label="계산 방식">
          <button type="button" onClick={() => setField("mode", "timeline")} className={`min-h-12 rounded-lg px-3 text-sm font-semibold ${data.mode === "timeline" ? "bg-white text-navy shadow-sm" : "text-muted"}`} aria-pressed={data.mode === "timeline"}>언제 달성할까?</button>
          <button type="button" onClick={() => setField("mode", "required")} className={`min-h-12 rounded-lg px-3 text-sm font-semibold ${data.mode === "required" ? "bg-white text-navy shadow-sm" : "text-muted"}`} aria-pressed={data.mode === "required"}>얼마씩 모아야 할까?</button>
        </div>
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-navy sm:col-span-2">목표 이름<input className={inputClass} maxLength={100} value={data.goalName} onChange={event => setField("goalName", event.target.value)} placeholder="Emergency fund" /></label>
          {numberField("target", "목표 금액 (AUD)")}{numberField("starting", "현재 모은 금액 (AUD)")}
          {data.mode === "timeline" ? numberField("contribution", "정기 저축액 (AUD)") : numberField("targetMonths", "목표 기간 (개월 · 1~600)")}
          <label className="text-sm font-medium text-navy">저축 주기<select className={inputClass} value={data.frequency} onChange={event => setField("frequency", event.target.value as SavingsFrequency)}><option value="weekly">매주</option><option value="fortnightly">격주</option><option value="monthly">매월</option></select></label>
          {numberField("annualRate", "가정 연이율 (% · 0~20)")}
        </div>
        <p className="mt-2 text-xs leading-5 text-muted">새 계획은 이자 없는 0%로 시작합니다. 이율을 모르면 0을 입력하세요. 저장해 둔 이율은 그대로 불러옵니다.</p>
        <section className="mt-8 border-t border-border pt-7" aria-labelledby="savings-project-heading">
          <h2 id="savings-project-heading" className="text-xl font-semibold text-navy">이미 저축한 금액 기록하기</h2>
          <p className="mt-2 text-sm leading-6 text-muted">이 버튼은 은행 송금을 실행하지 않습니다. 실제로 옮긴 뒤 기록하면 현재 모은 금액에 더해집니다. 위 잔액에 이미 포함한 돈은 다시 기록하지 마세요. 인출했다면 현재 모은 금액을 직접 고쳐 다시 계산하세요.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"><label className="text-sm font-medium text-navy">이번에 저축한 금액 (AUD)<input className={inputClass} inputMode="decimal" value={checkInAmount} onChange={event => setCheckInAmount(event.target.value)} /></label><button type="button" onClick={recordSaving} className="min-h-11 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light sm:mt-6">저축 완료 기록</button></div>
          <p className="mt-3 min-h-5 text-sm text-muted" aria-live="polite">{message}</p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-surface p-4"><dt className="text-xs text-muted">보관 중인 최대 100건 합계 · {data.checkIns.length}건</dt><dd className="mt-1 break-all text-xl font-semibold text-navy">{money(data.checkIns.reduce((sum, item) => sum + item.amount, 0))}</dd><p className="mt-2 text-xs text-muted">전체 이력 합계나 현재 잔액과 다릅니다.</p></div><div className="rounded-xl bg-surface p-4"><dt className="text-xs text-muted">다음 기록일 참고 · 최근 기록일 기준</dt><dd className="mt-1 text-base font-semibold text-navy">{nextSavingsDate.toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" })}</dd><p className="mt-2 text-xs text-muted">기록이 없으면 오늘부터 한 주기 뒤</p></div></dl>
          <button type="button" onClick={downloadReminder} className="mt-4 min-h-11 rounded-lg border border-navy px-4 py-2 text-sm font-semibold text-navy hover:bg-surface">캘린더 반복 리마인더 추가</button>
          {data.checkIns.length > 0 && <div className="mt-6"><h3 className="text-sm font-semibold text-navy">최근 저축 기록</h3><ul className="mt-2 divide-y divide-border rounded-xl border border-border">{data.checkIns.slice(0, 5).map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"><span className="text-muted">{new Date(item.date).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" })}</span><span className="break-all font-semibold text-navy">+{money(item.amount)}</span></li>)}</ul></div>}
        </section>
        <button type="button" onClick={() => { if (window.confirm("이 브라우저의 저축 계획과 기록을 지우고 예시로 초기화할까요?")) { if (reset()) { setCheckInAmount(""); setMessage(""); } } }} className="mt-6 min-h-11 rounded-lg border border-border px-4 py-2 text-sm font-medium text-navy">저장본 지우고 예시로 초기화</button>
      </fieldset>
    </section>
    <aside id="savings-results" className="min-w-0 rounded-2xl bg-navy p-6 text-white shadow-lg sm:p-8 lg:sticky lg:top-24" aria-labelledby="savings-result-heading">
      <p className="break-words text-sm font-semibold text-gold">{data.goalName || "Savings goal"}</p><h2 id="savings-result-heading" className="mt-2 text-2xl font-semibold">입력 기준 저축 계획</h2>
      {progress !== null && <div className="mt-6"><div className="flex justify-between gap-3 text-sm text-white/75"><span>현재 잔액 기준 진행률</span><span>{Math.round(progress)}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-gold" style={{ width: `${progress}%` }} /></div><p className="mt-2 break-all text-sm text-white/75">{money(starting!)} / {money(target!)}</p></div>}
      {result.state === "reached" ? <dl className="mt-7 space-y-3">
        <div className="rounded-xl bg-white/8 p-5"><dt className="text-sm text-white/75">{result.count === 0 ? "현재 잔액으로 목표 달성" : data.mode === "required" ? `${frequencyLabels[data.frequency]} 필요한 저축액 · 센트 올림` : "목표까지 필요한 납입 횟수"}</dt><dd className="mt-1 break-all text-3xl font-semibold">{result.count === 0 ? "추가 납입 0회" : data.mode === "required" ? money(result.payment) : `${result.count.toLocaleString("ko-KR")}회`}</dd></div>
        {result.count > 0 && <div className="rounded-xl bg-white/8 p-4"><dt className="text-sm text-white/75">{frequencyLabels[data.frequency]} 주기 말 납입</dt><dd className="mt-1 font-semibold">{result.count.toLocaleString("ko-KR")}회 · 약 {(result.count / periods[data.frequency] * 12).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}개월</dd><p className="mt-2 text-xs leading-5 text-white/70">달력상 납입일에 따라 기간이 달라질 수 있습니다. 확정 달성일이 아닙니다.</p></div>}
        <div className="grid gap-3 sm:grid-cols-2"><div className="min-w-0 rounded-xl bg-white/8 p-4"><dt className="text-sm text-white/75">마지막 납입 후 예상 잔액</dt><dd className="mt-1 break-all font-semibold">{money(result.final)}</dd></div><div className="min-w-0 rounded-xl bg-white/8 p-4"><dt className="text-sm text-white/75">가정에 따른 이자</dt><dd className="mt-1 break-all font-semibold">{money(result.interest)}</dd></div></div>
      </dl> : <div className="mt-7 rounded-xl border border-amber-200/30 bg-amber-200/10 p-5"><p className="font-semibold">{result.state === "incomplete" ? "입력을 마치면 계산합니다" : result.state === "no-growth" ? "현재 조건으로 잔액이 늘지 않습니다" : "계산 범위인 100년 안에 도달하지 않습니다"}</p><p className="mt-2 text-sm leading-6 text-white/80">{result.state === "incomplete" ? "빈칸과 오류를 확인하세요. 0원인 항목에는 0을 직접 입력하세요." : result.state === "no-growth" ? "저축액이 0이고 이자가 붙을 조건도 없어 목표까지 걸리는 시간을 정할 수 없습니다." : "목표·현재 잔액·정기 저축액을 다시 확인하세요."}</p></div>}
      <p className="mt-6 text-xs leading-5 text-white/70">각 주기 말에 납입하고 연이율은 계속 같다고 가정합니다. 명목 연이율을 연간 주기 수(52·26·12)로 나누어 계산하며 실제 은행의 일별 이자 방식과 다를 수 있습니다. 세금·수수료·인플레이션은 반영하지 않습니다. 목표 기간 모드에서는 그 기간 안의 완전한 납입 주기 수를 사용합니다.</p>
    </aside>
  </div>;
}
