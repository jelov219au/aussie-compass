export type PaydayScope = "on_or_before_2026_06_30" | "on_or_after_2026_07_01" | "unknown";
export type WorkerScope = "employee_18_plus" | "under_18_over_30_hours" | "under_18_not_over_30_hours" | "private_domestic" | "labour_contractor" | "other_or_unknown";
export type EarningsBasis = "qe_or_ote_categories_confirmed" | "categories_incomplete" | "unknown";
export type RateAndEstimate = "12_percent_estimate" | "award_or_agreement_extra_check" | "cannot_estimate";
export type ReceiptDeadline = "seven_business_days" | "first_contribution_twenty" | "transition_2026_07_28" | "other_exception_or_unknown";
export type EvidenceState = "payslip_only" | "fund_received" | "fund_missing" | "rejected_or_returned" | "mygov_only" | "evidence_conflict" | "unknown";
export type RoleAndHandoff = "employer_payroll" | "fund" | "ato" | "fair_work" | "registered_professional" | "none_yet";
export type PrivacyBoundary = "safe_minimum_only" | "redact_before_contact" | "do_not_send_sensitive" | "unknown";
export type SuperNextAction = "compare_one_payday" | "wait_until_due" | "ask_employer_payroll" | "ask_fund" | "check_mygov" | "report_to_ato" | "check_award_agreement" | "seek_advice" | "cannot_conclude";
export type SuperOutcomeStatus = "ready_to_ask" | "wait_or_verify" | "referral_ready";

export type OneSuperPaydayNextAction = {
  payday_scope: PaydayScope;
  worker_scope: WorkerScope;
  earnings_basis: EarningsBasis;
  rate_and_estimate: RateAndEstimate;
  receipt_deadline: ReceiptDeadline;
  evidence_state: EvidenceState;
  role_and_handoff: RoleAndHandoff;
  privacy_boundary: PrivacyBoundary;
  next_action: SuperNextAction;
};

export type SuperPaydayInput = {
  payday?: string;
  asOf?: string;
  workerScope?: WorkerScope;
  earningsBasis?: EarningsBasis;
  awardOrAgreementExtra?: boolean;
  contributionContext?: "ordinary" | "new_employee_first" | "new_fund_first" | "employer_internal_first" | "exception_or_unknown" | "transition_q4" | "bundled";
  evidenceState?: EvidenceState;
  employerAsked?: boolean;
  fundChecked?: boolean;
  minimumRecordsReady?: boolean;
  historicalBeforeThresholdAbolition?: boolean;
  contractorFactsUncertain?: boolean;
  fairWorkIssue?: boolean;
};

export type BusinessCalendar = { start: string; end: string; holidays: ReadonlySet<string> };

export const verifiedJuly2026Calendar: BusinessCalendar = {
  start: "2026-07-01",
  end: "2026-07-31",
  holidays: new Set<string>(),
};

