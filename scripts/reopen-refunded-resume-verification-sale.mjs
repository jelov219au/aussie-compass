import { timingSafeEqual } from "node:crypto";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { neon } from "@neondatabase/serverless";
import Stripe from "stripe";

const APPLY_ACK = "REOPEN_FULLY_REFUNDED_RESUME_VERIFICATION_SALE";
const productCode = "resume_pro";
const expectedAmountCents = 1990;
const expectedCurrency = "aud";
const endpointPattern = /^ep-[a-z0-9-]+$/;

export const recoveryPass = "RESUME_REFUNDED_VERIFICATION_RECOVERY=PASS product=resume_pro stripe=full-refund-verified internal_identity=verified database=owner-function-pass gate=OPEN secrets_printed=no identifiers_printed=no";
export const recoveryReady = "RESUME_REFUNDED_VERIFICATION_RECOVERY=READY product=resume_pro stripe=full-refund-verified internal_identity=verified database=owner-function-ready mutation=not-requested secrets_printed=no identifiers_printed=no";
export const recoveryFail = "RESUME_REFUNDED_VERIFICATION_RECOVERY=FAIL product=resume_pro stripe=unverified internal_identity=unverified database=unverified gate=LOCKED secrets_printed=no identifiers_printed=no";

function safeEqualText(left, right) {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function endpointIdFromDatabaseUrl(value) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    if (
      !["postgres:", "postgresql:"].includes(url.protocol)
      || !hostname.endsWith(".neon.tech")
      || url.pathname.replace(/\/+$/, "") !== "/neondb"
      || decodeURIComponent(url.username) !== "hoju_owner_operator"
    ) return null;
    const label = hostname.split(".")[0] ?? "";
    const endpointId = label.endsWith("-pooler") ? label.slice(0, -"-pooler".length) : label;
    return endpointPattern.test(endpointId) ? endpointId : null;
  } catch {
    return null;
  }
}

function expandedId(value) {
  return typeof value === "string" ? value : value?.id ?? null;
}

export function validateLiveRefundedVerification({
  session,
  paymentIntent,
  charge,
  refunds,
  lineItems,
  openResumeSessionCount,
  expectedSessionId,
  expectedPaymentIntentId,
  expectedChargeId,
  expectedPriceId,
  verifiedInternalEmail,
}) {
  const observedEmail = session?.customer_details?.email?.trim().toLowerCase() ?? "";
  const requestedEmail = verifiedInternalEmail.trim().toLowerCase();
  const succeededRefunds = refunds?.data?.filter((refund) => refund.status === "succeeded") ?? [];
  const refundedCents = succeededRefunds.reduce((sum, refund) => sum + (refund.amount ?? 0), 0);
  const singleLine = lineItems?.data?.length === 1 ? lineItems.data[0] : null;

  return session?.id === expectedSessionId
    && session.livemode === true
    && session.mode === "payment"
    && session.status === "complete"
    && session.payment_status === "paid"
    && session.currency === expectedCurrency
    && session.amount_total === expectedAmountCents
    && session.metadata?.product_code === productCode
    && session.metadata?.billing_model === "one_time"
    && expandedId(session.payment_intent) === expectedPaymentIntentId
    && observedEmail.length >= 3
    && requestedEmail.length >= 3
    && safeEqualText(observedEmail, requestedEmail)
    && lineItems?.has_more === false
    && singleLine?.quantity === 1
    && singleLine?.currency === expectedCurrency
    && singleLine?.amount_total === expectedAmountCents
    && expandedId(singleLine?.price) === expectedPriceId
    && paymentIntent?.id === expectedPaymentIntentId
    && paymentIntent.livemode === true
    && paymentIntent.status === "succeeded"
    && paymentIntent.currency === expectedCurrency
    && paymentIntent.amount === expectedAmountCents
    && paymentIntent.amount_received === expectedAmountCents
    && expandedId(paymentIntent.latest_charge) === expectedChargeId
    && charge?.id === expectedChargeId
    && charge.livemode === true
    && charge.paid === true
    && charge.status === "succeeded"
    && charge.currency === expectedCurrency
    && charge.amount === expectedAmountCents
    && charge.refunded === true
    && charge.amount_refunded === expectedAmountCents
    && charge.disputed === false
    && expandedId(charge.payment_intent) === expectedPaymentIntentId
    && refunds?.has_more === false
    && refunds?.data?.length > 0
    && refunds.data.every((refund) => (
      expandedId(refund.charge) === expectedChargeId
      && expandedId(refund.payment_intent) === expectedPaymentIntentId
      && refund.currency === expectedCurrency
      && refund.status === "succeeded"
    ))
    && refundedCents === expectedAmountCents
    && openResumeSessionCount === 0;
}

export async function verifyStripeState(stripe, input) {
  const [session, paymentIntent, charge, refunds, lineItems, openSessions] = await Promise.all([
    stripe.checkout.sessions.retrieve(input.expectedSessionId),
    stripe.paymentIntents.retrieve(input.expectedPaymentIntentId),
    stripe.charges.retrieve(input.expectedChargeId),
    stripe.refunds.list({ charge: input.expectedChargeId, limit: 100 }),
    stripe.checkout.sessions.listLineItems(input.expectedSessionId, { limit: 100 }),
    stripe.checkout.sessions.list({ status: "open", limit: 100 }),
  ]);
  if (openSessions.has_more) return false;
  const openResumeSessionCount = openSessions.data.filter(
    (candidate) => candidate.metadata?.product_code === productCode,
  ).length;
  return validateLiveRefundedVerification({
    session,
    paymentIntent,
    charge,
    refunds,
    lineItems,
    openResumeSessionCount,
    ...input,
  });
}

