"use client";

import { useState } from "react";

const SUPER_RATE = 0.12;
const PERMANENT_MINIMUM_RATE = 26.44;
const CASUAL_MINIMUM_RATE = 33.05;
const DEFAULT_HOURLY_RATE = "30";
const DEFAULT_WEEKLY_HOURS = "38";

type EmploymentType = "permanent" | "casual";

const currencyFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  minimumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat("en-AU", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function formatCurrency(amount: number) {
  return currencyFormatter.format(amount);
}

function calculateResidentIncomeTax(income: number) {
  if (income <= 18_200) return 0;
  if (income <= 45_000) return (income - 18_200) * 0.15;
  if (income <= 135_000) return 4_020 + (income - 45_000) * 0.3;
  if (income <= 190_000) return 31_020 + (income - 135_000) * 0.37;
  return 51_370 + (income - 190_000) * 0.45;
}

type ResultCardProps = {
  label: string;
  value: number;
  emphasis?: boolean;
};

function ResultCard({ label, value, emphasis = false }: ResultCardProps) {
  return (
    <div className={`rounded-xl border p-4 ${emphasis ? "border-gold/40 bg-gold/10" : "border-white/10 bg-white/10"}`}>
      <dt className="text-xs font-medium text-white/65">{label}</dt>
      <dd className="mt-2 break-words text-xl font-semibold tracking-tight sm:text-2xl">
        {formatCurrency(value)}
      </dd>
    </div>
  );
}

export function SalaryCalculator() {
  const [hourlyRate, setHourlyRate] = useState(DEFAULT_HOURLY_RATE);
  const [weeklyHours, setWeeklyHours] = useState(DEFAULT_WEEKLY_HOURS);
  const [employmentType, setEmploymentType] = useState<EmploymentType>("permanent");
  const [touched, setTouched] = useState({ rate: false, hours: false });

  const rate = Number(hourlyRate);
  const hours = Number(weeklyHours);
  const rateError =
    hourlyRate.trim() === "" || !Number.isFinite(rate) || rate <= 0
      ? "0보다 큰 시급을 입력해 주세요."
      : "";
  const hoursError =
    weeklyHours.trim() === "" || !Number.isFinite(hours) || hours <= 0 || hours > 168
      ? "0보다 크고 168 이하인 시간을 입력해 주세요."
      : "";
  const hasErrors = Boolean(rateError || hoursError);

  const grossWeekly = hasErrors ? 0 : rate * hours;
  const grossAnnual = grossWeekly * 52;
  const grossMonthly = grossAnnual / 12;
  const estimatedTax = calculateResidentIncomeTax(grossAnnual);
  const netAnnual = grossAnnual - estimatedTax;
  const netMonthly = netAnnual / 12;
  const netWeekly = netAnnual / 52;
  const superWeekly = grossWeekly * SUPER_RATE;
  const superAnnual = grossAnnual * SUPER_RATE;
  const totalPackage = grossAnnual + superAnnual;
  const effectiveTaxRate = grossAnnual > 0 ? estimatedTax / grossAnnual : 0;
  const applicableMinimum = employmentType === "casual" ? CASUAL_MINIMUM_RATE : PERMANENT_MINIMUM_RATE;
  const belowMinimum = !rateError && rate < applicableMinimum;

  function resetCalculator() {
    setHourlyRate(DEFAULT_HOURLY_RATE);
    setWeeklyHours(DEFAULT_WEEKLY_HOURS);
    setEmploymentType("permanent");
    setTouched({ rate: false, hours: false });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.3fr]">
      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gold">2026–27 기준</p>
            <h2 className="mt-2 text-xl font-semibold text-navy">급여 정보 입력</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">한 번 입력하면 세전·세후·Super를 모두 계산합니다.</p>
          </div>
          <button type="button" onClick={resetCalculator} className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm font-medium text-navy transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">
            초기화
          </button>
        </div>

        <fieldset className="mt-7">
          <legend className="text-sm font-medium text-navy">고용 형태</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <label className={`cursor-pointer rounded-xl border p-4 transition ${employmentType === "permanent" ? "border-navy bg-navy/5" : "border-border"}`}>
              <input type="radio" name="salary-employment-type" checked={employmentType === "permanent"} onChange={() => setEmploymentType("permanent")} className="mr-2 accent-navy" />
              <span className="font-medium text-navy">풀타임·파트타임</span>
            </label>
            <label className={`cursor-pointer rounded-xl border p-4 transition ${employmentType === "casual" ? "border-navy bg-navy/5" : "border-border"}`}>
              <input type="radio" name="salary-employment-type" checked={employmentType === "casual"} onChange={() => setEmploymentType("casual")} className="mr-2 accent-navy" />
              <span className="font-medium text-navy">캐주얼</span>
            </label>
          </div>
        </fieldset>

        <div className="mt-6 space-y-6">
          <label className="block">
            <span className="text-sm font-medium text-navy">나의 시급 (호주 달러)</span>
            <div className="relative mt-2">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-muted">$</span>
              <input type="number" min="0.01" step="0.01" inputMode="decimal" value={hourlyRate} onChange={(event) => setHourlyRate(event.target.value)} onBlur={() => setTouched((current) => ({ ...current, rate: true }))} aria-invalid={touched.rate && Boolean(rateError)} className={`w-full rounded-lg border bg-background py-3 pl-8 pr-4 text-navy outline-none transition focus:ring-2 focus:ring-navy/15 ${touched.rate && rateError ? "border-red-500" : "border-border focus:border-navy"}`} />
            </div>
            {touched.rate && rateError ? <span role="alert" className="mt-2 block text-sm text-red-600">{rateError}</span> : null}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-navy">주당 근무 시간</span>
            <input type="number" min="0.5" max="168" step="0.5" inputMode="decimal" value={weeklyHours} onChange={(event) => setWeeklyHours(event.target.value)} onBlur={() => setTouched((current) => ({ ...current, hours: true }))} aria-invalid={touched.hours && Boolean(hoursError)} className={`mt-2 w-full rounded-lg border bg-background px-4 py-3 text-navy outline-none transition focus:ring-2 focus:ring-navy/15 ${touched.hours && hoursError ? "border-red-500" : "border-border focus:border-navy"}`} />
            {touched.hours && hoursError ? <span role="alert" className="mt-2 block text-sm text-red-600">{hoursError}</span> : null}
          </label>
        </div>

        {!rateError ? (
          <div className={`mt-6 rounded-xl p-4 text-sm leading-relaxed ${belowMinimum ? "bg-red-50 text-red-800" : "bg-surface text-muted"}`}>
            {belowMinimum ? (
              <>입력한 시급이 현재 일반 성인 National Minimum Wage 기준인 {formatCurrency(applicableMinimum)}보다 낮습니다. 적용 Award를 반드시 확인하세요.</>
            ) : (
              <>선택한 고용 형태의 일반 최저 기준은 시간당 {formatCurrency(applicableMinimum)}입니다.</>
            )}
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl bg-navy p-6 text-white shadow-sm sm:p-8" aria-live="polite">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">통합 급여 결과</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/70">세전 급여, 예상 세후 소득, Super를 한눈에 확인하세요.</p>
          </div>
          {!hasErrors ? (
            <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/75">실효 소득세율 {percentFormatter.format(effectiveTaxRate)}</div>
          ) : null}
        </div>

        {hasErrors ? (
          <div className="mt-7 rounded-xl bg-white/10 p-5 text-sm leading-relaxed">정확한 결과를 계산하려면 입력값을 확인해 주세요.</div>
        ) : (
          <div className="mt-7 space-y-7">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-gold">세전 급여</h3>
              <dl className="mt-3 grid gap-3 sm:grid-cols-3">
                <ResultCard label="주급" value={grossWeekly} />
                <ResultCard label="월급" value={grossMonthly} />
                <ResultCard label="연봉" value={grossAnnual} emphasis />
              </dl>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-gold">예상 세후 소득</h3>
              <dl className="mt-3 grid gap-3 sm:grid-cols-3">
                <ResultCard label="세후 주급" value={netWeekly} />
                <ResultCard label="세후 월급" value={netMonthly} />
                <ResultCard label="세후 연 소득" value={netAnnual} emphasis />
              </dl>
              <p className="mt-3 text-sm text-white/65">예상 연 소득세: {formatCurrency(estimatedTax)}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-gold">Super 및 총 패키지</h3>
              <dl className="mt-3 grid gap-3 sm:grid-cols-3">
                <ResultCard label="주 Super" value={superWeekly} />
                <ResultCard label="연 Super" value={superAnnual} />
                <ResultCard label="연봉 + Super" value={totalPackage} emphasis />
              </dl>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
