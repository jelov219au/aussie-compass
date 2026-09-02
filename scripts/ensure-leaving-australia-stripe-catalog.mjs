import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import Stripe from "stripe";

import { ensureStripeLiveCatalog } from "./ensure-stripe-live-catalog.mjs";

export const leavingAustraliaStripeCatalogDefinition = Object.freeze({
  label: "Leaving Australia",
  productCode: "leaving_australia_pro",
  name: "Leaving Australia Pack Pro",
  description: "One-time browser-based workspace for organising departure tasks, pending settlements and closure-order records.",
  currency: "aud",
  unitAmount: 1290,
  taxBehavior: "inclusive",
  lookupKey: "leaving_australia_pro_aud_1290_v1",
  metadata: Object.freeze({ product_code: "leaving_australia_pro", billing_model: "one_time" }),
  checkoutSwitch: "LEAVING_AUSTRALIA_PRO_PAYMENTS_ENABLED",
  ackEnvironment: "LEAVING_AUSTRALIA_CATALOG_ACK",
  acknowledgement: "CREATE_OR_REUSE_LEAVING_AUSTRALIA_LIVE_CATALOG_CHECKOUT_OFF",
  productIdempotencyKey: "hoju_compass_leaving_australia_product_v1",
  priceIdempotencyKey: "hoju_compass_leaving_australia_price_v1",
});

export async function runLeavingAustraliaStripeCatalog({
  apply = false,
  createStripe = (secretKey) => new Stripe(secretKey, { maxNetworkRetries: 2, timeout: 10_000, telemetry: false }),
  environment = process.env,
} = {}) {
  return ensureStripeLiveCatalog({ apply, createStripe, definition: leavingAustraliaStripeCatalogDefinition, environment });
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some((value) => value !== "--apply") || args.filter((value) => value === "--apply").length > 1) {
    throw new Error("Usage: node scripts/ensure-leaving-australia-stripe-catalog.mjs [--apply]");
  }
  const result = await runLeavingAustraliaStripeCatalog({ apply: args.includes("--apply") });
  if (result.status === "pending") {
    console.log(`LEAVING_AUSTRALIA_STRIPE_CATALOG=PENDING product_missing=${result.productMissing} price_missing=${result.priceMissing} checkout=off mutations=none secrets_printed=no`);
    return;
  }
  console.log(`LEAVING_AUSTRALIA_STRIPE_CATALOG=PASS product_created=${result.productCreated} price_created=${result.priceCreated} checkout=off secrets_printed=no`);
  console.log(`LEAVING_AUSTRALIA_PRODUCT_ID=${result.product.id}`);
  console.log(`LEAVING_AUSTRALIA_PRICE_ID=${result.price.id}`);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) await main();
