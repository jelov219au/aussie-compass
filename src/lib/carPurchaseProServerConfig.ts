import "server-only";
import { isCarPurchaseApprovedOffer, type CarPurchaseApprovedOffer } from "./carPurchaseProCheckoutContract";

// Read back from the approved live catalog on 2026-09-11. IDs are public catalog
// identifiers; credentials are always supplied separately by the server.
export const carPurchaseLiveOffer = Object.freeze({
  productCode: "car_purchase_pro",
  currency: "aud",
  billing: "one_time",
  priceCents: 1490,
  stripePriceId: "price_1UESRxCWvUu2WkWQtBbN0WZY",
  stripeProductId: "prod_VEwKic8ctCSHch",
  termsVersion: "2026-09-06",
} as const satisfies CarPurchaseApprovedOffer);

const databaseHosts = {
  live: "ep-curly-wave-a78bktnq.ap-southeast-2.aws.neon.tech",
  test: "ep-calm-glitter-a7esj9zv.ap-southeast-2.aws.neon.tech",
} as const;

export function carPurchaseDeploymentMode(environment: NodeJS.ProcessEnv): {
  mode: "live" | "test" | null;
  deployment: "production" | "nonproduction";
} {
  if (environment.VERCEL_ENV === "production") return { mode: "live", deployment: "production" };
  if (environment.VERCEL_ENV === "preview" || environment.VERCEL_ENV === "development") {
    return { mode: "test", deployment: "nonproduction" };
  }
  return { mode: null, deployment: "nonproduction" };
}

export function configuredCarPurchaseOffer(environment: NodeJS.ProcessEnv): CarPurchaseApprovedOffer | null {
  const { mode } = carPurchaseDeploymentMode(environment);
  if (!mode) return null;
  const offer = { ...carPurchaseLiveOffer,
    stripePriceId: environment.STRIPE_CAR_PURCHASE_PRO_PRICE_ID?.trim(),
    stripeProductId: environment.STRIPE_CAR_PURCHASE_PRO_PRODUCT_ID?.trim(),
  };
  if (!isCarPurchaseApprovedOffer(offer)) return null;
  if (mode === "live") {
    return offer.stripePriceId === carPurchaseLiveOffer.stripePriceId
      && offer.stripeProductId === carPurchaseLiveOffer.stripeProductId ? Object.freeze(offer) : null;
  }
  // A test secret alone must never make a live catalog ID eligible in Preview.
  if (offer.stripePriceId === carPurchaseLiveOffer.stripePriceId
    || offer.stripeProductId === carPurchaseLiveOffer.stripeProductId) return null;
  return Object.freeze(offer);
}

export function isCarPurchaseDatabaseBinding(databaseUrl: string | null | undefined, mode: "test" | "live" | null) {
  if (!mode || !databaseUrl) return false;
  try {
    const parsed = new URL(databaseUrl);
    return ["postgres:", "postgresql:"].includes(parsed.protocol)
      && parsed.hostname === databaseHosts[mode] && parsed.pathname === "/neondb"
      && decodeURIComponent(parsed.username) === "hoju_app_runtime"
      && (!parsed.port || parsed.port === "5432")
      && [...parsed.searchParams].every(([key, value]) =>
        key === "sslmode" && ["require", "verify-full"].includes(value)
        || key === "channel_binding" && value === "require")
      && !parsed.hash;
  } catch { return false; }
}
