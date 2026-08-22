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

const firstSaleFailures = [
  ["checkout_retry_later", true, undefined],
  ["checkout_sales_closed", false, "/resume-builder"],
  ["checkout_support_required", false, "/contact"],
];
for (const [code, retryable, actionHref] of firstSaleFailures) {
  const failure = classifyResumeProCheckoutFailure({ name: "FirstSaleGateClosedError", publicFailureCode: code });
  assert.equal(failure.code, code, `${code} must remain a fixed public action result`);
  assert.equal(failure.retryable, retryable);
  assert.equal(failure.action?.href, actionHref);
  assert.doesNotMatch(
    failure.message,
    /\b(?:RESERVED|LOCKED|manual_review|Stripe|database|session)\b|다른 고객|세션 식별자/i,
    `${code} must not expose gate, customer or provider internals`,
  );
  assert.doesNotMatch(
    failure.message,
    /카드 (?:정보는 )?입력되지|청구되지 않았|결제되지 않았/,
    `${code} must not claim that an ambiguous earlier attempt was uncharged or had no card entry`,
  );
}

const forgedFirstSaleFailure = classifyResumeProCheckoutFailure({
  name: "FirstSaleGateClosedError",
  publicFailureCode: "checkout_secret_state",
});
assert.equal(forgedFirstSaleFailure.code, "checkout_unavailable", "unknown first-sale details must fail closed to generic copy");

const unknownFailure = classifyResumeProCheckoutFailure(new Error("price_secret_internal_detail"));
assert.equal(unknownFailure.code, "checkout_failed");
assert.equal(unknownFailure.status, 500);

for (const code of [
  "checkout_unavailable",
  "checkout_temporarily_unavailable",
  "checkout_retry_later",
  "checkout_sales_closed",
  "checkout_support_required",
  "checkout_failed",
]) {
  const failure = getResumeProCheckoutFailure(code);
  assert.ok(failure, `${code} must have an allowlisted public result`);
  assert.doesNotMatch(failure.message, /(sk|rk)_(test|live)_|price_|prod_|txcd_|STRIPE_/i, "public copy must not expose Stripe or environment identifiers");
}
assert.equal(getResumeProCheckoutFailure("price_secret_internal_detail"), null, "unknown error text must not become public copy");

const route = readFileSync(resolve("src/app/api/checkout/resume-pro/route.ts"), "utf8");
const form = readFileSync(resolve("src/components/tools/ResumeProCheckoutForm.tsx"), "utf8");
const jumpLink = readFileSync(resolve("src/components/tools/ResumeProCheckoutJumpLink.tsx"), "utf8");
const failureNotice = readFileSync(resolve("src/components/tools/ResumeProCheckoutFailureNotice.tsx"), "utf8");
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
assert.ok(page.includes("ResumeProCheckoutFailureNotice"), "native redirect must use the shared public failure notice");
assert.ok(form.includes("ResumeProCheckoutFailureNotice"), "enhanced JSON failures must use the shared public failure notice");
assert.ok(form.includes('"resume-pro-checkout-requirement resume-pro-checkout-failure"'), "Checkout control must describe the current failure as well as its prerequisite");
assert.ok(failureNotice.includes('role="status"') && failureNotice.includes('aria-live="polite"') && failureNotice.includes('aria-atomic="true"'), "failure copy must be announced accessibly without an interrupting alert");
assert.ok(failureNotice.includes("max-w-full") && !failureNotice.includes("whitespace-nowrap"), "failure actions must wrap safely at 390px");
assert.equal(form.match(/\btrack\(/g)?.length, 1, "public failures must not add analytics events");
assert.ok(form.includes('track("Checkout Started", { product: "resume_pro", entry })'), "the only Checkout event must use fixed product and normalized entry values");
assert.ok(form.includes('id="resume-pro-checkout-heading"') && form.includes("tabIndex={-1}"), "the Checkout section needs a programmatically focusable heading");
assert.ok(form.includes('focus:ring-2 focus:ring-gold'), "programmatic Checkout focus must remain visibly apparent");
assert.ok(form.indexOf('type="checkbox"') < form.indexOf('type="submit"') && form.indexOf('type="submit"') < form.indexOf('href="/terms"'), "after the Checkout heading, keyboard order must be checkbox, payment button, then policy links");
assert.match(jumpLink, /href="#resume-pro-checkout"/);
assert.match(jumpLink, /requestAnimationFrame[\s\S]*getElementById\(checkoutHeadingId\)\?\.focus\(\{ preventScroll: true \}\)/);
assert.doesNotMatch(jumpLink, /preventDefault|history\.(?:pushState|replaceState)/, "the jump link must keep native fragment and Back behavior");
assert.equal(page.match(/<ResumeProCheckoutJumpLink/g)?.length, 2, "every active Resume Pro purchase jump must use the focus-preserving link");
assert.equal(page.match(/href="#resume-pro-checkout"/g)?.length ?? 0, 0, "raw scroll-only Checkout anchors must not remain on the page");

for (const [outcome, code] of [
  ['result.outcome === "reserved"', '"checkout_retry_later"'],
  ['result.outcome === "locked"', '"checkout_sales_closed"'],
  ['result.outcome === "manual_review"', '"checkout_support_required"'],
]) {
  const outcomeIndex = route.indexOf(outcome);
  assert.ok(outcomeIndex >= 0 && route.indexOf(code, outcomeIndex) > outcomeIndex, `${outcome} must map to ${code}`);
}
assert.ok(route.includes('new URL(`/resume-pro?${query}`'), "native failure redirects must carry only the allowlisted public code");

console.log("Resume Pro Checkout resilience and analytics contract checks passed.");