const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const parseDate = (value?: string) => {
  if (!value || !isoDate.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
};

export function addBusinessDays(payday: string, days: number, calendar: BusinessCalendar): string | null {
  const date = parseDate(payday);
  if (!date || payday < calendar.start || payday > calendar.end || days < 1) return null;
  let counted = 0;
  while (counted < days) {
    date.setUTCDate(date.getUTCDate() + 1);
    const candidate = date.toISOString().slice(0, 10);
    if (candidate > calendar.end) return null;
    const weekday = date.getUTCDay();
    if (weekday !== 0 && weekday !== 6 && !calendar.holidays.has(candidate)) counted += 1;
  }
  return date.toISOString().slice(0, 10);
}

export function paydayScope(payday?: string): PaydayScope {
  if (!parseDate(payday)) return "unknown";
  return payday! >= "2026-07-01" ? "on_or_after_2026_07_01" : "on_or_before_2026_06_30";
}

const contactPrivacy = (role: RoleAndHandoff): PrivacyBoundary => role === "none_yet" ? "safe_minimum_only" : role === "registered_professional" ? "do_not_send_sensitive" : "redact_before_contact";

export function deriveOneSuperPaydayNextAction(input: SuperPaydayInput, calendar?: BusinessCalendar) {
  const scope = paydayScope(input.payday);
  const worker = input.workerScope ?? "other_or_unknown";
  const earnings = input.earningsBasis ?? "unknown";
  const evidence = input.evidenceState ?? "unknown";

  let deadline: ReceiptDeadline = "other_exception_or_unknown";
  if (scope === "on_or_before_2026_06_30" && input.payday && input.payday >= "2026-04-01" && input.payday <= "2026-06-30") deadline = "transition_2026_07_28";
  if (scope === "on_or_after_2026_07_01" && !input.contractorFactsUncertain && worker !== "other_or_unknown" && worker !== "private_domestic") {
    deadline = input.contributionContext === "new_employee_first" || input.contributionContext === "new_fund_first" ? "first_contribution_twenty" : input.contributionContext === "exception_or_unknown" || input.contributionContext === "bundled" ? "other_exception_or_unknown" : "seven_business_days";
  }

  const rate: RateAndEstimate = input.awardOrAgreementExtra ? "award_or_agreement_extra_check" : earnings === "qe_or_ote_categories_confirmed" && worker !== "under_18_not_over_30_hours" && worker !== "other_or_unknown" && worker !== "private_domestic" ? "12_percent_estimate" : "cannot_estimate";
  const days = deadline === "seven_business_days" ? 7 : deadline === "first_contribution_twenty" ? 20 : 0;
  const nextCheckDate = deadline === "transition_2026_07_28" ? "2026-07-28" : days && input.payday && calendar ? addBusinessDays(input.payday, days, calendar) : null;
  const duePassed = Boolean(nextCheckDate && input.asOf && parseDate(input.asOf) && input.asOf! > nextCheckDate);

  let role: RoleAndHandoff = "none_yet";
  let nextAction: SuperNextAction = "cannot_conclude";
  let outcomeStatus: SuperOutcomeStatus = "wait_or_verify";

  if (input.fairWorkIssue || input.awardOrAgreementExtra) {
    role = "fair_work"; nextAction = "check_award_agreement"; outcomeStatus = "ready_to_ask";
  } else if (input.historicalBeforeThresholdAbolition || (input.payday && input.payday < "2022-07-01")) {
    role = "registered_professional"; nextAction = "seek_advice";
  } else if (worker === "labour_contractor" || worker === "private_domestic") {
    role = "ato"; nextAction = "seek_advice"; outcomeStatus = "ready_to_ask";
  } else if (input.contractorFactsUncertain) {
    role = "ato";
  } else if (worker === "under_18_not_over_30_hours") {
    role = "none_yet";
  } else if (worker === "other_or_unknown" || scope === "unknown") {
    role = "employer_payroll"; nextAction = "ask_employer_payroll"; outcomeStatus = "ready_to_ask";
  } else if (input.contributionContext === "bundled") {
    role = "fund"; nextAction = "ask_fund"; outcomeStatus = "ready_to_ask";
  } else if (earnings !== "qe_or_ote_categories_confirmed") {
    role = "employer_payroll"; nextAction = "ask_employer_payroll"; outcomeStatus = "ready_to_ask";
  } else if (evidence === "fund_received") {
    role = "none_yet"; nextAction = "compare_one_payday"; outcomeStatus = "ready_to_ask";
  } else if (evidence === "rejected_or_returned") {
    role = "employer_payroll"; nextAction = "ask_employer_payroll"; outcomeStatus = "ready_to_ask";
  } else if (evidence === "mygov_only") {
    role = "fund"; nextAction = "ask_fund";
  } else if (evidence === "evidence_conflict") {
    role = "fund"; nextAction = "ask_fund"; outcomeStatus = "ready_to_ask";
  } else if (evidence === "fund_missing" && duePassed && input.employerAsked && input.fundChecked && input.minimumRecordsReady) {
    role = "ato"; nextAction = "report_to_ato"; outcomeStatus = "referral_ready";
  } else if (evidence === "fund_missing" && duePassed) {
    role = "employer_payroll"; nextAction = "ask_employer_payroll"; outcomeStatus = "ready_to_ask";
  } else if ((evidence === "fund_missing" || evidence === "payslip_only") && nextCheckDate && !duePassed && input.contributionContext !== "employer_internal_first") {
    role = "fund"; nextAction = "wait_until_due";
  } else if (input.contributionContext === "employer_internal_first") {
    role = "employer_payroll"; nextAction = "ask_employer_payroll"; outcomeStatus = "ready_to_ask";
  } else {
    role = "fund"; nextAction = "ask_fund"; outcomeStatus = "ready_to_ask";
  }

  const outcome: OneSuperPaydayNextAction = {
    payday_scope: scope,
    worker_scope: worker,
    earnings_basis: earnings,
    rate_and_estimate: rate,
    receipt_deadline: deadline,
    evidence_state: evidence,
    role_and_handoff: role,
    privacy_boundary: nextAction === "report_to_ato" || evidence === "rejected_or_returned" || evidence === "mygov_only" || input.contractorFactsUncertain || role === "registered_professional"
      ? "do_not_send_sensitive"
      : worker === "other_or_unknown" || input.awardOrAgreementExtra || (nextAction === "ask_employer_payroll" && earnings !== "qe_or_ote_categories_confirmed") || input.contributionContext === "employer_internal_first"
        ? "safe_minimum_only"
        : contactPrivacy(role),
    next_action: nextAction,
  };
  return { outcome, outcomeStatus, nextCheckDate };
}
