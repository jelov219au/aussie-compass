export type Amount = number | string;
export type BudgetFrequency = "weekly" | "fortnightly" | "monthly" | "quarterly" | "yearly";
export type Expense = { id: string; name: string; amount: Amount; frequency: BudgetFrequency; removable?: boolean };
export type BudgetData = { income: Amount; incomeFrequency: BudgetFrequency; expenses: Expense[] };
export type SavingsFrequency = "weekly" | "fortnightly" | "monthly";
export type CheckIn = { id: string; amount: number; date: string };
export type SavingsData = { goalName: string; target: Amount; starting: Amount; contribution: Amount; frequency: SavingsFrequency; annualRate: Amount; targetMonths: Amount; mode: "timeline" | "required"; checkIns: CheckIn[] };
export const periods = { weekly: 52, fortnightly: 26, monthly: 12 };
export const frequencyLabels = { weekly: "매주", fortnightly: "격주", monthly: "매월", quarterly: "분기", yearly: "매년" };
const object = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown, max: number) => typeof value === "string" && value.length <= max && !/[\u0000-\u001f]/.test(value);
export function amount(value: unknown): number | null {
  if (typeof value !== "number" && (typeof value !== "string" || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(value.trim()))) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= 1e12 ? number : null;
}
export const money = (value: number) => new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
export const toWeekly = (value: number, frequency: BudgetFrequency) => value * ({ weekly: 1, fortnightly: 1 / 2, monthly: 12 / 52, quarterly: 4 / 52, yearly: 1 / 52 }[frequency]);
export function budgetResult(data: BudgetData) {
  const rows = data.expenses.map(item => ({ ...item, weekly: amount(item.amount) === null ? null : toWeekly(amount(item.amount)!, item.frequency) }));
  const complete = amount(data.income) !== null && rows.every(item => item.weekly !== null && item.name.trim().length > 0);
  const weeklyExpenses = rows.reduce((sum, item) => sum + (item.weekly ?? 0), 0);
  const weeklyIncome = amount(data.income) === null ? null : toWeekly(amount(data.income)!, data.incomeFrequency);
  return { rows, complete, weeklyExpenses, weeklyIncome, weeklyBalance: complete ? weeklyIncome! - weeklyExpenses : null };
}
export function serializeBudget(data: BudgetData): string | null {
  if (!budgetResult(data).complete) return null;
  const raw = JSON.stringify({ ...data, income: amount(data.income), expenses: data.expenses.map(item => ({ ...item, amount: amount(item.amount) })) });
  return parseBudget(raw) ? raw : null;
}
export function parseBudget(raw: string): BudgetData | null {
  try {
    const data: unknown = JSON.parse(raw);
    if (!object(data) || Object.keys(data).some(key => !["income", "incomeFrequency", "expenses"].includes(key))
      || typeof data.income !== "number" || amount(data.income) === null || typeof data.incomeFrequency !== "string" || !Object.hasOwn(frequencyLabels, data.incomeFrequency)
      || !Array.isArray(data.expenses) || data.expenses.length > 50) return null;
    const ids = new Set();
    for (const item of data.expenses) {
      if (!object(item) || Object.keys(item).some(key => !["id", "name", "amount", "frequency", "removable"].includes(key))
        || !text(item.id, 200) || !item.id || ids.has(item.id) || !text(item.name, 100)
        || typeof item.amount !== "number" || amount(item.amount) === null || typeof item.frequency !== "string" || !Object.hasOwn(frequencyLabels, item.frequency)
        || (item.removable !== undefined && typeof item.removable !== "boolean")) return null;
      ids.add(item.id);
    }
    return data as BudgetData;
  } catch { return null; }
}
export function savingsErrors(data: SavingsData) {
  const errors: Record<string, string> = {};
  for (const key of ["target", "starting", "contribution", "annualRate", "targetMonths"] as const) {
    if ((key === "contribution" && data.mode !== "timeline") || (key === "targetMonths" && data.mode !== "required")) continue;
    const value = amount(data[key]);
    if (value === null) errors[key] = "금액을 입력하세요. 0~1조 사이의 유효한 숫자가 필요합니다.";
    else if (key === "target" && value === 0) errors[key] = "목표 금액은 0보다 커야 합니다.";
    else if (key === "annualRate" && value > 20) errors[key] = "가정 연이율은 0~20% 범위로 입력하세요.";
    else if (key === "targetMonths" && (!Number.isInteger(value) || value < 1 || value > 600)) errors[key] = "기간은 1~600개월의 정수로 입력하세요.";
  }
  return errors;
}
export function projectBalance(start: number, payment: number, rate: number, count: number) {
  let balance = start;
  for (let i = 0; i < count; i++) balance = balance * (1 + rate) + payment;
  return balance;
}
export function savingsResult(data: SavingsData) {
  if (Object.keys(savingsErrors(data)).length) return { state: "incomplete" as const };
  const target = amount(data.target)!, start = amount(data.starting)!, rate = amount(data.annualRate)! / 100 / periods[data.frequency];
  if (start >= target) return { state: "reached" as const, payment: 0, count: 0, final: start, interest: 0 };
  if (data.mode === "required") {
    const count = Math.floor(amount(data.targetMonths)! / 12 * periods[data.frequency]);
    const growth = Math.exp(count * Math.log1p(rate)), factor = rate ? Math.expm1(count * Math.log1p(rate)) / rate : count;
    let payment = Math.ceil(Math.max(0, (target - start * growth) / factor) * 100) / 100;
    let final = projectBalance(start, payment, rate, count);
    if (final < target) { payment = Math.round(payment * 100 + 1) / 100; final = projectBalance(start, payment, rate, count); }
    return { state: "reached" as const, payment, count, final, interest: Math.max(0, final - start - payment * count) };
  }
  const payment = amount(data.contribution)!;
  if (payment === 0 && (rate === 0 || start === 0)) return { state: "no-growth" as const };
  let final = start, count = 0;
  while (final < target && count < periods[data.frequency] * 100) { final = final * (1 + rate) + payment; count++; }
  if (final < target) return { state: "beyond-horizon" as const };
  return { state: "reached" as const, payment, count, final, interest: Math.max(0, final - start - payment * count) };
}
export function parseSavings(raw: string): SavingsData | null {
  try {
    const data: unknown = JSON.parse(raw);
    if (!object(data) || Object.keys(data).some(key => !["goalName", "target", "starting", "contribution", "frequency", "annualRate", "targetMonths", "mode", "checkIns"].includes(key))
      || !text(data.goalName, 100) || typeof data.frequency !== "string" || !Object.hasOwn(periods, data.frequency) || typeof data.mode !== "string" || !["timeline", "required"].includes(data.mode)
      || ["target", "starting", "contribution", "annualRate", "targetMonths"].some(key => typeof data[key] !== "number" || amount(data[key]) === null)
      || Number(data.annualRate) > 20 || !Number.isInteger(data.targetMonths) || Number(data.targetMonths) < 1 || Number(data.targetMonths) > 600
      || !Array.isArray(data.checkIns) || data.checkIns.length > 100) return null;
    const ids = new Set();
    for (const item of data.checkIns) {
      if (!object(item) || Object.keys(item).some(key => !["id", "amount", "date"].includes(key))
        || !text(item.id, 200) || !item.id || ids.has(item.id) || typeof item.amount !== "number" || amount(item.amount) === null || item.amount <= 0
        || typeof item.date !== "string" || !Number.isFinite(Date.parse(item.date)) || new Date(item.date).toISOString() !== item.date) return null;
      ids.add(item.id);
    }
    return data as SavingsData;
  } catch { return null; }
}
export function serializeSavings(data: SavingsData): string | null {
  if (Object.keys(savingsErrors(data)).length) return null;
  const normalized = { ...data, target: amount(data.target), starting: amount(data.starting), contribution: amount(data.contribution), annualRate: amount(data.annualRate), targetMonths: amount(data.targetMonths) };
  const raw = JSON.stringify(normalized);
  return parseSavings(raw) ? raw : null;
}
