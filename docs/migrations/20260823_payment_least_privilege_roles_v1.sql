-- Production hardening: separate migration owner, runtime and owner operator.
-- Apply only after restore_activation_nonce_v1 with PAYMENTS_ENABLED=false.
begin;

do $$
begin
  if not exists (
    select 1 from public.schema_migrations
    where version = '20260823_restore_activation_nonce_v1'
  ) then
    raise exception 'restore activation nonce v1 must be applied first';
  end if;
  if not exists (select 1 from pg_roles where rolname = 'hoju_migration_owner')
    or not exists (select 1 from pg_roles where rolname = 'hoju_app_runtime')
    or not exists (select 1 from pg_roles where rolname = 'hoju_owner_operator')
  then
    raise exception 'required payment roles are missing';
  end if;
end;
$$;

grant usage, create on schema public to hoju_migration_owner;
grant usage on schema public to hoju_app_runtime, hoju_owner_operator;
revoke create on schema public from public, hoju_app_runtime, hoju_owner_operator;

grant all privileges on table
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
to hoju_migration_owner;

grant usage, select, update on sequence
  public.purchase_entitlements_id_seq,
  public.purchase_access_sessions_id_seq,
  public.first_sale_gate_events_id_seq
to hoju_migration_owner;

alter function public.apply_entitlement_event(text, text, boolean, timestamptz, text, text, text, text, text, text, text) owner to hoju_migration_owner;
alter function public.claim_first_sale_reservation(text, text, timestamptz, text, text, integer) owner to hoju_migration_owner;
alter function public.attach_first_sale_checkout(text, bigint, text, text, timestamptz) owner to hoju_migration_owner;
alter function public.release_failed_first_sale_reservation(text, bigint, text, text) owner to hoju_migration_owner;
alter function public.release_verified_abandoned_first_sale(text, bigint, text) owner to hoju_migration_owner;
alter function public.lock_first_sale_from_paid_event(text, text, text, boolean, timestamptz) owner to hoju_migration_owner;
alter function public.apply_first_sale_paid_event(text, text, boolean, timestamptz, text, text, integer, text, text, text, text, text) owner to hoju_migration_owner;
alter function public.apply_guarded_entitlement_event(text, text, boolean, timestamptz, text, text, text, text, text, text, text) owner to hoju_migration_owner;
alter function public.consume_entitlement_restore_token(text, text, text, text, text, timestamptz) owner to hoju_migration_owner;
alter function public.create_entitlement_restore_token(bigint, text, text, timestamptz) owner to hoju_migration_owner;
alter function public.consume_checkout_activation(text, text, text, text, text, text, timestamptz) owner to hoju_migration_owner;
alter function public.release_purchase_access_session(bigint, text, text) owner to hoju_migration_owner;
alter function public.find_active_purchase_entitlement_by_access_session(bigint, text, text) owner to hoju_migration_owner;
alter function public.find_active_purchase_entitlement_by_checkout(text, text) owner to hoju_migration_owner;
alter function public.find_active_purchase_entitlement_by_id(bigint, text) owner to hoju_migration_owner;
alter function public.enqueue_payment_operator_alert_failure(text, text, boolean, text, text, text) owner to hoju_migration_owner;
alter function public.claim_payment_operator_alert_intent(text, text, text) owner to hoju_migration_owner;
alter function public.mark_payment_operator_alert_sent(text, text, text) owner to hoju_migration_owner;
alter function public.release_payment_operator_alert_claim(text, text, text) owner to hoju_migration_owner;
alter function public.approve_next_first_sale(text, text, text, integer, text) owner to hoju_migration_owner;
alter function public.prevent_first_sale_gate_event_mutation() owner to hoju_migration_owner;
alter function public.prevent_entitlement_tombstone_mutation() owner to hoju_migration_owner;
alter function public.record_payment_operator_alert_intent(text, text, boolean, text) owner to hoju_migration_owner;
alter function public.payment_operator_alert_from_receipt() owner to hoju_migration_owner;
alter function public.release_checkout_activation(bigint, text) owner to hoju_migration_owner;

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
from public, hoju_app_runtime, hoju_owner_operator;

revoke all privileges on sequence
  public.purchase_entitlements_id_seq,
  public.purchase_access_sessions_id_seq,
  public.first_sale_gate_events_id_seq
from public, hoju_app_runtime, hoju_owner_operator;

