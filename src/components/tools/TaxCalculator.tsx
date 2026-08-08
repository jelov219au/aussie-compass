"use client";

import { useState } from "react";

const DEFAULT_ANNUAL_INCOME = "70000";

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
  if (income <= 45_000) return (income - 18_200) * 0.16;
  if (income <= 135_000) return 4_288 + (income - 45_000) * 0.3;
  if (income <= 190_000) return 31_288 + (income - 135_000) * 0.37;
  return 51_638 + (income - 190_000) * 0.45;
}

export function TaxCalculator() {
  const [annualIncome, setAnnualIncome] = useState(DEFAULT_ANNUAL_INCOME);
  const [touched, setTouched] = useState(false);

  const income = Number(annualIncome);
  const error =
    annualIncome.trim() === ""
      ? "연간 과세소득을 입력해 주세요."
      : !Number.isFinite(income) || income < 0
        ? "0 이상의 숫자를 입력해 주세요."
        : "";

  const incomeTax = error ? 0 : calculateResidentIncomeTax(income);
  const takeHomeAnnual = income - incomeTax;
  const effectiveTaxRate = income > 0 ? incomeTax / income : 0;

  const results = [
    { label: "Estimated Income Tax", description: "예상 소득세", value: incomeTax },
    { label: "Annual Take-home", description: "세후 연 소득", value: takeHomeAnnual },
    { label: "Monthly Take-home", description: "세후 월 소득", value: takeHomeAnnual / 12 },
    { label: "Weekly Take-home", description: "세후 주 소득", value: takeHomeAnnual / 52 },
  ];

  function resetCalculator() {
    setAnnualIncome(DEFAULT_ANNUAL_INCOME);
    setTouched(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.2fr]">
      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gold">2025–26 소득연도</p>
            <h2 className="mt-2 text-xl font-semibold text-navy">과세소득 입력</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              공제 후 예상 연간 과세소득을 입력해 주세요.
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

        <label className="mt-7 block">
          <span className="text-sm font-medium text-navy">연간 과세소득 (호주 달러)</span>
          <div className="relative mt-2">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-muted">$</span>
            <input
              type="number"
              min="0"
              step="100"
              inputMode="decimal"
              value={annualIncome}
              onChange={(event) => setAnnualIncome(event.target.value)}
              onBlur={() => setTouched(true)}
              aria-invalid={touched && Boolean(error)}
              aria-describedby={touched && error ? "annual-income-error" : undefined}
              className={`w-full rounded-lg border bg-background py-3 pl-8 pr-4 text-navy outline-none transition focus:ring-2 focus:ring-navy/15 ${
                touched && error ? "border-red-500" : "border-border focus:border-navy"
              }`}
            />
          </div>
          {touched && error ? (
            <span id="annual-income-error" role="alert" className="mt-2 block text-sm text-red-600">
              {error}
            </span>
          ) : null}
        </label>

        {!error ? (
          <div className="mt-6 rounded-xl bg-surface p-4">
            <p className="text-sm text-muted">실효 소득세율</p>
            <p className="mt-1 text-2xl font-semibold text-navy">
              {percentFormatter.format(effectiveTaxRate)}
            </p>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl bg-navy p-6 text-white shadow-sm sm:p-8" aria-live="polite">
        <h2 className="text-xl font-semibold">예상 세금 및 세후 소득</h2>
        <p className="mt-2 text-sm leading-relaxed text-white/70">
          호주 세법상 거주자의 기본 개인소득세율을 적용한 예상치입니다.
        </p>

        {error ? (
          <div className="mt-7 rounded-xl bg-white/10 p-5 text-sm leading-relaxed">
            정확한 결과를 계산하려면 입력값을 확인해 주세요.
          </div>
        ) : (
          <dl className="mt-7 grid gap-4 sm:grid-cols-2">
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
