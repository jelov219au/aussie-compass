import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const entitlements = await readFile(new URL("../src/lib/entitlements.ts", import.meta.url), "utf8");
const entitlementStore = await readFile(new URL("../src/lib/neonEntitlementStore.ts", import.meta.url), "utf8");
const storageContract = await readFile(new URL("../docs/entitlement-storage.sql", import.meta.url), "utf8");
const firstSaleContract = await readFile(new URL("../docs/first-sale-gate.sql", import.meta.url), "utf8");

function hasGuardedProductLookups(source) {
  const normalized = source.replace(/\r\n?/g, "\n");
  return normalized.match(/product_code = \$\{productCode\}/g)?.length >= 2
    && normalized.includes("${productCode}\n    )");
}

const productLookupFixture = [
  "and product_code = ${productCode}",
  "and product_code = ${productCode}",
  "${productCode}",
  "    )",
].join("\n");

assert.equal(hasGuardedProductLookups(productLookupFixture), true, "LF product guards must be recognized");
assert.equal(hasGuardedProductLookups(productLookupFixture.replaceAll("\n", "\r\n")), true, "CRLF product guards must be recognized");

for (const productCode of ["resume_pro", "rental_application_pro"]) {
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
  entitlementStore.includes("consume_entitlement_restore_token(")
    && firstSaleContract.includes("where entitlement.product_code = p_product_code"),
  "A restore code must be filtered by product before it is consumed",
);
assert.ok(
  hasGuardedProductLookups(entitlementStore),
  "Active-entitlement lookups must be scoped to an explicit product",
);
assert.ok(
  entitlementStore.includes("create_entitlement_restore_token(")
    && entitlementStore.includes("${input.productCode}")
    && firstSaleContract.includes("entitlement.product_code = p_product_code"),
  "Restore-code creation must be scoped to the active product entitlement",
);

console.log("Paid-product entitlement isolation checks passed.");