revoke execute on function public.apply_entitlement_event(text, text, boolean, timestamptz, text, text, text, text, text, text, text) from public, hoju_app_runtime, hoju_owner_operator;
revoke execute on function public.claim_first_sale_reservation(text, text, timestamptz, text, text, integer) from public, hoju_app_runtime, hoju_owner_operator;
revoke execute on function public.attach_first_sale_checkout(text, bigint, text, text, timestamptz) from public, hoju_app_runtime, hoju_owner_operator;
revoke execute on function public.release_failed_first_sale_reservation(text, bigint, text, text) from public, hoju_app_runtime, hoju_owner_operator;
revoke execute on function public.release_verified_abandoned_first_sale(text, bigint, text) from public, hoju_app_runtime, hoju_owner_operator;
revoke execute on function public.lock_first_sale_from_paid_event(text, text, text, boolean, timestamptz) from public, hoju_app_runtime, hoju_owner_operator;
revoke execute on function public.apply_first_sale_paid_event(text, text, boolean, timestamptz, text, text, integer, text, text, text, text, text) from public, hoju_app_runtime, hoju_owner_operator;
revoke execute on function public.apply_guarded_entitlement_event(text, text, boolean, timestamptz, text, text, text, text, text, text, text) from public, hoju_app_runtime, hoju_owner_operator;
revoke execute on function public.consume_entitlement_restore_token(text, text, text, text, text, timestamptz) from public, hoju_app_runtime, hoju_owner_operator;
revoke execute on function public.create_entitlement_restore_token(bigint, text, text, timestamptz) from public, hoju_app_runtime, hoju_owner_operator;
revoke execute on function public.consume_checkout_activation(text, text, text, text, text, text, timestamptz) from public, hoju_app_runtime, hoju_owner_operator;
revoke execute on function public.release_purchase_access_session(bigint, text, text) from public, hoju_app_runtime, hoju_owner_operator;
revoke execute on function public.find_active_purchase_entitlement_by_access_session(bigint, text, text) from public, hoju_app_runtime, hoju_owner_operator;
revoke execute on function public.find_active_purchase_entitlement_by_checkout(text, text) from public, hoju_app_runtime, hoju_owner_operator;
revoke execute on function public.find_active_purchase_entitlement_by_id(bigint, text) from public, hoju_app_runtime, hoju_owner_operator;
revoke execute on function public.enqueue_payment_operator_alert_failure(text, text, boolean, text, text, text) from public, hoju_app_runtime, hoju_owner_operator;
revoke execute on function public.claim_payment_operator_alert_intent(text, text, text) from public, hoju_app_runtime, hoju_owner_operator;
revoke execute on function public.mark_payment_operator_alert_sent(text, text, text) from public, hoju_app_runtime, hoju_owner_operator;
revoke execute on function public.release_payment_operator_alert_claim(text, text, text) from public, hoju_app_runtime, hoju_owner_operator;
revoke execute on function public.approve_next_first_sale(text, text, text, integer, text) from public, hoju_app_runtime, hoju_owner_operator;
revoke execute on function public.prevent_first_sale_gate_event_mutation() from public, hoju_app_runtime, hoju_owner_operator;
revoke execute on function public.prevent_entitlement_tombstone_mutation() from public, hoju_app_runtime, hoju_owner_operator;
revoke execute on function public.record_payment_operator_alert_intent(text, text, boolean, text) from public, hoju_app_runtime, hoju_owner_operator;
revoke execute on function public.payment_operator_alert_from_receipt() from public, hoju_app_runtime, hoju_owner_operator;
revoke execute on function public.release_checkout_activation(bigint, text) from public, hoju_app_runtime, hoju_owner_operator;

grant execute on function public.claim_first_sale_reservation(text, text, timestamptz, text, text, integer) to hoju_app_runtime;
grant execute on function public.attach_first_sale_checkout(text, bigint, text, text, timestamptz) to hoju_app_runtime;
grant execute on function public.release_failed_first_sale_reservation(text, bigint, text, text) to hoju_app_runtime;
grant execute on function public.release_verified_abandoned_first_sale(text, bigint, text) to hoju_app_runtime;
grant execute on function public.apply_first_sale_paid_event(text, text, boolean, timestamptz, text, text, integer, text, text, text, text, text) to hoju_app_runtime;
grant execute on function public.apply_guarded_entitlement_event(text, text, boolean, timestamptz, text, text, text, text, text, text, text) to hoju_app_runtime;
grant execute on function public.consume_entitlement_restore_token(text, text, text, text, text, timestamptz) to hoju_app_runtime;
grant execute on function public.create_entitlement_restore_token(bigint, text, text, timestamptz) to hoju_app_runtime;
grant execute on function public.enqueue_payment_operator_alert_failure(text, text, boolean, text, text, text) to hoju_app_runtime;
grant execute on function public.claim_payment_operator_alert_intent(text, text, text) to hoju_app_runtime;
grant execute on function public.mark_payment_operator_alert_sent(text, text, text) to hoju_app_runtime;
grant execute on function public.release_payment_operator_alert_claim(text, text, text) to hoju_app_runtime;
grant execute on function public.consume_checkout_activation(text, text, text, text, text, text, timestamptz) to hoju_app_runtime;
grant execute on function public.release_purchase_access_session(bigint, text, text) to hoju_app_runtime;
grant execute on function public.find_active_purchase_entitlement_by_access_session(bigint, text, text) to hoju_app_runtime;
grant execute on function public.find_active_purchase_entitlement_by_checkout(text, text) to hoju_app_runtime;
grant execute on function public.find_active_purchase_entitlement_by_id(bigint, text) to hoju_app_runtime;

grant execute on function public.approve_next_first_sale(text, text, text, integer, text) to hoju_owner_operator;

revoke hoju_migration_owner, hoju_owner_operator from hoju_app_runtime;
revoke hoju_app_runtime from hoju_owner_operator;

alter default privileges for role hoju_migration_owner in schema public
  revoke execute on functions from public;

insert into public.schema_migrations (version)
values ('20260823_payment_least_privilege_roles_v1')
on conflict (version) do nothing;

commit;