function readInput(environment) {
  const databaseUrl = environment.PAYMENTS_OWNER_OPERATION_URL?.trim() ?? "";
  const expectedEndpointId = environment.PAYMENTS_EXPECTED_NEON_ENDPOINT_ID?.trim().toLowerCase() ?? "";
  const stripeKey = environment.PAYMENTS_STRIPE_ACCOUNTING_KEY?.trim() ?? "";
  const expectedSessionId = environment.PAYMENTS_VERIFIED_CHECKOUT_SESSION_ID?.trim() ?? "";
  const expectedPaymentIntentId = environment.PAYMENTS_VERIFIED_PAYMENT_INTENT_ID?.trim() ?? "";
  const expectedChargeId = environment.PAYMENTS_VERIFIED_CHARGE_ID?.trim() ?? "";
  const expectedPriceId = environment.STRIPE_RESUME_PRO_PRICE_ID?.trim() ?? "";
  const verifiedInternalEmail = environment.PAYMENTS_VERIFIED_INTERNAL_CUSTOMER_EMAIL?.trim() ?? "";
  const ownerApprovalReference = environment.PAYMENTS_OWNER_APPROVAL_REFERENCE?.trim() ?? "";
  const generation = Number(environment.PAYMENTS_VERIFIED_GENERATION ?? "");

  if (
    endpointIdFromDatabaseUrl(databaseUrl) !== expectedEndpointId
    || !endpointPattern.test(expectedEndpointId)
    || !/^rk_live_[A-Za-z0-9]+$/.test(stripeKey)
    || !/^cs_live_[A-Za-z0-9]+$/.test(expectedSessionId)
    || !/^pi_[A-Za-z0-9]+$/.test(expectedPaymentIntentId)
    || !/^ch_[A-Za-z0-9]+$/.test(expectedChargeId)
    || !/^price_[A-Za-z0-9]+$/.test(expectedPriceId)
    || !/^\S+@\S+\.\S+$/.test(verifiedInternalEmail)
    || !Number.isSafeInteger(generation)
    || generation < 1
    || ownerApprovalReference.length < 12
    || ownerApprovalReference.length > 120
    || !/[A-Za-z0-9]/.test(ownerApprovalReference)
  ) return null;

  return {
    databaseUrl,
    stripeKey,
    expectedSessionId,
    expectedPaymentIntentId,
    expectedChargeId,
    expectedPriceId,
    verifiedInternalEmail,
    ownerApprovalReference,
    generation,
  };
}

export async function runRecovery(
  environment = process.env,
  apply = false,
  dependencies = { Stripe, neon, verifyStripeState },
) {
  const input = readInput(environment);
  if (!input) return "fail";
  if (apply && environment.RESUME_REFUNDED_VERIFICATION_ACK !== APPLY_ACK) return "fail";

  const stripe = new dependencies.Stripe(input.stripeKey, {
    maxNetworkRetries: 2,
    timeout: 10_000,
    telemetry: false,
  });
  const stripeVerified = await dependencies.verifyStripeState(stripe, input);
  if (!stripeVerified) return "fail";

  const sql = dependencies.neon(input.databaseUrl, {
    fetchOptions: { signal: AbortSignal.timeout(15_000) },
  });
  const readinessRows = await sql`
    select
      current_database() = 'neondb' as database_ok,
      current_user = 'hoju_owner_operator' as operator_role_ok,
      coalesce(has_function_privilege(
        current_user,
        to_regprocedure('public.reopen_fully_refunded_resume_verification_sale(bigint,text,text,text,text)'),
        'EXECUTE'
      ), false) as function_ready,
      not coalesce(has_table_privilege(
        current_user,
        'public.first_sale_gates',
        'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'
      ), false) as no_gate_table_mutation
  `;
  if (!readinessRows[0] || !Object.values(readinessRows[0]).every((value) => value === true)) return "fail";
  if (!apply) return "ready";

  const rows = await sql`
    select public.reopen_fully_refunded_resume_verification_sale(
      ${input.generation},
      ${input.expectedSessionId},
      ${input.expectedPaymentIntentId},
      ${input.expectedChargeId},
      ${input.ownerApprovalReference}
    ) as reopened
  `;
  return rows.length === 1 && rows[0]?.reopened === true ? "pass" : "fail";
}

async function main() {
  try {
    const outcome = await runRecovery(process.env, process.argv.includes("--apply"));
    console.log(outcome === "pass" ? recoveryPass : outcome === "ready" ? recoveryReady : recoveryFail);
    if (outcome === "fail") process.exitCode = 1;
  } catch {
    console.log(recoveryFail);
    process.exitCode = 1;
  } finally {
    for (const name of [
      "PAYMENTS_OWNER_OPERATION_URL",
      "PAYMENTS_STRIPE_ACCOUNTING_KEY",
      "PAYMENTS_VERIFIED_CHECKOUT_SESSION_ID",
      "PAYMENTS_VERIFIED_PAYMENT_INTENT_ID",
      "PAYMENTS_VERIFIED_CHARGE_ID",
      "PAYMENTS_VERIFIED_INTERNAL_CUSTOMER_EMAIL",
      "PAYMENTS_OWNER_APPROVAL_REFERENCE",
      "RESUME_REFUNDED_VERIFICATION_ACK",
    ]) delete process.env[name];
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  await main();
}
