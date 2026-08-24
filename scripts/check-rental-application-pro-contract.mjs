import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const checkout = await readFile(new URL("../src/app/api/checkout/rental-application-pro/route.ts", import.meta.url), "utf8");
const checkoutForm = await readFile(new URL("../src/components/tools/RentalApplicationProCheckoutForm.tsx", import.meta.url), "utf8");
const commerce = await readFile(new URL("../src/lib/commerce.ts", import.meta.url), "utf8");
const purchase = await readFile(new URL("../src/lib/rentalApplicationProPurchase.ts", import.meta.url), "utf8");
const access = await readFile(new URL("../src/lib/rentalApplicationProAccess.ts", import.meta.url), "utf8");
const activateRoute = await readFile(new URL("../src/app/api/rental-application-pro/access/activate/route.ts", import.meta.url), "utf8");
const releaseRoute = await readFile(new URL("../src/app/api/rental-application-pro/access/release/route.ts", import.meta.url), "utf8");
const restoreRoute = await readFile(new URL("../src/app/api/rental-application-pro/restore/route.ts", import.meta.url), "utf8");
const restoreCodeRoute = await readFile(new URL("../src/app/api/rental-application-pro/restore-code/route.ts", import.meta.url), "utf8");
const activationForm = await readFile(new URL("../src/components/tools/RentalApplicationProActivationForm.tsx", import.meta.url), "utf8");
const successPage = await readFile(new URL("../src/app/rental-application-pro/success/page.tsx", import.meta.url), "utf8");
const restoreForm = await readFile(new URL("../src/components/tools/RentalApplicationProRestoreForm.tsx", import.meta.url), "utf8");
const workspace = await readFile(new URL("../src/app/rental-application-pro/workspace/page.tsx", import.meta.url), "utf8");
const webhook = await readFile(new URL("../src/app/api/stripe/webhook/route.ts", import.meta.url), "utf8");
const productEntitlementContract = await readFile(new URL("../src/lib/productEntitlementContract.ts", import.meta.url), "utf8");
const resumeStripeProduct = await readFile(new URL("../src/lib/resumeProStripeProduct.ts", import.meta.url), "utf8");

for (const contract of [
  "checkout.sessions.create",
  "integration_identifier",
  "terms_accepted",
  "purchase_terms_version",
  "stripe.prices.retrieve",
  "price.type === \"one_time\"",
  "price.unit_amount === rentalApplicationProProduct.priceCents",
  "managed_payments: { enabled: true }",
  'product_code: "rental_application_pro"',
]) assert.ok(checkout.includes(contract), `Rental checkout safety contract is missing: ${contract}`);

