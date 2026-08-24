export const evidencePhases = ["15m", "24h", "payout"];

export const fifteenMinuteChecks = [
  "integrated_first_sale_preflight_preserved",
  "live_checkout_paid",
  "currency_amount_price_match",
  "signed_webhook_2xx",
  "first_sale_gate_locked",
  "entitlement_active",
  "outbox_single_intent_sent",
  "mailbox_received_same_suffix",
  "activation_consumed_or_idempotent",
  "access_session_active_unexpired_unrevoked",
  "restore_binding_row_count_one",
  "same_token_hash",
  "same_nonce_hash",
  "same_pair_retry_idempotent",
  "access_session_suffix_same",
  "access_session_reference_suffix_only",
  "retry_new_access_session_count_zero",
  "retry_new_binding_count_zero",
  "different_nonce_denied",
  "different_nonce_cookie_not_issued",
  "released_same_pair_released",
  "released_retry_cookie_not_issued",
  "raw_nonce_same_tab_only",
  "raw_nonce_not_persisted_server_side",
  "raw_nonce_not_in_operational_packet",
  "raw_restore_code_not_in_session_storage",
  "raw_restore_code_not_persisted_server_side",
  "pii_not_persisted_server_side",
  "full_identifier_not_persisted_server_side",
];

export const twentyFourHourChecks = [
  "integrated_first_sale_preflight_unchanged",
  "fifteen_minute_evidence_unchanged",
  "no_new_access_session",
  "no_new_activation_or_restore_binding",
  "refund_review_release_state_consistent",
  "gross_captured",
  "displayed_tax_captured",
  "stripe_fee_captured",
  "withheld_tax_classified",
  "fee_net_of_withheld_tax_classified",
  "refund_credit_note_handled",
  "ending_balance_captured",
  "receipt_or_tax_document_retained",
  "document_issuer_verified",
  "liability_party_verified",
  "mailbox_receipt_preserved",
  "entitlement_refund_link_preserved",
  "support_ledger_original_transaction_chain_preserved",
  "payout_status_recorded",
  "no_raw_nonce_or_restore_code_persistence",
  "no_pii_or_full_identifier_in_evidence",
];

export const firstPayoutChecks = [
  "integrated_first_sale_preflight_carried_forward",
  "itemised_payout_retained",
  "bank_arrival_matched",
  "stripe_clearing_reconciled",
  "payout_not_recorded_as_sale",
  "ending_balance_carried_forward",
];

export const financialEventOutcomes = [
  "none_confirmed",
  "partial_refund_succeeded",
  "full_refund_succeeded",
  "dispute_open",
  "dispute_won_or_funds_reinstated",
  "dispute_lost",
  "unresolved",
];

export const entitlementOutcomes = ["active", "review", "revoked", "unresolved"];

export const accountingOutcomes = [
  "no_adjustment",
  "partial_refund_adjustment",
  "full_refund_adjustment",
  "dispute_open_adjustment",
  "dispute_reinstatement_adjustment",
  "dispute_loss_adjustment",
  "unresolved",
];

export const supportOutcomes = [
  "no_refund_or_dispute",
  "refund_request_pending",
  "partial_refund_confirmed",
  "full_refund_confirmed",
  "dispute_needs_response",
  "dispute_won_or_funds_reinstated",
  "dispute_lost",
  "unresolved",
];

const rootKeys = [
  "schema_version",
  "product_code",
  "environment",
  "event_suffix",
  "paid_at",
  "fifteen_minute",
  "twenty_four_hour",
  "first_payout",
];
const sectionKeys = ["observed_at", "checks"];
const twentyFourHourKeys = [
  "observed_at",
  "checks",
  "financial_event_outcome",
  "entitlement_outcome",
  "accounting_outcome",
  "support_outcome",
];
const payoutKeys = ["observed_at", "checks", "cash_difference_cents"];
const allowedStatuses = new Set(["PASS", "MISSING", "FAIL"]);
const allowedFinancialEventOutcomes = new Set(financialEventOutcomes);
const allowedEntitlementOutcomes = new Set(entitlementOutcomes);
const allowedAccountingOutcomes = new Set(accountingOutcomes);
const allowedSupportOutcomes = new Set(supportOutcomes);

