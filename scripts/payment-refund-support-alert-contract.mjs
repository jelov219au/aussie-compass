export const paymentRefundSupportAlertChecks = [
  "payments_disabled_during_transport_checks",
  "smtp_endpoint_owner_confirmed",
  "no_send_transport_pass_preserved",
  "labelled_send_transport_pass_preserved",
  "labelled_non_customer_message_received",
  "required_webhook_subscriptions_verified",
  "outbox_migration_and_privileges_verified",
  "controlled_purchase_signed_webhook_2xx",
  "controlled_purchase_outbox_single_sent",
  "controlled_purchase_mailbox_received_same_suffix",
  "controlled_refund_signed_webhook_2xx",
  "controlled_refund_outbox_single_sent",
  "controlled_refund_mailbox_received_same_suffix",
  "controlled_refund_entitlement_revoked",
  "smtp_failure_returns_503",
  "busy_worker_returns_503",
  "stale_lease_recovery_verified",
  "sent_duplicate_does_not_resend",
  "pii_full_identifiers_and_secrets_excluded",
  "monitored_mailbox_owner_acknowledged",
];

const rootKeys = [
  "schema_version",
  "environment",
  "product_code",
  "observation_scope",
  "observed_at",
  "transport_state",
  "purchase_alert_state",
  "refund_alert_state",
  "checks",
];
const allowedStatuses = new Set(["PASS", "MISSING", "FAIL"]);
const allowedTransportStates = new Set(["verified", "unresolved"]);
const allowedAlertStates = new Set(["received", "unresolved"]);

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
  return Object.fromEntries(paymentRefundSupportAlertChecks.map((check) => [check, "MISSING"]));
}

export function createPaymentRefundSupportAlertTemplate() {
  return {
    schema_version: 1,
    environment: "production",
    product_code: "resume_pro",
    observation_scope: "controlled_purchase_refund_alert_readiness",
    observed_at: null,
    transport_state: "unresolved",
    purchase_alert_state: "unresolved",
    refund_alert_state: "unresolved",
    checks: missingChecks(),
  };
}

export function containsSensitivePaymentRefundSupportAlertEvidence(raw) {
  if (typeof raw !== "string") return true;
  return [
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
    /\b(?:cs_(?:test|live)|pi_|ch_|evt_|re_|cus_|in_|sub_|po_|txn_)[A-Za-z0-9_]{8,}\b/,
    /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9_]+\b/,
    /\bwhsec_[A-Za-z0-9_]+\b/,
    /postgres(?:ql)?:\/\/[^\s"']+/i,
    /https?:\/\/[^\s"']+/i,
    /"(?:amount|email|address|event_suffix|checkout_suffix|refund_suffix|message_id|attempt_count)"\s*:/i,
  ].some((pattern) => pattern.test(raw));
}

function structuralErrors(packet) {
  const errors = [];
  if (!hasExactKeys(packet, rootKeys)) errors.push("packet_shape");
  if (!isPlainObject(packet)) return errors;
  if (packet.schema_version !== 1) errors.push("schema_version");
  if (packet.environment !== "production") errors.push("environment");
  if (packet.product_code !== "resume_pro") errors.push("product_code");
  if (packet.observation_scope !== "controlled_purchase_refund_alert_readiness") {
    errors.push("observation_scope");
  }
  if (packet.observed_at !== null && !isCanonicalUtc(packet.observed_at)) errors.push("observed_at");
  if (!allowedTransportStates.has(packet.transport_state)) errors.push("transport_state");
  if (!allowedAlertStates.has(packet.purchase_alert_state)) errors.push("purchase_alert_state");
  if (!allowedAlertStates.has(packet.refund_alert_state)) errors.push("refund_alert_state");
  if (!hasExactKeys(packet.checks, paymentRefundSupportAlertChecks)) {
    errors.push("checks_shape");
  } else if (!paymentRefundSupportAlertChecks.every((check) => allowedStatuses.has(packet.checks[check]))) {
    errors.push("check_status");
  }
  return [...new Set(errors)];
}

export function evaluatePaymentRefundSupportAlertEvidence(packet) {
  const errors = structuralErrors(packet);
  if (errors.length > 0) return { passed: false, decision: "STOP", errors, rows: [], unresolved: null };

  const rows = paymentRefundSupportAlertChecks.map((check) => ({ check, status: packet.checks[check] }));
  rows.push(
    { check: "observation_time_recorded", status: isCanonicalUtc(packet.observed_at) ? "PASS" : "MISSING" },
    { check: "transport_state_verified", status: packet.transport_state === "verified" ? "PASS" : "MISSING" },
    { check: "purchase_alert_received", status: packet.purchase_alert_state === "received" ? "PASS" : "MISSING" },
    { check: "refund_alert_received", status: packet.refund_alert_state === "received" ? "PASS" : "MISSING" },
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
