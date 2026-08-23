-- Read-only audit for the entitlement-link forward fix.
-- This file never authorizes or applies a Production mutation. Select the
-- Neon Primary branch explicitly and keep PAYMENTS_ENABLED=false.

begin transaction isolation level repeatable read read only;
set local statement_timeout = '10s';
set local lock_timeout = '2s';

with
target_function as (
  select pg_get_functiondef(
    to_regprocedure(
      'public.apply_entitlement_event(text,text,boolean,timestamptz,text,text,text,text,text,text,text)'
    )
  ) as definition
),
checks as (
  select
    current_database() = 'neondb' as expected_database_name,
    current_user = 'neondb_owner' as expected_console_owner,
    exists (
      select 1 from public.schema_migrations
      where version = '20260823_payment_least_privilege_roles_v1'
    ) as least_privilege_prerequisite_present,
    exists (
      select 1 from public.schema_migrations
      where version = '20260824_entitlement_link_conflict_v1'
    ) as forward_fix_recorded,
    position(
      'on conflict on constraint stripe_payment_object_links_pkey do nothing'
      in lower((select definition from target_function))
    ) > 0 as named_constraint_active,
    position(
      'on conflict (stripe_payment_intent_id, stripe_charge_id) do nothing'
      in lower((select definition from target_function))
    ) > 0 as ambiguous_column_list_active,
    not exists (
      select 1 from public.first_sale_gates where state = 'RESERVED'
    ) as no_reservation_in_flight
)
select
  clock_timestamp() as audited_at,
  current_database() as database_name,
  current_user as console_role,
  checks.*,
  (
    checks.expected_database_name
    and checks.expected_console_owner
    and checks.least_privilege_prerequisite_present
    and not checks.forward_fix_recorded
    and not checks.named_constraint_active
    and checks.ambiguous_column_list_active
    and checks.no_reservation_in_flight
  ) as preflight_can_apply_once,
  (
    checks.expected_database_name
    and checks.expected_console_owner
    and checks.least_privilege_prerequisite_present
    and checks.forward_fix_recorded
    and checks.named_constraint_active
    and not checks.ambiguous_column_list_active
    and checks.no_reservation_in_flight
  ) as postflight_pass,
  (select count(*) from public.first_sale_gates) as gate_row_count,
  (select count(*) from public.first_sale_gate_events) as gate_event_count,
  (select count(*) from public.payment_webhook_events) as webhook_event_count,
  (select count(*) from public.purchase_entitlements) as entitlement_count,
  (select count(*) from public.payment_operator_alert_outbox) as alert_count,
  (select count(*) from public.purchase_access_sessions) as access_session_count,
  (select count(*) from public.purchase_restore_activations) as restore_activation_count
from checks;

commit;
