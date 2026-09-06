import assert from "node:assert/strict";
import { addBusinessDays, deriveOneSuperPaydayNextAction, verifiedJuly2026Calendar } from "../src/lib/superPaydayNextAction.ts";
import { readFile } from "node:fs/promises";

const exactKeys = ["payday_scope", "worker_scope", "earnings_basis", "rate_and_estimate", "receipt_deadline", "evidence_state", "role_and_handoff", "privacy_boundary", "next_action"];
const tuple = result => exactKeys.map(key => result.outcome[key]);
const base = { payday: "2026-07-01", asOf: "2026-07-09", workerScope: "employee_18_plus", earningsBasis: "qe_or_ote_categories_confirmed", contributionContext: "ordinary", evidenceState: "unknown" };
const cases = [
  ["F01", { ...base, asOf: "2026-07-10", evidenceState: "fund_received" }, ["on_or_after_2026_07_01","employee_18_plus","qe_or_ote_categories_confirmed","12_percent_estimate","seven_business_days","fund_received","none_yet","safe_minimum_only","compare_one_payday"], "ready_to_ask"],
  ["F02", { ...base, payday: "2026-07-02", workerScope: "under_18_over_30_hours", evidenceState: "payslip_only" }, ["on_or_after_2026_07_01","under_18_over_30_hours","qe_or_ote_categories_confirmed","12_percent_estimate","seven_business_days","payslip_only","fund","redact_before_contact","wait_until_due"], "wait_or_verify"],
  ["F03", { ...base, payday: "2026-07-02", workerScope: "under_18_not_over_30_hours", earningsBasis: "categories_incomplete" }, ["on_or_after_2026_07_01","under_18_not_over_30_hours","categories_incomplete","cannot_estimate","seven_business_days","unknown","none_yet","safe_minimum_only","cannot_conclude"], "wait_or_verify"],
  ["F04", { ...base, payday: "2026-07-02", workerScope: "other_or_unknown", earningsBasis: "unknown", contributionContext: "exception_or_unknown" }, ["on_or_after_2026_07_01","other_or_unknown","unknown","cannot_estimate","other_exception_or_unknown","unknown","employer_payroll","safe_minimum_only","ask_employer_payroll"], "ready_to_ask"],
  ["F05", { ...base, payday: "2026-07-03" }, ["on_or_after_2026_07_01","employee_18_plus","qe_or_ote_categories_confirmed","12_percent_estimate","seven_business_days","unknown","fund","redact_before_contact","ask_fund"], "ready_to_ask"],
  ["F06", { payday: "2022-06-30", asOf: "2026-09-07", workerScope: "other_or_unknown", earningsBasis: "unknown", contributionContext: "exception_or_unknown", evidenceState: "unknown", historicalBeforeThresholdAbolition: true }, ["on_or_before_2026_06_30","other_or_unknown","unknown","cannot_estimate","other_exception_or_unknown","unknown","registered_professional","do_not_send_sensitive","seek_advice"], "wait_or_verify"],
  ["F07", { ...base, workerScope: "labour_contractor", earningsBasis: "categories_incomplete" }, ["on_or_after_2026_07_01","labour_contractor","categories_incomplete","cannot_estimate","seven_business_days","unknown","ato","redact_before_contact","seek_advice"], "ready_to_ask"],
  ["F08", { ...base, workerScope: "other_or_unknown", earningsBasis: "unknown", contributionContext: "exception_or_unknown", contractorFactsUncertain: true }, ["on_or_after_2026_07_01","other_or_unknown","unknown","cannot_estimate","other_exception_or_unknown","unknown","ato","do_not_send_sensitive","cannot_conclude"], "wait_or_verify"],
  ["F09", { ...base, payday: "2026-06-15", contributionContext: "transition_q4" }, ["on_or_before_2026_06_30","employee_18_plus","qe_or_ote_categories_confirmed","12_percent_estimate","transition_2026_07_28","unknown","fund","redact_before_contact","ask_fund"], "ready_to_ask"],
  ["F10", { ...base, payday: "2026-06-15", earningsBasis: "categories_incomplete", contributionContext: "transition_q4", awardOrAgreementExtra: true }, ["on_or_before_2026_06_30","employee_18_plus","categories_incomplete","award_or_agreement_extra_check","transition_2026_07_28","unknown","fair_work","safe_minimum_only","check_award_agreement"], "ready_to_ask"],
  ["F11", { ...base, earningsBasis: "categories_incomplete" }, ["on_or_after_2026_07_01","employee_18_plus","categories_incomplete","cannot_estimate","seven_business_days","unknown","employer_payroll","safe_minimum_only","ask_employer_payroll"], "ready_to_ask"],
  ["F12", { ...base, payday: "2026-06-30", contributionContext: "transition_q4" }, ["on_or_before_2026_06_30","employee_18_plus","qe_or_ote_categories_confirmed","12_percent_estimate","transition_2026_07_28","unknown","fund","redact_before_contact","ask_fund"], "ready_to_ask"],
  ["F13", { ...base, evidenceState: "fund_missing" }, ["on_or_after_2026_07_01","employee_18_plus","qe_or_ote_categories_confirmed","12_percent_estimate","seven_business_days","fund_missing","fund","redact_before_contact","wait_until_due"], "wait_or_verify", "2026-07-10"],
  ["F14", { ...base, payday: "2026-07-02", asOf: "2026-07-13", evidenceState: "fund_received" }, ["on_or_after_2026_07_01","employee_18_plus","qe_or_ote_categories_confirmed","12_percent_estimate","seven_business_days","fund_received","none_yet","safe_minimum_only","compare_one_payday"], "ready_to_ask", "2026-07-13"],
  ["F15", { ...base, contributionContext: "new_employee_first", evidenceState: "fund_missing", asOf: "2026-07-10" }, ["on_or_after_2026_07_01","employee_18_plus","qe_or_ote_categories_confirmed","12_percent_estimate","first_contribution_twenty","fund_missing","fund","redact_before_contact","wait_until_due"], "wait_or_verify", "2026-07-29"],
  ["F16", { ...base, contributionContext: "new_fund_first", evidenceState: "fund_missing", asOf: "2026-07-10" }, ["on_or_after_2026_07_01","employee_18_plus","qe_or_ote_categories_confirmed","12_percent_estimate","first_contribution_twenty","fund_missing","fund","redact_before_contact","wait_until_due"], "wait_or_verify", "2026-07-29"],
  ["F17", { ...base, contributionContext: "employer_internal_first", evidenceState: "payslip_only", asOf: "2026-07-09" }, ["on_or_after_2026_07_01","employee_18_plus","qe_or_ote_categories_confirmed","12_percent_estimate","seven_business_days","payslip_only","employer_payroll","safe_minimum_only","ask_employer_payroll"], "ready_to_ask", "2026-07-10"],
  ["F18", { ...base, payday: "2026-06-30", contributionContext: "transition_q4", evidenceState: "evidence_conflict" }, ["on_or_before_2026_06_30","employee_18_plus","qe_or_ote_categories_confirmed","12_percent_estimate","transition_2026_07_28","evidence_conflict","fund","redact_before_contact","ask_fund"], "ready_to_ask", "2026-07-28"],
  ["F19", { ...base, payday: "2026-07-03", asOf: "2026-07-10", evidenceState: "payslip_only" }, ["on_or_after_2026_07_01","employee_18_plus","qe_or_ote_categories_confirmed","12_percent_estimate","seven_business_days","payslip_only","fund","redact_before_contact","wait_until_due"], "wait_or_verify", "2026-07-14"],
  ["F20", { ...base, evidenceState: "rejected_or_returned" }, ["on_or_after_2026_07_01","employee_18_plus","qe_or_ote_categories_confirmed","12_percent_estimate","seven_business_days","rejected_or_returned","employer_payroll","do_not_send_sensitive","ask_employer_payroll"], "ready_to_ask"],
  ["F21", { ...base, evidenceState: "mygov_only" }, ["on_or_after_2026_07_01","employee_18_plus","qe_or_ote_categories_confirmed","12_percent_estimate","seven_business_days","mygov_only","fund","do_not_send_sensitive","ask_fund"], "wait_or_verify"],
  ["F22", { ...base, asOf: "2026-07-11", evidenceState: "evidence_conflict" }, ["on_or_after_2026_07_01","employee_18_plus","qe_or_ote_categories_confirmed","12_percent_estimate","seven_business_days","evidence_conflict","fund","redact_before_contact","ask_fund"], "ready_to_ask"],
  ["F23", { ...base, earningsBasis: "categories_incomplete", contributionContext: "bundled", evidenceState: "evidence_conflict" }, ["on_or_after_2026_07_01","employee_18_plus","categories_incomplete","cannot_estimate","other_exception_or_unknown","evidence_conflict","fund","redact_before_contact","ask_fund"], "ready_to_ask"],
  ["F24", { ...base, asOf: "2026-07-11", evidenceState: "fund_missing" }, ["on_or_after_2026_07_01","employee_18_plus","qe_or_ote_categories_confirmed","12_percent_estimate","seven_business_days","fund_missing","employer_payroll","redact_before_contact","ask_employer_payroll"], "ready_to_ask"],
  ["F25", { ...base, asOf: "2026-07-11", evidenceState: "fund_missing", employerAsked: true, fundChecked: true, minimumRecordsReady: true }, ["on_or_after_2026_07_01","employee_18_plus","qe_or_ote_categories_confirmed","12_percent_estimate","seven_business_days","fund_missing","ato","do_not_send_sensitive","report_to_ato"], "referral_ready"],
  ["F26", { ...base, earningsBasis: "categories_incomplete", contributionContext: "exception_or_unknown", fairWorkIssue: true }, ["on_or_after_2026_07_01","employee_18_plus","categories_incomplete","cannot_estimate","other_exception_or_unknown","unknown","fair_work","redact_before_contact","check_award_agreement"], "ready_to_ask"],
];

