export const PAYSLIP_ROUTE = "https://www.fairwork.gov.au/pay-and-wages/paying-wages/pay-slips";
export const PACT_ROUTE = "https://calculate.fairwork.gov.au/FindYourAward";
export const ATO_WITHHOLDING_ROUTE = "https://www.ato.gov.au/calculators-and-tools/tax-withheld-calculator";
export const ATO_SUPER_ROUTE = "https://www.ato.gov.au/businesses-and-organisations/super-for-employers/payday-super";

export type PayEstimateBasis = "hourly" | "annualPlusSuper" | "annualPackage";
export type PayEstimateTaxProfile = "resident" | "workingHolidayMaker" | "foreignUnknown";
export type PayEstimateBlocker =
  | "missingPayslip"
  | "missingBank"
  | "foreignTaxProfile"
  | "payBasis"
  | "grossMismatch"
  | "netVariance"
  | "super"
  | "matched";

export type PayEstimateNextCheck = {
  calculation_basis: string;
  included_excluded_components: string;
  comparison_pair: string;
  official_route: string;
  variance_status: string;
  next_action: string;
};

const COMPONENTS = "ordinary_overtime+penalty+allowance+loading+leave+reimbursement+salary_sacrifice+multiple_income+award_EA_contract+precise_PAYG+QE_OTE_receipt";
const ORDERED_COMPARISON = "estimate_gross_to_payslip_gross_then_payslip_net_to_bank_net";

function calculationBasis(basis: PayEstimateBasis) {
  if (basis === "annualPlusSuper") return "annual_base_plus_super+annual_tax_estimate_not_payroll_withholding";
  if (basis === "annualPackage") return "annual_total_package_reverse_estimate+annual_tax_estimate_not_payroll_withholding";
  return "hourly_user_rate+annual_tax_estimate_not_payroll_withholding";
}

function includedExcluded(
  basis: PayEstimateBasis,
  taxProfile: PayEstimateTaxProfile,
  blocker: PayEstimateBlocker,
  casual: boolean,
  includeMedicare: boolean,
  includeHelp: boolean,
) {
  if (blocker === "matched") {
    return "in:user_reviewed_base_and_selected_estimates; out_or_unknown:legal_entitlement+precise_PAYG+QE_OTE_receipt";
  }
  if (blocker === "netVariance") {
    return "in:base_gross+selected_annual_tax+selected_medicare_HELP; out_or_unknown:precise_PAYG+irregular_payments+multiple_income+other_standard_components";
  }
  if (blocker === "super") {
    return `in:${basis === "annualPackage" ? "reverse_base_gross" : "base_gross"}+simple_12%; out_or_unknown:${COMPONENTS}`;
  }
  if (taxProfile === "foreignUnknown" || blocker === "foreignTaxProfile") {
    return `in:base_gross; out_or_unknown:foreign_tax_profile+medicare+HELP+${COMPONENTS}`;
  }
  if (casual) {
    return `in:user_entered_base_gross; out_or_unknown:casual_loading_inclusion+${COMPONENTS}`;
  }

  const base = basis === "annualPackage" ? "reverse_base_gross" : "base_gross";
  const selectedTax = ["selected_annual_tax", includeMedicare ? "selected_medicare" : "", includeHelp ? "selected_HELP" : ""].filter(Boolean).join("+");
  const tax = taxProfile === "workingHolidayMaker" ? "WHM_annual_tax" : selectedTax;
  const additionalUnknown = taxProfile === "workingHolidayMaker"
    ? "employer_registration+"
    : basis === "annualPackage"
      ? "actual_package_components+"
      : "";
  return `in:${base}+${tax}+simple_12%; out_or_unknown:${additionalUnknown}${COMPONENTS}`;
}

export function buildPayEstimateNextCheck(input: {
  basis: PayEstimateBasis;
  blocker: PayEstimateBlocker;
  casual: boolean;
  includeHelp?: boolean;
  includeMedicare?: boolean;
  taxProfile: PayEstimateTaxProfile;
}): PayEstimateNextCheck {
  const { basis, blocker, casual, includeHelp = false, includeMedicare = false, taxProfile } = input;
  const shared = {
    calculation_basis: calculationBasis(basis),
    included_excluded_components: includedExcluded(basis, taxProfile, blocker, casual, includeMedicare, includeHelp),
    comparison_pair: ORDERED_COMPARISON,
  };

  if (blocker === "missingPayslip") return { ...shared, comparison_pair: "not_ready_missing_payslip_or_bank", official_route: PAYSLIP_ROUTE, variance_status: "not_comparable", next_action: "get_payslip" };
  if (blocker === "missingBank") return { ...shared, comparison_pair: "not_ready_missing_payslip_or_bank", official_route: PAYSLIP_ROUTE, variance_status: "not_comparable", next_action: "get_bank_transaction" };
  if (blocker === "foreignTaxProfile") return { ...shared, official_route: ATO_WITHHOLDING_ROUTE, variance_status: "not_comparable", next_action: "verify_withholding_in_ato" };
  if (blocker === "payBasis") return { ...shared, official_route: PACT_ROUTE, variance_status: "gross_variance_needs_basis_check", next_action: "verify_pay_basis_in_pact" };
  if (blocker === "grossMismatch") return { ...shared, official_route: "/underpayment-guide", variance_status: "gross_variance_needs_basis_check", next_action: "open_underpayment_next_action" };
  if (blocker === "netVariance") return { ...shared, official_route: ATO_WITHHOLDING_ROUTE, variance_status: "net_variance_needs_deduction_check", next_action: "verify_withholding_in_ato" };
  if (blocker === "super") return { ...shared, official_route: ATO_SUPER_ROUTE, variance_status: "estimate_only", next_action: "verify_super_qe_and_receipt" };
  return { ...shared, official_route: PAYSLIP_ROUTE, variance_status: "matched_user_reviewed", next_action: "verify_payslip_items" };
}
