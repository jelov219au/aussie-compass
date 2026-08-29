-- One-time Production grant template for the payment launch audit login.
-- Run only on the Primary branch / neondb as neondb_owner with PAYMENTS_ENABLED=false.
-- This file intentionally does not create the login or contain its password.
-- Create it first through SQL, with a password generated and retained outside the repo/chat:
-- create role hoju_payment_auditor with login password '<password-manager-generated-secret>'
--   nosuperuser nocreatedb nocreaterole noinherit noreplication nobypassrls;
begin;

set local statement_timeout = '10s';
set local lock_timeout = '2s';

do $$
declare
  audit_role record;
begin
  if current_database() <> 'neondb' then
    raise exception 'payment audit grants require neondb';
  end if;
  if current_user <> 'neondb_owner' then
    raise exception 'payment audit grants require neondb_owner';
  end if;
  if not exists (select 1 from pg_roles where rolname = 'hoju_migration_owner') then
    raise exception 'hoju_migration_owner is missing';
  end if;
  if exists (
    select 1 from public.first_sale_gates where state = 'RESERVED'
  ) then
    raise exception 'payment audit grants refuse an in-flight reservation';
  end if;

  select * into audit_role
  from pg_roles
  where rolname = 'hoju_payment_auditor';

  if not found then
    raise exception 'create hoju_payment_auditor with SQL before applying grants';
  end if;
  if not audit_role.rolcanlogin
    or audit_role.rolsuper
    or audit_role.rolcreatedb
    or audit_role.rolcreaterole
    or audit_role.rolreplication
    or audit_role.rolbypassrls
    or audit_role.rolinherit
  then
    raise exception 'hoju_payment_auditor role attributes are not least privilege';
  end if;
  if pg_has_role('hoju_payment_auditor', 'neon_superuser', 'MEMBER')
    or pg_has_role('hoju_payment_auditor', 'hoju_migration_owner', 'MEMBER')
    or pg_has_role('hoju_payment_auditor', 'hoju_app_runtime', 'MEMBER')
    or pg_has_role('hoju_payment_auditor', 'hoju_owner_operator', 'MEMBER')
  then
    raise exception 'hoju_payment_auditor must not inherit an elevated payment role';
  end if;
end;
$$;

grant connect on database neondb to hoju_payment_auditor;
grant usage on schema public to hoju_payment_auditor;
revoke create on schema public from hoju_payment_auditor;

revoke all privileges on table
  public.payment_webhook_events,
  public.purchase_entitlements,
  public.purchase_restore_tokens,
  public.purchase_checkout_activations,
  public.purchase_access_sessions,
  public.purchase_restore_activations,
  public.entitlement_event_tombstones,
  public.stripe_payment_object_links,
  public.payment_operator_alert_outbox,
  public.first_sale_gates,
  public.first_sale_gate_events
from hoju_payment_auditor;

revoke all privileges on sequence
  public.purchase_entitlements_id_seq,
  public.purchase_access_sessions_id_seq,
  public.first_sale_gate_events_id_seq
from hoju_payment_auditor;

grant select on table
  public.schema_migrations,
  public.first_sale_gates
to hoju_payment_auditor;

set role hoju_migration_owner;

revoke execute on function public.apply_entitlement_event(text, text, boolean, timestamptz, text, text, text, text, text, text, text) from hoju_payment_auditor;
revoke execute on function public.claim_first_sale_reservation(text, text, timestamptz, text, text, integer) from hoju_payment_auditor;
revoke execute on function public.attach_first_sale_checkout(text, bigint, text, text, timestamptz) from hoju_payment_auditor;
revoke execute on function public.release_failed_first_sale_reservation(text, bigint, text, text) from hoju_payment_auditor;
revoke execute on function public.release_verified_abandoned_first_sale(text, bigint, text) from hoju_payment_auditor;
revoke execute on function public.lock_first_sale_from_paid_event(text, text, text, boolean, timestamptz) from hoju_payment_auditor;
revoke execute on function public.apply_first_sale_paid_event(text, text, boolean, timestamptz, text, text, integer, text, text, text, text, text) from hoju_payment_auditor;
revoke execute on function public.apply_guarded_entitlement_event(text, text, boolean, timestamptz, text, text, text, text, text, text, text) from hoju_payment_auditor;
revoke execute on function public.consume_entitlement_restore_token(text, text, text, text, text, timestamptz) from hoju_payment_auditor;
revoke execute on function public.create_entitlement_restore_token(bigint, text, text, timestamptz) from hoju_payment_auditor;
revoke execute on function public.enqueue_payment_operator_alert_failure(text, text, boolean, text, text, text) from hoju_payment_auditor;
revoke execute on function public.claim_payment_operator_alert_intent(text, text, text) from hoju_payment_auditor;
revoke execute on function public.mark_payment_operator_alert_sent(text, text, text) from hoju_payment_auditor;
revoke execute on function public.release_payment_operator_alert_claim(text, text, text) from hoju_payment_auditor;
revoke execute on function public.consume_checkout_activation(text, text, text, text, text, text, timestamptz) from hoju_payment_auditor;
revoke execute on function public.release_purchase_access_session(bigint, text, text) from hoju_payment_auditor;
revoke execute on function public.find_active_purchase_entitlement_by_access_session(bigint, text, text) from hoju_payment_auditor;
revoke execute on function public.find_active_purchase_entitlement_by_checkout(text, text) from hoju_payment_auditor;
revoke execute on function public.find_active_purchase_entitlement_by_id(bigint, text) from hoju_payment_auditor;
revoke execute on function public.approve_next_first_sale(text, text, text, integer, text) from hoju_payment_auditor;
revoke execute on function public.prevent_first_sale_gate_event_mutation() from hoju_payment_auditor;
revoke execute on function public.prevent_entitlement_tombstone_mutation() from hoju_payment_auditor;
revoke execute on function public.record_payment_operator_alert_intent(text, text, boolean, text) from hoju_payment_auditor;
revoke execute on function public.payment_operator_alert_from_receipt() from hoju_payment_auditor;
revoke execute on function public.release_checkout_activation(bigint, text) from hoju_payment_auditor;

reset role;

commit;
