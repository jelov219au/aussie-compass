"use client";

import { useState } from "react";

const SUPER_RATE = 0.12;
const DEFAULT_HOURLY_RATE = "30";
const DEFAULT_WEEKLY_HOURS = "38";

const currencyFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  minimumFractionDigits: 2,
});

function formatCurrency(amount: number) {
  return currencyFormatter.format(amount);
}

export function SuperCalculator() {
  const [hourlyRate, setHourlyRate] = useState(DEFAULT_HOURLY_RATE);
  const [weeklyHours, setWeeklyHours] = useState(DEFAULT_WEEKLY_HOURS);

  const hourlyRateNumber = Number(hourlyRate);
  const weeklyHoursNumber = Number(weeklyHours);
  const isValid =
    hourlyRate.trim() !== "" &&
    weeklyHours.trim() !== "" &&
    Number.isFinite(hourlyRateNumber) &&
    Number.isFinite(weeklyHoursNumber) &&
    hourlyRateNumber > 0 &&
    weeklyHoursNumber > 0 &&
    weeklyHoursNumber <= 168;

  const weeklyPay = hourlyRateNumber * weeklyHoursNumber;
  const weeklySuper = weeklyPay * SUPER_RATE;
  const annualSuper = weeklySuper * 52;
  const monthlySuper = annualSuper / 12;

  const results = [
    { label: "Weekly Super", description: "주 Super", value: weeklySuper },
    { label: "Monthly Super", description: "월 Super", value: monthlySuper },
    { label: "Annual Super", description: "연 Super", value: annualSuper },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
        <div>
          <p className="text-sm font-semibold text-gold">현재 SG 비율: 12%</p>
          <h2 className="mt-2 text-xl font-semibold text-navy">근무 정보</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            시급과 평소 주당 근무 시간을 입력해 주세요.
          </p>
        </div>

        <div className="mt-7 space-y-6">
          <label className="block">
            <span className="text-sm font-medium text-navy">시급 (호주 달러)</span>
            <div className="relative mt-2">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-muted">$</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                value={hourlyRate}
                onChange={(event) => setHourlyRate(event.target.value)}
                className="w-full rounded-lg border border-border bg-background py-3 pl-8 pr-4 text-navy outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/15"
              />
            </div>
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
              className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-3 text-navy outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/15"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl bg-navy p-6 text-white shadow-sm sm:p-8" aria-live="polite">
        <h2 className="text-xl font-semibold">예상 고용주 Super 납부액</h2>
        <p className="mt-2 text-sm leading-relaxed text-white/70">
          일반 Super Guarantee 비율 12%를 적용한 단순 예상치입니다.
        </p>

        {isValid ? (
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
        ) : (
          <div className="mt-7 rounded-xl bg-white/10 p-5 text-sm leading-relaxed">
            0보다 큰 시급과 168시간 이하의 주당 근무 시간을 입력해 주세요.
          </div>
        )}
      </section>
    </div>
  );
}
