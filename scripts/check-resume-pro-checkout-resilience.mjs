import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  classifyResumeProCheckoutFailure,
  getResumeProCheckoutConfigurationFailure,
  getResumeProCheckoutFailure,
} from "../src/lib/resumeProCheckoutFailure.ts";

const configurationFailure = getResumeProCheckoutConfigurationFailure();
assert.deepEqual(
  { code: configurationFailure.code, status: configurationFailure.status, retryable: configurationFailure.retryable },
  { code: "checkout_unavailable", status: 503, retryable: false },
  "missing deployment configuration must fail closed",
);

for (const type of ["StripeAuthenticationError", "StripeInvalidRequestError", "StripePermissionError"]) {
  const failure = classifyResumeProCheckoutFailure({ type });
  assert.equal(failure.code, "checkout_unavailable", `${type} must be treated as a closed configuration failure`);
  assert.equal(failure.status, 503);
  assert.equal(failure.retryable, false);
}

for (const type of ["StripeAPIError", "StripeConnectionError", "StripeRateLimitError"]) {
  const failure = classifyResumeProCheckoutFailure({ type });
  assert.equal(failure.code, "checkout_temporarily_unavailable", `${type} must offer a safe retry`);
  assert.equal(failure.status, 503);
  assert.equal(failure.retryable, true);
  assert.match(failure.message, /다시 시도/);
}

const productFailure = classifyResumeProCheckoutFailure({ name: "ResumeProStripeProductContractError" });
assert.equal(productFailure.code, "checkout_unavailable", "Product identity or tax mismatch must fail closed");
assert.equal(productFailure.retryable, false);

const unknownFailure = classifyResumeProCheckoutFailure(new Error("price_secret_internal_detail"));
assert.equal(unknownFailure.code, "checkout_failed");
assert.equal(unknownFailure.status, 500);

for (const code of ["checkout_unavailable", "checkout_temporarily_unavailable", "checkout_failed"]) {
  const failure = getResumeProCheckoutFailure(code);
  assert.ok(failure, `${code} must have an allowlisted public result`);
  assert.doesNotMatch(failure.message, /(sk|rk)_(test|live)_|price_|prod_|txcd_|STRIPE_/i, "public copy must not expose Stripe or environment identifiers");
}
assert.equal(getResumeProCheckoutFailure("price_secret_internal_detail"), null, "unknown error text must not become public copy");

const route = readFileSync(resolve("src/app/api/checkout/resume-pro/route.ts"), "utf8");
const form = readFileSync(resolve("src/components/tools/ResumeProCheckoutForm.tsx"), "utf8");
const page = readFileSync(resolve("src/app/resume-pro/page.tsx"), "utf8");

const readinessGate = route.indexOf("if (!allowed)");
const remoteLookup = route.indexOf("stripe.prices.retrieve");
const sessionCreation = route.indexOf("stripe.checkout.sessions.create");
const successfulJson = route.indexOf("checkoutUrl: session.url");
assert.ok(readinessGate >= 0 && remoteLookup > readinessGate, "missing environment configuration must stop before the remote Product lookup");
assert.ok(sessionCreation >= 0 && successfulJson > sessionCreation, "a Checkout URL response must only follow Session creation");
assert.ok(route.includes("classifyResumeProCheckoutFailure(error)"), "Stripe and Product lookup failures must use the public classifier");
assert.ok(route.includes("checkoutFailureResponse(request, acquisitionSource"), "native and enhanced forms must share the safe failure boundary");
assert.ok(!route.includes("error.message") && !route.includes("String(error)"), "route logs and responses must not serialize internal errors");

const fetchCall = form.indexOf("await fetch(form.action");
const verifiedUrl = form.indexOf("getSafeCheckoutUrl(payload?.checkoutUrl)");
const checkoutStarted = form.indexOf('track("Checkout Started"');
assert.ok(fetchCall >= 0 && verifiedUrl > fetchCall && checkoutStarted > verifiedUrl, "Checkout Started must only be recorded after a verified Session URL is returned");
assert.ok(form.includes('headers: { Accept: "application/json" }'), "enhanced checkout must request the safe JSON contract");
assert.ok(!form.includes('onSubmit={() => track("Checkout Started"'), "form submission alone must not count as Checkout Started");
assert.ok(form.includes('url.hostname === "checkout.stripe.com"'), "client redirect must accept only Stripe-hosted Checkout URLs");
assert.ok(page.includes("getResumeProCheckoutFailure(checkout)"), "native form fallback must render only allowlisted Korean error copy");

console.log("Resume Pro Checkout resilience and analytics contract checks passed.");
