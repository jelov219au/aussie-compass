export const evidencePhases = ["15m", "24h", "payout"];

export const fifteenMinuteChecks = [
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
  "payout_status_recorded",
  "no_raw_nonce_or_restore_code_persistence",
  "no_pii_or_full_identifier_in_evidence",
];

export const firstPayoutChecks = [
  "itemised_payout_retained",
  "bank_arrival_matched",
  "stripe_clearing_reconciled",
  "payout_not_recorded_as_sale",
  "ending_balance_carried_forward",
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
const payoutKeys = ["observed_at", "checks", "cash_difference_cents"];
const allowedStatuses = new Set(["PASS", "MISSING", "FAIL"]);

function missingChecks(checkNames) {
  return Object.fromEntries(checkNames.map((name) => [name, "MISSING"]));
}

export function createFirstSaleEvidenceTemplate() {
  return {
    schema_version: 1,
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
  if (packet.schema_version !== 1) errors.push("schema_version");
  if (packet.product_code !== "resume_pro") errors.push("product_code");
  if (packet.environment !== "live") errors.push("environment");
  if (!/^[A-Za-z0-9]{8}$/.test(packet.event_suffix ?? "") || packet.event_suffix === "REPLACE8") {
    errors.push("event_suffix");
  }
  if (!isCanonicalUtc(packet.paid_at)) errors.push("paid_at");
  if (!validateSection(packet.fifteen_minute, fifteenMinuteChecks)) errors.push("fifteen_minute_shape");
  if (!validateSection(packet.twenty_four_hour, twentyFourHourChecks)) errors.push("twenty_four_hour_shape");
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
