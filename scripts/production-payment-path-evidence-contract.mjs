const migrationKeys = [
  "alert_outbox_v1",
  "checkout_activation_nonce_v1",
  "purchase_access_sessions_v1",
  "restore_activation_nonce_v1",
  "entitlement_link_conflict_v1",
];

const rootKeys = [
  "schema_version",
  "environment",
  "production_source_sha",
  "observed_at",
  "payments_enabled",
  "migrations",
  "webhook",
  "outbox",
  "activation",
  "release",
  "restore",
];

const sectionKeys = {
  webhook: ["signed_delivery_http_status", "receipt_count_delta", "duplicate_receipt_count_delta"],
  outbox: ["intent_count_delta", "sent_count_delta", "pending_count_delta", "delivery_attempt_count", "mailbox_received"],
  activation: [
    "binding_count_delta",
    "access_session_count_delta",
    "first_outcome",
    "same_nonce_retry_outcome",
    "same_nonce_new_binding_count",
    "same_nonce_new_session_count",
    "different_nonce_outcome",
    "different_nonce_cookie_issued",
  ],
  release: ["release_result", "released_at_recorded", "old_session_active", "retry_outcome", "retry_cookie_issued"],
  restore: [
    "binding_count_delta",
    "access_session_count_delta",
    "first_outcome",
    "same_nonce_retry_outcome",
    "same_nonce_new_binding_count",
    "same_nonce_new_session_count",
    "different_nonce_outcome",
    "different_nonce_cookie_issued",
    "access_session_active_unexpired_unrevoked",
  ],
};

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(value, keys) {
  return isObject(value)
    && Object.keys(value).sort().join("\n") === [...keys].sort().join("\n");
}

function isCanonicalUtc(value) {
  if (typeof value !== "string") return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
}

export function containsSensitiveProductionPathEvidence(raw) {
  if (typeof raw !== "string") return true;
  return [
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
    /\b(?:cs_(?:test|live)|pi_|ch_|evt_|re_|cus_|in_|sub_|po_)[A-Za-z0-9_]{8,}\b/,
    /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9_]+\b/,
    /\bwhsec_[A-Za-z0-9_]+\b/,
    /postgres(?:ql)?:\/\/[^\s"']+/i,
    /\b[a-f0-9]{64}\b/i,
  ].some((pattern) => pattern.test(raw));
}

export function createProductionPaymentPathEvidenceTemplate() {
  return {
    schema_version: 2,
    environment: "production",
    production_source_sha: null,
    observed_at: null,
    payments_enabled: false,
    migrations: Object.fromEntries(migrationKeys.map((key) => [key, false])),
    webhook: {
      signed_delivery_http_status: null,
      receipt_count_delta: null,
      duplicate_receipt_count_delta: null,
    },
    outbox: {
      intent_count_delta: null,
      sent_count_delta: null,
      pending_count_delta: null,
      delivery_attempt_count: null,
      mailbox_received: false,
    },
    activation: {
      binding_count_delta: null,
      access_session_count_delta: null,
      first_outcome: null,
      same_nonce_retry_outcome: null,
      same_nonce_new_binding_count: null,
      same_nonce_new_session_count: null,
      different_nonce_outcome: null,
      different_nonce_cookie_issued: null,
    },
    release: {
      release_result: null,
      released_at_recorded: null,
      old_session_active: null,
      retry_outcome: null,
      retry_cookie_issued: null,
    },
    restore: {
      binding_count_delta: null,
      access_session_count_delta: null,
      first_outcome: null,
      same_nonce_retry_outcome: null,
      same_nonce_new_binding_count: null,
      same_nonce_new_session_count: null,
      different_nonce_outcome: null,
      different_nonce_cookie_issued: null,
      access_session_active_unexpired_unrevoked: null,
    },
  };
}

function validShape(packet) {
  return hasExactKeys(packet, rootKeys)
    && hasExactKeys(packet.migrations, migrationKeys)
    && Object.entries(sectionKeys).every(([name, keys]) => hasExactKeys(packet[name], keys));
}

export function evaluateProductionPaymentPathEvidence(packet, expectedSourceSha) {
  if (!validShape(packet) || packet.schema_version !== 2 || packet.environment !== "production" || !isCanonicalUtc(packet.observed_at)) {
    return { passed: false, reason: "invalid_shape" };
  }
  if (typeof expectedSourceSha !== "string" || !/^[a-f0-9]{40}$/.test(expectedSourceSha)) {
    return { passed: false, reason: "invalid_expected_sha" };
  }
  if (packet.production_source_sha !== expectedSourceSha) {
    return { passed: false, reason: "source_sha_mismatch" };
  }
  if (packet.payments_enabled !== false) return { passed: false, reason: "payments_not_off" };
  if (!migrationKeys.every((key) => packet.migrations[key] === true)) {
    return { passed: false, reason: "migrations_unverified" };
  }

  const webhookPass = packet.webhook.signed_delivery_http_status === 200
    && packet.webhook.receipt_count_delta === 1
    && packet.webhook.duplicate_receipt_count_delta === 0;
  if (!webhookPass) return { passed: false, reason: "webhook_unverified" };

  const outboxPass = packet.outbox.intent_count_delta === 1
    && packet.outbox.sent_count_delta === 1
    && packet.outbox.pending_count_delta === 0
    && Number.isInteger(packet.outbox.delivery_attempt_count)
    && packet.outbox.delivery_attempt_count >= 1
    && packet.outbox.mailbox_received === true;
  if (!outboxPass) return { passed: false, reason: "outbox_unverified" };

  const activationPass = packet.activation.binding_count_delta === 1
    && packet.activation.access_session_count_delta === 1
    && packet.activation.first_outcome === "consumed"
    && packet.activation.same_nonce_retry_outcome === "idempotent"
    && packet.activation.same_nonce_new_binding_count === 0
    && packet.activation.same_nonce_new_session_count === 0
    && packet.activation.different_nonce_outcome === "used"
    && packet.activation.different_nonce_cookie_issued === false;
  if (!activationPass) return { passed: false, reason: "activation_unverified" };

  const releasePass = packet.release.release_result === true
    && packet.release.released_at_recorded === true
    && packet.release.old_session_active === false
    && packet.release.retry_outcome === "released"
    && packet.release.retry_cookie_issued === false;
  if (!releasePass) return { passed: false, reason: "release_unverified" };

  const restorePass = packet.restore.binding_count_delta === 1
    && packet.restore.access_session_count_delta === 1
    && packet.restore.first_outcome === "consumed"
    && packet.restore.same_nonce_retry_outcome === "idempotent"
    && packet.restore.same_nonce_new_binding_count === 0
    && packet.restore.same_nonce_new_session_count === 0
    && packet.restore.different_nonce_outcome === "used"
    && packet.restore.different_nonce_cookie_issued === false
    && packet.restore.access_session_active_unexpired_unrevoked === true;
  if (!restorePass) return { passed: false, reason: "restore_unverified" };

  return { passed: true, reason: null };
}
