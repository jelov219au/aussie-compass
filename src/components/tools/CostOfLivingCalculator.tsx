"use client";
import { amount, budgetResult, frequencyLabels, money, parseBudget, serializeBudget, type BudgetData, type BudgetFrequency } from "@/lib/personalPlans";
import { useLocalPlan } from "@/lib/useLocalPlan";

const initial: BudgetData = { income: 1200, incomeFrequency: "weekly", expenses: [
  { id: "housing", name: "주거비", amount: 350, frequency: "weekly" },
  { id: "groceries", name: "식료품", amount: 120, frequency: "weekly" },
  { id: "transport", name: "교통", amount: 50, frequency: "weekly" },
  { id: "utilities", name: "전기·가스·수도", amount: 150, frequency: "monthly" },
  { id: "phone", name: "통신비", amount: 50, frequency: "monthly" },
  { id: "insurance", name: "보험·의료", amount: 80, frequency: "monthly" },
  { id: "lifestyle", name: "외식·여가", amount: 80, frequency: "weekly" },
  { id: "other", name: "기타", amount: 30, frequency: "weekly" },
] };
const inputClass = "mt-1.5 min-h-11 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-navy focus:ring-2 focus:ring-navy/15";
const options = Object.entries(frequencyLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>);

export function CostOfLivingCalculator() {
  const { data: budget, update, reset, storage, saveState } = useLocalPlan("aussie-compass-living-budget-v1", initial, parseBudget, serializeBudget);
  const result = budgetResult(budget), validRows = result.rows.filter(item => item.weekly !== null);
  const updateExpense = (id: string, field: "name" | "amount" | "frequency", value: string) => update(current => ({ ...current, expenses: current.expenses.map(item => item.id === id ? { ...item, [field]: value } : item) }));
  return <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.72fr)]">
    <section className="min-w-0 rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7" aria-labelledby="budget-input-heading">
      <h2 id="budget-input-heading" className="text-xl font-semibold text-navy">수입과 생활비</h2>
      <p className="mt-2 text-sm leading-6 text-muted">기본 주급 A$1,200·주세 A$350 등은 가상 예시이며 호주 평균이나 내게 맞는 금액이 아닙니다. 저장본을 불러온 경우에는 기존 내 기록입니다. 실제 금액으로 바꿔 보세요.</p>
      <p className="mt-3 text-sm leading-6 text-muted" role="status">{saveState}</p>
      {storage === "blocked" && <p className="mt-3 rounded-lg bg-gold/10 p-4 text-sm leading-6 text-navy">저장본을 안전하게 읽지 못했습니다. 원본을 덮어쓰거나 지우지 않고 자동 저장을 중지했습니다. 화면에는 예시가 표시되며 새 입력은 화면에서만 사용합니다. 필요한 내용은 별도로 보관하세요.</p>}
      <p className="mt-2 text-xs leading-6 text-muted">빈칸·오류가 있으면 저장을 보류하고 마지막 정상 저장본을 유지합니다. 새로 입력한 미완료 내용은 다시 열 때 복구되지 않습니다.</p>
      <fieldset disabled={storage === "loading"} className="mt-6 rounded-xl bg-surface p-4">
        <legend className="font-semibold text-navy">세후 수입</legend>
        <div className="grid grid-cols-[minmax(0,1fr)_100px] gap-3">
          <label className="text-sm text-navy">금액 (AUD)<input className={inputClass} inputMode="decimal" value={budget.income} aria-invalid={amount(budget.income) === null} aria-describedby="budget-income-hint" onChange={event => update(current => ({ ...current, income: event.target.value }))} /></label>
          <label className="text-sm text-navy">주기<select className={inputClass} value={budget.incomeFrequency} onChange={event => update(current => ({ ...current, incomeFrequency: event.target.value as BudgetFrequency }))}>{options}</select></label>
        </div>
        <p id="budget-income-hint" className={`mt-2 text-xs leading-6 ${amount(budget.income) === null ? "text-red-700" : "text-muted"}`}>{amount(budget.income) === null ? "0~1조 사이의 유효한 숫자를 입력하세요. 빈칸은 0이 아닙니다." : "통장에 실제로 들어오는 세후 금액을 입력하세요."}</p>
      </fieldset>
      <fieldset disabled={storage === "loading"} className="mt-7">
        <legend className="font-semibold text-navy">지출 항목</legend>
        <div className="mt-3 space-y-3">{budget.expenses.map((item, index) => <div key={item.id} className="rounded-xl border border-border p-3">
          <div className="grid gap-3 sm:grid-cols-[minmax(100px,1fr)_110px_90px]">
            <label className="text-xs text-muted">항목<input maxLength={100} className={inputClass} value={item.name} aria-invalid={!item.name.trim()} onChange={event => updateExpense(item.id, "name", event.target.value)} /></label>
            <label className="text-xs text-muted">금액 (AUD)<input className={inputClass} inputMode="decimal" value={item.amount} aria-invalid={amount(item.amount) === null} aria-describedby={amount(item.amount) === null ? `expense-error-${index}` : undefined} onChange={event => updateExpense(item.id, "amount", event.target.value)} /></label>
            <label className="text-xs text-muted">주기<select className={inputClass} value={item.frequency} onChange={event => updateExpense(item.id, "frequency", event.target.value)}>{options}</select></label>
          </div>
          {amount(item.amount) === null && <p id={`expense-error-${index}`} className="mt-2 text-xs leading-6 text-red-700">금액 미확인: 0~1조 사이의 유효한 숫자를 입력하세요. 이 항목은 소계에 포함되지 않습니다.</p>}
          {!item.name.trim() && <p className="mt-2 text-xs text-red-700">항목 이름을 입력하세요.</p>}
          {item.removable && <button type="button" onClick={() => update(current => ({ ...current, expenses: current.expenses.filter(expense => expense.id !== item.id) }))} className="mt-2 min-h-11 px-3 text-sm text-muted underline" aria-label={`${item.name} 삭제`}>삭제</button>}
        </div>)}</div>
        <button type="button" disabled={budget.expenses.length >= 50} onClick={() => update(current => ({ ...current, expenses: [...current.expenses, { id: crypto.randomUUID(), name: "새 항목", amount: "", frequency: "monthly", removable: true }] }))} className="mt-4 min-h-11 rounded-lg border border-navy px-4 text-sm font-semibold text-navy disabled:opacity-50">+ 지출 항목 추가 (최대 50개)</button>
      </fieldset>
    </section>
    <aside id="living-budget-results" className="min-w-0 rounded-2xl bg-navy p-6 text-white sm:p-8 lg:sticky lg:top-24" aria-labelledby="budget-results-heading">
      <p className="text-sm text-gold">입력 기준 생활 예산</p><h2 id="budget-results-heading" className="mt-2 text-2xl font-semibold">{result.complete ? "생활비 요약" : "입력한 항목 소계"}</h2>
      <p className="mt-3 text-sm text-white/70">금액 입력 {validRows.length}/{budget.expenses.length}개 · 빈칸과 오류는 합산하지 않습니다.</p>
      <dl className="mt-5 space-y-3">{[["주간 생활비", result.weeklyExpenses], ["연간 평균 월액", result.weeklyExpenses * 52 / 12], ["연간 생활비", result.weeklyExpenses * 52]].map(([label, value]) => <div key={label} className="rounded-xl bg-white/8 p-4"><dt className="text-sm text-white/65">{label}</dt><dd className="mt-1 break-all text-2xl font-semibold">{validRows.length ? money(Number(value)) : "지출 금액을 입력하세요"}</dd></div>)}</dl>
      {result.weeklyBalance !== null ? <div className="mt-5 rounded-xl border border-white/20 p-5"><p className="text-sm text-white/70">입력 기준 주간 잔액</p><p className="mt-1 break-all text-3xl font-semibold">{money(result.weeklyBalance)}</p><p className="mt-2 text-sm leading-6 text-white/70">{result.weeklyBalance < 0 ? "현재 입력 지출이 수입보다 많습니다." : result.weeklyIncome! > 0 ? `입력 수입의 ${Math.round(result.weeklyBalance / result.weeklyIncome! * 100)}%가 남습니다.` : "입력 수입이 0이므로 남는 비율은 계산하지 않습니다."}</p></div> : <p className="mt-5 rounded-xl border border-gold/30 p-4 text-sm leading-7">수입과 모든 지출의 금액·항목 이름을 확인하면 주간 잔액을 계산합니다.</p>}
      <p className="mt-4 text-xs leading-6 text-white/70">월액은 주간 금액 × 52 ÷ 12의 연간 평균입니다. 이번 달 실제 청구액이나 오늘 계좌에서 쓸 수 있는 돈을 뜻하지 않습니다.</p>
      <h3 className="mt-6 text-sm font-semibold">항목별 주간 환산</h3><ul className="mt-3 space-y-2 text-sm">{validRows.map(item => <li key={item.id} className="flex flex-wrap justify-between gap-3"><span className="min-w-0 break-words text-white/70">{item.name || "이름 미입력"}</span><span className="break-all">{money(item.weekly!)}</span></li>)}</ul>
      <div className="living-budget-print-hide mt-6 flex flex-wrap gap-3"><button type="button" onClick={() => window.print()} className="min-h-11 rounded-lg bg-gold px-4 font-semibold text-navy">결과 인쇄</button><button type="button" disabled={storage === "loading"} onClick={() => { if (window.confirm("저장된 생활비를 지우고 기본 가상 예시로 되돌릴까요?")) reset(); }} className="min-h-11 rounded-lg border border-white/30 px-4 text-sm">기본 예시로 초기화</button></div>
    </aside>
  </div>;
}
