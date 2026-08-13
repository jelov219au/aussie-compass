"use client";

import { useEffect, useMemo, useState } from "react";

type Frequency = "weekly" | "fortnightly" | "monthly";
type GoalMode = "timeline" | "required";
type SavingsData = { goalName: string; target: number; starting: number; contribution: number; frequency: Frequency; annualRate: number; targetMonths: number; mode: GoalMode };

const STORAGE_KEY = "aussie-compass-savings-goal-v1";
const periods: Record<Frequency, number> = { weekly: 52, fortnightly: 26, monthly: 12 };
const labels: Record<Frequency, string> = { weekly: "매주", fortnightly: "격주", monthly: "매월" };
const initialData: SavingsData = { goalName: "Emergency fund", target: 10000, starting: 1000, contribution: 150, frequency: "weekly", annualRate: 4.5, targetMonths: 12, mode: "timeline" };
const inputClass = "mt-1.5 min-h-11 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-navy outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/15";

function currency(value: number) { return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(value); }

function projectBalance(start: number, payment: number, ratePerPeriod: number, count: number) {
  let balance = start;
  for (let index = 0; index < count; index += 1) balance = balance * (1 + ratePerPeriod) + payment;
  return balance;
}

export function SavingsGoalCalculator() {
  const [data, setData] = useState<SavingsData>(initialData);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { try { const stored = localStorage.getItem(STORAGE_KEY); if (stored) setData({ ...initialData, ...JSON.parse(stored) }); } catch {} setLoaded(true); }, []);
  useEffect(() => { if (!loaded) return; const timer = window.setTimeout(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); setSaved(true); window.setTimeout(() => setSaved(false), 1400); } catch {} }, 500); return () => window.clearTimeout(timer); }, [data, loaded]);

  const result = useMemo(() => {
    const target = Math.max(data.target, 0);
    const start = Math.min(Math.max(data.starting, 0), target);
    const perYear = periods[data.frequency];
    const rate = Math.max(data.annualRate, 0) / 100 / perYear;
    if (data.mode === "required") {
      const count = Math.max(1, Math.round(data.targetMonths / 12 * perYear));
      const growth = rate ? Math.pow(1 + rate, count) : 1;
      const factor = rate ? (growth - 1) / rate : count;
      const required = Math.max(0, (target - start * growth) / factor);
      const final = projectBalance(start, required, rate, count);
      return { payment: required, periodsNeeded: count, final, interest: Math.max(0, final - start - required * count), reached: true };
    }
    const payment = Math.max(data.contribution, 0);
    let balance = start;
    let count = 0;
    const maximum = perYear * 100;
    while (balance < target && count < maximum && (payment > 0 || rate > 0)) { balance = balance * (1 + rate) + payment; count += 1; }
    return { payment, periodsNeeded: count, final: balance, interest: Math.max(0, balance - start - payment * count), reached: balance >= target };
  }, [data]);

  const years = result.periodsNeeded / periods[data.frequency];
  const months = Math.ceil(years * 12);
  const targetDate = new Date(); targetDate.setMonth(targetDate.getMonth() + months);
  const progress = Math.min(100, data.target > 0 ? Math.max(0, data.starting) / data.target * 100 : 0);
  const setField = <K extends keyof SavingsData>(field: K, value: SavingsData[K]) => setData((current) => ({ ...current, [field]: value }));

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.72fr)]">
      <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7" aria-labelledby="savings-input-heading">
        <div className="flex items-start justify-between gap-4"><div><h2 id="savings-input-heading" className="text-xl font-semibold text-navy">저축 목표 설정</h2><p className="mt-1 text-sm leading-6 text-muted">금액은 현재 브라우저에만 저장됩니다.</p></div><span className="text-xs text-muted" aria-live="polite">{saved ? "저장됨" : "자동 저장"}</span></div>
        <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl bg-surface p-1" role="group" aria-label="계산 방식"><button type="button" onClick={() => setField("mode", "timeline")} className={`min-h-12 rounded-lg px-3 text-sm font-semibold ${data.mode === "timeline" ? "bg-white text-navy shadow-sm" : "text-muted"}`} aria-pressed={data.mode === "timeline"}>언제 달성할까?</button><button type="button" onClick={() => setField("mode", "required")} className={`min-h-12 rounded-lg px-3 text-sm font-semibold ${data.mode === "required" ? "bg-white text-navy shadow-sm" : "text-muted"}`} aria-pressed={data.mode === "required"}>얼마씩 모아야 할까?</button></div>
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-navy sm:col-span-2">목표 이름<input className={inputClass} value={data.goalName} onChange={(e) => setField("goalName", e.target.value)} placeholder="Emergency fund" /></label>
          <label className="text-sm font-medium text-navy">목표 금액 (AUD)<input className={inputClass} type="number" min="0" step="100" value={data.target} onChange={(e) => setField("target", Number(e.target.value))} /></label>
          <label className="text-sm font-medium text-navy">현재 모은 금액<input className={inputClass} type="number" min="0" step="100" value={data.starting} onChange={(e) => setField("starting", Number(e.target.value))} /></label>
          {data.mode === "timeline" ? <label className="text-sm font-medium text-navy">정기 저축액<input className={inputClass} type="number" min="0" step="10" value={data.contribution} onChange={(e) => setField("contribution", Number(e.target.value))} /></label> : <label className="text-sm font-medium text-navy">목표 기간 (개월)<input className={inputClass} type="number" min="1" max="600" value={data.targetMonths} onChange={(e) => setField("targetMonths", Number(e.target.value))} /></label>}
          <label className="text-sm font-medium text-navy">저축 주기<select className={inputClass} value={data.frequency} onChange={(e) => setField("frequency", e.target.value as Frequency)}><option value="weekly">매주</option><option value="fortnightly">격주</option><option value="monthly">매월</option></select></label>
          <label className="text-sm font-medium text-navy sm:col-span-2">예상 연이율 (%)<input className={inputClass} type="number" min="0" max="20" step="0.1" value={data.annualRate} onChange={(e) => setField("annualRate", Number(e.target.value))} /><span className="mt-1 block text-xs font-normal leading-5 text-muted">저축 계좌 이율을 모르면 0%로 입력해 보수적으로 계산하세요.</span></label>
        </div>
      </section>

      <aside id="savings-results" className="rounded-2xl bg-navy p-6 text-white shadow-lg sm:p-8 lg:sticky lg:top-24" aria-labelledby="savings-result-heading">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gold">{data.goalName || "Savings goal"}</p><h2 id="savings-result-heading" className="mt-2 text-2xl font-semibold">저축 계획</h2>
        <div className="mt-6"><div className="flex justify-between gap-3 text-sm text-white/65"><span>현재 진행률</span><span>{Math.round(progress)}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-gold" style={{ width: `${progress}%` }} /></div><p className="mt-2 text-sm text-white/60">{currency(data.starting)} / {currency(data.target)}</p></div>
        {result.reached ? <dl className="mt-7 space-y-3"><div className="rounded-xl bg-white/8 p-5"><dt className="text-sm text-white/65">{data.mode === "required" ? `${labels[data.frequency]} 필요한 저축액` : "예상 달성 기간"}</dt><dd className="mt-1 text-3xl font-semibold">{data.mode === "required" ? currency(result.payment) : months < 12 ? `${months}개월` : `${Math.floor(months / 12)}년 ${months % 12}개월`}</dd></div><div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-white/8 p-4"><dt className="text-sm text-white/65">예상 달성일</dt><dd className="mt-1 font-semibold">{targetDate.toLocaleDateString("ko-KR", { year: "numeric", month: "short" })}</dd></div><div className="rounded-xl bg-white/8 p-4"><dt className="text-sm text-white/65">예상 이자</dt><dd className="mt-1 font-semibold">{currency(result.interest)}</dd></div></div></dl> : <div className="mt-7 rounded-xl border border-rose-300/30 bg-rose-300/10 p-5"><p className="font-semibold">목표를 계산할 수 없습니다.</p><p className="mt-2 text-sm leading-6 text-white/70">정기 저축액 또는 이율을 입력해 주세요.</p></div>}
        <p className="mt-6 text-xs leading-5 text-white/50">이 결과는 입력한 금액과 고정 이율을 사용한 예상치이며, 인플레이션·세금·수수료는 반영하지 않습니다.</p>
      </aside>
    </div>
  );
}
