"use client";

import { useEffect, useMemo, useState } from "react";

type Frequency = "weekly" | "monthly" | "yearly";
type Expense = { id: string; name: string; amount: number; frequency: Frequency; removable?: boolean };
type BudgetData = { income: number; incomeFrequency: Frequency; expenses: Expense[] };

const STORAGE_KEY = "aussie-compass-living-budget-v1";
const weeksPerYear = 52;
const monthsPerYear = 12;
const defaultExpenses: Expense[] = [
  { id: "housing", name: "주거비", amount: 350, frequency: "weekly" },
  { id: "groceries", name: "식료품", amount: 120, frequency: "weekly" },
  { id: "transport", name: "교통", amount: 50, frequency: "weekly" },
  { id: "utilities", name: "전기·가스·수도", amount: 150, frequency: "monthly" },
  { id: "phone", name: "통신비", amount: 50, frequency: "monthly" },
  { id: "insurance", name: "보험·의료", amount: 80, frequency: "monthly" },
  { id: "lifestyle", name: "외식·여가", amount: 80, frequency: "weekly" },
  { id: "other", name: "기타", amount: 30, frequency: "weekly" },
];
const emptyBudget: BudgetData = { income: 1200, incomeFrequency: "weekly", expenses: defaultExpenses };
const inputClass = "min-h-11 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-navy outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/15";

function toWeekly(amount: number, frequency: Frequency) {
  if (frequency === "monthly") return amount * monthsPerYear / weeksPerYear;
  if (frequency === "yearly") return amount / weeksPerYear;
  return amount;
}

function currency(value: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(value);
}

