import Stripe from "stripe";
import { neon } from "@neondatabase/serverless";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const productionOperatorAuditPass = "PRODUCTION_OPERATOR_AUDIT=PASS stripe=account-read-pass business_profile=verified database=audit-role-pass migrations=eight rental_gate=active named_constraint=active reservation=none secrets_printed=no";
export const productionOperatorAuditFail = "PRODUCTION_OPERATOR_AUDIT=FAIL stripe=unverified business_profile=unverified database=unverified migrations=unverified named_constraint=unverified reservation=unverified secrets_printed=no launch=NO-GO";

const supportEmail = "support@hojucompass.com";
const endpointPattern = /^ep-[a-z0-9-]+$/;

function endpointIdFromDatabaseUrl(value) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    if (
      !["postgres:", "postgresql:"].includes(url.protocol)
      || !hostname.endsWith(".neon.tech")
      || url.pathname.replace(/\/+$/, "") !== "/neondb"
    ) return null;
    const label = hostname.split(".")[0] ?? "";
    const endpointId = label.endsWith("-pooler") ? label.slice(0, -"-pooler".length) : label;
    return endpointPattern.test(endpointId) ? endpointId : null;
  } catch {
    return null;
  }
}

async function verifyStripeAccount(auditKey) {
  const stripe = new Stripe(auditKey, {
    maxNetworkRetries: 2,
    timeout: 10_000,
    telemetry: false,
  });
  const account = await stripe.accounts.retrieveCurrent();
  const requirements = account.requirements;
  const profile = account.business_profile;

  return account.charges_enabled === true
    && account.payouts_enabled === true
    && account.details_submitted === true
    && requirements?.disabled_reason == null
    && (requirements?.currently_due?.length ?? 0) === 0
    && (requirements?.past_due?.length ?? 0) === 0
    && Boolean(profile?.name?.trim())
    && Boolean(profile?.url?.trim())
    && Boolean(profile?.support_phone?.trim())
    && profile?.support_email?.trim().toLowerCase() === supportEmail
    && Boolean(account.settings?.payments?.statement_descriptor?.trim());
}

