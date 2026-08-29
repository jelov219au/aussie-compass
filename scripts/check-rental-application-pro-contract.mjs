import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const checkout = await readFile(new URL("../src/app/api/checkout/rental-application-pro/route.ts", import.meta.url), "utf8");
const checkoutForm = await readFile(new URL("../src/components/tools/RentalApplicationProCheckoutForm.tsx", import.meta.url), "utf8");
const commerce = await readFile(new URL("../src/lib/commerce.ts", import.meta.url), "utf8");
const paymentLaunchCheck = await readFile(new URL("./check-payment-launch.mjs", import.meta.url), "utf8");
const purchase = await readFile(new URL("../src/lib/rentalApplicationProPurchase.ts", import.meta.url), "utf8");
const access = await readFile(new URL("../src/lib/rentalApplicationProAccess.ts", import.meta.url), "utf8");
const entitlementStore = await readFile(new URL("../src/lib/neonEntitlementStore.ts", import.meta.url), "utf8");
const successPage = await readFile(new URL("../src/app/rental-application-pro/success/page.tsx", import.meta.url), "utf8");
const workspace = await readFile(new URL("../src/app/rental-application-pro/workspace/page.tsx", import.meta.url), "utf8");

for (const contract of [
  "checkout.sessions.create",
  "integration_identifier",
  "terms_accepted",
  "purchase_terms_version",
  "stripe.prices.retrieve",
  "price.type === \"one_time\"",
  "price.unit_amount === rentalApplicationProProduct.priceCents",
  "managed_payments: { enabled: true }",
  "cancel_url:",
  'product_code: "rental_application_pro"',
]) assert.ok(checkout.includes(contract), `Rental checkout safety contract is missing: ${contract}`);

assert.ok(!checkout.includes("payment_method_types"), "Rental checkout must keep Stripe dynamic payment methods enabled");
assert.ok(!checkout.includes("automatic_tax"), "Rental checkout must not add automatic tax on top of Managed Payments");
assert.ok(checkoutForm.includes('/terms'), "Rental checkout must link the service terms");
assert.ok(checkoutForm.includes('/purchase-information'), "Rental checkout must link the purchase information");
assert.ok(checkoutForm.includes('/privacy'), "Rental checkout must link the privacy notice");
assert.ok(commerce.includes("RENTAL_APPLICATION_PRO_PAYMENTS_ENABLED"), "Rental payments require a product-specific kill switch");
assert.ok(commerce.includes("STRIPE_RENTAL_APPLICATION_PRO_PRICE_ID"), "Rental payments require a separate Stripe Price");
assert.ok(paymentLaunchCheck.includes('selectedProduct === "rental-application-pro"'), "Payment launch audit must support a Rental-specific mode");
assert.ok(paymentLaunchCheck.includes("RENTAL_APPLICATION_PRO_PAYMENTS_ENABLED"), "Rental launch audit must verify the product kill switch");
assert.ok(paymentLaunchCheck.includes("STRIPE_RENTAL_APPLICATION_PRO_PRICE_ID"), "Rental launch audit must verify the product Price");
assert.ok(purchase.includes('metadata?.product_code === "rental_application_pro"'), "Paid-session verification must require the Rental product code");
assert.ok(purchase.includes("rentalApplicationProProduct.priceCents"), "Paid-session verification must require the exact Rental price");
assert.ok(access.includes('findActiveById(payload.entitlementId, "rental_application_pro")'), "Rental access must query only its own entitlement");
assert.ok(entitlementStore.includes("findByCheckoutSession"), "Rental purchase status must distinguish refunded access from pending fulfillment");
assert.ok(successPage.includes('entitlementStatus === "revoked"'), "Rental success must clearly report revoked or refunded access");
assert.ok(workspace.includes("getActiveRentalApplicationProEntitlement"), "The Rental workspace must verify its paid entitlement");

const paymentLaunchPath = fileURLToPath(new URL("./check-payment-launch.mjs", import.meta.url));
const rentalAudit = spawnSync(process.execPath, [paymentLaunchPath, "--product=rental-application-pro", "--strict"], {
  encoding: "utf8",
  env: {
    ...process.env,
    VERCEL_ENV: "production",
    PAYMENTS_ENABLED: "true",
    STRIPE_SECRET_KEY: "rk_live_contract_placeholder",
    STRIPE_WEBHOOK_SECRET: "whsec_contract_placeholder",
    STRIPE_MANAGED_PAYMENTS_ENABLED: "true",
    PAYMENTS_ENTITLEMENT_STORE: "neon",
    ENTITLEMENT_DB_URL: "postgresql://contract-placeholder",
    ENTITLEMENT_SESSION_SECRET: "contract-placeholder-with-at-least-32-characters",
    BUSINESS_LEGAL_NAME: "Contract Placeholder",
    BUSINESS_ABN: "12345678901",
    NEXT_PUBLIC_SUPPORT_EMAIL: "support@example.com",
    RENTAL_APPLICATION_PRO_PAYMENTS_ENABLED: "true",
    STRIPE_RENTAL_APPLICATION_PRO_PRICE_ID: "price_contract_placeholder",
  },
});
assert.equal(rentalAudit.status, 0, rentalAudit.stderr || "Rental launch audit should pass a complete Production-shaped contract");
assert.match(rentalAudit.stdout, /Rental Pack Pro 스위치/);
assert.match(rentalAudit.stdout, /Rental Pack Pro 가격/);
assert.match(rentalAudit.stdout, /결과: 14\/14 통과, 0개 대기/);
assert.ok(!rentalAudit.stdout.includes("contract_placeholder"), "Rental launch audit must not print supplied values");

const invalidAudit = spawnSync(process.execPath, [paymentLaunchPath, "--product=unknown"], { encoding: "utf8" });
assert.equal(invalidAudit.status, 2, "Unknown product names must fail closed");
assert.match(invalidAudit.stderr, /Unknown payment product/);

console.log("Rental Application Pack Pro checkout and access contracts passed.");