assert.ok(!checkout.includes("payment_method_types"), "Rental checkout must keep Stripe dynamic payment methods enabled");
assert.ok(!checkout.includes("automatic_tax"), "Rental checkout must not add automatic tax on top of Managed Payments");
assert.ok(checkoutForm.includes('/terms'), "Rental checkout must link the service terms");
assert.ok(checkoutForm.includes('/purchase-information'), "Rental checkout must link the purchase information");
assert.ok(checkoutForm.includes('/privacy'), "Rental checkout must link the privacy notice");
assert.ok(commerce.includes("RENTAL_APPLICATION_PRO_PAYMENTS_ENABLED"), "Rental payments require a product-specific kill switch");
assert.ok(commerce.includes("STRIPE_RENTAL_APPLICATION_PRO_PRICE_ID"), "Rental payments require a separate Stripe Price");
assert.ok(commerce.includes('process.env.VERCEL_ENV !== "production"'), "Rental paid validation must fail closed in Production");
const productionGuard = checkout.indexOf('if (process.env.VERCEL_ENV === "production")');
assert.ok(productionGuard >= 0, "Rental Checkout must have a route-local Production deny gate");
assert.ok(productionGuard < checkout.indexOf("request.formData()"), "Rental Production denial must happen before request-body or Stripe work");
assert.ok(productionGuard < checkout.indexOf("stripe.prices.retrieve") && productionGuard < checkout.indexOf("checkout.sessions.create"), "Rental Production denial must happen before every Stripe call");
assert.ok(checkout.slice(productionGuard, checkout.indexOf("request.formData()")).includes("status: 503"), "Rental Production denial must fail closed with HTTP 503");
assert.ok(webhook.includes("matchesCheckoutProductEntitlementContract(entitlementCommand)"), "Webhook persistence must reject a cross-product Checkout contract before entitlement storage");
assert.ok(webhook.indexOf("matchesCheckoutProductEntitlementContract(entitlementCommand)") < webhook.lastIndexOf("getConfiguredEntitlementStore()"), "Webhook product isolation must run before entitlement persistence is selected");
for (const paidContract of [
  'resume_pro: { currency: "aud", amountTotal: 1990 }',
  'rental_application_pro: { currency: "aud", amountTotal: 1490 }',
]) assert.ok(productEntitlementContract.includes(paidContract), `Paid product entitlement contract is missing: ${paidContract}`);
assert.match(resumeStripeProduct, /resumeProStripeProductDefinition = \{[\s\S]*?currency: "aud",[\s\S]*?priceCents: 1990,/, "Resume entitlement contract must stay aligned with its Stripe product definition");
assert.match(commerce, /rentalApplicationProProduct = \{[\s\S]*?currency: "aud",[\s\S]*?priceCents: 1490,/, "Rental entitlement contract must stay aligned with its commerce product definition");
assert.ok(purchase.includes('metadata?.product_code === "rental_application_pro"'), "Paid-session verification must require the Rental product code");
assert.ok(purchase.includes("rentalApplicationProProduct.priceCents"), "Paid-session verification must require the exact Rental price");
assert.ok(access.includes("findActiveByAccessSession"), "Rental access must require a server-tracked device session");
assert.ok(access.includes('productCode: "rental_application_pro"'), "Rental access sessions must remain product-scoped");
assert.ok(activateRoute.includes("activation_nonce") && activateRoute.includes("consumeCheckoutActivation"), "Rental activation must consume a browser-bound nonce on the server");
assert.ok(activateRoute.includes('productCode: "rental_application_pro"'), "Rental activation must never consume another product's entitlement");
assert.ok(releaseRoute.includes("releaseAccessSession") && releaseRoute.includes("hashRentalApplicationAccessSessionId"), "Rental sign-out must revoke the server-tracked device session before clearing its cookie");
assert.ok(restoreRoute.includes("restore_nonce") && restoreRoute.includes("consumeRestoreTokenHash"), "Rental restore must consume a nonce-bound one-time token");
assert.ok(restoreRoute.includes('productCode: "rental_application_pro"'), "Rental restore must remain product-scoped");
assert.ok(restoreCodeRoute.includes("getActiveRentalApplicationProEntitlement"), "Restore codes must require an active server-tracked Rental session");
assert.ok(activationForm.includes("window.sessionStorage") && activationForm.includes("activation_nonce"), "Rental activation must keep the browser nonce out of the success URL");
for (const terminalStatus of ["used", "released", "refunded", "review"]) {
  assert.ok(successPage.includes(`${terminalStatus}:`), `Rental success must explain the ${terminalStatus} state`);
  assert.ok(activationForm.includes(`\"${terminalStatus}\"`), `Rental activation must recognize ${terminalStatus} as terminal`);
}
assert.ok(successPage.includes("terminalNotice") && activationForm.includes("terminalNotices.has(initialNotice)"), "Terminal Rental states must never expose reactivation");
assert.ok(successPage.includes("initialSessionId={!terminalNotice ? sessionId : undefined}"), "Pending and unavailable Rental states must retain the same Checkout session for safe retry");
assert.ok(activationForm.includes("sessionStorage.removeItem(activationStorageKey)"), "Terminal and stale Rental activation state must be removed");
assert.ok(activationForm.includes("createdAt") && activationForm.includes("activationLifetimeMs"), "Stored Rental activation attempts must expire locally");
assert.ok(successPage.includes("다시 결제하지 마세요") && activationForm.includes("재결제하지 않고 이용권 다시 확인"), "Pending and unavailable Rental states must preserve a no-repurchase retry path");
assert.ok(restoreForm.includes("window.sessionStorage") && restoreForm.includes("restore_nonce"), "Rental restore must bind the raw code to a browser nonce");
assert.ok(!restoreForm.includes("sessionStorage.setItem(restoreNonceStorageKey, code"), "The raw Rental restore code must never be stored in browser storage");
assert.ok(workspace.includes("getActiveRentalApplicationProEntitlement"), "The Rental workspace must verify its paid entitlement");

console.log("Rental Application Pack Pro checkout and access contracts passed.");
