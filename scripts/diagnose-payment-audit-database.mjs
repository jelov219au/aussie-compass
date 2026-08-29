import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.PAYMENTS_OWNER_DIAGNOSTIC_URL?.trim() ?? "";
const fail = "PAYMENT_AUDIT_DATABASE_DIAGNOSTIC=FAIL connection=unverified secrets_printed=no";

if (!/^postgres(?:ql)?:\/\//.test(databaseUrl)) {
  console.log(fail);
  process.exit(1);
}

try {
  const sql = neon(databaseUrl, {
    readOnly: true,
    isolationLevel: "RepeatableRead",
    fetchOptions: { signal: AbortSignal.timeout(15_000) },
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
      exists (
        select 1 from pg_roles
        where rolname = 'hoju_payment_auditor' and rolcanlogin
      ) as audit_login_exists,
      coalesce((
        select not rolsuper
          and not rolcreatedb
          and not rolcreaterole
          and not rolreplication
          and not rolbypassrls
          and not rolinherit
        from pg_roles
        where rolname = 'hoju_payment_auditor'
      ), false) as safe_role_attributes,
      not pg_has_role('hoju_payment_auditor', 'neon_superuser', 'MEMBER')
        and not pg_has_role('hoju_payment_auditor', 'hoju_migration_owner', 'MEMBER')
        and not pg_has_role('hoju_payment_auditor', 'hoju_app_runtime', 'MEMBER')
        and not pg_has_role('hoju_payment_auditor', 'hoju_owner_operator', 'MEMBER')
        as no_elevated_membership,
      coalesce(has_table_privilege('hoju_payment_auditor', 'public.schema_migrations', 'SELECT'), false)
        as can_read_migrations,
      coalesce(has_table_privilege('hoju_payment_auditor', 'public.first_sale_gates', 'SELECT'), false)
        as can_read_gate,
      not coalesce(has_schema_privilege('hoju_payment_auditor', 'public', 'CREATE'), false)
        as cannot_create_schema_objects,
      (
        select bool_and(
          to_regclass(table_name.qualified_name) is not null
          and not coalesce(has_table_privilege(
            'hoju_payment_auditor',
            to_regclass(table_name.qualified_name),
            privilege.privilege_name
          ), false)
        )
        from protected_tables table_name
        cross join mutation_privileges privilege
      ) as no_protected_table_mutation,
      (
        select bool_and(
          to_regprocedure(blocked.signature) is not null
          and not coalesce(has_function_privilege(
            'hoju_payment_auditor',
            to_regprocedure(blocked.signature),
            'EXECUTE'
          ), false)
        )
        from blocked_functions blocked
      ) as cannot_execute_payment_functions,
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
      ) as rental_gate_contract,
      position(
        'on conflict on constraint stripe_payment_object_links_pkey do nothing'
        in lower((select definition from target_function))
      ) > 0 as named_constraint_contract,
      not exists (
        select 1 from public.first_sale_gates where state = 'RESERVED'
      ) as no_reservation
    from target_function
  `;

  const result = rows[0] ?? {};
  const fields = Object.entries(result).map(([key, value]) => `${key}=${value === true ? "pass" : "fail"}`);
  const passed = Object.values(result).length > 0 && Object.values(result).every((value) => value === true);
  console.log(`PAYMENT_AUDIT_DATABASE_DIAGNOSTIC=${passed ? "PASS" : "FAIL"} ${fields.join(" ")} secrets_printed=no`);
  if (result.no_reservation === false) {
    const reservations = await sql`
      select
        product_code,
        generation,
        reservation_expires_at <= now() as expired,
        stripe_checkout_session_id is not null as checkout_linked,
        right(stripe_checkout_session_id, 8) as checkout_last8
      from public.first_sale_gates
      where state = 'RESERVED'
      order by product_code
    `;
    for (const reservation of reservations) {
      console.log(
        `PAYMENT_AUDIT_RESERVATION=FOUND product=${reservation.product_code} generation=${reservation.generation} expired=${reservation.expired ? "yes" : "no"} checkout_linked=${reservation.checkout_linked ? "yes" : "no"} checkout_last8=${reservation.checkout_last8 ?? "none"} secrets_printed=no`,
      );
    }
  }
  if (!passed) process.exitCode = 1;
} catch {
  console.log(fail);
  process.exitCode = 1;
} finally {
  delete process.env.PAYMENTS_OWNER_DIAGNOSTIC_URL;
}
