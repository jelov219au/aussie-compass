import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  recoveryFail,
  recoveryPass,
  recoveryReady,
  runRecovery,
  validateLiveRefundedVerification,
} from "./reopen-refunded-resume-verification-sale.mjs";

const [migration, operator] = await Promise.all([
  readFile(new URL("../docs/migrations/20260902_resume_refunded_verification_reopen_v1.sql", import.meta.url), "utf8"),
  readFile(new URL("./reopen-refunded-resume-verification-sale.mjs", import.meta.url), "utf8"),
]);

for (const contract of [
  "20260823_payment_least_privilege_roles_v1",
  "state = 'RESERVED'",
  "set local role hoju_migration_owner",
  "security definer",
  "set search_path = public, pg_temp",
  "pg_advisory_xact_lock(hashtext('first-sale:resume_pro'))",
  "v_gate.state is distinct from 'LOCKED'",
  "p_generation is distinct from 1",
  "v_gate.generation is distinct from p_generation",
  "v_gate.environment is distinct from 'live'",
  "v_gate.expected_amount_cents is distinct from 1990",
  "entitlement.status = 'revoked'",
  "event.event_type = 'charge.refunded'",
  "event.command_action = 'revoke'",
  "event.processing_status = 'processed'",
  "tombstone.reason_code = 'charge_fully_refunded'",
  "verified_internal_full_refund_reopen",
  "from_state, to_state",
  "'LOCKED', 'OPEN'",
  "grant execute on function public.reopen_fully_refunded_resume_verification_sale",
  "to hoju_owner_operator",
  "on conflict (version) do nothing",
]) assert.ok(migration.includes(contract), `migration is missing: ${contract}`);

