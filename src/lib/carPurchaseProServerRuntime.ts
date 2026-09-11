import "server-only";

import { neon } from "@neondatabase/serverless";
import { cookies } from "next/headers";
import { carPurchaseServerReadinessSql } from "./carPurchaseProServerReadiness";

import { getEntitlementDatabaseUrl } from "./entitlementConfig";
import { paymentAlertsConfigured, sendPaymentOperatorMessage } from "./paymentAlerts";
import { siteUrl } from "./site";
import { getStripe, getStripeSecretMode } from "./stripe";
import type { CarPurchaseAccessQuery } from "./carPurchaseProAccessStore";
import type { CarPurchaseExceptionQuery } from "./carPurchaseProExceptionStore";
import type { CarPurchaseApprovedOffer } from "./carPurchaseProCheckoutContract";
import { configuredCarPurchaseOffer, carPurchaseDeploymentMode, isCarPurchaseDatabaseBinding } from "./carPurchaseProServerConfig";
import { createCarPurchaseRuntimeAssembly } from "./carPurchaseProRuntimeAssembly";
import { createCarPurchaseStripeProvider } from "./carPurchaseProStripeProvider";
import type { CarPurchaseWebhookProvider } from "./carPurchaseProWebhookFulfillment";
import { createCarPurchaseWebhookPipeline } from "./carPurchaseProWebhookPipeline";

type Mode = "test" | "live";
type ReadinessRow = {
  access_ready: boolean;
  webhook_ready: boolean;
  checkout_ready: boolean;
};

function configuredQuery(mode: Mode | null): CarPurchaseExceptionQuery | null {
  const databaseUrl = getEntitlementDatabaseUrl();
  if (!databaseUrl || !isCarPurchaseDatabaseBinding(databaseUrl, mode)) return null;
  return async (statement, values) => {
    const sql = neon(databaseUrl, { fetchOptions: { signal: AbortSignal.timeout(10_000) } });
    return sql.query(statement, [...values]);
  };
}

function configuredProviders(mode: Mode | null) {
  if (!mode || getStripeSecretMode() !== mode) return { checkout: null, webhook: null };
  try {
    const stripe = getStripe();
    const checkout = createCarPurchaseStripeProvider(stripe);
    const webhook: CarPurchaseWebhookProvider = Object.freeze({
      retrieveCheckout: (id: string, options: { expand: ["line_items"] }) =>
        stripe.checkout.sessions.retrieve(id, options),
      retrievePaymentIntent: (id: string) => stripe.paymentIntents.retrieve(id),
      retrieveCharge: (id: string) => stripe.charges.retrieve(id),
      listCheckoutsForPaymentIntent: (id: string, options: { limit: 2 }) =>
        stripe.checkout.sessions.list({ payment_intent: id, limit: options.limit }),
      retrieveDispute: (id: string) => stripe.disputes.retrieve(id),
    });
    return { checkout, webhook };
  } catch {
    return { checkout: null, webhook: null };
  }
}

async function probe(query: CarPurchaseAccessQuery | null): Promise<ReadinessRow | null> {
  if (!query) return null;
  try {
    const rows = await query(carPurchaseServerReadinessSql, []);
    if (!Array.isArray(rows) || rows.length !== 1 || !rows[0] || typeof rows[0] !== "object") return null;
    const row = rows[0] as Record<string, unknown>;
    if (typeof row.access_ready !== "boolean" || typeof row.webhook_ready !== "boolean"
      || typeof row.checkout_ready !== "boolean") return null;
    return row as ReadinessRow;
  } catch {
    return null;
  }
}

const environment = process.env;
const offer = configuredCarPurchaseOffer(environment);
const { mode, deployment } = carPurchaseDeploymentMode(environment);
const query = configuredQuery(mode);
const providers = configuredProviders(offer && query ? mode : null);
const webhookConfigured = environment.CAR_PURCHASE_PRO_WEBHOOK_ENABLED === "true"
  && Boolean(environment.STRIPE_WEBHOOK_SECRET?.trim())
  && paymentAlertsConfigured();
const runtimeEnabled = environment.CAR_PURCHASE_PRO_RUNTIME_ENABLED === "true";
const runtimeEnvironment = environment.NODE_ENV === "development" ? "development" : "production";

async function runtimeReadiness(approvedOffer: Readonly<CarPurchaseApprovedOffer>, expectedMode: Mode) {
  const row = await probe(query);
  const access = row?.access_ready === true;
  const webhook = row?.webhook_ready === true && webhookConfigured;
  return {
    offer: approvedOffer,
    mode: expectedMode,
    accessFunctions: access,
    runtimePrivileges: access,
    webhook,
    checkoutGate: row?.checkout_ready === true && webhook,
    // These two gates stay false until the no-charge live rehearsal and the
    // complete customer journey are recorded against the exact release.
    managedPayments: false,
    customerJourney: false,
  };
}

const runtime = createCarPurchaseRuntimeAssembly({
  enabled: runtimeEnabled,
  salesEnabled: false,
  approvedOffer: offer,
  expectedMode: mode,
  stripeMode: getStripeSecretMode(),
  deployment,
  environment: runtimeEnvironment,
  expectedOrigin: new URL(siteUrl).origin,
  secret: environment.CAR_PURCHASE_PRO_ACCESS_TOKEN_SECRET ?? null,
  query,
  provider: providers.checkout,
  readCookies: cookies,
  readReadiness: offer && mode ? runtimeReadiness : null,
});

const webhook = offer && mode && query && providers.webhook
  && environment.CAR_PURCHASE_PRO_WEBHOOK_ENABLED === "true"
  ? createCarPurchaseWebhookPipeline({
    enabled: true,
    approvedOffer: offer,
    expectedMode: mode,
    stripeMode: getStripeSecretMode(),
    deployment,
    verifySignature: (payload, signature) =>
      getStripe().webhooks.constructEvent(payload, signature, environment.STRIPE_WEBHOOK_SECRET ?? ""),
    checkPrerequisites: async () => (await probe(query))?.webhook_ready === true,
    provider: providers.webhook,
    query,
    sender: sendPaymentOperatorMessage,
    checkAlertPrerequisites: async () => webhookConfigured,
  })
  : null;

export const handleConfiguredCarPurchaseAccess = runtime.handleAccess;
export const handleConfiguredCarPurchaseCheckout = runtime.handleCheckout;
export const hasConfiguredCarPurchaseWorkspaceAccess = runtime.hasWorkspaceAccess;
export const isConfiguredCarPurchaseAccessAvailable = runtime.isAccessAvailable;
export function getConfiguredCarPurchaseWebhookHandler() {
  return webhook;
}
