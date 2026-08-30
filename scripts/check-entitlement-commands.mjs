import assert from "node:assert/strict";

import { getEntitlementCommand } from "../src/lib/entitlements.ts";
import { matchesCheckoutProductEntitlementContract } from "../src/lib/productEntitlementContract.ts";

function stripeEvent(type, object, id = `evt_${type.replaceAll(".", "_")}`) {
  return { id, type, data: { object } };
}

const paidSession = {
  id: "cs_test_paid",
  payment_status: "paid",
  metadata: { product_code: "resume_pro" },
  payment_intent: "pi_paid",
  customer: "cus_paid",
  currency: "aud",
  amount_total: 1990,
};

const resumePaidCommand = getEntitlementCommand(stripeEvent("checkout.session.completed", paidSession));
assert.deepEqual(resumePaidCommand, {
  action: "grant",
  eventId: "evt_checkout_session_completed",
  eventType: "checkout.session.completed",
  productCode: "resume_pro",
  checkoutSessionId: "cs_test_paid",
  paymentIntentId: "pi_paid",
  customerId: "cus_paid",
  currency: "aud",
  amountTotal: 1990,
  referenceId: "cs_test_paid",
  reason: "checkout_paid",
});
assert.equal(matchesCheckoutProductEntitlementContract(resumePaidCommand), true);

const rentalPaidCommand = getEntitlementCommand(stripeEvent("checkout.session.completed", {
  ...paidSession,
  id: "cs_test_rental_paid",
  metadata: { product_code: "rental_application_pro" },
  payment_intent: "pi_rental_paid",
  customer: "cus_rental_paid",
  amount_total: 1490,
}, "evt_rental_checkout_completed"));
assert.deepEqual(
  rentalPaidCommand,
  {
    action: "grant",
    eventId: "evt_rental_checkout_completed",
    eventType: "checkout.session.completed",
    productCode: "rental_application_pro",
    checkoutSessionId: "cs_test_rental_paid",
    paymentIntentId: "pi_rental_paid",
    customerId: "cus_rental_paid",
    currency: "aud",
    amountTotal: 1490,
    referenceId: "cs_test_rental_paid",
    reason: "checkout_paid",
  },
  "a Rental Application purchase must receive only its own product entitlement",
);
assert.equal(matchesCheckoutProductEntitlementContract(rentalPaidCommand), true);
assert.equal(
  matchesCheckoutProductEntitlementContract(getEntitlementCommand(stripeEvent("checkout.session.completed", {
    ...paidSession,
    metadata: { product_code: "rental_application_pro" },
  }))),
  false,
  "a Resume-priced Checkout mislabeled as Rental must never grant Rental access",
);
assert.equal(
  matchesCheckoutProductEntitlementContract(getEntitlementCommand(stripeEvent("checkout.session.completed", {
    ...paidSession,
    amount_total: 1490,
  }))),
  false,
  "a Rental-priced Checkout mislabeled as Resume must never grant Resume access",
);

const payEvidencePaidCommand = getEntitlementCommand(stripeEvent("checkout.session.completed", {
  ...paidSession,
  id: "cs_test_pay_evidence_paid",
  metadata: { product_code: "pay_evidence_pro" },
  payment_intent: "pi_pay_evidence_paid",
  customer: "cus_pay_evidence_paid",
  amount_total: 990,
}, "evt_pay_evidence_checkout_completed"));
assert.equal(payEvidencePaidCommand?.productCode, "pay_evidence_pro");
assert.equal(payEvidencePaidCommand?.amountTotal, 990);
assert.equal(matchesCheckoutProductEntitlementContract(payEvidencePaidCommand), true);
assert.equal(
  matchesCheckoutProductEntitlementContract(getEntitlementCommand(stripeEvent("checkout.session.completed", {
    ...paidSession,
    metadata: { product_code: "pay_evidence_pro" },
  }))),
  false,
  "a Resume-priced Checkout mislabeled as Pay Evidence must never grant Pay Evidence access",
);

assert.equal(
  getEntitlementCommand(stripeEvent("checkout.session.completed", { ...paidSession, metadata: { product_code: "other" } })),
  null,
  "unknown products must never receive a paid-product entitlement",
);
assert.equal(
  getEntitlementCommand(stripeEvent("checkout.session.completed", { ...paidSession, payment_status: "unpaid" }))?.action,
  "review",
  "an unpaid completed session must not grant access",
);
assert.equal(
  getEntitlementCommand(stripeEvent("checkout.session.async_payment_failed", { ...paidSession, payment_status: "unpaid" }))?.action,
  "revoke",
  "a failed asynchronous payment must revoke access",
);
assert.equal(
  getEntitlementCommand(stripeEvent("checkout.session.async_payment_succeeded", paidSession))?.reason,
  "async_payment_succeeded",
);

assert.equal(
  getEntitlementCommand(stripeEvent("refund.updated", { id: "re_1", status: "succeeded", payment_intent: "pi_paid", charge: "ch_1" }))?.action,
  "review",
  "refund events require amount reconciliation instead of guessing",
);
assert.equal(
  getEntitlementCommand(stripeEvent("charge.refunded", { id: "ch_1", refunded: true, amount: 1990, amount_refunded: 1990 }))?.action,
  "revoke",
  "a full refund must revoke access",
);
assert.equal(
  getEntitlementCommand(stripeEvent("charge.refunded", { id: "ch_1", refunded: false, amount: 1990, amount_refunded: 500 }))?.action,
  "review",
  "a partial refund must require review",
);

assert.equal(
  getEntitlementCommand(stripeEvent("charge.dispute.created", { id: "dp_1", status: "needs_response", charge: "ch_1" }))?.action,
  "revoke",
  "an opened dispute must block access",
);
assert.equal(
  getEntitlementCommand(stripeEvent("charge.dispute.updated", { id: "dp_1", status: "under_review", charge: "ch_1" }))?.action,
  "review",
);
assert.equal(
  getEntitlementCommand(stripeEvent("charge.dispute.funds_reinstated", { id: "dp_1", status: "won", charge: "ch_1" }))?.action,
  "grant",
  "reinstated funds may restore access",
);
assert.equal(
  getEntitlementCommand(stripeEvent("charge.dispute.closed", { id: "dp_1", status: "lost", charge: "ch_1" }))?.action,
  "revoke",
);
assert.equal(getEntitlementCommand(stripeEvent("customer.created", { id: "cus_1" })), null);

console.log("Stripe entitlement-command checks passed.");
