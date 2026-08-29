"use client";

import { useState } from "react";

const PERMANENT_HOURLY_RATE = 26.44;
const PERMANENT_38_HOUR_WEEKLY_RATE = 1004.9;
const CASUAL_HOURLY_RATE = 33.05;
const DEFAULT_WEEKLY_HOURS = "38";

type EmploymentType = "permanent" | "casual";

const currencyFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  minimumFractionDigits: 2,
});

function formatCurrency(amount: number) {
  return currencyFormatter.format(amount);
}

export function MinimumWageCalculator() {
  const [employmentType, setEmploymentType] = useState<EmploymentType>("permanent");
  const [weeklyHours, setWeeklyHours] = useState(DEFAULT_WEEKLY_HOURS);
  const [touched, setTouched] = useState(false);

  const hours = Number(weeklyHours);
  const error =
    weeklyHours.trim() === ""
      ? "주당 근무 시간을 입력해 주세요."
      : !Number.isFinite(hours) || hours <= 0 || hours > 168
        ? "0보다 크고 168 이하인 시간을 입력해 주세요."
        : "";

  const hourlyRate = employmentType === "casual" ? CASUAL_HOURLY_RATE : PERMANENT_HOURLY_RATE;
  const usesOfficialPermanentWeeklyRate = employmentType === "permanent" && hours === 38;
  const weeklyPay = error ? 0 : usesOfficialPermanentWeeklyRate ? PERMANENT_38_HOUR_WEEKLY_RATE : hourlyRate * hours;
  const annualPay = weeklyPay * 52;

  const results = [
    { label: "Minimum Hourly Rate", description: "최저 시급", value: hourlyRate },
    { label: "Estimated Weekly Pay", description: "예상 주급", value: weeklyPay },
    { label: "Estimated Annual Pay", description: "예상 연봉", value: annualPay },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold text-gold">2026년 7월 1일부터 적용</p>
        <h2 className="mt-2 text-xl font-semibold text-navy">근무 조건</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          고용 형태와 평소 주당 근무 시간을 선택해 주세요.
        </p>

        <fieldset className="mt-7">
          <legend className="text-sm font-medium text-navy">고용 형태</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <label className={`cursor-pointer rounded-xl border p-4 transition ${employmentType === "permanent" ? "border-navy bg-navy/5" : "border-border"}`}>
              <input
                type="radio"
                name="employment-type"
                value="permanent"
                checked={employmentType === "permanent"}
                onChange={() => setEmploymentType("permanent")}
                className="mr-2 accent-navy"
              />
              <span className="font-medium text-navy">풀타임·파트타임</span>
              <span className="mt-1 block pl-5 text-xs leading-relaxed text-muted">기본 최저 시급 적용</span>
            </label>

            <label className={`cursor-pointer rounded-xl border p-4 transition ${employmentType === "casual" ? "border-navy bg-navy/5" : "border-border"}`}>
              <input
                type="radio"
                name="employment-type"
                value="casual"
                checked={employmentType === "casual"}
                onChange={() => setEmploymentType("casual")}
                className="mr-2 accent-navy"
              />
              <span className="font-medium text-navy">캐주얼</span>
              <span className="mt-1 block pl-5 text-xs leading-relaxed text-muted">25% 캐주얼 로딩 포함</span>
            </label>
          </div>
        </fieldset>

        <label className="mt-6 block">
          <span className="text-sm font-medium text-navy">주당 근무 시간</span>
          <input
            type="number"
            min="0.5"
            max="168"
            step="0.5"
            inputMode="decimal"
            value={weeklyHours}
            onChange={(event) => setWeeklyHours(event.target.value)}
            onBlur={() => setTouched(true)}
            aria-invalid={touched && Boolean(error)}
            aria-describedby={touched && error ? "minimum-wage-hours-error" : undefined}
            className={`mt-2 w-full rounded-lg border bg-background px-4 py-3 text-navy outline-none transition focus:ring-2 focus:ring-navy/15 ${touched && error ? "border-red-500" : "border-border focus:border-navy"}`}
          />
          {touched && error ? (
            <span id="minimum-wage-hours-error" role="alert" className="mt-2 block text-sm text-red-600">
              {error}
            </span>
          ) : null}
        </label>
      </section>

      <section className="rounded-2xl bg-navy p-6 text-white shadow-sm sm:p-8" aria-live="polite">
        <h2 className="text-xl font-semibold">National Minimum Wage 예상 금액</h2>
        <p className="mt-2 text-sm leading-relaxed text-white/70">
          세전 금액이며 일반 성인 award-free 근로자 기준입니다.
        </p>
        {usesOfficialPermanentWeeklyRate ? (
          <p className="mt-3 border-l-2 border-gold pl-3 text-xs leading-6 text-white/70">
            38시간 주급은 Fair Work가 공표한 A$1,004.90을 사용합니다. 표시 시급은 센트 단위로 반올림되어 단순 곱셈과 소액 차이가 날 수 있어요.
          </p>
        ) : null}

        {error ? (
          <div className="mt-7 rounded-xl bg-white/10 p-5 text-sm leading-relaxed">
            정확한 결과를 계산하려면 입력값을 확인해 주세요.
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
