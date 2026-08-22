import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const checkout = await readFile(new URL("../src/app/api/checkout/rental-application-pro/route.ts", import.meta.url), "utf8");
const checkoutForm = await readFile(new URL("../src/components/tools/RentalApplicationProCheckoutForm.tsx", import.meta.url), "utf8");
const commerce = await readFile(new URL("../src/lib/commerce.ts", import.meta.url), "utf8");
const purchase = await readFile(new URL("../src/lib/rentalApplicationProPurchase.ts", import.meta.url), "utf8");
const access = await readFile(new URL("../src/lib/rentalApplicationProAccess.ts", import.meta.url), "utf8");
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
  'product_code: "rental_application_pro"',
]) assert.ok(checkout.includes(contract), `Rental checkout safety contract is missing: ${contract}`);

assert.ok(!checkout.includes("payment_method_types"), "Rental checkout must keep Stripe dynamic payment methods enabled");
assert.ok(!checkout.includes("automatic_tax"), "Rental checkout must not add automatic tax on top of Managed Payments");
assert.ok(checkoutForm.includes('/terms'), "Rental checkout must link the service terms");
assert.ok(checkoutForm.includes('/purchase-information'), "Rental checkout must link the purchase information");
assert.ok(checkoutForm.includes('/privacy'), "Rental checkout must link the privacy notice");
assert.ok(commerce.includes("RENTAL_APPLICATION_PRO_PAYMENTS_ENABLED"), "Rental payments require a product-specific kill switch");
assert.ok(commerce.includes("STRIPE_RENTAL_APPLICATION_PRO_PRICE_ID"), "Rental payments require a separate Stripe Price");
assert.ok(purchase.includes('metadata?.product_code === "rental_application_pro"'), "Paid-session verification must require the Rental product code");
assert.ok(purchase.includes("rentalApplicationProProduct.priceCents"), "Paid-session verification must require the exact Rental price");
assert.ok(access.includes('findActiveById(payload.entitlementId, "rental_application_pro")'), "Rental access must query only its own entitlement");
assert.ok(workspace.includes("getActiveRentalApplicationProEntitlement"), "The Rental workspace must verify its paid entitlement");

console.log("Rental Application Pack Pro checkout and access contracts passed.");
