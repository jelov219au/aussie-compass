import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const checkout = await readFile(new URL("../src/app/api/checkout/resume-pro/route.ts", import.meta.url), "utf8");
const webhook = await readFile(new URL("../src/app/api/stripe/webhook/route.ts", import.meta.url), "utf8");

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

assert.ok(!checkout.includes("payment_method_types"), "Checkout must keep Stripe dynamic payment methods enabled");
assert.ok(!checkout.includes("automatic_tax"), "The app must not add a separate automatic-tax setting on top of Managed Payments");

for (const contract of [
  "webhooks.constructEvent",
  "stripe-signature",
  "maxWebhookPayloadBytes",
  "event.livemode !== expectsLiveEvent",
]) {
  assert.ok(webhook.includes(contract), `Webhook safety contract is missing: ${contract}`);
}

console.log("Stripe Checkout and webhook safety-contract checks passed.");
