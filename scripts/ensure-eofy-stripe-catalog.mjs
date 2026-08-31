import assert from "node:assert/strict";

import Stripe from "stripe";

const PRODUCT_CODE = "eofy_pro";
const LOOKUP_KEY = "eofy_pro_aud_990_v1";
const CATALOG_ACK = "CREATE_OR_REUSE_EOFY_LIVE_CATALOG_CHECKOUT_OFF";

if (process.env.EOFY_CATALOG_ACK !== CATALOG_ACK) {
  throw new Error("The explicit EOFY catalog acknowledgement is missing.");
}
if (process.env.VERCEL_ENV !== "production") {
  throw new Error("The catalog command requires the pinned Production environment.");
}
if (process.env.EOFY_PRO_PAYMENTS_ENABLED === "true") {
  throw new Error("EOFY Checkout must remain off during catalog setup.");
}

const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
assert.match(secretKey ?? "", /^sk_live_/, "A live Stripe secret key is required.");
const stripe = new Stripe(secretKey);

const matchingProducts = [];
for await (const product of stripe.products.list({ active: true, limit: 100 })) {
  if (product.metadata.product_code === PRODUCT_CODE) matchingProducts.push(product);
}
assert.ok(matchingProducts.length <= 1, "Multiple active EOFY products require manual review.");

let product = matchingProducts[0];
let productCreated = false;
if (!product) {
  product = await stripe.products.create({
    name: "EOFY Pack Pro",
    description: "One-time browser-based workspace for organising EOFY preparation records and accountant handoff questions.",
    metadata: {
      product_code: PRODUCT_CODE,
      billing_model: "one_time",
    },
  }, { idempotencyKey: "hoju_compass_eofy_product_v1" });
  productCreated = true;
}
assert.equal(product.active, true);
assert.equal(product.metadata.product_code, PRODUCT_CODE);
assert.equal(product.metadata.billing_model, "one_time");

const prices = await stripe.prices.list({ product: product.id, active: true, limit: 100 });
const matchingPrices = prices.data.filter((candidate) => (
  candidate.type === "one_time"
  && candidate.currency === "aud"
  && candidate.unit_amount === 990
  && candidate.tax_behavior === "inclusive"
));
assert.ok(matchingPrices.length <= 1, "Multiple active A$9.90 EOFY Prices require manual review.");
let price = matchingPrices[0];
let priceCreated = false;
if (!price) {
  price = await stripe.prices.create({
    product: product.id,
    currency: "aud",
    unit_amount: 990,
    tax_behavior: "inclusive",
    lookup_key: LOOKUP_KEY,
    metadata: {
      product_code: PRODUCT_CODE,
      billing_model: "one_time",
    },
  }, { idempotencyKey: "hoju_compass_eofy_price_v1" });
  priceCreated = true;
}

assert.equal(typeof price.product === "string" ? price.product : price.product.id, product.id);
assert.equal(price.active, true);
assert.equal(price.type, "one_time");
assert.equal(price.currency, "aud");
assert.equal(price.unit_amount, 990);
assert.equal(price.tax_behavior, "inclusive");
assert.equal(price.livemode, true);

console.log(`EOFY_STRIPE_CATALOG=PASS product_created=${productCreated} price_created=${priceCreated} checkout=off secrets_printed=no`);
console.log(`EOFY_PRODUCT_ID=${product.id}`);
console.log(`EOFY_PRICE_ID=${price.id}`);