export function CostOfLivingCalculator() {
  const [budget, setBudget] = useState<BudgetData>(emptyBudget);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as BudgetData;
        if (Array.isArray(parsed.expenses)) setBudget(parsed);
      }
    } catch {
      // Keep the calculator available when local storage is unavailable.
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(budget));
        setSaved(true);
        window.setTimeout(() => setSaved(false), 1500);
      } catch {
        // Calculations still work without persistence.
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [budget, loaded]);

  const results = useMemo(() => {
    const weeklyExpenses = budget.expenses.reduce((sum, item) => sum + toWeekly(Math.max(0, item.amount || 0), item.frequency), 0);
    const weeklyIncome = toWeekly(Math.max(0, budget.income || 0), budget.incomeFrequency);
    return {
      weeklyExpenses,
      monthlyExpenses: weeklyExpenses * weeksPerYear / monthsPerYear,
      yearlyExpenses: weeklyExpenses * weeksPerYear,
      weeklyIncome,
      weeklyBalance: weeklyIncome - weeklyExpenses,
    };
  }, [budget]);

  const updateExpense = (id: string, field: "name" | "amount" | "frequency", value: string | number) =>
    setBudget((current) => ({ ...current, expenses: current.expenses.map((item) => item.id === id ? { ...item, [field]: value } : item) }));

  const addExpense = () => setBudget((current) => ({ ...current, expenses: [...current.expenses, { id: `custom-${Date.now()}`, name: "새 항목", amount: 0, frequency: "monthly", removable: true }] }));
  const resetBudget = () => {
    if (!window.confirm("입력한 생활비를 기본 예시로 되돌릴까요?")) return;
    setBudget({ ...emptyBudget, expenses: defaultExpenses.map((item) => ({ ...item })) });
    window.localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.72fr)]">
      <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7" aria-labelledby="budget-input-heading">
        <div className="flex items-start justify-between gap-4"><div><h2 id="budget-input-heading" className="text-xl font-semibold text-navy">수입과 생활비</h2><p className="mt-1 text-sm leading-6 text-muted">금액과 결제 주기를 실제 상황에 맞게 바꾸세요.</p></div><span className="min-w-16 text-right text-xs text-muted" aria-live="polite">{saved ? "저장됨" : "자동 저장"}</span></div>

        <fieldset className="mt-7 rounded-xl bg-surface p-4">
          <legend className="px-1 text-base font-semibold text-navy">세후 수입</legend>
          <div className="mt-2 grid grid-cols-[minmax(0,1fr)_110px] gap-3">
            <label className="text-sm font-medium text-navy">금액 (AUD)<input className={`${inputClass} mt-1.5`} type="number" min="0" step="10" value={budget.income} onChange={(e) => setBudget((current) => ({ ...current, income: Number(e.target.value) }))} /></label>
            <label className="text-sm font-medium text-navy">주기<select className={`${inputClass} mt-1.5`} value={budget.incomeFrequency} onChange={(e) => setBudget((current) => ({ ...current, incomeFrequency: e.target.value as Frequency }))}><option value="weekly">매주</option><option value="monthly">매월</option><option value="yearly">매년</option></select></label>
          </div>
          <p className="mt-3 text-xs leading-5 text-muted">통장에 실제로 들어오는 세후 금액을 입력하면 남는 예산을 더 정확히 볼 수 있습니다.</p>
        </fieldset>

        <fieldset className="mt-8">
          <legend className="text-base font-semibold text-navy">지출 항목</legend>
          <div className="mt-4 space-y-3">
            {budget.expenses.map((item) => (
              <div key={item.id} className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-[minmax(130px,1fr)_130px_105px_auto] sm:items-end">
                <label className="text-xs font-medium text-muted">항목<input className={`${inputClass} mt-1`} value={item.name} onChange={(e) => updateExpense(item.id, "name", e.target.value)} /></label>
                <label className="text-xs font-medium text-muted">금액 (AUD)<input className={`${inputClass} mt-1`} type="number" min="0" step="5" value={item.amount} onChange={(e) => updateExpense(item.id, "amount", Number(e.target.value))} /></label>
                <label className="text-xs font-medium text-muted">주기<select className={`${inputClass} mt-1`} value={item.frequency} onChange={(e) => updateExpense(item.id, "frequency", e.target.value as Frequency)}><option value="weekly">매주</option><option value="monthly">매월</option><option value="yearly">매년</option></select></label>
                <button type="button" disabled={!item.removable} onClick={() => setBudget((current) => ({ ...current, expenses: current.expenses.filter((expense) => expense.id !== item.id) }))} className="min-h-11 rounded-lg px-3 text-sm text-muted underline underline-offset-4 disabled:invisible" aria-label={`${item.name} 삭제`}>삭제</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addExpense} className="mt-4 min-h-11 rounded-lg border border-navy px-4 py-2 text-sm font-semibold text-navy hover:bg-surface">+ 지출 항목 추가</button>
        </fieldset>
      </section>

      <aside id="living-budget-results" className="rounded-2xl bg-navy p-6 text-white shadow-lg sm:p-8 lg:sticky lg:top-24" aria-labelledby="budget-results-heading">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gold">예상 생활 예산</p>
        <h2 id="budget-results-heading" className="mt-2 text-2xl font-semibold">생활비 요약</h2>
        <dl className="mt-7 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <div className="rounded-xl bg-white/8 p-4"><dt className="text-sm text-white/65">주간 생활비</dt><dd className="mt-1 text-2xl font-semibold">{currency(results.weeklyExpenses)}</dd></div>
          <div className="rounded-xl bg-white/8 p-4"><dt className="text-sm text-white/65">월간 생활비</dt><dd className="mt-1 text-2xl font-semibold">{currency(results.monthlyExpenses)}</dd></div>
          <div className="rounded-xl bg-white/8 p-4"><dt className="text-sm text-white/65">연간 생활비</dt><dd className="mt-1 text-2xl font-semibold">{currency(results.yearlyExpenses)}</dd></div>
        </dl>
        <div className={`mt-5 rounded-xl border p-5 ${results.weeklyBalance >= 0 ? "border-emerald-300/30 bg-emerald-300/10" : "border-rose-300/30 bg-rose-300/10"}`}>
          <p className="text-sm text-white/70">수입에서 생활비를 뺀 주간 잔액</p><p className="mt-1 text-3xl font-semibold">{currency(results.weeklyBalance)}</p><p className="mt-2 text-sm leading-6 text-white/70">{results.weeklyBalance >= 0 ? `수입의 ${results.weeklyIncome ? Math.round(results.weeklyBalance / results.weeklyIncome * 100) : 0}%가 남습니다.` : "현재 입력 기준으로 지출이 수입보다 많습니다."}</p>
        </div>
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-white">항목별 주간 환산</h3>
          <ul className="mt-3 space-y-2 text-sm">{budget.expenses.filter((item) => item.amount > 0).sort((a, b) => toWeekly(b.amount, b.frequency) - toWeekly(a.amount, a.frequency)).map((item) => <li key={item.id} className="flex items-center justify-between gap-4"><span className="truncate text-white/70">{item.name}</span><span className="shrink-0 font-medium">{currency(toWeekly(item.amount, item.frequency))}</span></li>)}</ul>
        </div>
        <div className="living-budget-print-hide mt-7 flex flex-wrap gap-3"><button type="button" onClick={() => window.print()} className="min-h-11 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy hover:bg-gold/90">결과 인쇄</button><button type="button" onClick={resetBudget} className="min-h-11 rounded-lg border border-white/25 px-4 py-2 text-sm font-medium text-white hover:bg-white/10">기본값으로 초기화</button></div>
        <p className="mt-5 text-xs leading-5 text-white/50">기본 금액은 기능을 보여주기 위한 예시이며 공식 생활비 기준이 아닙니다.</p>
      </aside>
    </div>
  );
}
