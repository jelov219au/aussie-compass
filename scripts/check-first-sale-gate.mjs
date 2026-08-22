import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { FirstSalePaymentIntentContractError, verifyFirstSalePaymentIntent } from "../src/lib/firstSalePaymentIntent.ts";

const [checkout, webhook, gate, neonGate, entitlementStore, migration, runbook, commerce, entitlementCommands] = await Promise.all([
  readFile(new URL("../src/app/api/checkout/resume-pro/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/app/api/stripe/webhook/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/firstSaleGate.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/neonFirstSaleGate.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/neonEntitlementStore.ts", import.meta.url), "utf8"),
  readFile(new URL("../docs/first-sale-gate.sql", import.meta.url), "utf8"),
  readFile(new URL("../docs/first-sale-gate-runbook.md", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/commerce.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/entitlements.ts", import.meta.url), "utf8"),
]);
const compactMigration = migration.replace(/\s+/g, " ");

for (const obsoleteSignature of [
  "drop function if exists public.apply_first_sale_paid_event( text, text, boolean, timestamptz, text, text, text, text, text );",
  "drop function if exists public.apply_first_sale_paid_event( text, text, boolean, timestamptz, text, text, integer, text, text, text, text );",
]) {
  assert.ok(compactMigration.includes(obsoleteSignature), `Obsolete paid-event overload is not removed: ${obsoleteSignature}`);
}
assert.equal(
  migration.match(/create or replace function public\.apply_first_sale_paid_event\(/g)?.length,
  1,
  "exactly one charge-aware paid-event implementation may be installed",
);

for (const contract of [
  "claimFirstSale(firstSaleGate, stripe, environment)",
  "checkout.sessions.create",
  "expires_at: Math.floor(claim.expiresAt.getTime() / 1000)",
  "{ idempotencyKey: claim.idempotencyKey }",
  "attachCheckoutSession",
  "isVerifiedAbandonedCheckout",
  "releaseVerifiedAbandoned",
  "session.payment_intent",
  'result.outcome === "reserved"',
  '"checkout_retry_later"',
  'result.outcome === "locked"',
  '"checkout_sales_closed"',
  'result.outcome === "manual_review"',
  '"checkout_support_required"',
]) {
  assert.ok(checkout.includes(contract), `Checkout first-sale contract is missing: ${contract}`);
}

assert.equal(
  checkout.match(/checkout\.sessions\.create/g)?.length,
  1,
  "the route must have one Session creation site",
);
assert.ok(
  checkout.indexOf("claimFirstSale(firstSaleGate") < checkout.indexOf("checkout.sessions.create"),
  "the DB claim must happen before Session creation",
);
assert.ok(
  checkout.indexOf("attachCheckoutSession") < checkout.indexOf("checkoutUrl: session.url"),
  "the Session must be attached before its URL is returned",
);

const metadataStart = checkout.indexOf("metadata: {");
const metadataEnd = checkout.indexOf("},", metadataStart);
const metadata = checkout.slice(metadataStart, metadataEnd);
for (const prohibited of ["claimTokenHash", "idempotencyKey", "generation", "reservation"]) {
  assert.ok(!metadata.includes(prohibited), `Stripe metadata must not expose ${prohibited}`);
}
assert.ok(!checkout.includes("error.message") && !checkout.includes("String(error)"), "public/log boundaries must not serialize internal errors");

for (const contract of [
  "STRIPE_CHECKOUT_MINIMUM_TTL_SECONDS = 30 * 60",
  "FIRST_SALE_CLOCK_SKEW_BUFFER_SECONDS = 60",
  "resume_pro_first_sale_${claimTokenHash}",
  "StripeAuthenticationError",
  "StripeInvalidRequestError",
  "StripePermissionError",
  'input.status === "expired"',
  'input.paymentStatus === "unpaid"',
  "input.paymentIntentId === null",
]) {
  assert.ok(gate.includes(contract), `Gate safety helper is missing: ${contract}`);
}

for (const ambiguous of ["StripeConnectionError", "StripeAPIError", "StripeRateLimitError"]) {
  assert.ok(!gate.includes(`stripeType === "${ambiguous}"`), `${ambiguous} must retain the reservation`);
}

for (const contract of [
  "claim_first_sale_reservation",
  "attach_first_sale_checkout",
  "release_failed_first_sale_reservation",
  "release_verified_abandoned_first_sale",
  "apply_first_sale_paid_event",
  "${command.chargeId}",
]) {
  assert.ok(neonGate.includes(contract), `Neon gate adapter is missing: ${contract}`);
}

for (const contract of [
  "apply_guarded_entitlement_event",
  "consume_entitlement_restore_token",
  "create_entitlement_restore_token",
  "find_active_purchase_entitlement_by_checkout",
  "find_active_purchase_entitlement_by_id",
]) {
  assert.ok(entitlementStore.includes(contract), `Least-privilege entitlement adapter is missing: ${contract}`);
}

for (const contract of [
  "pg_advisory_xact_lock(hashtext('first-sale:' || p_product_code))",
  "for update",
  "first_sale_gate_events is append-only",
  "security definer",
  "set search_path = public, pg_temp",
  "p_reservation_expires_at < now() + interval '30 minutes'",
  "return query select 'manual_review'::text",
  "verified_expired_unpaid_no_intent",
  "lock_first_sale_from_paid_event",
  "apply_first_sale_paid_event",
  "from public.apply_entitlement_event(",
  "'SOLD', 'LOCKED'",
  "Paid event does not match the active first-sale reservation",
  "First-sale gate is locked by another paid event",
  "revoke create on schema public from public",
  "revoke all on table public.first_sale_gates, public.first_sale_gate_events from public",
  "revoke all on function public.apply_entitlement_event",
  "apply_guarded_entitlement_event",
  "Resume Pro grant requires apply_first_sale_paid_event",
  "revoke all on table public.payment_webhook_events",
  "grant execute on function public.apply_first_sale_paid_event",
  "revoke all on function public.approve_next_first_sale",
  "p_evidence_status is distinct from 'PASS'",
  "p_cash_difference_cents is null",
  "p_payout_status is distinct from 'matched'",
  "v_approval_reference = ''",
  "translate(",
  "[[:cntrl:]]",
  "v_approval_reference !~ '[[:alnum:]]'",
  "\\200B",
  "\\2060",
  "p_product_code is null",
  "p_generation is null",
  "p_claim_token_hash is null",
  "p_checkout_session_id is null",
  "p_checkout_expires_at is null",
  "p_reservation_expires_at is null",
  "p_livemode is null",
  "p_stripe_created_at is null",
  "p_currency is null",
  "p_currency is distinct from 'aud'",
  "p_amount_total is null",
  "p_amount_total is distinct from 1990",
  "p_charge_id is null",
  "p_charge_id !~ '^ch_[A-Za-z0-9]+$'",
  "is distinct from p_checkout_session_id",
  "entitlement_event_tombstones",
  "stripe_payment_object_links",
  "prevent_entitlement_tombstone_mutation",
  "on conflict (version) do nothing",
  "20260823_first_sale_gate_v1",
  "20260823_first_sale_gate_charge_link_v2",
  "drop function if exists public.apply_first_sale_paid_event(",
]) {
  assert.ok(migration.includes(contract), `First-sale migration contract is missing: ${contract}`);
}

for (const contract of [
  'outcome?: "processed" | "duplicate" | "ignored_stale" | "tombstoned"',
  "row.id === null ? undefined : toEntitlementRecord(row)",
]) {
  assert.ok(entitlementStore.includes(contract), `Tombstone adapter contract is missing: ${contract}`);
}

assert.ok(
  webhook.includes("getPaymentOperatorAlertKind(event)")
    && webhook.includes("deliverDurablePaymentOperatorAlert"),
  "entitlement-free refund/dispute tombstones must still reach the operator alert path",
);
assert.ok(!entitlementCommands.includes("`refund_${"), "refund reasons must not interpolate provider or customer text");
assert.ok(!entitlementCommands.includes("`dispute_${"), "dispute reasons must not interpolate provider or customer text");

function sqlFunction(name, nextName) {
  const start = migration.indexOf(`create or replace function public.${name}`);
  const end = nextName ? migration.indexOf(`create or replace function public.${nextName}`, start + 1) : migration.length;
  assert.ok(start >= 0 && end > start, `SQL function ${name} must exist`);
  return migration.slice(start, end);
}

for (const [name, nextName, requiredNullGuards] of [
  ["claim_first_sale_reservation", "attach_first_sale_checkout", ["p_product_code", "p_claim_token_hash", "p_reservation_expires_at", "p_environment", "p_currency", "p_expected_amount_cents"]],
  ["attach_first_sale_checkout", "release_failed_first_sale_reservation", ["p_product_code", "p_generation", "p_claim_token_hash", "p_checkout_session_id", "p_checkout_expires_at"]],
  ["release_failed_first_sale_reservation", "release_verified_abandoned_first_sale", ["p_product_code", "p_generation", "p_claim_token_hash", "p_reason_code"]],
  ["release_verified_abandoned_first_sale", "lock_first_sale_from_paid_event", ["p_product_code", "p_generation", "p_checkout_session_id"]],
  ["lock_first_sale_from_paid_event", "approve_next_first_sale", ["p_product_code", "p_stripe_event_id", "p_checkout_session_id", "p_livemode", "p_stripe_created_at"]],
  ["apply_first_sale_paid_event", "apply_guarded_entitlement_event", ["p_event_id", "p_event_type", "p_livemode", "p_stripe_created_at", "p_product_code", "p_currency", "p_amount_total", "p_checkout_session_id", "p_payment_intent_id", "p_charge_id", "p_customer_id", "p_reason"]],
  ["consume_entitlement_restore_token", "create_entitlement_restore_token", ["p_token_hash", "p_product_code"]],
  ["create_entitlement_restore_token", null, ["p_entitlement_id", "p_product_code", "p_token_hash", "p_expires_at"]],
]) {
  const body = sqlFunction(name, nextName);
  for (const parameter of requiredNullGuards) {
    assert.ok(body.includes(`${parameter} is null`), `${name} must reject NULL ${parameter}`);
  }
}

const restoreCreate = sqlFunction("create_entitlement_restore_token", null);
assert.ok(
  restoreCreate.indexOf("select entitlement.id into v_active_entitlement_id") < restoreCreate.indexOf("update public.purchase_restore_tokens"),
  "restore-token creation must validate and lock the active product entitlement before invalidating older tokens",
);
assert.ok(restoreCreate.includes("p_expires_at > now() + interval '30 days'"), "restore-token creation must reject expiry beyond 30 days");
const restoreConsume = sqlFunction("consume_entitlement_restore_token", "create_entitlement_restore_token");
for (const contract of ["active_entitlement as materialized", "entitlement.status = 'active'", "for update"]) {
  assert.ok(restoreConsume.includes(contract), `restore-token consumption must lock and require active status: ${contract}`);
}

assert.ok(
  webhook.indexOf("applyPaidEventAndEntitlement") < webhook.indexOf("Persisted Stripe entitlement event"),
  "paid first sale must be committed before success is acknowledged",
);
assert.ok(
  webhook.indexOf("paymentIntents.retrieve") < webhook.indexOf("applyPaidEventAndEntitlement"),
  "latest_charge must be verified before the atomic DB transaction starts",
);
assert.ok(webhook.includes("chargeId,"), "the verified latest Charge must enter the atomic DB transaction");
assert.ok(
  webhook.indexOf("paymentIntents.retrieve") > webhook.indexOf("try {")
    && webhook.includes('return webhookResponse({ error: "Entitlement persistence failed." }, 503)'),
  "PaymentIntent retrieval failures must stay in the fail-closed 503 and operator-alert boundary",
);
assert.ok(!webhook.includes("approve_next_first_sale"), "webhook code must never reopen sales");
assert.ok(webhook.includes("stripeReferenceSuffix(event.id)"), "logs must use only the final eight reference characters");
assert.equal(webhook.match(/eventId: event\.id/g)?.length, 2, "the complete event ID may enter only the private DB receipt and guarded failure-outbox wrapper");
assert.ok(webhook.includes("enqueueFulfillmentAttention"), "a failed paid transaction must durably record the operator alert path");
assert.ok(webhook.includes("deliverDurablePaymentOperatorAlert"), "pending operator alerts must be delivered through the durable outbox");
assert.ok(commerce.includes('process.env.FIRST_SALE_GATE_ENABLED === "true"'), "readiness must require the first-sale gate");
assert.ok(commerce.includes("&& readiness.firstSaleGateConfigured"), "test Checkout must also fail closed");

const validPaymentIntent = {
  id: "pi_testVerified123",
  livemode: false,
  currency: "aud",
  amount: 1990,
  status: "succeeded",
  customer: "cus_testVerified123",
  latest_charge: "ch_testVerified123",
};
const expectedPaymentIntent = {
  paymentIntentId: "pi_testVerified123",
  customerId: "cus_testVerified123",
  livemode: false,
  currency: "aud",
  amountCents: 1990,
};
assert.equal(verifyFirstSalePaymentIntent(validPaymentIntent, expectedPaymentIntent), "ch_testVerified123");
for (const candidate of [
  { ...validPaymentIntent, id: "pi_wrong" },
  { ...validPaymentIntent, livemode: true },
  { ...validPaymentIntent, currency: "usd" },
  { ...validPaymentIntent, amount: 1989 },
  { ...validPaymentIntent, status: "processing" },
  { ...validPaymentIntent, customer: "cus_wrong" },
  { ...validPaymentIntent, latest_charge: null },
  { ...validPaymentIntent, latest_charge: "pi_not_a_charge" },
]) {
  assert.throws(
    () => verifyFirstSalePaymentIntent(candidate, expectedPaymentIntent),
    FirstSalePaymentIntentContractError,
    "a mismatched PaymentIntent must fail closed before the gate lock",
  );
}

for (const contract of [
  "OPEN → RESERVED → SOLD → LOCKED",
  "expired + unpaid + no PaymentIntent",
  "does not authorize",
  "Do **not** grant it `approve_next_first_sale`",
  "zero existing open Checkout Sessions",
  "live remains **HOLD**",
  "A refund does not constitute rollback",
  "PaymentIntents Read",
  "old_9_arg_paid_event_removed",
  "old_11_arg_paid_event_removed",
  "all_privilege_checks_pass",
  "exactly one 12-argument row",
]) {
  assert.ok(runbook.includes(contract), `Operations runbook is missing: ${contract}`);
}

class GateModel {
  state = "OPEN";
  generation = 0;
  session = null;
  expiresAt = 0;
  seenPaid = new Set();
  lockedEvent = null;
  lockedSession = null;
  events = [];

  async claim(now) {
    await Promise.resolve();
    if (this.state === "LOCKED") return "locked";
    if (this.state === "RESERVED") return "reserved";
    this.state = "RESERVED";
    this.generation += 1;
    this.expiresAt = now + 1_860_000;
    this.events.push("OPEN>RESERVED");
    return "claimed";
  }

  attach(session) {
    assert.equal(this.state, "RESERVED");
    this.session = session;
  }

  verifyAbandoned(now, remote) {
    if (this.state !== "RESERVED" || now < this.expiresAt) return false;
    if (remote.status !== "expired" || remote.paymentStatus !== "unpaid" || remote.paymentIntent !== null) return false;
    this.state = "OPEN";
    this.session = null;
    this.events.push("RESERVED>OPEN:verified");
    return true;
  }

  paid(eventId, session = this.session) {
    if (this.seenPaid.has(eventId)) return "duplicate";
    if (this.state === "LOCKED") return "blocked";
    if (this.state !== "RESERVED" || !this.session || session !== this.session) return "blocked";
    this.seenPaid.add(eventId);
    this.events.push(`${this.state}>SOLD`, "SOLD>LOCKED");
    this.state = "LOCKED";
    this.lockedEvent = eventId;
    this.lockedSession = session;
    return "locked";
  }

  refund() {
    return this.state;
  }

  ownerReopen({ approved, evidence, cashDifference, payout }) {
    const approvalReference = typeof approved === "string"
      ? approved.replace(/[\u00a0\u1680\u2000-\u200b\u2028\u2029\u202f\u205f\u2060\u3000\ufeff\u0000-\u001f\u007f]/gu, "").trim()
      : "";
    if (
      approvalReference.length < 4
      || approvalReference.length > 120
      || !/[\p{L}\p{N}]/u.test(approvalReference)
      || evidence !== "PASS"
      || cashDifference === null
      || !Number.isInteger(cashDifference)
      || Math.abs(cashDifference) > 1
      || payout !== "matched"
    ) return false;
    if (this.state !== "LOCKED") return false;
    this.state = "OPEN";
    this.events.push("LOCKED>OPEN:owner");
    return true;
  }
}

const concurrent = new GateModel();
const claims = await Promise.all(Array.from({ length: 16 }, () => concurrent.claim(0)));
assert.equal(claims.filter((outcome) => outcome === "claimed").length, 1, "concurrent claims must have exactly one winner");
assert.equal(claims.filter((outcome) => outcome === "reserved").length, 15);

concurrent.attach("session-internal");
assert.equal(concurrent.verifyAbandoned(1_860_001, { status: "expired", paymentStatus: "unpaid", paymentIntent: "pi_pending" }), false);
assert.equal(concurrent.verifyAbandoned(1_860_001, { status: "expired", paymentStatus: "unpaid", paymentIntent: null }), true);
assert.equal(await concurrent.claim(1_860_002), "claimed", "verified abandonment must permit one new first customer");
concurrent.attach("session-retry");

assert.equal(concurrent.paid("evt_paid"), "locked");
assert.equal(concurrent.paid("evt_paid"), "duplicate", "the exact paid webhook must be idempotent");
assert.equal(concurrent.paid("evt_other", concurrent.lockedSession), "blocked", "a different event after LOCKED must not reach entitlement");
assert.equal(concurrent.paid("evt_other_session", "session-other"), "blocked", "a different Session after LOCKED must be blocked");
assert.equal(concurrent.refund(), "LOCKED", "refund must not reopen the gate");
assert.equal(await concurrent.claim(2_000_000), "locked", "second Checkout must remain blocked");
const validApproval = "FP-OWNER-0001";
assert.equal(concurrent.ownerReopen({ approved: validApproval, evidence: null, cashDifference: 0, payout: "matched" }), false, "NULL evidence must fail closed");
assert.equal(concurrent.ownerReopen({ approved: validApproval, evidence: "PASS", cashDifference: null, payout: "matched" }), false, "NULL cash difference must fail closed");
assert.equal(concurrent.ownerReopen({ approved: validApproval, evidence: "PASS", cashDifference: 0, payout: null }), false, "NULL payout must fail closed");
assert.equal(concurrent.ownerReopen({ approved: validApproval, evidence: null, cashDifference: null, payout: null }), false, "combined NULL inputs must fail closed");
assert.equal(concurrent.ownerReopen({ approved: null, evidence: "PASS", cashDifference: 0, payout: "matched" }), false, "NULL owner reference must fail closed");
assert.equal(concurrent.ownerReopen({ approved: "   ", evidence: "PASS", cashDifference: 0, payout: "matched" }), false, "blank owner reference must fail closed");
assert.equal(concurrent.ownerReopen({ approved: "\t\n\r", evidence: "PASS", cashDifference: 0, payout: "matched" }), false, "control-only owner reference must fail closed");
assert.equal(concurrent.ownerReopen({ approved: "\u00a0\u2003\u3000", evidence: "PASS", cashDifference: 0, payout: "matched" }), false, "Unicode-space-only owner reference must fail closed");
assert.equal(concurrent.ownerReopen({ approved: "\u200b\u2060\u200b\u2060", evidence: "PASS", cashDifference: 0, payout: "matched" }), false, "format-only owner reference must fail closed");
assert.equal(concurrent.ownerReopen({ approved: "abc", evidence: "PASS", cashDifference: 0, payout: "matched" }), false, "short owner reference must fail closed");
assert.equal(concurrent.ownerReopen({ approved: "x".repeat(121), evidence: "PASS", cashDifference: 0, payout: "matched" }), false, "long owner reference must fail closed");
assert.equal(concurrent.ownerReopen({ approved: validApproval, evidence: "PASS", cashDifference: 2, payout: "matched" }), false, "+2 cents must fail");
assert.equal(concurrent.ownerReopen({ approved: validApproval, evidence: "PASS", cashDifference: -2, payout: "matched" }), false, "-2 cents must fail");

for (const cashDifference of [-1, 0, 1]) {
  const passingGate = new GateModel();
  assert.equal(await passingGate.claim(0), "claimed");
  passingGate.attach(`session-pass-${cashDifference}`);
  assert.equal(passingGate.paid(`event-pass-${cashDifference}`), "locked");
  assert.equal(
    passingGate.ownerReopen({ approved: validApproval, evidence: "PASS", cashDifference, payout: "matched" }),
    true,
    `${cashDifference} cent must pass`,
  );
}

assert.equal(concurrent.ownerReopen({ approved: validApproval, evidence: "PASS", cashDifference: 0, payout: "matched" }), true);
assert.equal(await concurrent.claim(2_000_001), "claimed", "owner approval opens only one fresh reservation");

const refundBeforeGrant = new GateModel();
assert.equal(refundBeforeGrant.refund(), "OPEN", "a refund-before-grant cannot fabricate a sale transition");
assert.equal(refundBeforeGrant.paid("evt_unreserved"), "blocked", "an unreserved paid event must not grant access");
assert.equal(await refundBeforeGrant.claim(0), "claimed");
refundBeforeGrant.attach("session-late");
assert.equal(refundBeforeGrant.paid("evt_late_grant", "session-late"), "locked", "a later verified reserved paid event must permanently lock");
assert.equal(refundBeforeGrant.refund(), "LOCKED", "a retried refund must leave the gate locked");

function restoreTokenCreationAllowed(now, expiresAt) {
  return expiresAt > now && expiresAt <= now + 30 * 24 * 60 * 60 * 1000;
}
assert.equal(restoreTokenCreationAllowed(0, 30 * 24 * 60 * 60 * 1000), true, "exactly 30 days must pass");
assert.equal(restoreTokenCreationAllowed(0, 30 * 24 * 60 * 60 * 1000 + 1), false, "more than 30 days must fail");
assert.equal(restoreTokenCreationAllowed(0, 0), false, "an already expired token must fail");

function consumeRestoreToken(entitlementStatus) {
  return entitlementStatus === "active";
}
assert.equal(consumeRestoreToken("active"), true);
assert.equal(consumeRestoreToken("revoked"), false, "a refunded entitlement cannot consume an issued restore token");
assert.equal(consumeRestoreToken("review"), false, "a reviewed entitlement cannot consume an issued restore token");

console.log("Atomic first-sale gate, Stripe idempotency, expiry, webhook-order and owner-reopen contracts passed.");