for (const [name, input, expected, expectedStatus, expectedDate] of cases) {
  const result = deriveOneSuperPaydayNextAction(input, verifiedJuly2026Calendar);
  assert.deepEqual(Object.keys(result.outcome), exactKeys, `${name}: exact fields`);
  assert.deepEqual(tuple(result), expected, `${name}: tuple`);
  assert.equal(result.outcomeStatus, expectedStatus, `${name}: outcome status`);
  if (expectedDate) assert.equal(result.nextCheckDate, expectedDate, `${name}: due date`);
}

assert.equal(addBusinessDays("2026-07-01", 7, verifiedJuly2026Calendar), "2026-07-10");
assert.equal(addBusinessDays("2026-07-02", 7, verifiedJuly2026Calendar), "2026-07-13");
assert.equal(addBusinessDays("2026-07-03", 7, verifiedJuly2026Calendar), "2026-07-14");
assert.equal(addBusinessDays("2026-07-01", 20, verifiedJuly2026Calendar), "2026-07-29");
assert.equal(addBusinessDays("2026-08-03", 7, verifiedJuly2026Calendar), null, "unverified calendar must not create an exact date");
assert.deepEqual(tuple(deriveOneSuperPaydayNextAction({ ...base, workerScope: "private_domestic" }, verifiedJuly2026Calendar)), ["on_or_after_2026_07_01","private_domestic","qe_or_ote_categories_confirmed","cannot_estimate","other_exception_or_unknown","unknown","ato","redact_before_contact","seek_advice"], "private/domestic work must remain non-conclusive");

const component = await readFile(new URL("../src/components/tools/SuperPaydayNextAction.tsx", import.meta.url), "utf8");
const page = await readFile(new URL("../src/app/super-guide/page.tsx", import.meta.url), "utf8");
for (const value of ["one_super_payday_next_action", "새로고침하면 선택은 사라집니다", "마지막 8자", "TFN", "myGov 비밀번호·OTP", "2026-09-07"]) assert.ok(component.includes(value), value);
for (const value of ["30시간을 <strong", "2022년 7월 1일부터 폐지", "ATO contractor 기준", "2026년 7월 28일", "Fair Work Tax and super"]) assert.ok(page.includes(value), value);
assert.doesNotMatch(component, /localStorage|sessionStorage|fetch\(|XMLHttpRequest|track\(|analytics|URLSearchParams|location\./, "the memory-only result must not persist or transmit selections");
assert.doesNotMatch(component, /createCheckout|stripe|paymentReadiness/i);

console.log(`SUPER_ONE_PAYDAY_NEXT_ACTION=PASS cases=${cases.length} exactFields=${exactKeys.length} storageWrites=0 networkWrites=0`);
