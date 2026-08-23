import assert from "node:assert/strict";

import {
  addResumeProPaymentTotals,
  classifyResumeProPerformancePayment,
  emptyResumeProPaymentTotals,
} from "../src/lib/resumeProPerformancePayment.ts";

const base = {
  status: "complete",
  paymentStatus: "paid",
  productCode: "resume_pro",
  currency: "aud",
  amountTotal: 1990,
  expectedCurrency: "aud",
  expectedAmountTotal: 1990,
  paymentIntentStatus: "succeeded",
  chargePaid: true,
  amountRefunded: 0,
};

assert.deepEqual(classifyResumeProPerformancePayment(base), {
  paidCheckouts: 1,
  fullRefunds: 0,
  retainedPayments: 1,
  grossRevenueCents: 1990,
  refundedCents: 0,
  netRevenueCents: 1990,
});

const fullyRefunded = classifyResumeProPerformancePayment({ ...base, amountRefunded: 1990 });
assert.deepEqual(fullyRefunded, {
  paidCheckouts: 1,
  fullRefunds: 1,
  retainedPayments: 0,
  grossRevenueCents: 1990,
  refundedCents: 1990,
  netRevenueCents: 0,
});

assert.deepEqual(classifyResumeProPerformancePayment({ ...base, amountRefunded: 490 }), {
  paidCheckouts: 1,
  fullRefunds: 0,
  retainedPayments: 1,
  grossRevenueCents: 1990,
  refundedCents: 490,
  netRevenueCents: 1500,
});

assert.equal(classifyResumeProPerformancePayment({ ...base, productCode: "other_product" }), null);
assert.equal(classifyResumeProPerformancePayment({ ...base, amountTotal: 990 }), null);
assert.throws(
  () => classifyResumeProPerformancePayment({ ...base, paymentIntentStatus: null, chargePaid: null, amountRefunded: null }),
  /refund evidence is unavailable/,
);

assert.deepEqual(
  addResumeProPaymentTotals(emptyResumeProPaymentTotals(), fullyRefunded),
  fullyRefunded,
);

console.log("Resume Pro performance payment and refund metrics passed.");
