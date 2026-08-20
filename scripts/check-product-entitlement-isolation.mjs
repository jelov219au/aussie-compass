import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const entitlements = await readFile(new URL("../src/lib/entitlements.ts", import.meta.url), "utf8");
const entitlementStore = await readFile(new URL("../src/lib/neonEntitlementStore.ts", import.meta.url), "utf8");
const storageContract = await readFile(new URL("../docs/entitlement-storage.sql", import.meta.url), "utf8");
const rentalAccess = await readFile(new URL("../src/lib/rentalProAccess.ts", import.meta.url), "utf8");
const rentalPurchase = await readFile(new URL("../src/lib/rentalProPurchase.ts", import.meta.url), "utf8");

for (const productCode of ["resume_pro", "rental_application_pro", "pay_evidence_pro"]) {
  assert.ok(entitlements.includes(`"${productCode}"`), `Supported product code is missing: ${productCode}`);
  assert.ok(storageContract.includes(`'${productCode}'`), `Database product constraint is missing: ${productCode}`);
}

for (const methodContract of [
  "consumeRestoreTokenHash(tokenHash: string, productCode: ProductCode)",
  "findActiveByCheckoutSession(checkoutSessionId: string, productCode: ProductCode)",
  "findActiveById(entitlementId: string, productCode: ProductCode)",
  "productCode: ProductCode;",
]) {
  assert.ok(entitlementStore.includes(methodContract), `Product-isolation contract is missing: ${methodContract}`);
}

assert.ok(
  entitlementStore.includes("select id from purchase_entitlements where product_code = ${productCode}"),
  "A restore code must be filtered by product before it is consumed",
);
assert.ok(
  entitlementStore.match(/product_code = \$\{productCode\}/g)?.length >= 3,
  "Active-entitlement lookups must be scoped to an explicit product",
);
assert.ok(
  entitlementStore.includes("product_code = ${input.productCode}"),
  "Restore-code creation must be scoped to the active product entitlement",
);

for (const contract of ["rental_application_pro", "__Host-hoju_rental_application_pro_access", "findActiveById"]) {
  assert.ok(rentalAccess.includes(contract), `Rental access isolation is missing: ${contract}`);
}
assert.ok(rentalPurchase.includes('session.metadata?.product_code === "rental_application_pro"'));

console.log("Paid-product entitlement isolation checks passed.");
