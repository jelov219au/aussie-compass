import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [
  checkout, offer, checkoutForm, commerce, contract, firstSale, webhook,
  entitlementMigration, gateMigration, workspace, success, accessTools, deviceData,
  nextConfig, activationRoute, activationForm,
] = await Promise.all([
  read("../src/app/api/checkout/pay-evidence-pro/route.ts"),
  read("../src/app/pay-evidence-pro/page.tsx"),
  read("../src/components/tools/PayEvidenceProCheckoutForm.tsx"),
  read("../src/lib/commerce.ts"),
  read("../src/lib/productEntitlementContract.ts"),
  read("../src/lib/firstSaleGate.ts"),
  read("../src/app/api/stripe/webhook/route.ts"),
  read("../docs/migrations/20260830_pay_evidence_entitlement_v1.sql"),
  read("../docs/migrations/20260830_pay_evidence_first_sale_gate_v1.sql"),
  read("../src/app/pay-evidence-pro/workspace/page.tsx"),
  read("../src/app/pay-evidence-pro/success/page.tsx"),
  read("../src/components/tools/PayEvidenceProAccessTools.tsx"),
  read("../src/components/tools/DeviceDataTransfer.tsx"),
  read("../next.config.ts"),
  read("../src/app/api/pay-evidence-pro/access/activate/route.ts"),
  read("../src/components/tools/PayEvidenceProActivationForm.tsx"),
]);

for (const value of [
  "checkout.sessions.create", "integration_identifier", "terms_accepted",
  "purchase_terms_version", "stripe.prices.retrieve", 'price.type === "one_time"',
  "price.unit_amount === payEvidenceProProduct.priceCents", "managed_payments: { enabled: true }",
  "isPaymentRuntimeSchemaReady(\"pay_evidence_pro\")", "getActivePayEvidenceProEntitlement()",
  "createFirstSaleReservation(PAY_EVIDENCE_FIRST_SALE_PRODUCT_CODE)", "attachCheckoutSession",
  "releaseFailedReservation", "idempotencyKey: claim.idempotencyKey",
]) assert.ok(checkout.includes(value), `Pay Evidence checkout contract is missing: ${value}`);

assert.ok(!checkout.includes("payment_method_types"), "Stripe must retain dynamic payment methods");
assert.ok(!checkout.includes("automatic_tax"), "Managed Payments must not be combined with automatic tax");
assert.ok(
  nextConfig.includes(`"form-action 'self' https://checkout.stripe.com"`),
  "Pay Evidence native Checkout POST must allow only the exact hosted Stripe form destination",
);
assert.ok(
  checkoutForm.includes('action="/api/checkout/pay-evidence-pro"')
    && checkoutForm.includes('method="post"')
    && checkout.includes("return NextResponse.redirect(session.url, 303)"),
  "Pay Evidence Checkout must retain its native POST and 303 hosted-Checkout navigation",
);
for (const returnContract of [
  "/pay-evidence-pro/success?session_id={CHECKOUT_SESSION_ID}",
  "/pay-evidence-pro?checkout=cancelled",
]) {
  assert.ok(checkout.includes(returnContract), `Pay Evidence Checkout return path is missing: ${returnContract}`);
}
assert.ok(
  success.includes("getVerifiedPayEvidenceProCheckout(sessionId)")
    && success.includes('findActiveByCheckoutSession(session.id, "pay_evidence_pro")'),
  "Pay Evidence success must verify both the Checkout Session and product-scoped entitlement",
);
assert.ok(
  activationRoute.includes('"activation_ready", "/pay-evidence-pro/workspace", 200')
    && activationForm.includes('window.location.assign(body.destination)'),
  "Pay Evidence activation must enter the paid workspace only after the server returns activation_ready",
);
assert.ok(
  workspace.includes("getActivePayEvidenceProEntitlement()")
    && workspace.includes('redirect("/pay-evidence-pro?access=required")'),
  "Pay Evidence workspace must remain entitlement-protected",
);
for (const href of ["/terms", "/purchase-information", "/privacy"]) {
  assert.ok(checkoutForm.includes(href), `Checkout disclosure link is missing: ${href}`);
}
assert.ok(checkoutForm.includes("A$9.90") && !checkoutForm.includes("A$14.90"), "Checkout copy must use the A$9.90 product contract");
assert.ok(commerce.includes("PAY_EVIDENCE_PRO_PAYMENTS_ENABLED") && commerce.includes("STRIPE_PAY_EVIDENCE_PRO_PRICE_ID"), "Pay Evidence needs an independent kill switch and Price ID");
assert.match(commerce, /payEvidenceProProduct = \{[\s\S]*?currency: "aud",[\s\S]*?priceCents: 990,/, "Commerce amount must remain AUD 9.90");
assert.ok(contract.includes('pay_evidence_pro: { currency: "aud", amountTotal: 990 }'), "Webhook entitlement contract must pin AUD 9.90");
assert.ok(firstSale.includes('PAY_EVIDENCE_FIRST_SALE_PRODUCT_CODE = "pay_evidence_pro"'), "First-sale gate must recognize Pay Evidence");
assert.ok(webhook.includes("PAY_EVIDENCE_FIRST_SALE_PRODUCT_CODE") && webhook.includes("matchesCheckoutProductEntitlementContract"), "Webhook must isolate Pay Evidence before persistence");
for (const migration of [entitlementMigration, gateMigration]) {
  assert.ok(migration.includes("pay_evidence_pro"), "Migration must include Pay Evidence");
}
assert.ok(gateMigration.includes("expected_amount_cents = 990") && gateMigration.includes("when 'pay_evidence_pro' then 990"), "First-sale migration must pin AUD 9.90");
assert.ok(workspace.includes("getActivePayEvidenceProEntitlement") && success.includes("findActiveByCheckoutSession(session.id, \"pay_evidence_pro\")"), "Workspace and success flow must use the product-scoped entitlement");
assert.ok(accessTools.includes("/pay-evidence-pro?access=released") && accessTools.includes("#pay-evidence-delete-heading"), "Release must preserve a separate local-data deletion path");
assert.ok(deviceData.includes('const payEvidenceProStorageKey = "hoju-compass-pay-evidence-pro-v1"') && deviceData.includes("deletePayEvidenceDeviceData"), "Shared-device deletion must target only Pay Evidence local data");
assert.ok(offer.includes("다시 결제하지 말고") && offer.includes("/pay-evidence-pro/restore"), "Offer must retain safe recovery and no-repurchase guidance");

console.log("Pay Evidence Pack Pro checkout, entitlement, recovery, and migration contracts passed.");
