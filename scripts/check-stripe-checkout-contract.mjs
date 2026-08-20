import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const checkout = await readFile(new URL("../src/app/api/checkout/resume-pro/route.ts", import.meta.url), "utf8");
const checkoutForm = await readFile(new URL("../src/components/tools/ResumeProCheckoutForm.tsx", import.meta.url), "utf8");
const payEvidenceCheckout = await readFile(new URL("../src/app/api/checkout/pay-evidence-pro/route.ts", import.meta.url), "utf8");
const payEvidenceCheckoutForm = await readFile(new URL("../src/components/tools/PayEvidenceCheckoutForm.tsx", import.meta.url), "utf8");
const webhook = await readFile(new URL("../src/app/api/stripe/webhook/route.ts", import.meta.url), "utf8");
const purchaseVerification = await readFile(new URL("../src/lib/resumeProPurchase.ts", import.meta.url), "utf8");
const entitlementStore = await readFile(new URL("../src/lib/neonEntitlementStore.ts", import.meta.url), "utf8");
const requestSecurity = await readFile(new URL("../src/lib/requestSecurity.ts", import.meta.url), "utf8");

for (const contract of [
  "checkout.sessions.create",
  "integration_identifier",
  "terms_accepted",
  "purchase_terms_version",
  "stripe.prices.retrieve",
  "price.type === \"one_time\"",
  "price.unit_amount === resumeProProduct.priceCents",
  "managed_payments: { enabled: true }",
]) {
  assert.ok(checkout.includes(contract), `Checkout safety contract is missing: ${contract}`);
}

for (const contract of [
  "checkout.sessions.create",
  "integration_identifier",
  "terms_accepted",
  "purchase_terms_version",
  "stripe.prices.retrieve",
  "price.type === \"one_time\"",
  "price.unit_amount === payEvidenceProduct.priceCents",
  "managed_payments: { enabled: true }",
  "STRIPE_PAY_EVIDENCE_PRO_PRICE_ID",
  "product_code: \"pay_evidence_pro\"",
]) {
  assert.ok(payEvidenceCheckout.includes(contract), `Pay Evidence Checkout safety contract is missing: ${contract}`);
}

assert.ok(!checkout.includes("payment_method_types"), "Checkout must keep Stripe dynamic payment methods enabled");
assert.ok(!payEvidenceCheckout.includes("payment_method_types"), "Pay Evidence Checkout must keep Stripe dynamic payment methods enabled");
assert.ok(!checkout.includes("automatic_tax"), "The app must not add a separate automatic-tax setting on top of Managed Payments");
assert.ok(!payEvidenceCheckout.includes("automatic_tax"), "Pay Evidence Checkout must not add a separate automatic-tax setting on top of Managed Payments");
assert.ok(purchaseVerification.includes("(?:test|live)_"), "Purchase verification must accept both test and live Checkout Session IDs");
assert.ok(entitlementStore.includes("(?:test|live)_"), "Entitlement lookup must accept both test and live Checkout Session IDs");
for (const notice of ["/terms", "/purchase-information", "/privacy"]) {
  assert.ok(checkoutForm.includes(notice), `Checkout form must link the customer notice: ${notice}`);
  assert.ok(payEvidenceCheckoutForm.includes(notice), `Pay Evidence Checkout form must link the customer notice: ${notice}`);
}

for (const contract of [
  "webhooks.constructEvent",
  "stripe-signature",
  "maxWebhookPayloadBytes",
  "Unsupported webhook content type",
  "event.livemode !== expectsLiveEvent",
]) {
  assert.ok(webhook.includes(contract), `Webhook safety contract is missing: ${contract}`);
}

for (const contract of ["VERCEL_ENV === \"production\"", "sec-fetch-site", "maxBodyBytes", "allowedContentTypes"]) {
  assert.ok(requestSecurity.includes(contract), `Mutation-request safety contract is missing: ${contract}`);
}

console.log("Stripe Checkout and webhook safety-contract checks passed.");
