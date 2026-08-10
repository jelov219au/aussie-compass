"use client";

import { useEffect, useState } from "react";

const SUPER_RATE = 0.12;
const MEDICARE_LEVY_RATE = 0.02;
const MEDICARE_LEVY_LOWER_THRESHOLD = 27_222;
const MEDICARE_LEVY_UPPER_THRESHOLD = 34_027;
const HELP_MINIMUM_REPAYMENT_INCOME = 69_528;
const HELP_SECOND_THRESHOLD = 129_717;
const PERMANENT_MINIMUM_RATE = 26.44;
const CASUAL_MINIMUM_RATE = 33.05;
const DEFAULT_HOURLY_RATE = "30";
const DEFAULT_WEEKLY_HOURS = "38";
const DEFAULT_WORKING_WEEKS = "52";
const DEFAULT_ANNUAL_SALARY = "70000";

type EmploymentType = "permanent" | "casual";
type PayInputMode = "hourly" | "annual";
type AnnualAmountType = "plusSuper" | "includesSuper";
type CopyStatus = "idle" | "success" | "error";
type TaxProfile = "resident" | "workingHolidayMaker";
type SaveStatus = "idle" | "saved" | "loaded" | "error";

const SAVED_CALCULATION_KEY = "aussie-compass-salary-calculation";

type SavedCalculation = {
  taxProfile: TaxProfile;
  payInputMode: PayInputMode;
  hourlyRate: string;
  weeklyHours: string;
  workingWeeks: string;
  annualSalary: string;
  annualAmountType: AnnualAmountType;
  includeMedicareLevy: boolean;
  includeHelpRepayment: boolean;
  employmentType: EmploymentType;
};

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

function calculateWorkingHolidayMakerTax(income: number) {
  if (income <= 45_000) return income * 0.15;
  if (income <= 135_000) return 6_750 + (income - 45_000) * 0.3;
  if (income <= 190_000) return 33_750 + (income - 135_000) * 0.37;
  return 54_100 + (income - 190_000) * 0.45;
}

function calculateLowIncomeTaxOffset(income: number) {
  if (income <= 37_500) return 700;
  if (income <= 45_000) return 700 - (income - 37_500) * 0.05;
  if (income <= 66_667) return Math.max(0, 325 - (income - 45_000) * 0.015);
  return 0;
}

function calculateMedicareLevy(income: number) {
  if (income <= MEDICARE_LEVY_LOWER_THRESHOLD) return 0;
  if (income <= MEDICARE_LEVY_UPPER_THRESHOLD) {
    return Math.min(income * MEDICARE_LEVY_RATE, (income - MEDICARE_LEVY_LOWER_THRESHOLD) * 0.1);
  }
  return income * MEDICARE_LEVY_RATE;
}

