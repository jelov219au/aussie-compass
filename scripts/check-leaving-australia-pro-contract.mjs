import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [
  checkout, offer, checkoutForm, commerce, contract, firstSale, webhook,
  entitlementMigration, gateMigration, workspace, success, accessTools, deviceData,
  paymentAlerts, paymentAlertOutbox,
] = await Promise.all([
  read("../src/app/api/checkout/leaving-australia-pro/route.ts"),
  read("../src/app/leaving-australia-pro/page.tsx"),
  read("../src/components/tools/LeavingAustraliaProCheckoutForm.tsx"),
  read("../src/lib/commerce.ts"),
  read("../src/lib/productEntitlementContract.ts"),
  read("../src/lib/firstSaleGate.ts"),
  read("../src/app/api/stripe/webhook/route.ts"),
  read("../docs/migrations/20260830_leaving_australia_entitlement_v1.sql"),
  read("../docs/migrations/20260830_leaving_australia_first_sale_gate_v1.sql"),
  read("../src/app/leaving-australia-pro/workspace/page.tsx"),
  read("../src/app/leaving-australia-pro/success/page.tsx"),
  read("../src/components/tools/LeavingAustraliaProAccessTools.tsx"),
  read("../src/components/tools/DeviceDataTransfer.tsx"),
  read("../src/lib/paymentAlerts.ts"),
  read("../src/lib/paymentAlertOutbox.ts"),
]);

for (const value of [
  "checkout.sessions.create", "integration_identifier", "terms_accepted",
  "purchase_terms_version", "stripe.prices.retrieve", 'price.type === "one_time"',
  "price.unit_amount === leavingAustraliaProProduct.priceCents", "managed_payments: { enabled: true }",
  "isPaymentRuntimeSchemaReady(\"leaving_australia_pro\")", "getActiveLeavingAustraliaProEntitlement()",
  "createFirstSaleReservation(LEAVING_AUSTRALIA_FIRST_SALE_PRODUCT_CODE)", "attachCheckoutSession",
  "releaseFailedReservation", "idempotencyKey: claim.idempotencyKey",
]) assert.ok(checkout.includes(value), `Leaving Australia checkout contract is missing: ${value}`);

assert.ok(!checkout.includes("payment_method_types"), "Stripe must retain dynamic payment methods");
assert.ok(!checkout.includes("automatic_tax"), "Managed Payments must not be combined with automatic tax");
for (const href of ["/terms", "/purchase-information", "/privacy"]) {
  assert.ok(checkoutForm.includes(href), `Checkout disclosure link is missing: ${href}`);
}
assert.ok(checkoutForm.includes("A$12.90") && !checkoutForm.includes("A$9.90"), "Checkout copy must use the A$12.90 product contract");
assert.ok(commerce.includes("LEAVING_AUSTRALIA_PRO_PAYMENTS_ENABLED") && commerce.includes("STRIPE_LEAVING_AUSTRALIA_PRO_PRICE_ID"), "Leaving Australia needs an independent kill switch and Price ID");
assert.match(commerce, /leavingAustraliaProProduct = \{[\s\S]*?currency: "aud",[\s\S]*?priceCents: 1290,/, "Commerce amount must remain AUD 12.90");
assert.ok(contract.includes('leaving_australia_pro: { currency: "aud", amountTotal: 1290 }'), "Webhook entitlement contract must pin AUD 12.90");
assert.ok(firstSale.includes('LEAVING_AUSTRALIA_FIRST_SALE_PRODUCT_CODE = "leaving_australia_pro"'), "First-sale gate must recognize Leaving Australia");
assert.ok(webhook.includes("LEAVING_AUSTRALIA_FIRST_SALE_PRODUCT_CODE") && webhook.includes("matchesCheckoutProductEntitlementContract"), "Webhook must isolate Leaving Australia before persistence");
assert.ok(paymentAlerts.includes('leaving_australia_pro: "Leaving Australia Pack Pro"') && paymentAlertOutbox.includes('"leaving_australia_pro"'), "Operator alerts must retain the Leaving Australia product identity");
for (const migration of [entitlementMigration, gateMigration]) {
  assert.ok(migration.includes("leaving_australia_pro"), "Migration must include Leaving Australia");
  assert.ok(migration.includes("eofy_pro"), "Leaving Australia migrations must preserve the existing EOFY product contract");
}
assert.ok(gateMigration.includes("expected_amount_cents = 1290") && gateMigration.includes("when 'leaving_australia_pro' then 1290"), "First-sale migration must pin AUD 12.90");
assert.ok(workspace.includes("getActiveLeavingAustraliaProEntitlement") && success.includes("findActiveByCheckoutSession(session.id, \"leaving_australia_pro\")"), "Workspace and success flow must use the product-scoped entitlement");
assert.ok(accessTools.includes("/leaving-australia-pro?access=released") && accessTools.includes("#leaving-australia-delete-heading"), "Release must preserve a separate local-data deletion path");
assert.ok(deviceData.includes('const leavingAustraliaProStorageKey = "hoju-compass-leaving-pro-v1"') && deviceData.includes("deleteLeavingAustraliaDeviceData"), "Shared-device deletion must target only Leaving Australia local data");
assert.ok(offer.includes("다시 결제하지 말고") && offer.includes("/leaving-australia-pro/restore"), "Offer must retain safe recovery and no-repurchase guidance");

console.log("Leaving Australia Pack Pro checkout, entitlement, recovery, and migration contracts passed.");
