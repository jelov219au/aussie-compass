"use client";

import { useState } from "react";

const DEFAULT_HOURLY_RATE = "30";
const DEFAULT_WEEKLY_HOURS = "38";

const currencyFormatter = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "AUD",
  currencyDisplay: "symbol",
  minimumFractionDigits: 2,
});

function formatCurrency(amount: number) {
  return currencyFormatter.format(amount);
}

function validatePositiveNumber(value: string, label: string) {
  if (value.trim() === "") return `${label}을(를) 입력해 주세요.`;

  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    return `${label}은(는) 0보다 큰 숫자여야 합니다.`;
  }

  return "";
}

export function PayCalculator() {
  const [hourlyRate, setHourlyRate] = useState(DEFAULT_HOURLY_RATE);
  const [weeklyHours, setWeeklyHours] = useState(DEFAULT_WEEKLY_HOURS);
  const [touched, setTouched] = useState({ hourlyRate: false, weeklyHours: false });

  const hourlyRateError = validatePositiveNumber(hourlyRate, "시급");
  const weeklyHoursError =
    validatePositiveNumber(weeklyHours, "주당 근무 시간") ||
    (Number(weeklyHours) > 168 ? "주당 근무 시간은 168시간을 넘을 수 없습니다." : "");
  const hasErrors = Boolean(hourlyRateError || weeklyHoursError);

  const weeklyPay = Number(hourlyRate) * Number(weeklyHours);
  const annualPay = weeklyPay * 52;
  const monthlyPay = annualPay / 12;

  const results = [
    { label: "Weekly Pay", description: "주급", value: weeklyPay },
    { label: "Monthly Pay", description: "월급", value: monthlyPay },
    { label: "Annual Salary", description: "연봉", value: annualPay },
  ];

  function resetCalculator() {
    setHourlyRate(DEFAULT_HOURLY_RATE);
    setWeeklyHours(DEFAULT_WEEKLY_HOURS);
    setTouched({ hourlyRate: false, weeklyHours: false });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-navy">근무 정보</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              시급과 평소 주당 근무 시간을 입력해 주세요.
            </p>
          </div>
          <button
            type="button"
            onClick={resetCalculator}
            className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm font-medium text-navy transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
          >
            초기화
          </button>
        </div>

        <div className="mt-7 space-y-6">
          <label className="block">
            <span className="text-sm font-medium text-navy">시급 (호주 달러)</span>
            <div className="relative mt-2">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-muted">
                $
              </span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                value={hourlyRate}
                onChange={(event) => setHourlyRate(event.target.value)}
                onBlur={() => setTouched((current) => ({ ...current, hourlyRate: true }))}
                aria-invalid={touched.hourlyRate && Boolean(hourlyRateError)}
                aria-describedby={touched.hourlyRate && hourlyRateError ? "hourly-rate-error" : undefined}
                className={`w-full rounded-lg border bg-background py-3 pl-8 pr-4 text-navy outline-none transition focus:ring-2 focus:ring-navy/15 ${
                  touched.hourlyRate && hourlyRateError ? "border-red-500" : "border-border focus:border-navy"
                }`}
              />
            </div>
            {touched.hourlyRate && hourlyRateError ? (
              <span id="hourly-rate-error" role="alert" className="mt-2 block text-sm text-red-600">
                {hourlyRateError}
              </span>
            ) : null}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-navy">주당 근무 시간</span>
            <input
              type="number"
              min="0.5"
              max="168"
              step="0.5"
              inputMode="decimal"
              value={weeklyHours}
              onChange={(event) => setWeeklyHours(event.target.value)}
              onBlur={() => setTouched((current) => ({ ...current, weeklyHours: true }))}
              aria-invalid={touched.weeklyHours && Boolean(weeklyHoursError)}
              aria-describedby={touched.weeklyHours && weeklyHoursError ? "weekly-hours-error" : undefined}
              className={`mt-2 w-full rounded-lg border bg-background px-4 py-3 text-navy outline-none transition focus:ring-2 focus:ring-navy/15 ${
                touched.weeklyHours && weeklyHoursError ? "border-red-500" : "border-border focus:border-navy"
              }`}
            />
            {touched.weeklyHours && weeklyHoursError ? (
              <span id="weekly-hours-error" role="alert" className="mt-2 block text-sm text-red-600">
                {weeklyHoursError}
              </span>
            ) : null}
          </label>
        </div>
      </section>

      <section
        className="rounded-2xl bg-navy p-6 text-white shadow-sm sm:p-8"
        aria-live="polite"
      >
        <h2 className="text-xl font-semibold">예상 세전 급여</h2>
        <p className="mt-2 text-sm leading-relaxed text-white/70">
          세금과 퇴직연금(Superannuation)을 공제하기 전 금액입니다.
        </p>

        {hasErrors ? (
          <div className="mt-7 rounded-xl bg-white/10 p-5 text-sm leading-relaxed text-white">
            정확한 급여를 계산하려면 입력 오류를 확인해 주세요.
          </div>
        ) : (
          <dl className="mt-7 grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {results.map((result) => (
              <div key={result.label} className="rounded-xl border border-white/10 bg-white/10 p-5">
                <dt className="text-sm font-medium text-white/80">
                  {result.label}
                  <span className="mt-1 block text-xs font-normal text-white/55">{result.description}</span>
                </dt>
                <dd className="mt-3 break-words text-2xl font-semibold tracking-tight sm:text-3xl">
                  {formatCurrency(result.value)}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </section>
    </div>
  );
}
