import Stripe from "stripe";

export function getStripeAccountingConfig() {
  const key = process.env.STRIPE_ACCOUNTING_KEY?.trim();
  if (!key?.startsWith("rk_test_") && !key?.startsWith("rk_live_")) {
    throw new Error("STRIPE_ACCOUNTING_KEY must be a dedicated restricted Stripe key (rk_). Do not use the checkout or performance key.");
  }

  return {
    key,
    mode: key.startsWith("rk_live_") ? "live" : "test",
  };
}

export function createStripeAccountingClient(key, appName) {
  return new Stripe(key, {
    appInfo: { name: appName, version: "0.1.0" },
    maxNetworkRetries: 2,
    timeout: 20_000,
    telemetry: false,
  });
}

export function safeStripeAccountingError(error, operation) {
  const code = typeof error === "object" && error !== null ? error.code : undefined;
  if (code === "more_permissions_required") {
    return new Error(`Stripe accounting ${operation} needs Balance Transactions Read permission on the dedicated restricted key. No private file was written.`);
  }
  return new Error(`Stripe accounting ${operation} failed before a private file was written. Review the restricted key and Stripe availability without copying the raw SDK error.`);
}
