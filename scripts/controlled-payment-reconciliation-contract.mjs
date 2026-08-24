export const controlledPaymentReconciliationChecks = [
  "original_checkout_payment_intent_charge_chain_verified",
  "sale_balance_transaction_link_verified",
  "original_gross_sale_preserved_once",
  "stripe_fee_recorded_separately",
  "stripe_fee_tax_not_relabelled_as_customer_tax",
  "full_refund_original_charge_link_verified",
  "refund_balance_transaction_recorded_once",
  "refund_fee_adjustment_source_recorded",
  "refund_credit_document_status_recorded",
  "ending_balance_reconciled",
  "payout_source_status_verified",
  "payout_bank_match_or_verified_none",
  "gross_fee_refund_net_reconciled",
  "cash_difference_within_one_cent",
  "live_test_separation_verified",
  "unknown_values_not_coerced_to_zero",
  "source_evidence_retained_private",
];

export const controlledPaymentRefundStates = ["full_refund_succeeded", "unresolved"];
export const controlledPaymentPayoutStates = [
  "matched",
  "source_verified_none",
  "pending",
  "unresolved",
];

const rootKeys = [
  "schema_version",
  "environment",
  "product_code",
  "observation_scope",
  "observed_at",
  "refund_state",
  "payout_state",
  "checks",
];
const allowedStatuses = new Set(["PASS", "MISSING", "FAIL"]);
const allowedRefundStates = new Set(controlledPaymentRefundStates);
const allowedPayoutStates = new Set(controlledPaymentPayoutStates);

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
  return Object.fromEntries(controlledPaymentReconciliationChecks.map((check) => [check, "MISSING"]));
}

export function createControlledPaymentReconciliationTemplate() {
  return {
    schema_version: 1,
    environment: "live",
    product_code: "resume_pro",
    observation_scope: "owner_controlled_2026_08_20_full_refund",
    observed_at: null,
    refund_state: "unresolved",
    payout_state: "unresolved",
    checks: missingChecks(),
  };
}

export function containsSensitiveControlledPaymentReconciliation(raw) {
  if (typeof raw !== "string") return true;
  return [
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
    /\b(?:cs_(?:test|live)|pi_|ch_|evt_|re_|cus_|in_|sub_|po_|txn_)[A-Za-z0-9_]{8,}\b/,
    /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9_]+\b/,
    /\bwhsec_[A-Za-z0-9_]+\b/,
    /postgres(?:ql)?:\/\/[^\s"']+/i,
    /https?:\/\/[^\s"']+/i,
    /"(?:amount|gross_amount|fee_amount|refund_amount|payout_amount|cash_difference_cents)"\s*:/i,
  ].some((pattern) => pattern.test(raw));
}

function structuralErrors(packet) {
  const errors = [];
  if (!hasExactKeys(packet, rootKeys)) errors.push("packet_shape");
  if (!isPlainObject(packet)) return errors;
  if (packet.schema_version !== 1) errors.push("schema_version");
  if (packet.environment !== "live") errors.push("environment");
  if (packet.product_code !== "resume_pro") errors.push("product_code");
  if (packet.observation_scope !== "owner_controlled_2026_08_20_full_refund") {
    errors.push("observation_scope");
  }
  if (packet.observed_at !== null && !isCanonicalUtc(packet.observed_at)) errors.push("observed_at");
  if (!allowedRefundStates.has(packet.refund_state)) errors.push("refund_state");
  if (!allowedPayoutStates.has(packet.payout_state)) errors.push("payout_state");
  if (!hasExactKeys(packet.checks, controlledPaymentReconciliationChecks)) {
    errors.push("checks_shape");
  } else if (!controlledPaymentReconciliationChecks.every((check) => allowedStatuses.has(packet.checks[check]))) {
    errors.push("check_status");
  }
  return [...new Set(errors)];
}

export function evaluateControlledPaymentReconciliation(packet) {
  const errors = structuralErrors(packet);
  if (errors.length > 0) return { passed: false, decision: "STOP", errors, rows: [], unresolved: null };

  const rows = controlledPaymentReconciliationChecks.map((check) => ({
    check,
    status: packet.checks[check],
  }));
  const stateChecks = [
    { check: "observation_time_recorded", status: isCanonicalUtc(packet.observed_at) ? "PASS" : "MISSING" },
    { check: "full_refund_state_resolved", status: packet.refund_state === "full_refund_succeeded" ? "PASS" : "MISSING" },
    {
      check: "payout_state_resolved",
      status: ["matched", "source_verified_none"].includes(packet.payout_state) ? "PASS" : "MISSING",
    },
  ];
  rows.push(...stateChecks);
  const unresolved = rows.filter((row) => row.status !== "PASS").length;

  return {
    passed: unresolved === 0,
    decision: unresolved === 0 ? "PASS" : "HOLD",
    errors: [],
    rows,
    unresolved,
  };
}
