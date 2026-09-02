import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import Stripe from "stripe";

import { ensureStripeLiveCatalog } from "./ensure-stripe-live-catalog.mjs";

export const eofyStripeCatalogDefinition = Object.freeze({
  label: "EOFY",
  productCode: "eofy_pro",
  name: "EOFY Pack Pro",
  description: "One-time browser-based workspace for organising EOFY preparation records and accountant handoff questions.",
  currency: "aud",
  unitAmount: 990,
  taxBehavior: "inclusive",
  lookupKey: "eofy_pro_aud_990_v1",
  metadata: Object.freeze({ product_code: "eofy_pro", billing_model: "one_time" }),
  checkoutSwitch: "EOFY_PRO_PAYMENTS_ENABLED",
  ackEnvironment: "EOFY_CATALOG_ACK",
  acknowledgement: "CREATE_OR_REUSE_EOFY_LIVE_CATALOG_CHECKOUT_OFF",
  productIdempotencyKey: "hoju_compass_eofy_product_v1",
  priceIdempotencyKey: "hoju_compass_eofy_price_v1",
});

export async function runEofyStripeCatalog({
  apply = false,
  createStripe = (secretKey) => new Stripe(secretKey, { maxNetworkRetries: 2, timeout: 10_000, telemetry: false }),
  environment = process.env,
} = {}) {
  return ensureStripeLiveCatalog({ apply, createStripe, definition: eofyStripeCatalogDefinition, environment });
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some((value) => value !== "--apply") || args.filter((value) => value === "--apply").length > 1) {
    throw new Error("Usage: node scripts/ensure-eofy-stripe-catalog.mjs [--apply]");
  }
  const result = await runEofyStripeCatalog({ apply: args.includes("--apply") });
  if (result.status === "pending") {
    console.log(`EOFY_STRIPE_CATALOG=PENDING product_missing=${result.productMissing} price_missing=${result.priceMissing} checkout=off mutations=none secrets_printed=no`);
    return;
  }
  console.log(`EOFY_STRIPE_CATALOG=PASS product_created=${result.productCreated} price_created=${result.priceCreated} checkout=off secrets_printed=no`);
  console.log(`EOFY_PRODUCT_ID=${result.product.id}`);
  console.log(`EOFY_PRICE_ID=${result.price.id}`);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) await main();
