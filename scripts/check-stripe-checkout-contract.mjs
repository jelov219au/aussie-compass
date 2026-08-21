import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const checkout = await readFile(new URL("../src/app/api/checkout/resume-pro/route.ts", import.meta.url), "utf8");
const checkoutForm = await readFile(new URL("../src/components/tools/ResumeProCheckoutForm.tsx", import.meta.url), "utf8");
const attribution = await readFile(new URL("../src/lib/resumeProAttribution.ts", import.meta.url), "utf8");
const payEvidenceCheckout = await readFile(new URL("../src/app/api/checkout/pay-evidence-pro/route.ts", import.meta.url), "utf8");
const payEvidenceCheckoutForm = await readFile(new URL("../src/components/tools/PayEvidenceCheckoutForm.tsx", import.meta.url), "utf8");
const rentalCheckout = await readFile(new URL("../src/app/api/checkout/rental-application-pro/route.ts", import.meta.url), "utf8");
const rentalCheckoutForm = await readFile(new URL("../src/components/tools/RentalProCheckoutForm.tsx", import.meta.url), "utf8");
const carBuyCheckout = await readFile(new URL("../src/app/api/checkout/car-buy-pro/route.ts", import.meta.url), "utf8");
const carBuyCheckoutForm = await readFile(new URL("../src/components/tools/CarBuyProCheckoutForm.tsx", import.meta.url), "utf8");
const eofyCheckout = await readFile(new URL("../src/app/api/checkout/eofy-pro/route.ts", import.meta.url), "utf8");
const eofyCheckoutForm = await readFile(new URL("../src/components/tools/EofyProCheckoutForm.tsx", import.meta.url), "utf8");
const webhook = await readFile(new URL("../src/app/api/stripe/webhook/route.ts", import.meta.url), "utf8");
const purchaseVerification = await readFile(new URL("../src/lib/resumeProPurchase.ts", import.meta.url), "utf8");
const entitlementStore = await readFile(new URL("../src/lib/neonEntitlementStore.ts", import.meta.url), "utf8");
const entitlementTypes = await readFile(new URL("../src/lib/entitlements.ts", import.meta.url), "utf8");
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
  "acquisition_source",
  "normalizeResumeProEntry",
]) {
  assert.ok(checkout.includes(contract), `Checkout safety contract is missing: ${contract}`);
}

assert.ok(checkoutForm.includes('name="source"'), "Resume Pro Checkout must submit its allowlisted acquisition source");
for (const entry of ["article-job-search-plan", "article-achievement-examples", "resume-builder-complete"]) {
  assert.ok(attribution.includes(entry), `Resume Pro acquisition allowlist is missing: ${entry}`);
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

for (const contract of [
  "checkout.sessions.create",
  "integration_identifier",
  "terms_accepted",
  "purchase_terms_version",
  "stripe.prices.retrieve",
  "price.type === \"one_time\"",
  "price.unit_amount === rentalProProduct.priceCents",
  "managed_payments: { enabled: true }",
  "STRIPE_RENTAL_PRO_PRICE_ID",
  "product_code: \"rental_application_pro\"",
]) {
  assert.ok(rentalCheckout.includes(contract), `Rental Checkout safety contract is missing: ${contract}`);
}

for (const contract of [
  "checkout.sessions.create",
  "integration_identifier",
  "terms_accepted",
  "purchase_terms_version",
  "stripe.prices.retrieve",
  "price.type === \"one_time\"",
  "price.unit_amount === carBuyProProduct.priceCents",
  "managed_payments: { enabled: true }",
  "STRIPE_CAR_BUY_PRO_PRICE_ID",
  "product_code: \"car_buy_pro\"",
]) {
  assert.ok(carBuyCheckout.includes(contract), `Car Buy Pro Checkout safety contract is missing: ${contract}`);
}

for (const contract of [
  "checkout.sessions.create",
  "integration_identifier",
  "terms_accepted",
  "purchase_terms_version",
  "stripe.prices.retrieve",
  "price.type === \"one_time\"",
  "price.unit_amount === eofyProProduct.priceCents",
  "managed_payments: { enabled: true }",
  "STRIPE_EOFY_PRO_PRICE_ID",
  "product_code: \"eofy_pro\"",
]) {
  assert.ok(eofyCheckout.includes(contract), `EOFY Pack Pro Checkout safety contract is missing: ${contract}`);
}

assert.ok(!checkout.includes("payment_method_types"), "Checkout must keep Stripe dynamic payment methods enabled");
assert.ok(!payEvidenceCheckout.includes("payment_method_types"), "Pay Evidence Checkout must keep Stripe dynamic payment methods enabled");
assert.ok(!rentalCheckout.includes("payment_method_types"), "Rental Checkout must keep Stripe dynamic payment methods enabled");
assert.ok(!carBuyCheckout.includes("payment_method_types"), "Car Buy Pro Checkout must keep Stripe dynamic payment methods enabled");
assert.ok(!eofyCheckout.includes("payment_method_types"), "EOFY Pack Pro Checkout must keep Stripe dynamic payment methods enabled");
assert.ok(!checkout.includes("automatic_tax"), "The app must not add a separate automatic-tax setting on top of Managed Payments");
assert.ok(!payEvidenceCheckout.includes("automatic_tax"), "Pay Evidence Checkout must not add a separate automatic-tax setting on top of Managed Payments");
assert.ok(!rentalCheckout.includes("automatic_tax"), "Rental Checkout must not add a separate automatic-tax setting on top of Managed Payments");
assert.ok(!carBuyCheckout.includes("automatic_tax"), "Car Buy Pro Checkout must not add a separate automatic-tax setting on top of Managed Payments");
assert.ok(!eofyCheckout.includes("automatic_tax"), "EOFY Pack Pro Checkout must not add a separate automatic-tax setting on top of Managed Payments");
assert.ok(purchaseVerification.includes("(?:test|live)_"), "Purchase verification must accept both test and live Checkout Session IDs");
assert.ok(entitlementStore.includes("(?:test|live)_"), "Entitlement lookup must accept both test and live Checkout Session IDs");
assert.ok(entitlementStore.includes("ignored_unmatched"), "The entitlement store must accept verified unmatched refund events without retrying forever");
assert.ok(entitlementStore.includes("No entitlement matches Stripe event"), "Only the database's explicit unmatched-event result may bypass webhook retries");
assert.ok(entitlementTypes.includes("ignored_unmatched"), "The entitlement result contract must expose unmatched verified events explicitly");
for (const notice of ["/terms", "/purchase-information", "/privacy"]) {
  assert.ok(checkoutForm.includes(notice), `Checkout form must link the customer notice: ${notice}`);
  assert.ok(payEvidenceCheckoutForm.includes(notice), `Pay Evidence Checkout form must link the customer notice: ${notice}`);
  assert.ok(rentalCheckoutForm.includes(notice), `Rental Checkout form must link the customer notice: ${notice}`);
  assert.ok(carBuyCheckoutForm.includes(notice), `Car Buy Pro Checkout form must link the customer notice: ${notice}`);
  assert.ok(eofyCheckoutForm.includes(notice), `EOFY Pack Pro Checkout form must link the customer notice: ${notice}`);
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
