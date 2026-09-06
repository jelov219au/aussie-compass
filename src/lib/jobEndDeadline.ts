export const JOB_END_ROUTES = {
  final: "https://www.fairwork.gov.au/ending-employment/final-pay",
  leave: "https://www.fairwork.gov.au/leave/annual-leave/payment-for-annual-leave",
  redundancy: "https://www.fairwork.gov.au/ending-employment/redundancy",
  super: "https://www.fairwork.gov.au/pay-and-wages/tax-and-superannuation",
  help: "https://www.fairwork.gov.au/workplace-problems/common-workplace-problems/ive-lost-my-job-and-im-not-sure-what-im-entitled-to",
  person: "https://www.servicesaustralia.gov.au/when-you-need-employment-separation-certificate",
  employer: "https://www.servicesaustralia.gov.au/employment-separation-certificates-for-employers",
} as const;
export type JobEndEvent = "unknown" | "final_pay_under_instrument" | "payment_in_lieu" | "requested_employment_certificate";
export type JobEndEvidence = "not_checked" | "requested" | "received_not_verified" | "verified_by_user_outside_product" | "unavailable";
export type JobEndInput = {
  event: JobEndEvent;
  today: string;
  instrument?: "unknown" | "award_unknown" | "agreement_unknown" | "contract_only" | "award_free" | "verified7" | "verifiedDate";
  finalItem?: "pay" | "redundancy" | "annualLeave" | "sickLeave" | "super";
  notice?: "unknown" | "payout" | "partial" | "worked";
  certificate?: "unknown" | "recipientRequested" | "employerEmployeeRequest" | "employerAgencyRequest" | "newClaim" | "noRequest";
  terminationDate?: string;
  requestDate?: string;
  verifiedDue?: string;
  publicHolidayRuleUnknown?: boolean;
  paymentMissing?: boolean;
  certificateOutstanding?: boolean;
  cannotGetCertificate?: boolean;
  urgentLoss?: boolean;
  hardship?: boolean;
  sourceUnavailable?: boolean;
  evidence?: JobEndEvidence;
};
export const JOB_END_ACTIONS = {
  check_award_agreement_contract: "Award·Agreement·Contract 확인하기",
  check_final_pay_items: "마지막 급여 항목 확인하기",
  ask_employer_for_payment_in_lieu_record: "통지수당 기록 요청 방법 확인하기",
  request_employment_separation_certificate: "Certificate 필요 여부 확인하기",
  submit_certificate_to_services_australia: "Services Australia 제출 안내 보기",
  give_certificate_to_requester: "고용주의 Certificate 제공 안내 보기",
  use_services_australia_alternative_evidence: "Certificate 대체자료 확인하기",
  check_redundancy_entitlement: "Redundancy 적용 기준 확인하기",
  check_unused_annual_leave: "미사용 연차·수당 확인하기",
  check_super_separately: "Super를 별도로 확인하기",
  start_fwo_underpayment_steps: "미지급 급여 확인 절차 시작하기",
  contact_fwo_now: "Fair Work 도움 지금 확인하기",
  contact_services_australia_hardship_line: "Services Australia 긴급 생활비 상담 안내",
  choose_event_type: "먼저 확인할 항목 고르기",
  retry_official_source_on_recheck_date: "공식 안내 다시 열기",
} as const;
export type JobEndResult = {
  event_type: JobEndEvent;
  applicability: "unknown" | "user_confirmed" | "not_applicable";
  due_state: "instrument_due_verified" | "instrument_due_unknown" | "due_before_or_on_termination_day" | "certificate_due_14_days_from_request" | "certificate_request_or_condition_unknown" | "overdue_action_required" | "not_applicable" | "official_source_unavailable";
  due_or_recheck: string;
  official_route: string;
  next_action: keyof typeof JOB_END_ACTIONS;
  external_evidence_state: JobEndEvidence;
};
// Reject invalid/missing calendar dates before any arithmetic or overdue check.
export function validJobEndDate(value = ""): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
function addDays(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
function weekendDate(value: string, certificate = false): string {
  const day = new Date(`${value}T00:00:00Z`).getUTCDay();
  return `${value}${day === 6 ? " Saturday" : day === 0 ? " Sunday" : ""}${certificate && (day === 0 || day === 6) ? "; NO AUTO-SHIFT" : ""}`;
}
export function jobEndToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Brisbane" }).format(new Date());
}
export function buildJobEndDeadline(i: JobEndInput): JobEndResult {
  const out = (due_state: JobEndResult["due_state"], due_or_recheck: string, official_route: string, next_action: JobEndResult["next_action"], applicability: JobEndResult["applicability"] = "unknown"): JobEndResult => ({
    event_type: i.event,
    applicability,
    due_state,
    due_or_recheck,
    official_route,
    next_action,
    external_evidence_state: i.evidence ?? "not_checked",
  });
  const isPast = (date: string) => validJobEndDate(i.today) && date < i.today;
  const employer = i.certificate === "employerEmployeeRequest" || i.certificate === "employerAgencyRequest";
  const certificateRoute = employer ? JOB_END_ROUTES.employer : JOB_END_ROUTES.person;
  const certificateAction = employer ? "give_certificate_to_requester" : i.cannotGetCertificate ? "use_services_australia_alternative_evidence" : "submit_certificate_to_services_australia";
  // Urgent help does not depend on successfully classifying a missing payment.
  if (i.event === "requested_employment_certificate" && i.certificate === "recipientRequested" && i.hardship) return out("overdue_action_required", "NOW", JOB_END_ROUTES.person, "contact_services_australia_hardship_line", "user_confirmed");
  if (i.urgentLoss && i.event !== "requested_employment_certificate") return out("overdue_action_required", "NOW", JOB_END_ROUTES.help, "contact_fwo_now");
  if (i.sourceUnavailable) return out("official_source_unavailable", validJobEndDate(i.today) ? `RECHECK ${addDays(i.today, 1)} AEST` : "CHECK CURRENT DATE AND RETRY", i.event === "requested_employment_certificate" ? certificateRoute : JOB_END_ROUTES.final, "retry_official_source_on_recheck_date");
  if (i.event === "unknown") return out("instrument_due_unknown", "CHOOSE EVENT NOW", JOB_END_ROUTES.final, "choose_event_type");
  if (i.event === "payment_in_lieu") {
    if (i.notice === "worked") return out("not_applicable", "N/A FOR PAYMENT IN LIEU", JOB_END_ROUTES.final, "check_final_pay_items", "not_applicable");
    if (!validJobEndDate(i.terminationDate)) return out("instrument_due_unknown", "CHECK TERMINATION DATE NOW", JOB_END_ROUTES.final, "ask_employer_for_payment_in_lieu_record");
    if (i.notice !== "payout" && i.notice !== "partial") return out("instrument_due_unknown", "CHECK NOTICE APPLICABILITY NOW", JOB_END_ROUTES.final, "ask_employer_for_payment_in_lieu_record");
    if (i.paymentMissing && isPast(i.terminationDate!)) return out("overdue_action_required", "NOW", JOB_END_ROUTES.help, "contact_fwo_now", "user_confirmed");
    return out("due_before_or_on_termination_day", `ON OR BEFORE ${i.terminationDate}`, JOB_END_ROUTES.final, "ask_employer_for_payment_in_lieu_record", "user_confirmed");
  }
  if (i.event === "requested_employment_certificate") {
    if (i.certificate === "noRequest") return out("not_applicable", "NO DUE UNTIL REQUEST/CONDITION", JOB_END_ROUTES.person, "request_employment_separation_certificate", "not_applicable");
    if (i.certificate === "newClaim") return out("certificate_request_or_condition_unknown", "CHECK CLAIM TASK NOW", JOB_END_ROUTES.person, "request_employment_separation_certificate");
    if (i.certificate !== "recipientRequested" && !employer) return out("certificate_request_or_condition_unknown", "CHECK REQUEST AND CONDITION NOW", JOB_END_ROUTES.person, "request_employment_separation_certificate");
    if (!validJobEndDate(i.requestDate)) return out("certificate_request_or_condition_unknown", "CHECK REQUEST DATE NOW", certificateRoute, certificateAction, "user_confirmed");
    const due = addDays(i.requestDate!, 14);
    if (i.certificateOutstanding && isPast(due)) return out("overdue_action_required", "NOW", certificateRoute, certificateAction, "user_confirmed");
    return out("certificate_due_14_days_from_request", weekendDate(due, true), certificateRoute, certificateAction, "user_confirmed");
  }
  if (i.finalItem === "redundancy") return out("instrument_due_unknown", "CHECK NOW", JOB_END_ROUTES.redundancy, "check_redundancy_entitlement");
  if (i.finalItem === "annualLeave") return out("instrument_due_unknown", "CHECK WITH FINAL-PAY RULE", JOB_END_ROUTES.leave, "check_unused_annual_leave");
  if (i.finalItem === "sickLeave") return out("instrument_due_unknown", "CHECK FINAL-PAY ITEMS NOW", JOB_END_ROUTES.final, "check_final_pay_items");
  if (i.finalItem === "super") return out("instrument_due_unknown", "SEPARATE SUPER CHECK", JOB_END_ROUTES.super, "check_super_separately");
  if (i.publicHolidayRuleUnknown) return out("instrument_due_unknown", "CHECK INSTRUMENT; NO AUTO-SHIFT", JOB_END_ROUTES.final, "check_award_agreement_contract");
  let due: string | undefined;
  if (i.instrument === "verified7") {
    if (!validJobEndDate(i.terminationDate)) return out("instrument_due_unknown", "GET TERMINATION DATE", JOB_END_ROUTES.final, "check_award_agreement_contract");
    due = addDays(i.terminationDate!, 7);
  }
  if (i.instrument === "verifiedDate" && validJobEndDate(i.verifiedDue)) due = i.verifiedDue;
  if (due) {
    if (i.paymentMissing && isPast(due)) return out("overdue_action_required", "NOW", JOB_END_ROUTES.help, "start_fwo_underpayment_steps", "user_confirmed");
    return out("instrument_due_verified", weekendDate(due), JOB_END_ROUTES.final, "check_final_pay_items", "user_confirmed");
  }
  return out("instrument_due_unknown", "CHECK NOW", JOB_END_ROUTES.final, "check_award_agreement_contract");
}
export function jobEndDueLabel(result: JobEndResult): string {
  const labels: Record<string, string> = {
    "NOW": "지금 확인·문의하세요",
    "CHOOSE EVENT NOW": "어떤 돈·서류인지 먼저 골라주세요",
    "CHECK NOW": "적용 기준을 먼저 확인하세요",
    "GET TERMINATION DATE": "확정된 고용 종료일이 필요해요",
    "CHECK TERMINATION DATE NOW": "고용 종료일을 먼저 확인하세요",
    "CHECK NOTICE APPLICABILITY NOW": "통지수당 적용 여부를 먼저 확인하세요",
    "N/A FOR PAYMENT IN LIEU": "선택한 조건에는 통지수당 기한이 적용되지 않아요",
    "NO DUE UNTIL REQUEST/CONDITION": "현재 선택한 조건으로는 서류 기한을 정할 수 없어요",
    "CHECK CLAIM TASK NOW": "새 신청의 서류 요청 항목을 확인하세요",
    "CHECK REQUEST DATE NOW": "실제 서류 요청일을 확인하세요",
    "CHECK REQUEST AND CONDITION NOW": "서류 요청과 적용 조건을 확인하세요",
    "CHECK INSTRUMENT; NO AUTO-SHIFT": "공휴일 관련 조항을 확인하세요 · 자동 연장 없음",
    "CHECK WITH FINAL-PAY RULE": "연차수당과 마지막 급여 기준을 함께 확인하세요",
    "CHECK FINAL-PAY ITEMS NOW": "휴가 종류별 지급 항목을 확인하세요",
    "SEPARATE SUPER CHECK": "Super 납부는 급여와 별도로 확인하세요",
    "CHECK CURRENT DATE AND RETRY": "현재 날짜와 공식 안내를 다시 확인하세요",
  };
  return labels[result.due_or_recheck] ?? result.due_or_recheck.replace("ON OR BEFORE ", "이 날짜 전 또는 당일: ").replace("RECHECK ", "다시 확인할 날짜: ").replace(" Saturday", " 토요일").replace(" Sunday", " 일요일").replace("; NO AUTO-SHIFT", " · 자동 연장 없음");
}