const refundDisputeOutcomeMatrix = {
  none_confirmed: {
    entitlement: "active",
    accounting: "no_adjustment",
    support: new Set(["no_refund_or_dispute", "refund_request_pending"]),
  },
  partial_refund_succeeded: {
    entitlement: "review",
    accounting: "partial_refund_adjustment",
    support: new Set(["partial_refund_confirmed"]),
  },
  full_refund_succeeded: {
    entitlement: "revoked",
    accounting: "full_refund_adjustment",
    support: new Set(["full_refund_confirmed"]),
  },
  dispute_open: {
    entitlement: "revoked",
    accounting: "dispute_open_adjustment",
    support: new Set(["dispute_needs_response"]),
  },
  dispute_won_or_funds_reinstated: {
    entitlement: "active",
    accounting: "dispute_reinstatement_adjustment",
    support: new Set(["dispute_won_or_funds_reinstated"]),
  },
  dispute_lost: {
    entitlement: "revoked",
    accounting: "dispute_loss_adjustment",
    support: new Set(["dispute_lost"]),
  },
};

function missingChecks(checkNames) {
  return Object.fromEntries(checkNames.map((name) => [name, "MISSING"]));
}

export function createFirstSaleEvidenceTemplate() {
  return {
    schema_version: 4,
    product_code: "resume_pro",
    environment: "live",
    event_suffix: "REPLACE8",
    paid_at: "REPLACE_WITH_UTC_TIMESTAMP",
    fifteen_minute: {
      observed_at: null,
      checks: missingChecks(fifteenMinuteChecks),
    },
    twenty_four_hour: {
      observed_at: null,
      checks: missingChecks(twentyFourHourChecks),
      financial_event_outcome: "unresolved",
      entitlement_outcome: "unresolved",
      accounting_outcome: "unresolved",
      support_outcome: "unresolved",
    },
    first_payout: {
      observed_at: null,
      checks: missingChecks(firstPayoutChecks),
      cash_difference_cents: null,
    },
  };
}

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

function validateChecks(value, names) {
  if (!hasExactKeys(value, names)) return false;
  return names.every((name) => allowedStatuses.has(value[name]));
}

function validateSection(value, names, keys = sectionKeys) {
  return hasExactKeys(value, keys)
    && (value.observed_at === null || isCanonicalUtc(value.observed_at))
    && validateChecks(value.checks, names);
}

function validateTwentyFourHourSection(value) {
  return validateSection(value, twentyFourHourChecks, twentyFourHourKeys)
    && allowedFinancialEventOutcomes.has(value.financial_event_outcome)
    && allowedEntitlementOutcomes.has(value.entitlement_outcome)
    && allowedAccountingOutcomes.has(value.accounting_outcome)
    && allowedSupportOutcomes.has(value.support_outcome);
}

export function refundDisputeOutcomeMatrixConsistent(section) {
  if (!isPlainObject(section)) return false;
  const expected = refundDisputeOutcomeMatrix[section.financial_event_outcome];
  return Boolean(expected)
    && section.entitlement_outcome === expected.entitlement
    && section.accounting_outcome === expected.accounting
    && expected.support.has(section.support_outcome);
}

export function containsSensitiveEvidence(raw) {
  if (typeof raw !== "string") return true;
  return [
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
    /\b(?:cs_(?:test|live)|pi_|ch_|evt_|re_|cus_|in_|sub_|po_)[A-Za-z0-9_]{12,}\b/,
    /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9_]+\b/,
    /\bwhsec_[A-Za-z0-9_]+\b/,
    /postgres(?:ql)?:\/\/[^\s"']+/i,
  ].some((pattern) => pattern.test(raw));
}

