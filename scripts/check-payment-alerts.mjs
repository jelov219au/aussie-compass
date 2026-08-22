import assert from "node:assert/strict";
import fs from "node:fs";

import { supportedProductCodes } from "../src/lib/entitlements.ts";
import { buildStripeOperatorAlert } from "../src/lib/paymentAlerts.ts";
import {
  deliverDurablePaymentOperatorAlert,
  getPaymentOperatorAlertKind,
} from "../src/lib/paymentAlertOutbox.ts";

function stripeEvent(type, object, id) {
  return { id, type, livemode: true, data: { object } };
}

const paidAlert = buildStripeOperatorAlert(stripeEvent("checkout.session.completed", {
  id: "cs_live_paid",
  payment_status: "paid",
  amount_total: 1990,
  currency: "aud",
  metadata: { product_code: "resume_pro" },
  payment_intent: "pi_live_paid",
  customer_details: { email: "customer@example.com" },
}, "evt_paid"));

assert.match(paidAlert?.subject ?? "", /결제 완료 · Resume Pro · \$19\.90/);
assert.doesNotMatch(paidAlert?.text ?? "", /customer@example\.com|고객 이메일/);
assert.match(paidAlert?.text ?? "", /Stripe event ref: evt_paid/);

for (const productCode of supportedProductCodes) {
  const alert = buildStripeOperatorAlert(stripeEvent("checkout.session.completed", {
    id: `cs_live_${productCode}`,
    payment_status: "paid",
    amount_total: 1000,
    currency: "aud",
    metadata: { product_code: productCode },
  }, `evt_${productCode}`));
  assert.ok(alert, `the shared operator alert must cover ${productCode}`);
}

assert.equal(buildStripeOperatorAlert(stripeEvent("checkout.session.completed", {
  id: "cs_live_unpaid",
  payment_status: "unpaid",
  metadata: { product_code: "resume_pro" },
}, "evt_unpaid")), null, "unpaid Checkout sessions must not create payment-complete alerts");

assert.equal(buildStripeOperatorAlert(stripeEvent("checkout.session.completed", {
  id: "cs_live_unknown",
  payment_status: "paid",
  metadata: { product_code: "unknown_product" },
}, "evt_unknown")), null, "unknown products must not create operator alerts");

const refundAlert = buildStripeOperatorAlert(stripeEvent("charge.refunded", {
  id: "ch_refunded",
  amount: 1490,
  amount_refunded: 1490,
  currency: "aud",
  refunded: true,
  payment_intent: "pi_refunded",
  payment_method_details: { card: { last4: "4242" } },
}, "evt_refunded"));

assert.match(refundAlert?.subject ?? "", /전액 환불 · \$14\.90/);
assert.doesNotMatch(refundAlert?.text ?? "", /4242|card|payment_method/i, "alerts must not expose card details");

for (const eventType of ["refund.created", "refund.updated", "refund.failed"]) {
  const refundObjectAlert = buildStripeOperatorAlert(stripeEvent(eventType, {
    id: "re_1234567890sensitive",
    amount: 1990,
    currency: "aud",
    status: eventType === "refund.failed" ? "failed" : "pending",
    payment_intent: "pi_1234567890sensitive",
    charge: "ch_1234567890sensitive",
    metadata: { customer_email: "must-not-appear@example.com" },
  }, `evt_${eventType.replaceAll(".", "_")}_1234567890`));

  assert.ok(refundObjectAlert, `${eventType} must not be skipped`);
  assert.match(refundObjectAlert.subject, /환불 이벤트/);
  assert.match(refundObjectAlert.text, /환불금액: \$19\.90/);
  assert.match(refundObjectAlert.text, /Stripe Dashboard/);
  assert.doesNotMatch(refundObjectAlert.text, /must-not-appear@example\.com|1234567890sensitive|metadata|payload/i);
}

const disputeAlert = buildStripeOperatorAlert(stripeEvent("charge.dispute.created", {
  id: "dp_open",
  amount: 1990,
  currency: "aud",
  status: "needs_response",
  reason: "product_not_received",
  payment_intent: "pi_disputed",
}, "evt_disputed"));

assert.match(disputeAlert?.subject ?? "", /결제 분쟁 needs_response/);
assert.match(disputeAlert?.text ?? "", /답변 기한/);

assert.equal(getPaymentOperatorAlertKind(stripeEvent("checkout.session.completed", {}, "evt_kind")), "payment_completed");
assert.equal(getPaymentOperatorAlertKind(stripeEvent("refund.created", {}, "evt_kind")), "refund_event");
assert.equal(getPaymentOperatorAlertKind(stripeEvent("charge.dispute.created", {}, "evt_kind")), "dispute_event");

