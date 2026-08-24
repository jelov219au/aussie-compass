import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  accountingProductCodes,
  containsSensitiveProductIsolationEvidence,
  createAccountingProductIsolationTemplate,
  crossProductIsolationChecks,
  evaluateAccountingProductIsolation,
  productIsolationChecks,
} from "./accounting-product-isolation-contract.mjs";

const [verifier, rollout, accounting, packageSource] = await Promise.all([
  readFile(new URL("./verify-accounting-product-isolation.mjs", import.meta.url), "utf8"),
  readFile(new URL("../docs/pro-product-rollout.md", import.meta.url), "utf8"),
  readFile(new URL("../docs/accounting-reconciliation.md", import.meta.url), "utf8"),
  readFile(new URL("../package.json", import.meta.url), "utf8"),
]);
const compactRollout = rollout.replace(/\s+/g, " ");
const compactAccounting = accounting.replace(/\s+/g, " ");

function passingPacket() {
  const packet = createAccountingProductIsolationTemplate();
  packet.window_start = "2026-08-01T00:00:00.000Z";
  packet.window_end = "2026-09-01T00:00:00.000Z";
  for (const productCode of accountingProductCodes) {
    for (const check of productIsolationChecks) packet.products[productCode][check] = "PASS";
  }
  for (const check of crossProductIsolationChecks) packet.cross_product_checks[check] = "PASS";
  return packet;
}

assert.deepEqual(Object.keys(createAccountingProductIsolationTemplate().products), accountingProductCodes);
assert.equal(evaluateAccountingProductIsolation(passingPacket()).decision, "PASS");

const rentalPriceMissing = passingPacket();
rentalPriceMissing.products.rental_application_pro.checkout_price_verified = "MISSING";
assert.equal(evaluateAccountingProductIsolation(rentalPriceMissing).decision, "UNRESOLVED");

const reusedPrice = passingPacket();
reusedPrice.cross_product_checks.stripe_prices_distinct = "FAIL";
assert.equal(evaluateAccountingProductIsolation(reusedPrice).decision, "UNRESOLVED");

const brokenPaymentIntentChain = passingPacket();
brokenPaymentIntentChain.products.rental_application_pro.checkout_payment_intent_link_verified = "FAIL";
assert.equal(evaluateAccountingProductIsolation(brokenPaymentIntentChain).decision, "UNRESOLVED");

const crossedRefundSupport = passingPacket();
crossedRefundSupport.cross_product_checks.no_cross_product_refund_dispute_support_links = "FAIL";
assert.equal(evaluateAccountingProductIsolation(crossedRefundSupport).decision, "UNRESOLVED");

const wrongProducts = passingPacket();
wrongProducts.products.rental_pack = wrongProducts.products.rental_application_pro;
delete wrongProducts.products.rental_application_pro;
assert.ok(evaluateAccountingProductIsolation(wrongProducts).errors.includes("products_shape"));

const reversedWindow = passingPacket();
reversedWindow.window_end = reversedWindow.window_start;
assert.ok(evaluateAccountingProductIsolation(reversedWindow).errors.includes("window_order"));

for (const unsafe of [
  "buyer@example.com",
  "price_1234567890ABCDEF",
  "pi_1234567890ABCDEF",
  "ch_1234567890ABCDEF",
  "rk_live_1234567890ABCDEF",
  "postgresql://operator:secret@example.invalid/database",
]) assert.equal(containsSensitiveProductIsolationEvidence(unsafe), true);
assert.equal(containsSensitiveProductIsolationEvidence(JSON.stringify(passingPacket())), false);

for (const forbiddenBoundary of ["process.env", "fetch(", "node:child_process", "new Stripe(", "writeFile", "mkdir"]){
  assert.ok(!verifier.includes(forbiddenBoundary), `the classifier must stay local and read-only: ${forbiddenBoundary}`);
}
assert.ok(packageSource.includes('"accounting:product-isolation": "node scripts/verify-accounting-product-isolation.mjs"'));
assert.ok(packageSource.includes('"test:accounting-product-isolation": "node scripts/check-accounting-product-isolation.mjs"'));

for (const boundary of [
  "npm.cmd run accounting:product-isolation -- --template",
  "price_identity=PASS",
  "products=resume_pro+rental_application_pro",
  "Do not copy Resume PASS values into Rental rows",
  "A `mode=test` PASS is not live launch evidence",
  "Rental product switch remains off",
]) assert.ok(compactRollout.includes(boundary), `rollout runbook is missing executable product isolation: ${boundary}`);
for (const boundary of [
  "Executable cross-product attribution gate",
  "checkout metadata → Price → PaymentIntent → Charge → Balance Transaction",
  "refund, dispute, support and entitlement links",
  "Resume-only first-sale packet cannot prove Rental isolation",
]) assert.ok(compactAccounting.includes(boundary), `accounting runbook is missing executable product isolation: ${boundary}`);

console.log("Accounting product-isolation classifier contract passed.");
