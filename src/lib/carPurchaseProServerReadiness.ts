import "server-only";

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

// One fixed catalog-only probe. The app role intentionally cannot SELECT
// schema_migrations; never require a new table grant just to check readiness.
// Migration markers are deployment audit evidence. Runtime checks inspect the
// required objects, function protections, Car contracts and private hold guards.
export const carPurchaseServerReadinessSql = `
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
    and (select count(*) = 2 and coalesce(bool_and(p.prosecdef
        and pg_get_userbyid(p.proowner) = 'hoju_migration_owner'
        and p.proconfig @> array['search_path=public, pg_temp']
        and not has_function_privilege(current_user, p.oid, 'EXECUTE')), false)
      from pg_proc p where p.oid in (
        to_regprocedure('public.assert_car_purchase_grant_allowed_v1(text,boolean,text,text,text,text)'),
        to_regprocedure('public.car_purchase_sale_hold_blocks_v1(text,boolean)')
      ))
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
    and position('car_purchase_sale_hold_blocks_v1' in pg_get_functiondef(to_regprocedure(
      'public.claim_first_sale_reservation(text,text,timestamptz,text,text,integer)'))) > 0
    and position('assert_car_purchase_grant_allowed_v1' in pg_get_functiondef(to_regprocedure(
      'public.apply_first_sale_paid_event(text,text,boolean,timestamptz,text,text,integer,text,text,text,text,text)'))) > 0
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
