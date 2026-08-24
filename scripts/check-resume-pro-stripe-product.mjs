import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  assertResumeProStripeProduct,
  getResumeProStripeProductConfig,
  hasResumeProStripeProductConfig,
  resumeProStripeProductDefinition,
} from "../src/lib/resumeProStripeProduct.ts";

const config = getResumeProStripeProductConfig({
  STRIPE_RESUME_PRO_PRICE_ID: "price_resume_pro",
  STRIPE_RESUME_PRO_PRODUCT_ID: "prod_resume_pro",
  STRIPE_RESUME_PRO_TAX_CODE: "txcd_approved",
});

assert.equal(hasResumeProStripeProductConfig({
  STRIPE_RESUME_PRO_PRICE_ID: config.priceId,
  STRIPE_RESUME_PRO_PRODUCT_ID: config.productId,
  STRIPE_RESUME_PRO_TAX_CODE: config.taxCode,
}), true, "all three independent Stripe identifiers must satisfy the deployment contract");
assert.equal(hasResumeProStripeProductConfig({
  STRIPE_RESUME_PRO_PRICE_ID: config.priceId,
}), false, "Checkout readiness must fail closed when both Product ID and tax code are missing");
assert.equal(hasResumeProStripeProductConfig({
  STRIPE_RESUME_PRO_PRICE_ID: config.priceId,
  STRIPE_RESUME_PRO_TAX_CODE: config.taxCode,
}), false, "Checkout readiness must fail closed when Product ID is missing");
assert.equal(hasResumeProStripeProductConfig({
  STRIPE_RESUME_PRO_PRICE_ID: config.priceId,
  STRIPE_RESUME_PRO_PRODUCT_ID: config.productId,
}), false, "Checkout readiness must fail closed when tax code is missing");

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

const [resumeProPage, jsonLdComponent, productImage] = await Promise.all([
  readFile("src/app/resume-pro/page.tsx", "utf8"),
  readFile("src/components/seo/JsonLd.tsx", "utf8"),
  readFile("src/app/resume-pro/opengraph-image.tsx", "utf8"),
]);

for (const contract of [
  "name={resumeProProduct.name}",
  "currency={resumeProProduct.currency}",
  "priceCents={resumeProProduct.priceCents}",
  'path="/resume-pro"',
  'imagePath="/resume-pro/opengraph-image"',
  "liveCheckoutAvailable && (",
  "available",
]) {
  assert.ok(resumeProPage.includes(contract), `Resume Pro Product JSON-LD is not tied to the verified product contract: ${contract}`);
}

assert.ok(jsonLdComponent.includes("const url = `${siteUrl}${path}`"), "Product and Offer URLs must use the canonical site URL");
assert.ok(jsonLdComponent.includes("price: (priceCents / 100).toFixed(2)"), "Product JSON-LD must derive AUD 19.90 from the server price definition");
assert.ok(jsonLdComponent.includes("image: `${siteUrl}${imagePath}`"), "Product JSON-LD must expose a crawlable product image");
assert.ok(jsonLdComponent.includes("serializeJsonLd(data)"), "Product JSON-LD must keep the safe serializer");
assert.ok(jsonLdComponent.includes("getPublicSellerDetails"), "Organization JSON-LD must keep the configured public support email");
assert.equal(jsonLdComponent.includes("aggregateRating"), false, "Product JSON-LD must not invent aggregate ratings");
assert.equal(jsonLdComponent.includes('"review"'), false, "Product JSON-LD must not invent reviews");
assert.equal(jsonLdComponent.includes("shippingDetails"), false, "A digital workspace must not invent physical shipping details");
assert.equal(jsonLdComponent.includes("hasMerchantReturnPolicy"), false, "Return markup must wait for the Merchant of Record and an exact policy category");
assert.equal(jsonLdComponent.includes('seller: { "@id": `${siteUrl}/#organization` }'), false, "Offer seller must not contradict the unsettled Managed Payments Merchant of Record");
assert.ok(productImage.includes("new ImageResponse") && productImage.includes("width: 1200, height: 630"), "Resume Pro must expose a rendered 1200x630 product image");
assert.ok(productImage.includes("TAILORED RESUME") && productImage.includes("COVER LETTER") && productImage.includes("STAR EVIDENCE"), "The product image must show concrete Resume Pro deliverables");

console.log("Resume Pro Stripe Product identity and tax-contract checks passed.");
