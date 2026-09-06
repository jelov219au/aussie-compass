export const ATO_DUE_ROUTE = "https://www.ato.gov.au/individuals-and-families/your-tax-return/how-to-lodge-your-tax-return";
export const ATO_NEED_ROUTE = "https://www.ato.gov.au/calculators-and-tools";
export const TPB_REGISTER_ROUTE = "https://www.tpb.gov.au/public-register";
export const TPB_CONSUMER_ROUTE = "https://www.tpb.gov.au/finding-and-using-tax-practitioner";

export type LodgingPath = "unknown" | "selfLodge" | "registeredAgent";
export type TaxGuideScenario = "standard" | "individualDate" | "individualUnreadable" | "overdue" | "atoNotice" | "atoUnavailable" | "agentUnverified" | "agentVerified" | "agentLateContact" | "priorOverdue" | "priorFixedPending" | "agentAppearsRegistered" | "agentUnregistered" | "agentAmbiguous" | "basOnly" | "tpbUnavailable";
export type TaxGuideNextAction = { income_year: string; lodging_path: string; due_state: string; due_or_recheck: string; official_route: string; next_action: string };

const iso = (date: Date) => date.toISOString().slice(0, 10);

export function generalSelfLodgeDate(incomeEndYear: number) {
  const nominal = new Date(Date.UTC(incomeEndYear, 9, 31));
  const day = nominal.getUTCDay();
  if (day === 6) nominal.setUTCDate(nominal.getUTCDate() + 2);
  if (day === 0) nominal.setUTCDate(nominal.getUTCDate() + 1);
  return iso(nominal);
}

export function buildTaxGuideNextAction(input: { incomeYear: "unknown" | "2025-26"; lodgingPath: LodgingPath; scenario: TaxGuideScenario; today: string; individualDueDate?: string }): TaxGuideNextAction {
  const { incomeYear, lodgingPath, scenario, today, individualDueDate } = input;
  const base = { income_year: incomeYear === "unknown" ? "unknown" : "2025–26", lodging_path: lodgingPath };
  const nextDay = new Date(`${today}T00:00:00Z`); nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  const retry = `RECHECK ${iso(nextDay)} AEST`;
  if (scenario === "atoUnavailable" || scenario === "tpbUnavailable") return { ...base, due_state: "official_source_unavailable", due_or_recheck: retry, official_route: scenario === "tpbUnavailable" ? TPB_REGISTER_ROUTE : ATO_DUE_ROUTE, next_action: "retry_official_source_on_recheck_date" };
  if (incomeYear === "unknown" || lodgingPath === "unknown") return { ...base, due_state: "lodgment_obligation_unknown", due_or_recheck: "CHECK NOW", official_route: ATO_NEED_ROUTE, next_action: "check_lodgment_obligation" };
  if (scenario === "individualUnreadable") return { ...base, due_state: "lodgment_obligation_unknown", due_or_recheck: "CHECK NOW", official_route: ATO_DUE_ROUTE, next_action: "check_ato_individual_due_date" };
  if (scenario === "individualDate") return individualDueDate
    ? { ...base, due_state: "individual_ato_due_date_overrides", due_or_recheck: individualDueDate === today ? `${individualDueDate} TODAY` : individualDueDate, official_route: ATO_DUE_ROUTE, next_action: individualDueDate <= today ? "lodge_or_contact_ato_now" : "check_ato_individual_due_date" }
    : { ...base, due_state: "lodgment_obligation_unknown", due_or_recheck: "CHECK NOW", official_route: ATO_DUE_ROUTE, next_action: "check_ato_individual_due_date" };
  if (["overdue", "atoNotice", "priorOverdue"].includes(scenario)) return { ...base, due_state: "prior_late_or_overdue_action_required", due_or_recheck: scenario === "atoNotice" ? "CHECK NOW" : "NOW", official_route: ATO_DUE_ROUTE, next_action: "lodge_or_contact_ato_now" };
  if (lodgingPath === "registeredAgent") {
    if (["agentUnverified", "agentAmbiguous"].includes(scenario)) return { ...base, due_state: "agent_registration_or_scope_check", due_or_recheck: "CHECK NOW", official_route: TPB_REGISTER_ROUTE, next_action: "verify_agent_in_tpb_register" };
    if (scenario === "agentUnregistered") return { ...base, due_state: "agent_registration_or_scope_check", due_or_recheck: "STOP BEFORE PAYMENT/LODGMENT", official_route: TPB_REGISTER_ROUTE, next_action: "stop_and_choose_registered_tax_agent" };
    if (scenario === "basOnly") return { ...base, due_state: "agent_registration_or_scope_check", due_or_recheck: "STOP AND CHECK TAX-AGENT SCOPE", official_route: TPB_CONSUMER_ROUTE, next_action: "verify_agent_registration_scope" };
    if (scenario === "agentAppearsRegistered") return { ...base, due_state: "agent_registration_or_scope_check", due_or_recheck: "CHECK SERVICE/SCOPE NOW", official_route: TPB_REGISTER_ROUTE, next_action: "verify_agent_registration_scope" };
    return { ...base, due_state: "agent_schedule_confirmation_required", due_or_recheck: scenario === "priorFixedPending" ? "RECHECK IN ATO/AGENT SYSTEM" : scenario === "agentVerified" ? "AGENT/ATO DATE UNKNOWN" : "CHECK NOW", official_route: ATO_DUE_ROUTE, next_action: "confirm_due_date_with_registered_agent" };
  }
  const generalDate = generalSelfLodgeDate(2026);
  if (today > generalDate) return { ...base, due_state: "prior_late_or_overdue_action_required", due_or_recheck: "NOW", official_route: ATO_DUE_ROUTE, next_action: "lodge_or_contact_ato_now" };
  return { ...base, due_state: "general_self_lodge_date", due_or_recheck: `${generalDate} general only`, official_route: ATO_DUE_ROUTE, next_action: "check_ato_individual_due_date" };
}
