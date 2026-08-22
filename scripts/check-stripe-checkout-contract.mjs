import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const checkout = await readFile(new URL("../src/app/api/checkout/resume-pro/route.ts", import.meta.url), "utf8");
const productContract = await readFile(new URL("../src/lib/resumeProStripeProduct.ts", import.meta.url), "utf8");
const commerce = await readFile(new URL("../src/lib/commerce.ts", import.meta.url), "utf8");
const launchCheck = await readFile(new URL("./check-payment-launch.mjs", import.meta.url), "utf8");
const checkoutForm = await readFile(new URL("../src/components/tools/ResumeProCheckoutForm.tsx", import.meta.url), "utf8");
const attribution = await readFile(new URL("../src/lib/resumeProAttribution.ts", import.meta.url), "utf8");
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
  "expand: [\"product\"]",
  "assertResumeProStripeProduct",
  "managed_payments: { enabled: true }",
  "acquisition_source",
  "normalizeResumeProEntry",
]) {
  assert.ok(checkout.includes(contract), `Checkout safety contract is missing: ${contract}`);
}

for (const contract of [
  "STRIPE_RESUME_PRO_PRODUCT_ID",
  "STRIPE_RESUME_PRO_TAX_CODE",
  "price.product",
  "product.id === config.productId",
  "price.tax_behavior === resumeProStripeProductDefinition.taxBehavior",
  "getTaxCodeId(product) !== config.taxCode",
]) {
  assert.ok(productContract.includes(contract), `Resume Pro Stripe Product contract is missing: ${contract}`);
}

for (const contract of [
  "hasResumeProStripeProductConfig()",
  "stripeMode === expectedStripeMode && stripeProductContractConfigured",
  "readiness.stripeConfigured",
]) {
  assert.ok(commerce.includes(contract), `Checkout readiness fail-closed contract is missing: ${contract}`);
}

for (const contract of ["--verify-stripe", "expand: [\"product\"]", "assertResumeProStripeProduct"]) {
  assert.ok(launchCheck.includes(contract), `Read-only Stripe launch verification is missing: ${contract}`);
}

assert.ok(checkoutForm.includes('name="source"'), "Resume Pro Checkout must submit its allowlisted acquisition source");
for (const entry of ["article-job-search-plan", "article-achievement-examples", "resume-builder-complete"]) {
  assert.ok(attribution.includes(entry), `Resume Pro acquisition allowlist is missing: ${entry}`);
}

assert.ok(!checkout.includes("payment_method_types"), "Checkout must keep Stripe dynamic payment methods enabled");
assert.ok(!checkout.includes("automatic_tax"), "The app must not add a separate automatic-tax setting on top of Managed Payments");
assert.ok(purchaseVerification.includes("(?:test|live)_"), "Purchase verification must accept both test and live Checkout Session IDs");
assert.ok(entitlementStore.includes("(?:test|live)_"), "Entitlement lookup must accept both test and live Checkout Session IDs");
for (const notice of ["/terms", "/purchase-information", "/privacy"]) {
  assert.ok(checkoutForm.includes(notice), `Checkout form must link the customer notice: ${notice}`);
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