async function verifyAuditDatabase(databaseUrl) {
  const sql = neon(databaseUrl, {
    readOnly: true,
    isolationLevel: "RepeatableRead",
    fetchOptions: { signal: AbortSignal.timeout(10_000) },
  });
  const rows = await sql`
    with
    protected_tables(qualified_name) as (
      values
        ('public.payment_webhook_events'),
        ('public.purchase_entitlements'),
        ('public.purchase_restore_tokens'),
        ('public.purchase_checkout_activations'),
        ('public.purchase_access_sessions'),
        ('public.purchase_restore_activations'),
        ('public.entitlement_event_tombstones'),
        ('public.stripe_payment_object_links'),
        ('public.payment_operator_alert_outbox'),
        ('public.first_sale_gates'),
        ('public.first_sale_gate_events')
    ),
    mutation_privileges(privilege_name) as (
      values ('INSERT'), ('UPDATE'), ('DELETE'), ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')
    ),
    blocked_functions(signature) as (
      values
        ('public.apply_entitlement_event(text,text,boolean,timestamptz,text,text,text,text,text,text,text)'),
        ('public.claim_first_sale_reservation(text,text,timestamptz,text,text,integer)'),
        ('public.attach_first_sale_checkout(text,bigint,text,text,timestamptz)'),
        ('public.release_failed_first_sale_reservation(text,bigint,text,text)'),
        ('public.release_verified_abandoned_first_sale(text,bigint,text)'),
        ('public.apply_first_sale_paid_event(text,text,boolean,timestamptz,text,text,integer,text,text,text,text,text)'),
        ('public.consume_checkout_activation(text,text,text,text,text,text,timestamptz)'),
        ('public.consume_entitlement_restore_token(text,text,text,text,text,timestamptz)'),
        ('public.approve_next_first_sale(text,text,text,integer,text)')
    ),
    target_function as (
      select pg_get_functiondef(to_regprocedure(
        'public.apply_entitlement_event(text,text,boolean,timestamptz,text,text,text,text,text,text,text)'
      )) as definition
    )
    select
      current_database() = 'neondb' as expected_database,
      current_user = 'hoju_payment_auditor' as least_privilege_audit_role,
      coalesce((
        select not rolsuper
          and not rolcreatedb
          and not rolcreaterole
          and not rolreplication
          and not rolbypassrls
          and not rolinherit
        from pg_roles
        where rolname = current_user
      ), false) as audit_role_has_safe_attributes,
      not pg_has_role(current_user, 'neon_superuser', 'MEMBER')
        and not pg_has_role(current_user, 'hoju_migration_owner', 'MEMBER')
        and not pg_has_role(current_user, 'hoju_app_runtime', 'MEMBER')
        and not pg_has_role(current_user, 'hoju_owner_operator', 'MEMBER')
        as audit_does_not_inherit_elevated_roles,
      coalesce(has_table_privilege(current_user, 'public.schema_migrations', 'SELECT'), false)
        as audit_can_read_migration_ledger,
      coalesce(has_table_privilege(current_user, 'public.first_sale_gates', 'SELECT'), false)
        as audit_can_read_first_sale_gate,
      not coalesce(has_schema_privilege(current_user, 'public', 'CREATE'), false)
        as audit_cannot_create_in_public_schema,
      (
        select bool_and(
          to_regclass(table_name.qualified_name) is not null
          and not coalesce(has_table_privilege(
            current_user,
            to_regclass(table_name.qualified_name),
            privilege.privilege_name
          ), false)
        )
        from protected_tables table_name
        cross join mutation_privileges privilege
      ) as audit_has_no_protected_table_mutation,
      (
        select bool_and(
          to_regprocedure(blocked.signature) is not null
          and not coalesce(has_function_privilege(
            current_user,
            to_regprocedure(blocked.signature),
            'EXECUTE'
          ), false)
        )
        from blocked_functions blocked
      ) as audit_cannot_execute_payment_functions,
      (
        select count(distinct version) = 8
        from public.schema_migrations
        where version = any(array[
          '20260823_first_sale_gate_charge_link_v2',
          '20260823_payment_operator_alert_outbox_v1',
          '20260823_checkout_activation_nonce_v1',
          '20260823_purchase_access_sessions_v1',
          '20260823_restore_activation_nonce_v1',
          '20260823_payment_least_privilege_roles_v1',
          '20260824_entitlement_link_conflict_v1',
          '20260829_rental_first_sale_gate_v1'
        ])
      ) as required_migrations_present,
      exists (
        select 1 from pg_constraint
        where conrelid = 'public.first_sale_gates'::regclass
          and contype = 'c'
          and position('rental_application_pro' in pg_get_constraintdef(oid)) > 0
      ) and exists (
        select 1 from pg_constraint
        where conrelid = 'public.first_sale_gate_events'::regclass
          and contype = 'c'
          and position('rental_application_pro' in pg_get_constraintdef(oid)) > 0
      ) as rental_first_sale_gate_contract_active,
      position(
        'on conflict on constraint stripe_payment_object_links_pkey do nothing'
        in lower((select definition from target_function))
      ) > 0 as named_entitlement_link_constraint_active,
      not exists (
        select 1 from public.first_sale_gates where state = 'RESERVED'
      ) as no_reservation_in_flight
    from target_function
  `;

  const result = rows[0];
  return Boolean(result) && Object.values(result).every((value) => value === true);
}

export async function runProductionPaymentOperatorAudit(
  environment = process.env,
  dependencies = { verifyStripeAccount, verifyAuditDatabase },
) {
  const auditKey = environment.PAYMENTS_STRIPE_AUDIT_KEY?.trim() ?? "";
  const databaseUrl = environment.PAYMENTS_AUDIT_DB_URL?.trim() ?? "";
  const expectedEndpointId = environment.PAYMENTS_EXPECTED_NEON_ENDPOINT_ID?.trim().toLowerCase() ?? "";
  if (
    !/^rk_live_[A-Za-z0-9]+$/.test(auditKey)
    || !endpointPattern.test(expectedEndpointId)
    || endpointIdFromDatabaseUrl(databaseUrl) !== expectedEndpointId
  ) return false;

  try {
    const [stripeReady, databaseReady] = await Promise.all([
      dependencies.verifyStripeAccount(auditKey),
      dependencies.verifyAuditDatabase(databaseUrl),
    ]);
    return stripeReady && databaseReady;
  } catch {
    return false;
  }
}

async function main() {
  const passed = await runProductionPaymentOperatorAudit();
  console.log(passed ? productionOperatorAuditPass : productionOperatorAuditFail);
  if (!passed) process.exitCode = 1;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  await main();
}
