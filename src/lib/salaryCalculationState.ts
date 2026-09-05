export type TaxYear = "2025-26" | "2026-27";
export type SalaryCalculation = { taxYear: TaxYear; taxProfile: "resident" | "workingHolidayMaker"; payInputMode: "hourly" | "annual"; hourlyRate: string; weeklyHours: string; workingWeeks: string; annualSalary: string; annualAmountType: "plusSuper" | "includesSuper"; includeMedicareLevy: boolean; includeHelpRepayment: boolean; employmentType: "permanent" | "casual" };
export function salaryInputErrors(data: SalaryCalculation) {
  const rate = Number(data.hourlyRate), hours = Number(data.weeklyHours), weeks = Number(data.workingWeeks), annual = Number(data.annualSalary);
  const numeric = (value: string) => /^[+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim());
  const errors = {
    rate: !numeric(data.hourlyRate) || !Number.isFinite(rate) || rate <= 0 ? "0보다 큰 유효한 시급을 입력해 주세요." : "",
    hours: !numeric(data.weeklyHours) || !Number.isFinite(hours) || hours <= 0 || hours > 168 ? "0보다 크고 168 이하인 시간을 입력해 주세요." : "",
    weeks: !numeric(data.workingWeeks) || !Number.isFinite(weeks) || !Number.isInteger(weeks) || weeks < 1 || weeks > 52 ? "1 이상 52 이하의 정수로 근무 주 수를 입력해 주세요." : "",
    annual: !numeric(data.annualSalary) || !Number.isFinite(annual) || annual <= 0 ? "0보다 큰 유효한 연봉을 입력해 주세요." : "",
    overflow: "",
  };
  const inputInvalid = data.payInputMode === "hourly" ? Boolean(errors.rate || errors.hours || errors.weeks) : Boolean(errors.annual);
  const gross = data.payInputMode === "hourly" ? rate * hours * weeks : data.annualAmountType === "includesSuper" ? annual / 1.12 : annual;
  const weekly = data.payInputMode === "hourly" ? rate * hours : gross / 52;
  if (!inputInvalid && ![gross, weekly, weekly * 2, gross * 1.12].every(Number.isFinite)) errors.overflow = "입력 금액이 계산 가능한 범위를 넘었습니다. 금액과 근무시간을 확인하세요.";
  return { ...errors, invalid: inputInvalid || Boolean(errors.overflow) };
}
export function parseSavedSalary(raw: string): SalaryCalculation | null {
  try {
    const d: unknown = JSON.parse(raw);
    if (!d || typeof d !== "object" || Array.isArray(d)) return null;
    const value = d as Record<string, unknown>;
    if (Object.keys(value).some(key => !["taxYear", "taxProfile", "payInputMode", "hourlyRate", "weeklyHours", "workingWeeks", "annualSalary", "annualAmountType", "includeMedicareLevy", "includeHelpRepayment", "employmentType"].includes(key))
      || (value.taxYear !== undefined && value.taxYear !== "2025-26" && value.taxYear !== "2026-27") || (value.taxProfile !== "resident" && value.taxProfile !== "workingHolidayMaker")
      || (value.payInputMode !== "hourly" && value.payInputMode !== "annual") || (value.annualAmountType !== "plusSuper" && value.annualAmountType !== "includesSuper")
      || (value.employmentType !== "permanent" && value.employmentType !== "casual") || typeof value.includeMedicareLevy !== "boolean" || typeof value.includeHelpRepayment !== "boolean"
      || ["hourlyRate", "weeklyHours", "workingWeeks", "annualSalary"].some(key => typeof value[key] !== "string" || value[key].length > 128 || /[\u0000-\u001f]/.test(value[key]))) return null;
    const restored = { ...value, taxYear: value.taxYear ?? "2026-27" } as SalaryCalculation;
    return salaryInputErrors(restored).invalid ? null : restored;
  } catch { return null; }
}
export const superGuidance = (year: TaxYear) => year === "2026-27" ? {
  basis: "2026–27은 qualifying earnings(QE) 기준입니다. 이 도구는 QE를 구분해 수집하지 않으므로 법정 SG 금액이나 납부일·예외를 판정하지 않습니다.",
  href: "https://www.ato.gov.au/businesses-and-organisations/super-for-employers/payday-super",
} : {
  basis: "2025–26은 ordinary time earnings(OTE) 기준입니다. 실제 대상 소득, 적용 상한과 개인 상황에 따라 달라지며 이 도구는 법정 SG 금액을 판정하지 않습니다.",
  href: "https://www.ato.gov.au/businesses-and-organisations/super-for-employers/quarterly-super-to-30-june-2026/how-much-super-to-pay",
};
export const annualEstimateNotice = "선택한 연간 근무 주 수 또는 연봉이 이어진다는 가정의 예상치입니다. 급여일의 실제 원천징수액은 Payroll의 PAYG 표와 신고사항에 따라 달라질 수 있습니다. 시급 모드의 주·격주 세후 금액은 예상 연세액을 근무 주 수로 나눈 값이며, 연봉 모드는 52주로 환산합니다. 월액은 연간 ÷ 12입니다.";
