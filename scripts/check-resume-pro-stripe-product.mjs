import assert from "node:assert/strict";

import {
  assertResumeProStripeProduct,
  getResumeProStripeProductConfig,
  resumeProStripeProductDefinition,
} from "../src/lib/resumeProStripeProduct.ts";

const config = getResumeProStripeProductConfig({
  STRIPE_RESUME_PRO_PRICE_ID: "price_resume_pro",
  STRIPE_RESUME_PRO_PRODUCT_ID: "prod_resume_pro",
  STRIPE_RESUME_PRO_TAX_CODE: "txcd_approved",
});

const validPrice = {
  id: config.priceId,
  active: true,
  currency: resumeProStripeProductDefinition.currency,
  livemode: false,
  product: {
    id: config.productId,
    active: true,
    livemode: false,
    tax_code: config.taxCode,
  },
  tax_behavior: resumeProStripeProductDefinition.taxBehavior,
  type: "one_time",
  unit_amount: resumeProStripeProductDefinition.priceCents,
};

assert.doesNotThrow(() => assertResumeProStripeProduct(validPrice, config, false));
assert.doesNotThrow(() => assertResumeProStripeProduct({
  ...validPrice,
  product: { ...validPrice.product, tax_code: { id: config.taxCode } },
}, config, false), "expanded Stripe TaxCode objects must be accepted by exact ID");

for (const [label, candidate] of [
  ["same-price wrong Product", { ...validPrice, product: { ...validPrice.product, id: "prod_wrong" } }],
  ["missing tax code", { ...validPrice, product: { ...validPrice.product, tax_code: null } }],
  ["wrong tax code", { ...validPrice, product: { ...validPrice.product, tax_code: "txcd_wrong" } }],
  ["unspecified tax behavior", { ...validPrice, tax_behavior: "unspecified" }],
  ["wrong environment mode", { ...validPrice, livemode: true, product: { ...validPrice.product, livemode: true } }],
  ["unexpanded Product", { ...validPrice, product: config.productId }],
  ["deleted Product", { ...validPrice, product: { id: config.productId, deleted: true } }],
]) {
  assert.throws(
    () => assertResumeProStripeProduct(candidate, config, false),
    undefined,
    `${label} must fail closed`,
  );
}

for (const [label, environment] of [
  ["missing Product ID", { STRIPE_RESUME_PRO_PRICE_ID: "price_ok", STRIPE_RESUME_PRO_TAX_CODE: "txcd_ok" }],
  ["invalid Product ID", { STRIPE_RESUME_PRO_PRICE_ID: "price_ok", STRIPE_RESUME_PRO_PRODUCT_ID: "price_wrong", STRIPE_RESUME_PRO_TAX_CODE: "txcd_ok" }],
  ["missing tax code", { STRIPE_RESUME_PRO_PRICE_ID: "price_ok", STRIPE_RESUME_PRO_PRODUCT_ID: "prod_ok" }],
]) {
  assert.throws(() => getResumeProStripeProductConfig(environment), undefined, `${label} must fail closed`);
}

console.log("Resume Pro Stripe Product identity and tax-contract checks passed.");