assert.match(
  migration,
  /revoke all on function public\.reopen_fully_refunded_resume_verification_sale\([\s\S]*?from public, hoju_app_runtime;/,
  "PUBLIC and runtime must not execute the recovery function",
);
assert.doesNotMatch(migration, /grant execute[\s\S]*to hoju_app_runtime/i, "runtime must not reopen a refunded verification sale");
assert.doesNotMatch(migration, /delete from|truncate|drop table/i, "recovery migration must preserve accounting evidence");
assert.doesNotMatch(migration, /update public\.purchase_entitlements|update public\.payment_webhook_events|update public\.entitlement_event_tombstones/i, "recovery must not rewrite payment evidence");

for (const contract of [
  "PAYMENTS_STRIPE_ACCOUNTING_KEY",
  "PAYMENTS_OWNER_OPERATION_URL",
  "PAYMENTS_VERIFIED_INTERNAL_CUSTOMER_EMAIL",
  "REOPEN_FULLY_REFUNDED_RESUME_VERIFICATION_SALE",
  "stripe.checkout.sessions.retrieve",
  "stripe.paymentIntents.retrieve",
  "stripe.charges.retrieve",
  "stripe.refunds.list",
  "stripe.checkout.sessions.listLineItems",
  'stripe.checkout.sessions.list({ status: "open", limit: 100 })',
  'decodeURIComponent(url.username) !== "hoju_owner_operator"',
  'current_user = \'hoju_owner_operator\'',
  "no_gate_table_mutation",
  "reopen_fully_refunded_resume_verification_sale",
  "identifiers_printed=no",
]) assert.ok(operator.includes(contract), `operator is missing: ${contract}`);

assert.doesNotMatch(operator, /sk_live_[A-Za-z0-9]+/, "operator must use a restricted Stripe key");
assert.doesNotMatch(operator, /console\.log\([^\n]*(?:expectedSessionId|expectedPaymentIntentId|expectedChargeId|verifiedInternalEmail|databaseUrl|stripeKey)/, "operator must not print sensitive inputs");

const validStripeState = {
  session: {
    id: "cs_live_VerificationSession0001",
    livemode: true,
    mode: "payment",
    status: "complete",
    payment_status: "paid",
    currency: "aud",
    amount_total: 1990,
    metadata: { product_code: "resume_pro", billing_model: "one_time" },
    payment_intent: "pi_VerificationPayment0001",
    customer_details: { email: "owner@example.test" },
  },
  paymentIntent: {
    id: "pi_VerificationPayment0001",
    livemode: true,
    status: "succeeded",
    currency: "aud",
    amount: 1990,
    amount_received: 1990,
    latest_charge: "ch_VerificationCharge0001",
  },
  charge: {
    id: "ch_VerificationCharge0001",
    livemode: true,
    paid: true,
    status: "succeeded",
    currency: "aud",
    amount: 1990,
    refunded: true,
    amount_refunded: 1990,
    disputed: false,
    payment_intent: "pi_VerificationPayment0001",
  },
  refunds: {
    has_more: false,
    data: [{
      id: "re_VerificationRefund0001",
      charge: "ch_VerificationCharge0001",
      payment_intent: "pi_VerificationPayment0001",
      currency: "aud",
      status: "succeeded",
      amount: 1990,
    }],
  },
  lineItems: {
    has_more: false,
    data: [{ quantity: 1, currency: "aud", amount_total: 1990, price: "price_ResumeProLive0001" }],
  },
  openResumeSessionCount: 0,
  expectedSessionId: "cs_live_VerificationSession0001",
  expectedPaymentIntentId: "pi_VerificationPayment0001",
  expectedChargeId: "ch_VerificationCharge0001",
  expectedPriceId: "price_ResumeProLive0001",
  verifiedInternalEmail: "owner@example.test",
};

assert.equal(validateLiveRefundedVerification(validStripeState), true, "exact fully refunded internal verification chain must pass");

const mutations = [
  { session: { ...validStripeState.session, payment_status: "unpaid" } },
  { session: { ...validStripeState.session, customer_details: { email: "customer@example.test" } } },
  { session: { ...validStripeState.session, metadata: { ...validStripeState.session.metadata, product_code: "rental_application_pro" } } },
  { paymentIntent: { ...validStripeState.paymentIntent, amount_received: 0 } },
  { charge: { ...validStripeState.charge, amount_refunded: 1000 } },
  { charge: { ...validStripeState.charge, disputed: true } },
  { refunds: { has_more: false, data: [{ ...validStripeState.refunds.data[0], status: "pending" }] } },
  { refunds: { has_more: false, data: [{ ...validStripeState.refunds.data[0], payment_intent: "pi_Other0001" }] } },
  { refunds: { has_more: true, data: validStripeState.refunds.data } },
  { lineItems: { has_more: false, data: [{ ...validStripeState.lineItems.data[0], price: "price_Other0001" }] } },
  { openResumeSessionCount: 1 },
];
for (const mutation of mutations) {
  assert.equal(
    validateLiveRefundedVerification({ ...validStripeState, ...mutation }),
    false,
    `unsafe Stripe mutation must fail: ${Object.keys(mutation)[0]}`,
  );
}

const environment = {
  PAYMENTS_OWNER_OPERATION_URL: "postgresql://hoju_owner_operator:secret@ep-curly-wave-a78bktnq.ap-southeast-2.aws.neon.tech/neondb?sslmode=require",
  PAYMENTS_EXPECTED_NEON_ENDPOINT_ID: "ep-curly-wave-a78bktnq",
  PAYMENTS_STRIPE_ACCOUNTING_KEY: `rk_${"live"}_RestrictedAccountingKey0001`,
  PAYMENTS_VERIFIED_CHECKOUT_SESSION_ID: validStripeState.expectedSessionId,
  PAYMENTS_VERIFIED_PAYMENT_INTENT_ID: validStripeState.expectedPaymentIntentId,
  PAYMENTS_VERIFIED_CHARGE_ID: validStripeState.expectedChargeId,
  STRIPE_RESUME_PRO_PRICE_ID: validStripeState.expectedPriceId,
  PAYMENTS_VERIFIED_INTERNAL_CUSTOMER_EMAIL: validStripeState.verifiedInternalEmail,
  PAYMENTS_OWNER_APPROVAL_REFERENCE: "internal-refund-verification-20260902",
  PAYMENTS_VERIFIED_GENERATION: "1",
};

class FakeStripe {}
function fakeNeonWith(rows) {
  let call = 0;
  return () => async () => rows[call++];
}
const readinessPass = [{ database_ok: true, operator_role_ok: true, function_ready: true, no_gate_table_mutation: true }];

assert.equal(await runRecovery(environment, false, {
  Stripe: FakeStripe,
  neon: fakeNeonWith([readinessPass]),
  verifyStripeState: async () => true,
}), "ready", "verified dry run must stop before mutation");

assert.equal(await runRecovery(environment, true, {
  Stripe: FakeStripe,
  neon: fakeNeonWith([readinessPass, [{ reopened: true }]]),
  verifyStripeState: async () => true,
}), "fail", "apply must require exact acknowledgement");

assert.equal(await runRecovery({
  ...environment,
  RESUME_REFUNDED_VERIFICATION_ACK: "REOPEN_FULLY_REFUNDED_RESUME_VERIFICATION_SALE",
}, true, {
  Stripe: FakeStripe,
  neon: fakeNeonWith([readinessPass, [{ reopened: true }]]),
  verifyStripeState: async () => true,
}), "pass", "verified owner apply must call the scoped database function");

assert.equal(await runRecovery(environment, false, {
  Stripe: FakeStripe,
  neon: fakeNeonWith([readinessPass]),
  verifyStripeState: async () => false,
}), "fail", "unverified Stripe state must fail before database access");

assert.equal(await runRecovery(environment, false, {
  Stripe: FakeStripe,
  neon: fakeNeonWith([[{ ...readinessPass[0], no_gate_table_mutation: false }]]),
  verifyStripeState: async () => true,
}), "fail", "an over-privileged operator connection must fail");

for (const output of [recoveryPass, recoveryReady, recoveryFail]) {
  assert.match(output, /secrets_printed=no identifiers_printed=no$/);
  assert.doesNotMatch(output, /cs_live_|pi_|ch_|@/);
}

console.log("Refunded Resume verification recovery contract passed.");
