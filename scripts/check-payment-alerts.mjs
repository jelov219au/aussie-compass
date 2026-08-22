import assert from "node:assert/strict";

import { supportedProductCodes } from "../src/lib/entitlements.ts";
import { buildStripeOperatorAlert } from "../src/lib/paymentAlerts.ts";

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

console.log("Stripe operator-alert checks passed.");
