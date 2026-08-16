import "server-only";

import Stripe from "stripe";

let stripeClient: Stripe | undefined;

export function getStripeSecretMode() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!secretKey) return "missing" as const;
  if (secretKey.startsWith("sk_test_")) return "test" as const;
  if (secretKey.startsWith("sk_live_")) return "live" as const;
  return "invalid" as const;
}

export function assertSafeStripeEnvironment() {
  const mode = getStripeSecretMode();
  const isProduction = process.env.VERCEL_ENV === "production";

  if (mode === "missing" || mode === "invalid") {
    throw new Error("Stripe secret key is missing or invalid.");
  }

  if (isProduction && mode !== "live") {
    throw new Error("Production checkout requires a live Stripe key.");
  }

  if (!isProduction && mode !== "test") {
    throw new Error("Non-production checkout requires a test Stripe key.");
  }
}

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  stripeClient ??= new Stripe(secretKey);
  return stripeClient;
}
