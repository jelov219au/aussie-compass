import {
  createStripeAccountingClient,
  getStripeAccountingConfig,
  safeStripeAccountingError,
} from "./stripe-accounting-access.mjs";

const { key, mode } = getStripeAccountingConfig();
const stripe = createStripeAccountingClient(key, "Hoju Compass accounting preflight");

try {
  await stripe.balanceTransactions.list({ limit: 1 });
} catch (error) {
  throw safeStripeAccountingError(error, "preflight");
}

console.log(`Stripe accounting preflight passed for ${mode} mode. Balance Transactions Read permission is available. No private file was written.`);