function calculateHelpRepayment(income: number) {
  if (income <= HELP_MINIMUM_REPAYMENT_INCOME) return 0;

  const firstBandIncome = Math.min(income, HELP_SECOND_THRESHOLD) - HELP_MINIMUM_REPAYMENT_INCOME;
  const secondBandIncome = Math.max(0, income - HELP_SECOND_THRESHOLD);
  const marginalRepayment = firstBandIncome * 0.15 + secondBandIncome * 0.17;

  return Math.min(marginalRepayment, income * 0.1);
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
  const [taxProfile, setTaxProfile] = useState<TaxProfile>("resident");
  const [payInputMode, setPayInputMode] = useState<PayInputMode>("hourly");
  const [hourlyRate, setHourlyRate] = useState(DEFAULT_HOURLY_RATE);
  const [weeklyHours, setWeeklyHours] = useState(DEFAULT_WEEKLY_HOURS);
  const [workingWeeks, setWorkingWeeks] = useState(DEFAULT_WORKING_WEEKS);
  const [annualSalary, setAnnualSalary] = useState(DEFAULT_ANNUAL_SALARY);
  const [annualAmountType, setAnnualAmountType] = useState<AnnualAmountType>("plusSuper");
  const [includeMedicareLevy, setIncludeMedicareLevy] = useState(true);
  const [includeHelpRepayment, setIncludeHelpRepayment] = useState(false);
  const [employmentType, setEmploymentType] = useState<EmploymentType>("permanent");
  const [touched, setTouched] = useState({ rate: false, hours: false, weeks: false, annual: false });
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [hasSavedCalculation, setHasSavedCalculation] = useState(false);

  useEffect(() => {
    setHasSavedCalculation(Boolean(window.localStorage.getItem(SAVED_CALCULATION_KEY)));
  }, []);

  const rate = Number(hourlyRate);
  const hours = Number(weeklyHours);
  const weeks = Number(workingWeeks);
  const annual = Number(annualSalary);
  const rateError =
    hourlyRate.trim() === "" || !Number.isFinite(rate) || rate <= 0
      ? "0보다 큰 시급을 입력해 주세요."
      : "";
  const hoursError =
    weeklyHours.trim() === "" || !Number.isFinite(hours) || hours <= 0 || hours > 168
      ? "0보다 크고 168 이하인 시간을 입력해 주세요."
      : "";
  const weeksError =
    workingWeeks.trim() === "" || !Number.isFinite(weeks) || !Number.isInteger(weeks) || weeks < 1 || weeks > 52
      ? "1 이상 52 이하의 정수로 근무 주 수를 입력해 주세요."
      : "";
  const annualError =
    annualSalary.trim() === "" || !Number.isFinite(annual) || annual <= 0
      ? "0보다 큰 연봉을 입력해 주세요."
      : "";
  const hasErrors = payInputMode === "hourly" ? Boolean(rateError || hoursError || weeksError) : Boolean(annualError);

  const grossAnnual = hasErrors
    ? 0
    : payInputMode === "hourly"
      ? rate * hours * weeks
      : annualAmountType === "includesSuper"
        ? annual / (1 + SUPER_RATE)
        : annual;
  const grossWeekly = payInputMode === "hourly" ? rate * hours : grossAnnual / 52;
  const grossFortnightly = grossWeekly * 2;
  const grossMonthly = grossAnnual / 12;
  const workingPayPeriods = payInputMode === "hourly" && !weeksError ? weeks : 52;
  const isWorkingHolidayMaker = taxProfile === "workingHolidayMaker";
  const incomeTaxBeforeOffsets = isWorkingHolidayMaker
    ? calculateWorkingHolidayMakerTax(grossAnnual)
    : calculateResidentIncomeTax(grossAnnual);
  const estimatedLito = isWorkingHolidayMaker
    ? 0
    : Math.min(incomeTaxBeforeOffsets, calculateLowIncomeTaxOffset(grossAnnual));
  const estimatedIncomeTax = incomeTaxBeforeOffsets - estimatedLito;
  const estimatedMedicareLevy = !isWorkingHolidayMaker && includeMedicareLevy ? calculateMedicareLevy(grossAnnual) : 0;
  const estimatedHelpRepayment = !isWorkingHolidayMaker && includeHelpRepayment ? calculateHelpRepayment(grossAnnual) : 0;
  const estimatedTotalDeductions = estimatedIncomeTax + estimatedMedicareLevy + estimatedHelpRepayment;
  const netAnnual = grossAnnual - estimatedTotalDeductions;
  const netMonthly = netAnnual / 12;
  const netWeekly = netAnnual / workingPayPeriods;
  const netFortnightly = netWeekly * 2;
  const superWeekly = grossWeekly * SUPER_RATE;
  const superFortnightly = grossFortnightly * SUPER_RATE;
  const superAnnual = grossAnnual * SUPER_RATE;
  const totalPackage = grossAnnual + superAnnual;
  const incomeTaxRate = grossAnnual > 0 ? estimatedIncomeTax / grossAnnual : 0;
  const medicareLevyRate = grossAnnual > 0 ? estimatedMedicareLevy / grossAnnual : 0;
  const helpRepaymentRate = grossAnnual > 0 ? estimatedHelpRepayment / grossAnnual : 0;
  const totalDeductionRate = grossAnnual > 0 ? estimatedTotalDeductions / grossAnnual : 0;
  const applicableMinimum = employmentType === "casual" ? CASUAL_MINIMUM_RATE : PERMANENT_MINIMUM_RATE;
  const belowMinimum = !rateError && rate < applicableMinimum;

  function resetCalculator() {
    setTaxProfile("resident");
    setPayInputMode("hourly");
    setHourlyRate(DEFAULT_HOURLY_RATE);
    setWeeklyHours(DEFAULT_WEEKLY_HOURS);
    setWorkingWeeks(DEFAULT_WORKING_WEEKS);
    setAnnualSalary(DEFAULT_ANNUAL_SALARY);
    setAnnualAmountType("plusSuper");
    setIncludeMedicareLevy(true);
    setIncludeHelpRepayment(false);
    setEmploymentType("permanent");
    setTouched({ rate: false, hours: false, weeks: false, annual: false });
    setCopyStatus("idle");
    setSaveStatus("idle");
  }

  function saveCalculation() {
    const calculation: SavedCalculation = {
      taxProfile,
      payInputMode,
      hourlyRate,
      weeklyHours,
      workingWeeks,
      annualSalary,
      annualAmountType,
      includeMedicareLevy,
      includeHelpRepayment,
      employmentType,
    };

    try {
      window.localStorage.setItem(SAVED_CALCULATION_KEY, JSON.stringify(calculation));
      setHasSavedCalculation(true);
      setSaveStatus("saved");
      window.setTimeout(() => setSaveStatus("idle"), 2_000);
    } catch {
      setSaveStatus("error");
    }
  }

  function loadCalculation() {
    try {
      const savedValue = window.localStorage.getItem(SAVED_CALCULATION_KEY);
      if (!savedValue) return;

      const calculation = JSON.parse(savedValue) as SavedCalculation;
      setTaxProfile(calculation.taxProfile);
      setPayInputMode(calculation.payInputMode);
      setHourlyRate(calculation.hourlyRate);
      setWeeklyHours(calculation.weeklyHours);
      setWorkingWeeks(calculation.workingWeeks);
      setAnnualSalary(calculation.annualSalary);
      setAnnualAmountType(calculation.annualAmountType);
      setIncludeMedicareLevy(calculation.includeMedicareLevy);
      setIncludeHelpRepayment(calculation.includeHelpRepayment);
      setEmploymentType(calculation.employmentType);
      setTouched({ rate: false, hours: false, weeks: false, annual: false });
      setCopyStatus("idle");
      setSaveStatus("loaded");
      window.setTimeout(() => setSaveStatus("idle"), 2_000);
    } catch {
      setSaveStatus("error");
    }
  }

  function selectTaxProfile(profile: TaxProfile) {
    setTaxProfile(profile);
    setIncludeMedicareLevy(profile === "resident");
    setIncludeHelpRepayment(false);
    setCopyStatus("idle");
  }

  async function copyResults() {
    const summary = [
      "Aussie Compass 급여 계산 결과",
      `세금 유형: ${isWorkingHolidayMaker ? "Working Holiday Maker (세법상 비거주자 가정)" : "호주 세법상 거주자"}`,
      payInputMode === "hourly" ? `계산 기준: 연 ${workingWeeks}주 근무` : "계산 기준: 입력 연봉",
      "",
      `[세전 급여]`,
      `주급 (Weekly): ${formatCurrency(grossWeekly)}`,
      `격주급 (Fortnightly): ${formatCurrency(grossFortnightly)}`,
      `월급 (Monthly): ${formatCurrency(grossMonthly)}`,
      `연봉 (Annual): ${formatCurrency(grossAnnual)}`,
      "",
      `[예상 세후 소득]`,
      `세후 주급 (Weekly): ${formatCurrency(netWeekly)}`,
      `세후 격주급 (Fortnightly): ${formatCurrency(netFortnightly)}`,
      `세후 월급 (Monthly): ${formatCurrency(netMonthly)}`,
      `세후 연 소득 (Annual): ${formatCurrency(netAnnual)}`,
      `총 예상 공제: ${formatCurrency(estimatedTotalDeductions)} (${percentFormatter.format(totalDeductionRate)})`,
      "",
      `[Super]`,
      `연 Super: ${formatCurrency(superAnnual)}`,
      `연봉 + Super: ${formatCurrency(totalPackage)}`,
      "",
      "참고용 예상치이며 실제 세금과 Super는 개인 상황에 따라 달라질 수 있습니다.",
    ].join("\n");

    try {
      await navigator.clipboard.writeText(summary);
      setCopyStatus("success");
      window.setTimeout(() => setCopyStatus("idle"), 2_000);
    } catch {
      setCopyStatus("error");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.3fr]">
      <section id="salary-inputs" className="scroll-mt-24 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
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

        <a href="#salary-results" className="mt-5 flex w-full items-center justify-center rounded-lg bg-navy px-4 py-3 text-sm font-semibold text-white transition hover:bg-navy-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 lg:hidden">
          계산 결과 바로 보기 ↓
        </a>

        <div className="mt-5 rounded-xl border border-border bg-surface p-4">
          <p className="text-sm font-medium text-navy">내 계산 조건</p>
          <p className="mt-1 text-sm leading-6 text-muted">현재 입력값을 이 기기에 저장하고 다음 방문 때 다시 불러올 수 있습니다.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={saveCalculation} disabled={hasErrors} className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-light disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">
              {saveStatus === "saved" ? "저장 완료" : "현재 조건 저장"}
            </button>
            <button type="button" onClick={loadCalculation} disabled={!hasSavedCalculation} className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-semibold text-navy transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">
              {saveStatus === "loaded" ? "불러오기 완료" : "저장 조건 불러오기"}
            </button>
          </div>
          {saveStatus === "error" ? <p role="alert" className="mt-2 text-sm text-red-600">브라우저 저장 공간을 사용할 수 없습니다.</p> : null}
        </div>

        <fieldset className="mt-7">
          <legend className="text-sm font-medium text-navy">세금 유형</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <label className={`cursor-pointer rounded-xl border p-4 transition ${taxProfile === "resident" ? "border-navy bg-navy/5" : "border-border"}`}>
              <input type="radio" name="tax-profile" checked={taxProfile === "resident"} onChange={() => selectTaxProfile("resident")} className="mr-2 accent-navy" />
              <span className="font-medium text-navy">호주 세법상 거주자</span>
            </label>
            <label className={`cursor-pointer rounded-xl border p-4 transition ${taxProfile === "workingHolidayMaker" ? "border-navy bg-navy/5" : "border-border"}`}>
              <input type="radio" name="tax-profile" checked={taxProfile === "workingHolidayMaker"} onChange={() => selectTaxProfile("workingHolidayMaker")} className="mr-2 accent-navy" />
              <span className="font-medium text-navy">Working Holiday Maker</span>
            </label>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted">
            {isWorkingHolidayMaker
              ? "일반적인 세법상 비거주자 WHM을 가정합니다. LITO, Medicare Levy와 HELP/HECS는 포함하지 않습니다."
              : "2026–27 호주 세법상 거주자 세율과 해당 공제 기준을 적용합니다."}
          </p>
        </fieldset>

        <fieldset className="mt-7">
          <legend className="text-sm font-medium text-navy">급여 입력 방식</legend>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className={`cursor-pointer rounded-xl border p-4 transition ${payInputMode === "hourly" ? "border-navy bg-navy/5" : "border-border"}`}>
              <input type="radio" name="pay-input-mode" checked={payInputMode === "hourly"} onChange={() => setPayInputMode("hourly")} className="mr-2 accent-navy" />
              <span className="font-medium text-navy">시급으로 계산</span>
            </label>
            <label className={`cursor-pointer rounded-xl border p-4 transition ${payInputMode === "annual" ? "border-navy bg-navy/5" : "border-border"}`}>
              <input type="radio" name="pay-input-mode" checked={payInputMode === "annual"} onChange={() => setPayInputMode("annual")} className="mr-2 accent-navy" />
              <span className="font-medium text-navy">연봉으로 계산</span>
            </label>
          </div>
        </fieldset>

        {payInputMode === "hourly" ? <>
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

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
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

          <label className="block">
            <span className="text-sm font-medium text-navy">연간 근무 주 수</span>
            <input type="number" min="1" max="52" step="1" inputMode="numeric" value={workingWeeks} onChange={(event) => setWorkingWeeks(event.target.value)} onBlur={() => setTouched((current) => ({ ...current, weeks: true }))} aria-invalid={touched.weeks && Boolean(weeksError)} className={`mt-2 w-full rounded-lg border bg-background px-4 py-3 text-navy outline-none transition focus:ring-2 focus:ring-navy/15 ${touched.weeks && weeksError ? "border-red-500" : "border-border focus:border-navy"}`} />
            {touched.weeks && weeksError ? <span role="alert" className="mt-2 block text-sm text-red-600">{weeksError}</span> : <span className="mt-2 block text-sm leading-6 text-muted">기본값은 52주입니다. 무급휴가나 계절근무가 있다면 실제 근무 주 수로 조정하세요.</span>}
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
        </> : (<>
          <fieldset className="mt-7">
            <legend className="text-sm font-medium text-navy">연봉 표기 방식</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <label className={`cursor-pointer rounded-xl border p-4 transition ${annualAmountType === "plusSuper" ? "border-navy bg-navy/5" : "border-border"}`}>
                <input type="radio" name="annual-amount-type" checked={annualAmountType === "plusSuper"} onChange={() => setAnnualAmountType("plusSuper")} className="mr-2 accent-navy" />
                <span className="font-medium text-navy">연봉 + Super 별도</span>
              </label>
              <label className={`cursor-pointer rounded-xl border p-4 transition ${annualAmountType === "includesSuper" ? "border-navy bg-navy/5" : "border-border"}`}>
                <input type="radio" name="annual-amount-type" checked={annualAmountType === "includesSuper"} onChange={() => setAnnualAmountType("includesSuper")} className="mr-2 accent-navy" />
                <span className="font-medium text-navy">Super 포함 총 패키지</span>
              </label>
            </div>
          </fieldset>

          <label className="mt-6 block">
            <span className="text-sm font-medium text-navy">{annualAmountType === "includesSuper" ? "Super 포함 총 패키지" : "나의 세전 연봉 (Super 제외)"}</span>
            <div className="relative mt-2">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-muted">$</span>
              <input type="number" min="1" step="100" inputMode="decimal" value={annualSalary} onChange={(event) => setAnnualSalary(event.target.value)} onBlur={() => setTouched((current) => ({ ...current, annual: true }))} aria-invalid={touched.annual && Boolean(annualError)} className={`w-full rounded-lg border bg-background py-3 pl-8 pr-4 text-navy outline-none transition focus:ring-2 focus:ring-navy/15 ${touched.annual && annualError ? "border-red-500" : "border-border focus:border-navy"}`} />
            </div>
            {touched.annual && annualError ? <span role="alert" className="mt-2 block text-sm text-red-600">{annualError}</span> : null}
            <span className="mt-2 block text-sm leading-6 text-muted">
              {annualAmountType === "includesSuper"
                ? "입력한 총 패키지에서 12% Super와 세전 연봉을 역산합니다."
                : "채용 공고의 연봉이 “plus super” 또는 “super 제외”로 표시된 경우 입력하세요."}
            </span>
          </label>
        </>)}

        <label className={`mt-6 flex items-start gap-3 rounded-xl border border-border bg-surface p-4 ${isWorkingHolidayMaker ? "cursor-not-allowed opacity-55" : "cursor-pointer"}`}>
          <input type="checkbox" checked={includeMedicareLevy} disabled={isWorkingHolidayMaker} onChange={(event) => setIncludeMedicareLevy(event.target.checked)} className="mt-1 h-4 w-4 accent-navy" />
          <span>
            <span className="block text-sm font-medium text-navy">Medicare Levy 예상액 포함</span>
            <span className="mt-1 block text-sm leading-6 text-muted">일반 개인 기준 2%와 저소득 감면 구간을 적용합니다. 면제 대상이면 선택을 해제하세요.</span>
          </span>
        </label>

        <label className={`mt-3 flex items-start gap-3 rounded-xl border border-border bg-surface p-4 ${isWorkingHolidayMaker ? "cursor-not-allowed opacity-55" : "cursor-pointer"}`}>
          <input type="checkbox" checked={includeHelpRepayment} disabled={isWorkingHolidayMaker} onChange={(event) => setIncludeHelpRepayment(event.target.checked)} className="mt-1 h-4 w-4 accent-navy" />
          <span>
            <span className="block text-sm font-medium text-navy">HELP/HECS 상환 예상액 포함</span>
            <span className="mt-1 block text-sm leading-6 text-muted">2026–27 한계상환 기준을 급여에 적용합니다. HELP 등 학자금 대출이 있는 경우 선택하세요.</span>
          </span>
        </label>
      </section>

      <section id="salary-results" className="scroll-mt-24 rounded-2xl bg-navy p-6 text-white shadow-sm sm:p-8" aria-live="polite">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">통합 급여 결과</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/70">세전 급여, 예상 세후 소득, Super를 한눈에 확인하세요.</p>
          </div>
          {!hasErrors ? (
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/75">총 예상 공제율 {percentFormatter.format(totalDeductionRate)}</div>
              <button type="button" onClick={copyResults} className="salary-print-hide rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy">
                {copyStatus === "success" ? "복사 완료" : "결과 복사"}
              </button>
              <button type="button" onClick={() => window.print()} className="salary-print-hide rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy">
                인쇄 / PDF 저장
              </button>
              <a href="#salary-inputs" className="salary-print-hide rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy lg:hidden">
                입력 수정 ↑
              </a>
            </div>
          ) : null}
        </div>

        {copyStatus === "error" ? (
          <p role="alert" className="mt-3 text-sm text-red-200">결과를 복사하지 못했습니다. 브라우저의 클립보드 권한을 확인해 주세요.</p>
        ) : null}

        {!hasErrors ? (
          <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/55">적용 기준</p>
            <ul className="mt-3 flex flex-wrap gap-2 text-xs text-white/80" aria-label="계산 적용 기준">
              <li className="rounded-full bg-white/10 px-3 py-1.5">{isWorkingHolidayMaker ? "Working Holiday Maker" : "호주 세법상 거주자"}</li>
              <li className="rounded-full bg-white/10 px-3 py-1.5">
                {payInputMode === "hourly"
                  ? `시급 · 연 ${workingWeeks}주`
                  : annualAmountType === "includesSuper"
                    ? "연봉 · Super 포함"
                    : "연봉 · Super 별도"}
              </li>
              {payInputMode === "hourly" ? (
                <li className="rounded-full bg-white/10 px-3 py-1.5">{employmentType === "casual" ? "Casual" : "Permanent / Part-time"}</li>
              ) : null}
              <li className="rounded-full bg-white/10 px-3 py-1.5">Medicare {includeMedicareLevy && !isWorkingHolidayMaker ? "적용" : "제외"}</li>
              <li className="rounded-full bg-white/10 px-3 py-1.5">HELP/HECS {includeHelpRepayment && !isWorkingHolidayMaker ? "적용" : "제외"}</li>
              <li className="rounded-full bg-white/10 px-3 py-1.5">Super 12%</li>
            </ul>
          </div>
        ) : null}

        {hasErrors ? (
          <div className="mt-7 rounded-xl bg-white/10 p-5 text-sm leading-relaxed">정확한 결과를 계산하려면 입력값을 확인해 주세요.</div>
        ) : (
          <div className="mt-7 space-y-7">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-gold">세전 급여</h3>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <ResultCard label="주급 (Weekly)" value={grossWeekly} />
                <ResultCard label="격주급 (Fortnightly)" value={grossFortnightly} />
                <ResultCard label="월급 (Monthly)" value={grossMonthly} />
                <ResultCard label="연봉 (Annual)" value={grossAnnual} emphasis />
              </dl>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-gold">예상 세후 소득</h3>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <ResultCard label="세후 주급 (Weekly)" value={netWeekly} />
                <ResultCard label="세후 격주급 (Fortnightly)" value={netFortnightly} />
                <ResultCard label="세후 월급 (Monthly)" value={netMonthly} />
                <ResultCard label="세후 연 소득 (Annual)" value={netAnnual} emphasis />
              </dl>
              <dl className="mt-3 grid gap-4 rounded-xl bg-white/5 p-4 text-sm sm:grid-cols-2 xl:grid-cols-3">
                <div><dt className="text-white/60">LITO 적용 전 소득세</dt><dd className="mt-1 font-semibold">{formatCurrency(incomeTaxBeforeOffsets)}</dd></div>
                <div><dt className="text-white/60">LITO 세액공제</dt><dd className="mt-1 font-semibold text-emerald-300">{estimatedLito > 0 ? `-${formatCurrency(estimatedLito)}` : formatCurrency(0)}</dd></div>
                <div><dt className="text-white/60">예상 소득세</dt><dd className="mt-1 font-semibold">{formatCurrency(estimatedIncomeTax)} <span className="text-xs font-normal text-white/50">({percentFormatter.format(incomeTaxRate)})</span></dd></div>
                <div><dt className="text-white/60">예상 Medicare Levy</dt><dd className="mt-1 font-semibold">{formatCurrency(estimatedMedicareLevy)} <span className="text-xs font-normal text-white/50">({percentFormatter.format(medicareLevyRate)})</span></dd></div>
                <div><dt className="text-white/60">예상 HELP/HECS 상환</dt><dd className="mt-1 font-semibold">{formatCurrency(estimatedHelpRepayment)} <span className="text-xs font-normal text-white/50">({percentFormatter.format(helpRepaymentRate)})</span></dd></div>
                <div><dt className="text-white/60">총 예상 공제</dt><dd className="mt-1 font-semibold text-gold">{formatCurrency(estimatedTotalDeductions)} <span className="text-xs font-normal text-white/60">({percentFormatter.format(totalDeductionRate)})</span></dd></div>
              </dl>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-gold">Super 및 총 패키지</h3>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <ResultCard label="주 Super (Weekly)" value={superWeekly} />
                <ResultCard label="격주 Super (Fortnightly)" value={superFortnightly} />
                <ResultCard label="연 Super (Annual)" value={superAnnual} />
                <ResultCard label="연봉 + Super" value={totalPackage} emphasis />
              </dl>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
