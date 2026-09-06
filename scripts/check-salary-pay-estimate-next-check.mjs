import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const read = path => fs.readFileSync(path, "utf8");
const loadTs = async path => {
  const output = ts.transpileModule(read(path), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);
};

const nextCheck = await loadTs("src/lib/payEstimateNextCheck.ts");
const salaryState = await loadTs("src/lib/salaryCalculationState.ts");
const component = read("src/components/tools/SalaryCalculator.tsx");
const make = overrides => nextCheck.buildPayEstimateNextCheck({
  basis: "hourly",
  blocker: "missingPayslip",
  casual: false,
  includeHelp: false,
  includeMedicare: false,
  taxProfile: "resident",
  ...overrides,
});
const salary = overrides => ({ taxYear: "2026-27", taxProfile: "resident", payInputMode: "hourly", hourlyRate: "30", weeklyHours: "20", workingWeeks: "26", annualSalary: "70000", annualAmountType: "plusSuper", includeMedicareLevy: false, includeHelpRepayment: false, employmentType: "permanent", ...overrides });
let count = 0;
const test = (name, fn) => { fn(); count += 1; process.stdout.write(`PASS ${name}\n`); };

test("SC01 untouched defaults produce no next-check card", () => { assert.match(component, /useState\(false\)/); assert.match(component, /hasConfirmedInput \? \(/); });
test("SC02 blank hourly rate is invalid", () => assert.equal(salaryState.salaryInputErrors(salary({ hourlyRate: "" })).invalid, true));
test("SC03 zero hourly rate is invalid", () => assert.equal(salaryState.salaryInputErrors(salary({ hourlyRate: "0" })).invalid, true));
test("SC04 blank weekly hours is invalid", () => assert.equal(salaryState.salaryInputErrors(salary({ weeklyHours: "" })).invalid, true));
test("SC05 excessive weekly hours is invalid", () => assert.equal(salaryState.salaryInputErrors(salary({ weeklyHours: "169" })).invalid, true));
test("SC06 invalid working weeks are rejected", () => { for (const workingWeeks of ["", "0", "53", "26.5", "Infinity"]) assert.equal(salaryState.salaryInputErrors(salary({ workingWeeks })).invalid, true); });
test("SC07 invalid annual amount is rejected", () => { for (const annualSalary of ["", "0", "-1", "Infinity"]) assert.equal(salaryState.salaryInputErrors(salary({ payInputMode: "annual", annualSalary })).invalid, true); });
test("SC08 hourly result has exact missing-payslip tuple", () => assert.deepEqual(make(), {
  calculation_basis: "hourly_user_rate+annual_tax_estimate_not_payroll_withholding",
  included_excluded_components: "in:base_gross+selected_annual_tax+simple_12%; out_or_unknown:ordinary_overtime+penalty+allowance+loading+leave+reimbursement+salary_sacrifice+multiple_income+award_EA_contract+precise_PAYG+QE_OTE_receipt",
  comparison_pair: "not_ready_missing_payslip_or_bank",
  official_route: nextCheck.PAYSLIP_ROUTE,
  variance_status: "not_comparable",
  next_action: "get_payslip",
}));
test("SC09 Super stays a simple estimate", () => { const v = make({ blocker: "super" }); assert.equal(v.variance_status, "estimate_only"); assert.equal(v.official_route, nextCheck.ATO_SUPER_ROUTE); assert.match(v.included_excluded_components, /^in:base_gross\+simple_12%/); });
test("SC10 annual plus-Super basis and selected Medicare", () => { const v = make({ basis: "annualPlusSuper", blocker: "netVariance", includeMedicare: true }); assert.equal(v.calculation_basis, "annual_base_plus_super+annual_tax_estimate_not_payroll_withholding"); assert.match(v.included_excluded_components, /selected_medicare_HELP/); });
test("SC11 total-package reverse estimate", () => { const v = make({ basis: "annualPackage", blocker: "payBasis", includeMedicare: true }); assert.equal(v.calculation_basis, "annual_total_package_reverse_estimate+annual_tax_estimate_not_payroll_withholding"); assert.match(v.included_excluded_components, /actual_package_components/); });
test("SC12 WHM assumptions remain explicit", () => { const v = make({ basis: "annualPlusSuper", taxProfile: "workingHolidayMaker", blocker: "missingPayslip" }); assert.match(v.included_excluded_components, /WHM_annual_tax/); assert.match(v.included_excluded_components, /employer_registration/); });
test("SC13 foreign or uncertain tax profile stays unknown", () => { const v = make({ blocker: "foreignTaxProfile", taxProfile: "foreignUnknown" }); assert.match(v.included_excluded_components, /foreign_tax_profile\+medicare\+HELP/); assert.equal(v.variance_status, "not_comparable"); });
test("SC14 casual loading is never auto-added", () => { const v = make({ casual: true, blocker: "payBasis" }); assert.match(v.included_excluded_components, /in:user_entered_base_gross/); assert.match(v.included_excluded_components, /casual_loading_inclusion/); assert.match(component, /Casual 25% loading은 자동으로 더하지 않습니다/); });
test("SC15 overtime uncertainty routes to PACT", () => { const v = make({ blocker: "payBasis" }); assert.match(v.included_excluded_components, /ordinary_overtime/); assert.equal(v.official_route, nextCheck.PACT_ROUTE); });
test("SC16 penalty uncertainty is not zero", () => assert.match(make({ blocker: "payBasis" }).included_excluded_components, /penalty/));
test("SC17 allowance and reimbursement stay unknown", () => assert.match(make({ blocker: "payBasis" }).included_excluded_components, /allowance\+loading\+leave\+reimbursement/));
test("SC18 casual loading inclusion stays unknown", () => assert.match(make({ casual: true, blocker: "payBasis" }).included_excluded_components, /casual_loading_inclusion/));
test("SC19 Net variance routes to ATO withholding", () => { const v = make({ blocker: "netVariance" }); assert.equal(v.variance_status, "net_variance_needs_deduction_check"); assert.equal(v.next_action, "verify_withholding_in_ato"); });
test("SC20 QE and OTE remain outside the estimate", () => assert.match(make({ blocker: "super" }).included_excluded_components, /QE_OTE_receipt/));
test("SC21 missing Payslip blocks comparison", () => { const v = make(); assert.equal(v.comparison_pair, "not_ready_missing_payslip_or_bank"); assert.equal(v.next_action, "get_payslip"); });
test("SC22 missing bank record blocks Net comparison", () => { const v = make({ blocker: "missingBank" }); assert.equal(v.comparison_pair, "not_ready_missing_payslip_or_bank"); assert.equal(v.next_action, "get_bank_transaction"); });
test("SC23 user-reviewed match remains qualified", () => { const v = make({ blocker: "matched" }); assert.equal(v.variance_status, "matched_user_reviewed"); assert.equal(v.next_action, "verify_payslip_items"); });
test("SC24 unresolved Gross basis routes to PACT", () => { const v = make({ blocker: "payBasis" }); assert.equal(v.variance_status, "gross_variance_needs_basis_check"); assert.equal(v.official_route, nextCheck.PACT_ROUTE); });
test("SC25 reviewed Gross mismatch routes to underpayment", () => { const v = make({ blocker: "grossMismatch" }); assert.equal(v.official_route, "/underpayment-guide"); assert.equal(v.next_action, "open_underpayment_next_action"); });
test("SC26 Gross-first then Net comparison is fixed", () => assert.equal(make({ blocker: "netVariance" }).comparison_pair, "estimate_gross_to_payslip_gross_then_payslip_net_to_bank_net"));
test("SC27 Super blocker has one ATO route", () => { const v = make({ blocker: "super" }); assert.equal(v.official_route, nextCheck.ATO_SUPER_ROUTE); assert.equal(v.next_action, "verify_super_qe_and_receipt"); });
test("SC28 reducer emits exactly one route and action", () => { for (const blocker of ["missingPayslip", "missingBank", "foreignTaxProfile", "payBasis", "grossMismatch", "netVariance", "super", "matched"]) { const v = make({ blocker }); assert.equal(typeof v.official_route, "string"); assert.equal(typeof v.next_action, "string"); } });
test("SC29 next-check is memory-only and omitted from save/share/copy", () => { const beforeCard = component.slice(0, component.indexOf("function PayEstimateNextCheckCard")); const persistence = component.slice(component.indexOf("function saveCalculation"), component.indexOf("return (", component.indexOf("function saveCalculation"))); assert.doesNotMatch(persistence, /variance_status|next_action|official_route|comparison_pair/); assert.doesNotMatch(beforeCard, /localStorage\.setItem\([^)]*pay_estimate/); assert.match(component, /salary-print-hide mt-5/); });
test("SC30 no next-check analytics payload exists", () => assert.doesNotMatch(component, /track[^\n]*(variance_status|next_action|official_route)|analytics[^\n]*(variance_status|next_action|official_route)/i));
test("SC31 six fields render immediately after core result in exact order", () => { assert.deepEqual([...component.matchAll(/^\s+"(calculation_basis|included_excluded_components|comparison_pair|official_route|variance_status|next_action)",$/gm)].map(match => match[1]), ["calculation_basis", "included_excluded_components", "comparison_pair", "official_route", "variance_status", "next_action"]); assert(component.indexOf("<PayEstimateNextCheckCard") < component.indexOf("상세 급여 및 공제 내역 보기")); });
test("SC32 control, focus, semantics and contrast hooks exist", () => { assert.match(component, /<select[\s\S]*?min-h-11/); assert.match(component, /<a[\s\S]*?min-h-11/); assert.match(component, /<dl[^>]*aria-label="급여 추정 다음 확인 결과"/); assert.match(component, /focus-visible:ring-2/); });

assert.equal(count, 32);
console.log(`PASS salary pay estimate next check: ${count} fixtures`);
