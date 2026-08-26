import "server-only";

import { neon } from "@neondatabase/serverless";

import { getEntitlementDatabaseUrl } from "@/lib/entitlementConfig";

const endpointPattern = /^ep-[a-z0-9-]+$/;

function endpointIdFromDatabaseUrl(value: string) {
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

export async function verifyProductionRuntimeDatabase(expectedEndpointId: string) {
  if (!endpointPattern.test(expectedEndpointId)) return false;

  const databaseUrl = getEntitlementDatabaseUrl()?.trim() ?? "";
  if (endpointIdFromDatabaseUrl(databaseUrl) !== expectedEndpointId) return false;

  try {
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
      )
      select
        current_database() = 'neondb' as expected_database,
        current_user = 'hoju_app_runtime' as least_privilege_runtime_role,
        coalesce((
          select not rolsuper
            and not rolcreatedb
            and not rolcreaterole
            and not rolreplication
            and not rolbypassrls
          from pg_roles
          where rolname = current_user
        ), false) as runtime_role_has_safe_attributes,
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
        ) as runtime_has_no_protected_table_mutation,
        not coalesce(has_function_privilege(
          current_user,
          to_regprocedure('public.approve_next_first_sale(text,text,text,integer,text)'),
          'EXECUTE'
        ), false) as runtime_cannot_approve_next_sale
    ` as Record<string, boolean>[];

    const result = rows[0];
    return Boolean(result) && Object.values(result).every((value) => value === true);
  } catch {
    return false;
  }
}
