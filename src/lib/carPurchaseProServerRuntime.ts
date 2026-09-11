import "server-only";

import { neon } from "@neondatabase/serverless";
import { cookies } from "next/headers";

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

const runtimeFunctionSignatures = [
  "public.claim_first_sale_reservation(text,text,timestamptz,text,text,integer)",
  "public.attach_first_sale_checkout(text,bigint,text,text,timestamptz)",
  "public.release_failed_first_sale_reservation(text,bigint,text,text)",
  "public.consume_checkout_activation(text,text,text,text,text,text,timestamptz)",
  "public.consume_entitlement_restore_token(text,text,text,text,text,timestamptz)",
  "public.release_purchase_access_session(bigint,text,text)",
  "public.find_active_purchase_entitlement_by_access_session(bigint,text,text)",
  "public.create_entitlement_restore_token(bigint,text,text,timestamptz)",
] as const;

const webhookFunctionSignatures = [
  "public.apply_first_sale_paid_event(text,text,boolean,timestamptz,text,text,integer,text,text,text,text,text)",
  "public.apply_car_purchase_reversal_event_v1(text,text,boolean,timestamptz,text,text,text,text,text,text,text)",
  "public.apply_car_purchase_exception_event_v1(text,text,boolean,timestamptz,text,text,text,text,text,text,text,text,text)",
  "public.claim_car_purchase_operator_alert_v1(text,text,text,boolean,text)",
  "public.mark_car_purchase_operator_alert_sent_v1(text,text,text,boolean,text)",
  "public.release_car_purchase_operator_alert_claim_v1(text,text,text,boolean,text)",
] as const;

const sqlValues = (values: readonly string[]) => values
  .map(value => `('${value.replaceAll("'", "''")}')`)
  .join(",\n");

// One fixed, metadata-only probe. It runs through the app role connection and
// accepts no identifiers from a request. Direct table writes remain forbidden.
const readinessSql = `
with runtime_functions(signature) as (values
${sqlValues(runtimeFunctionSignatures)}
), webhook_functions(signature) as (values
${sqlValues(webhookFunctionSignatures)}
), runtime_ok as (
  select count(*) = ${runtimeFunctionSignatures.length}
    and coalesce(bool_and(
      to_regprocedure(signature) is not null
      and exists (select 1 from pg_proc where oid = to_regprocedure(signature)
        and prosecdef and pg_get_userbyid(proowner) = 'hoju_migration_owner'
        and proconfig @> array['search_path=public, pg_temp'])
      and has_function_privilege(current_user, to_regprocedure(signature), 'EXECUTE')
      and not exists (
        select 1
        from aclexplode(coalesce(
          (select proacl from pg_proc where oid = to_regprocedure(signature)),
          acldefault('f', (select proowner from pg_proc where oid = to_regprocedure(signature)))
        ))
        where grantee = 0 and privilege_type = 'EXECUTE'
      )
    ), false) as ready
  from runtime_functions
), webhook_ok as (
  select count(*) = ${webhookFunctionSignatures.length}
    and coalesce(bool_and(
      to_regprocedure(signature) is not null
      and exists (select 1 from pg_proc where oid = to_regprocedure(signature)
        and prosecdef and pg_get_userbyid(proowner) = 'hoju_migration_owner'
        and proconfig @> array['search_path=public, pg_temp'])
      and has_function_privilege(current_user, to_regprocedure(signature), 'EXECUTE')
      and not exists (
        select 1
        from aclexplode(coalesce(
          (select proacl from pg_proc where oid = to_regprocedure(signature)),
          acldefault('f', (select proowner from pg_proc where oid = to_regprocedure(signature)))
        ))
        where grantee = 0 and privilege_type = 'EXECUTE'
      )
    ), false) as ready
  from webhook_functions
), schema_ok as (
  select
    current_database() = 'neondb'
    and current_user = 'hoju_app_runtime'
    and exists (
      select 1 from public.schema_migrations
      where version = '20260906_car_purchase_schema_v1'
    )
    and exists (
      select 1 from public.schema_migrations
      where version = '20260906_car_purchase_runtime_v1'
    )
    and to_regclass('public.car_purchase_exception_receipts') is not null
    and to_regclass('public.car_purchase_payment_holds') is not null
    and exists (
      select 1 from pg_constraint
      where conrelid = 'public.first_sale_gates'::regclass
        and convalidated
        and position('car_purchase_pro' in pg_get_constraintdef(oid)) > 0
        and position('1490' in pg_get_constraintdef(oid)) > 0
    )
    and exists (
      select 1 from pg_constraint
      where conrelid = 'public.first_sale_gate_events'::regclass
        and convalidated
        and position('car_purchase_pro' in pg_get_constraintdef(oid)) > 0
        and position('1490' in pg_get_constraintdef(oid)) > 0
    )
    and position(
      'when ''car_purchase_pro'' then 1490'
      in pg_get_functiondef(to_regprocedure(
        'public.claim_first_sale_reservation(text,text,timestamptz,text,text,integer)'
      ))
    ) > 0
    and position(
      'when ''car_purchase_pro'' then 1490'
      in pg_get_functiondef(to_regprocedure(
        'public.apply_first_sale_paid_event(text,text,boolean,timestamptz,text,text,integer,text,text,text,text,text)'
      ))
    ) > 0
    and not has_table_privilege(
      current_user,
      'public.car_purchase_exception_receipts',
      'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'
    )
    and not has_table_privilege(
      current_user,
      'public.car_purchase_payment_holds',
      'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'
    ) as ready
)
select
  schema_ok.ready and runtime_ok.ready as access_ready,
  schema_ok.ready and runtime_ok.ready and webhook_ok.ready as webhook_ready,
  schema_ok.ready and runtime_ok.ready and webhook_ok.ready as checkout_ready
from schema_ok cross join runtime_ok cross join webhook_ok
`;

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
    const rows = await query(readinessSql, []);
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
export function getConfiguredCarPurchaseWebhookHandler() {
  return webhook;
}
