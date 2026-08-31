import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [
  checkout, offer, checkoutForm, commerce, contract, firstSale, webhook,
  entitlementMigration, gateMigration, workspace, success, accessTools, deviceData,
  paymentAlerts, paymentAlertOutbox,
] = await Promise.all([
  read("../src/app/api/checkout/eofy-pro/route.ts"),
  read("../src/app/eofy-pro/page.tsx"),
  read("../src/components/tools/EofyProCheckoutForm.tsx"),
  read("../src/lib/commerce.ts"),
  read("../src/lib/productEntitlementContract.ts"),
  read("../src/lib/firstSaleGate.ts"),
  read("../src/app/api/stripe/webhook/route.ts"),
  read("../docs/migrations/20260830_eofy_entitlement_v1.sql"),
  read("../docs/migrations/20260830_eofy_first_sale_gate_v1.sql"),
  read("../src/app/eofy-pro/workspace/page.tsx"),
  read("../src/app/eofy-pro/success/page.tsx"),
  read("../src/components/tools/EofyProAccessTools.tsx"),
  read("../src/components/tools/DeviceDataTransfer.tsx"),
  read("../src/lib/paymentAlerts.ts"),
  read("../src/lib/paymentAlertOutbox.ts"),
]);

for (const value of [
  "checkout.sessions.create", "integration_identifier", "terms_accepted",
  "purchase_terms_version", "stripe.prices.retrieve", 'price.type === "one_time"',
  "price.unit_amount === eofyProProduct.priceCents", "managed_payments: { enabled: true }",
  "isPaymentRuntimeSchemaReady(\"eofy_pro\")", "getActiveEofyProEntitlement()",
  "createFirstSaleReservation(EOFY_FIRST_SALE_PRODUCT_CODE)", "attachCheckoutSession",
  "releaseFailedReservation", "idempotencyKey: claim.idempotencyKey",
]) assert.ok(checkout.includes(value), `EOFY checkout contract is missing: ${value}`);

assert.ok(!checkout.includes("payment_method_types"), "Stripe must retain dynamic payment methods");
assert.ok(!checkout.includes("automatic_tax"), "Managed Payments must not be combined with automatic tax");
for (const href of ["/terms", "/purchase-information", "/privacy"]) {
  assert.ok(checkoutForm.includes(href), `Checkout disclosure link is missing: ${href}`);
}
assert.ok(checkoutForm.includes("A$9.90") && !checkoutForm.includes("A$14.90"), "Checkout copy must use the A$9.90 product contract");
assert.ok(commerce.includes("EOFY_PRO_PAYMENTS_ENABLED") && commerce.includes("STRIPE_EOFY_PRO_PRICE_ID"), "EOFY needs an independent kill switch and Price ID");
assert.match(commerce, /eofyProProduct = \{[\s\S]*?currency: "aud",[\s\S]*?priceCents: 990,/, "Commerce amount must remain AUD 9.90");
assert.ok(contract.includes('eofy_pro: { currency: "aud", amountTotal: 990 }'), "Webhook entitlement contract must pin AUD 9.90");
assert.ok(firstSale.includes('EOFY_FIRST_SALE_PRODUCT_CODE = "eofy_pro"'), "First-sale gate must recognize EOFY");
assert.ok(webhook.includes("EOFY_FIRST_SALE_PRODUCT_CODE") && webhook.includes("matchesCheckoutProductEntitlementContract"), "Webhook must isolate EOFY before persistence");
assert.ok(paymentAlerts.includes('eofy_pro: "EOFY Pack Pro"') && paymentAlertOutbox.includes('"eofy_pro"'), "Operator alerts must retain the EOFY product identity");
for (const migration of [entitlementMigration, gateMigration]) {
  assert.ok(migration.includes("eofy_pro"), "Migration must include EOFY");
}
assert.ok(gateMigration.includes("expected_amount_cents = 990") && gateMigration.includes("when 'eofy_pro' then 990"), "First-sale migration must pin AUD 9.90");
assert.ok(workspace.includes("getActiveEofyProEntitlement") && success.includes("findActiveByCheckoutSession(session.id, \"eofy_pro\")"), "Workspace and success flow must use the product-scoped entitlement");
assert.ok(accessTools.includes("/eofy-pro?access=released") && accessTools.includes("#eofy-delete-heading"), "Release must preserve a separate local-data deletion path");
assert.ok(deviceData.includes('const eofyProStorageKey = "hoju-compass-eofy-pro-v1"') && deviceData.includes("deleteEofyDeviceData"), "Shared-device deletion must target only EOFY local data");
assert.ok(offer.includes("다시 결제하지 말고") && offer.includes("/eofy-pro/restore"), "Offer must retain safe recovery and no-repurchase guidance");

console.log("EOFY Pack Pro checkout, entitlement, recovery, and migration contracts passed.");