function structuralErrors(packet) {
  const errors = [];
  if (!hasExactKeys(packet, rootKeys)) errors.push("packet_shape");
  if (!isPlainObject(packet)) return errors;
  if (packet.schema_version !== 4) errors.push("schema_version");
  if (packet.product_code !== "resume_pro") errors.push("product_code");
  if (packet.environment !== "live") errors.push("environment");
  if (!/^[A-Za-z0-9]{8}$/.test(packet.event_suffix ?? "") || packet.event_suffix === "REPLACE8") {
    errors.push("event_suffix");
  }
  if (!isCanonicalUtc(packet.paid_at)) errors.push("paid_at");
  if (!validateSection(packet.fifteen_minute, fifteenMinuteChecks)) errors.push("fifteen_minute_shape");
  if (!validateTwentyFourHourSection(packet.twenty_four_hour)) errors.push("twenty_four_hour_shape");
  if (!validateSection(packet.first_payout, firstPayoutChecks, payoutKeys)) errors.push("first_payout_shape");
  if (
    isPlainObject(packet.first_payout)
    && packet.first_payout.cash_difference_cents !== null
    && !Number.isInteger(packet.first_payout.cash_difference_cents)
  ) errors.push("cash_difference_cents");
  return [...new Set(errors)];
}

function addSectionRows(rows, section, checkNames) {
  for (const name of checkNames) rows.push({ check: name, status: section.checks[name] });
}

function addTimingRow(rows, check, passed) {
  rows.push({ check, status: passed ? "PASS" : "FAIL" });
}

export function evaluateFirstSaleEvidence(packet, phase) {
  if (!evidencePhases.includes(phase)) {
    return { passed: false, decision: "STOP", errors: ["phase"], rows: [] };
  }

  const errors = structuralErrors(packet);
  if (errors.length > 0) return { passed: false, decision: "STOP", errors, rows: [] };

  const rows = [];
  const paidAt = Date.parse(packet.paid_at);
  const fifteenObservedAt = Date.parse(packet.fifteen_minute.observed_at ?? "");
  addSectionRows(rows, packet.fifteen_minute, fifteenMinuteChecks);
  addTimingRow(
    rows,
    "fifteen_minute_observed_within_window",
    Number.isFinite(fifteenObservedAt)
      && fifteenObservedAt >= paidAt
      && fifteenObservedAt <= paidAt + (15 * 60 * 1000),
  );

  if (phase === "24h" || phase === "payout") {
    const twentyFourObservedAt = Date.parse(packet.twenty_four_hour.observed_at ?? "");
    addSectionRows(rows, packet.twenty_four_hour, twentyFourHourChecks);
    addTimingRow(
      rows,
      "twenty_four_hour_window_closed",
      Number.isFinite(twentyFourObservedAt)
        && twentyFourObservedAt >= paidAt + (24 * 60 * 60 * 1000)
        && twentyFourObservedAt >= fifteenObservedAt,
    );
    addTimingRow(
      rows,
      "refund_dispute_outcome_matrix_consistent",
      refundDisputeOutcomeMatrixConsistent(packet.twenty_four_hour),
    );

    if (phase === "payout") {
      const payoutObservedAt = Date.parse(packet.first_payout.observed_at ?? "");
      addSectionRows(rows, packet.first_payout, firstPayoutChecks);
      addTimingRow(
        rows,
        "first_payout_observed_after_twenty_four_hour_close",
        Number.isFinite(payoutObservedAt) && payoutObservedAt >= twentyFourObservedAt,
      );
      addTimingRow(
        rows,
        "cash_difference_within_one_cent",
        Number.isInteger(packet.first_payout.cash_difference_cents)
          && Math.abs(packet.first_payout.cash_difference_cents) <= 1,
      );
    }
  }

  const passed = rows.every((row) => row.status === "PASS");
  return {
    passed,
    decision: passed ? "PASS" : phase === "15m" ? "STOP" : "HOLD",
    errors: [],
    rows,
  };
}
