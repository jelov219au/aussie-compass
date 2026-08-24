export const registeredTaxAgentHandoffChecks = [
  "adviser_registration_source_retained_private",
  "registered_tax_agent_confirmation_retained_private",
  "all_required_facts_confirmed_by_adviser",
  "all_required_questions_concluded_by_adviser",
  "all_bookkeeping_mapping_rows_concluded_by_adviser",
  "entity_and_abn_gst_applicability_concluded",
  "gst_reporting_treatment_concluded",
  "managed_payments_role_and_revenue_owner_concluded",
  "managed_payments_gross_sale_treatment_concluded",
  "managed_payments_fee_and_fee_tax_treatment_concluded",
  "managed_payments_refund_dispute_treatment_concluded",
  "managed_payments_payout_clearing_treatment_concluded",
  "private_source_retention_requirements_concluded",
  "dated_advice_record_retained_private",
  "evidence_index_retained_private",
  "contradictions_none",
  "open_follow_ups_none",
  "owner_acknowledgement_recorded",
];

const rootKeys = [
  "schema_version",
  "environment",
  "product_code",
  "handoff_scope",
  "observed_at",
  "adviser_registration_verified",
  "overall_tax_handoff",
  "checks",
];
const allowedStatuses = new Set(["PASS", "MISSING", "FAIL"]);
const allowedRegistrationStates = new Set(["VERIFIED", "UNRESOLVED"]);
const allowedHandoffStates = new Set(["PASS", "UNRESOLVED"]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(value, keys) {
  return isPlainObject(value)
    && Object.keys(value).sort().join("\n") === [...keys].sort().join("\n");
}

function isCanonicalUtc(value) {
  if (typeof value !== "string") return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString() === value;
}

function missingChecks() {
  return Object.fromEntries(registeredTaxAgentHandoffChecks.map((check) => [check, "MISSING"]));
}

export function createRegisteredTaxAgentHandoffTemplate() {
  return {
    schema_version: 1,
    environment: "production",
    product_code: "resume_pro",
    handoff_scope: "registered_tax_agent_first_sale",
    observed_at: null,
    adviser_registration_verified: "UNRESOLVED",
    overall_tax_handoff: "UNRESOLVED",
    checks: missingChecks(),
  };
}

export function containsSensitiveRegisteredTaxAgentHandoffEvidence(raw) {
  if (typeof raw !== "string") return true;
  return [
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
    /\b\d{2}\s?\d{3}\s?\d{3}\s?\d{3}\b/,
    /\b(?:cs_(?:test|live)|pi_|ch_|evt_|re_|cus_|in_|sub_|po_|txn_)[A-Za-z0-9_]{8,}\b/,
    /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9_]+\b/,
    /\bwhsec_[A-Za-z0-9_]+\b/,
    /postgres(?:ql)?:\/\/[^\s"']+/i,
    /https?:\/\/[^\s"']+/i,
    /"(?:name|practice|abn|contact|email|phone|address|amount|bank|bsb|account_number|stripe_id|document_id|source_url|advice|advice_text|recommendation|registration_reference|confirmation_reference|evidence_reference)"\s*:/i,
    /\b(?:AUD|A\$|\$)\s*\d/i,
  ].some((pattern) => pattern.test(raw));
}

function structuralErrors(packet) {
  const errors = [];
  if (!hasExactKeys(packet, rootKeys)) errors.push("packet_shape");
  if (!isPlainObject(packet)) return errors;
  if (packet.schema_version !== 1) errors.push("schema_version");
  if (packet.environment !== "production") errors.push("environment");
  if (packet.product_code !== "resume_pro") errors.push("product_code");
  if (packet.handoff_scope !== "registered_tax_agent_first_sale") errors.push("handoff_scope");
  if (packet.observed_at !== null && !isCanonicalUtc(packet.observed_at)) errors.push("observed_at");
  if (!allowedRegistrationStates.has(packet.adviser_registration_verified)) {
    errors.push("adviser_registration_verified");
  }
  if (!allowedHandoffStates.has(packet.overall_tax_handoff)) errors.push("overall_tax_handoff");
  if (!hasExactKeys(packet.checks, registeredTaxAgentHandoffChecks)) {
    errors.push("checks_shape");
  } else if (!registeredTaxAgentHandoffChecks.every((check) => allowedStatuses.has(packet.checks[check]))) {
    errors.push("check_status");
  }
  return [...new Set(errors)];
}

export function evaluateRegisteredTaxAgentHandoff(packet) {
  const errors = structuralErrors(packet);
  if (errors.length > 0) return { passed: false, decision: "STOP", errors, rows: [], unresolved: null };

  const rows = registeredTaxAgentHandoffChecks.map((check) => ({ check, status: packet.checks[check] }));
  rows.push(
    { check: "observation_time_recorded", status: isCanonicalUtc(packet.observed_at) ? "PASS" : "MISSING" },
    {
      check: "adviser_registration_verified",
      status: packet.adviser_registration_verified === "VERIFIED" ? "PASS" : "MISSING",
    },
    {
      check: "overall_tax_handoff_pass",
      status: packet.overall_tax_handoff === "PASS" ? "PASS" : "MISSING",
    },
  );
  const unresolved = rows.filter((row) => row.status !== "PASS").length;

  return {
    passed: unresolved === 0,
    decision: unresolved === 0 ? "PASS" : "HOLD",
    errors: [],
    rows,
    unresolved,
  };
}
