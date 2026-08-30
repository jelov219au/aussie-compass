import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const entitlements = await readFile(new URL("../src/lib/entitlements.ts", import.meta.url), "utf8");
const entitlementStore = await readFile(new URL("../src/lib/neonEntitlementStore.ts", import.meta.url), "utf8");
const storageContract = await readFile(new URL("../docs/entitlement-storage.sql", import.meta.url), "utf8");
const firstSaleContract = await readFile(new URL("../docs/first-sale-gate.sql", import.meta.url), "utf8");

function hasGuardedProductLookups(source) {
  const normalized = source.replace(/\r\n?/g, "\n");
  return [
    "find_active_purchase_entitlement_by_checkout",
    "find_active_purchase_entitlement_by_id",
  ].every((functionName) => {
    const start = normalized.indexOf(`${functionName}(`);
    const end = normalized.indexOf(")", start);
    return start >= 0 && end > start && normalized.slice(start, end).includes("${productCode}");
  });
}

const productLookupFixture = [
  "find_active_purchase_entitlement_by_checkout(",
  "  ${checkoutSessionId},",
  "  ${productCode}",
  ")",
  "find_active_purchase_entitlement_by_id(",
  "  ${entitlementId},",
  "  ${productCode}",
  ")",
].join("\n");

assert.equal(hasGuardedProductLookups(productLookupFixture), true, "LF product guards must be recognized");
assert.equal(hasGuardedProductLookups(productLookupFixture.replaceAll("\n", "\r\n")), true, "CRLF product guards must be recognized");

for (const productCode of ["resume_pro", "rental_application_pro", "pay_evidence_pro", "eofy_pro"]) {
  assert.ok(entitlements.includes(`"${productCode}"`), `Supported product code is missing: ${productCode}`);
  assert.ok(storageContract.includes(`'${productCode}'`), `Database product constraint is missing: ${productCode}`);
}

for (const legacyProductCode of ["car_buy_pro"]) {
  assert.ok(
    storageContract.includes(`'${legacyProductCode}'`),
    `Historical entitlement evidence must remain storage-compatible: ${legacyProductCode}`,
  );
  assert.ok(
    !entitlements.includes(`"${legacyProductCode}"`),
    `Historical product code must not become runtime-purchasable: ${legacyProductCode}`,
  );
}

for (const methodContract of [
  "async function consumeRestoreTokenHash(",
  "input: Parameters<EntitlementStore[\"consumeRestoreTokenHash\"]>[0]",
  "${input.productCode}",
  "${input.nonceHash}",
  "${input.accessSession.accessSessionHash}",
  "findActiveByCheckoutSession(checkoutSessionId: string, productCode: ProductCode)",
  "findActiveById(entitlementId: string, productCode: ProductCode)",
  "find_active_purchase_entitlement_by_access_session(",
  "${input.productCode}",
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
  hasGuardedProductLookups(entitlementStore)
    && storageContract.match(/entitlement\.product_code = p_product_code/g)?.length >= 2,
  "Active-entitlement lookups must be scoped to an explicit product",
);
assert.ok(
  entitlementStore.includes("create_entitlement_restore_token(")
    && entitlementStore.includes("${input.productCode}")
    && firstSaleContract.includes("entitlement.product_code = p_product_code"),
  "Restore-code creation must be scoped to the active product entitlement",
);

console.log("Paid-product entitlement isolation checks passed.");