function inMemoryOutbox(event, alertKind) {
  const row = {
    alertKind,
    eventType: event.type,
    eventRefLast8: event.id.slice(-8),
    attempts: 0,
    status: "pending",
    claimToken: null,
  };
  return {
    row,
    async enqueueFulfillmentAttention() {},
    async claim() {
      if (row.status !== "pending" || row.claimToken) return null;
      row.attempts += 1;
      row.claimToken = `claim-${row.attempts}`;
      return { ...row, claimToken: row.claimToken };
    },
    async markSent(_eventId, _kind, claimToken) {
      if (row.status !== "pending" || row.claimToken !== claimToken) return false;
      row.status = "sent";
      row.claimToken = null;
      return true;
    },
    async release(_eventId, _kind, claimToken) {
      if (row.status !== "pending" || row.claimToken !== claimToken) return false;
      row.claimToken = null;
      return true;
    },
  };
}

const retryEvent = stripeEvent("checkout.session.completed", {
  id: "cs_live_retry",
  payment_status: "paid",
  amount_total: 1990,
  currency: "aud",
  metadata: { product_code: "resume_pro" },
  payment_intent: "pi_live_retry",
}, "evt_alert_retry_12345678");
const retryStore = inMemoryOutbox(retryEvent, "payment_completed");
let sendAttempts = 0;
await assert.rejects(() => deliverDurablePaymentOperatorAlert(
  retryEvent,
  "payment_completed",
  retryStore,
  async () => {
    sendAttempts += 1;
    throw new Error("temporary SMTP failure");
  },
));
assert.equal(retryStore.row.status, "pending", "SMTP failure must leave a pending durable intent");
assert.equal(retryStore.row.attempts, 1);

const retryResult = await deliverDurablePaymentOperatorAlert(
  retryEvent,
  "payment_completed",
  retryStore,
  async () => {
    sendAttempts += 1;
    return { outcome: "sent" };
  },
);
assert.equal(retryResult.outcome, "sent");
assert.equal(retryStore.row.status, "sent");
assert.equal(retryStore.row.attempts, 2);

const sentDuplicate = await deliverDurablePaymentOperatorAlert(
  retryEvent,
  "payment_completed",
  retryStore,
  async () => {
    sendAttempts += 1;
    return { outcome: "sent" };
  },
);
assert.equal(sentDuplicate.outcome, "not_pending");
assert.equal(sendAttempts, 2, "a sent duplicate must not send another email");

const entitlementSql = fs.readFileSync(new URL("../docs/entitlement-storage.sql", import.meta.url), "utf8");
const webhookSource = fs.readFileSync(new URL("../src/app/api/stripe/webhook/route.ts", import.meta.url), "utf8");
const outboxTable = entitlementSql.slice(
  entitlementSql.indexOf("create table if not exists payment_operator_alert_outbox"),
  entitlementSql.indexOf("create or replace function record_payment_operator_alert_intent"),
);

for (const contract of [
  "primary key (event_key, alert_kind)",
  "status in ('pending', 'sent')",
  "attempts integer not null default 0",
  "last_attempt_at timestamptz",
  "sent_at timestamptz",
  "lease_token_hash text",
  "20260823_payment_operator_alert_outbox_v1",
  "revoke all on table payment_operator_alert_outbox from public",
  "perform public.record_payment_operator_alert_intent",
]) {
  assert.ok(entitlementSql.includes(contract), `missing durable alert SQL contract: ${contract}`);
}
assert.doesNotMatch(outboxTable, /email|card|payload|json|stripe_event_id/i, "outbox rows must contain no PII, payload or full Stripe ID column");
assert.ok(
  entitlementSql.indexOf("perform public.record_payment_operator_alert_intent")
    < entitlementSql.indexOf("insert into purchase_entitlements"),
  "the outbox intent must be written before the entitlement mutation so rollback cannot orphan it",
);
assert.doesNotMatch(webhookSource, /\bafter\s*\(/, "durable alert delivery must not happen after the HTTP response");
assert.match(webhookSource, /deliverDurablePaymentOperatorAlert/);
assert.match(webhookSource, /entitlementPersisted[\s\S]*payment_alert_delivery/);
assert.match(webhookSource, /enqueueFulfillmentAttention/);
assert.match(webhookSource, /return webhookResponse\(\{ error: "Entitlement persistence failed\." \}, 503\)/);

console.log("Stripe operator-alert checks passed.");
