-- Hoju Compass first-sale database rehearsal.
-- ISOLATED USE ONLY: refuses to run outside the dated empty rehearsal DB.
-- Synthetic test references only; never calls Stripe or SMTP or enables payments.

begin;

do $$
begin
  if current_database() is distinct from 'first_sale_rehearsal_20260824_v2' then
    raise exception 'Refusing to run outside first_sale_rehearsal_20260824';
  end if;
  if not exists (select 1 from public.schema_migrations where version = '20260824_entitlement_link_conflict_v1') then
    raise exception 'Entitlement link conflict forward fix is missing';
  end if;
  if exists (select 1 from public.first_sale_gates)
    or exists (select 1 from public.first_sale_gate_events)
    or exists (select 1 from public.payment_webhook_events)
    or exists (select 1 from public.purchase_entitlements)
    or exists (select 1 from public.purchase_restore_tokens)
    or exists (select 1 from public.purchase_checkout_activations)
    or exists (select 1 from public.purchase_access_sessions)
    or exists (select 1 from public.purchase_restore_activations)
    or exists (select 1 from public.payment_operator_alert_outbox)
  then raise exception 'Rehearsal database is not empty; do not overwrite evidence'; end if;
end;
$$;

create schema if not exists rehearsal;
revoke all on schema rehearsal from public;
create table rehearsal.results (
  check_name text primary key,
  observed_value text not null,
  passed boolean not null,
  recorded_at timestamptz not null default clock_timestamp()
);
create table rehearsal.context (entitlement_id bigint primary key);
revoke all on table rehearsal.results from public;
revoke all on table rehearsal.context from public;
grant usage on schema rehearsal to hoju_app_runtime;
grant insert on table rehearsal.results to hoju_app_runtime;
grant select, insert on table rehearsal.context to hoju_app_runtime;

-- Temporary membership lets the console owner SET ROLE and prove the exact
-- wrapper boundary. It is revoked before evidence is selected.
do $$ begin
  execute format('grant hoju_app_runtime to %I', current_user);
  execute format('grant hoju_owner_operator to %I', current_user);
end $$;

set role hoju_app_runtime;

insert into rehearsal.results
select 'reservation_first_claim', outcome, outcome = 'claimed'
from public.claim_first_sale_reservation('resume_pro', repeat('a',64), clock_timestamp()+interval '31 minutes', 'test', 'aud', 1990);

insert into rehearsal.results
select 'reservation_second_claim', outcome, outcome = 'reserved'
from public.claim_first_sale_reservation('resume_pro', repeat('b',64), clock_timestamp()+interval '31 minutes', 'test', 'aud', 1990);

insert into rehearsal.results
select 'expiry_checkout_attached', value::text, value
from (select public.attach_first_sale_checkout('resume_pro', 1, repeat('a',64), 'cs_test_RehearsalExpiry00000001', clock_timestamp()+interval '2 seconds') value) x;

reset role;

-- Move only the synthetic attached reservation clock into the past so the
-- whole rehearsal remains atomic and rolls back on any failed assertion.
update public.first_sale_gates
set reservation_expires_at=clock_timestamp()-interval '1 second'
where product_code='resume_pro' and state='RESERVED' and generation=1
  and stripe_checkout_session_id='cs_test_RehearsalExpiry00000001';

set role hoju_app_runtime;

insert into rehearsal.results
select 'verified_expiry_released', value::text, value
from (select public.release_verified_abandoned_first_sale('resume_pro', 1, 'cs_test_RehearsalExpiry00000001') value) x;

insert into rehearsal.results
select 'post_expiry_claim', outcome, outcome = 'claimed'
from public.claim_first_sale_reservation('resume_pro', repeat('b',64), clock_timestamp()+interval '31 minutes', 'test', 'aud', 1990);

insert into rehearsal.results
select 'paid_checkout_attached', value::text, value
from (select public.attach_first_sale_checkout('resume_pro', 2, repeat('b',64), 'cs_test_RehearsalPaid00000002', clock_timestamp()+interval '31 minutes') value) x;

insert into rehearsal.results
select 'paid_event_processed', value, value = 'processed'
from (select public.apply_first_sale_paid_event(
  'evt_RehearsalPaid00000002','checkout.session.completed',false,clock_timestamp(),
  'resume_pro','aud',1990,'cs_test_RehearsalPaid00000002','pi_RehearsalPaid00000002',
  'ch_RehearsalPaid00000002','cus_RehearsalPaid00000002','checkout_paid') value) x;

insert into rehearsal.results
select 'paid_event_idempotent', value, value = 'duplicate'
from (select public.apply_first_sale_paid_event(
  'evt_RehearsalPaid00000002','checkout.session.completed',false,clock_timestamp(),
  'resume_pro','aud',1990,'cs_test_RehearsalPaid00000002','pi_RehearsalPaid00000002',
  'ch_RehearsalPaid00000002','cus_RehearsalPaid00000002','checkout_paid') value) x;

insert into rehearsal.context (entitlement_id)
select id from public.find_active_purchase_entitlement_by_checkout('cs_test_RehearsalPaid00000002','resume_pro');

insert into rehearsal.results
select 'later_checkout_locked', outcome, outcome = 'locked'
from public.claim_first_sale_reservation('resume_pro', repeat('c',64), clock_timestamp()+interval '31 minutes', 'test', 'aud', 1990);

insert into rehearsal.results
select 'activation_first_consume', activation_outcome, activation_outcome='consumed'
from public.consume_checkout_activation('cs_test_RehearsalPaid00000002','resume_pro','cus_RehearsalPaid00000002',repeat('c',64),repeat('d',64),'ACTR0001',clock_timestamp()+interval '29 days');

insert into rehearsal.results
select 'activation_same_nonce_retry', activation_outcome, activation_outcome='idempotent'
from public.consume_checkout_activation('cs_test_RehearsalPaid00000002','resume_pro','cus_RehearsalPaid00000002',repeat('c',64),repeat('d',64),'ACTR0001',clock_timestamp()+interval '29 days');

insert into rehearsal.results
select 'activation_different_nonce_denied', activation_outcome, activation_outcome='used'
from public.consume_checkout_activation('cs_test_RehearsalPaid00000002','resume_pro','cus_RehearsalPaid00000002',repeat('e',64),repeat('f',64),'ACTR0002',clock_timestamp()+interval '29 days');

insert into rehearsal.results
select 'activation_session_released', value::text, value
from (select public.release_purchase_access_session((select entitlement_id from rehearsal.context),'resume_pro',repeat('d',64)) value) x;

insert into rehearsal.results
select 'activation_release_retry_denied', activation_outcome, activation_outcome='released'
from public.consume_checkout_activation('cs_test_RehearsalPaid00000002','resume_pro','cus_RehearsalPaid00000002',repeat('c',64),repeat('d',64),'ACTR0001',clock_timestamp()+interval '29 days');

insert into rehearsal.results
select 'restore_token_created', value::text, value
from (select public.create_entitlement_restore_token((select entitlement_id from rehearsal.context),'resume_pro',repeat('0',64),clock_timestamp()+interval '29 days') value) x;

insert into rehearsal.results
select 'restore_first_consume', restore_outcome, restore_outcome='consumed'
from public.consume_entitlement_restore_token(repeat('0',64),'resume_pro',repeat('1',64),repeat('2',64),'RSTR0001',clock_timestamp()+interval '29 days');

insert into rehearsal.results
select 'restore_same_nonce_retry', restore_outcome, restore_outcome='idempotent'
from public.consume_entitlement_restore_token(repeat('0',64),'resume_pro',repeat('1',64),repeat('2',64),'RSTR0001',clock_timestamp()+interval '29 days');

insert into rehearsal.results
select 'restore_different_nonce_denied', restore_outcome, restore_outcome='used'
from public.consume_entitlement_restore_token(repeat('0',64),'resume_pro',repeat('3',64),repeat('4',64),'RSTR0003',clock_timestamp()+interval '29 days');

insert into rehearsal.results
select 'restore_session_released', value::text, value
from (select public.release_purchase_access_session((select entitlement_id from rehearsal.context),'resume_pro',repeat('2',64)) value) x;

insert into rehearsal.results
select 'restore_release_retry_denied', restore_outcome, restore_outcome='released'
from public.consume_entitlement_restore_token(repeat('0',64),'resume_pro',repeat('1',64),repeat('2',64),'RSTR0001',clock_timestamp()+interval '29 days');

insert into rehearsal.results
select 'second_restore_token_created', value::text, value
from (select public.create_entitlement_restore_token((select entitlement_id from rehearsal.context),'resume_pro',repeat('5',64),clock_timestamp()+interval '29 days') value) x;

insert into rehearsal.results
select 'second_restore_device_active', restore_outcome, restore_outcome='consumed'
from public.consume_entitlement_restore_token(repeat('5',64),'resume_pro',repeat('6',64),repeat('7',64),'RSTR0002',clock_timestamp()+interval '29 days');

insert into rehearsal.results
select 'paid_alert_claimed', claim_outcome, claim_outcome='claimed'
from public.claim_payment_operator_alert_intent('evt_RehearsalPaid00000002','payment_completed',repeat('8',64));

insert into rehearsal.results
select 'paid_alert_busy_worker', claim_outcome, claim_outcome='busy'
from public.claim_payment_operator_alert_intent('evt_RehearsalPaid00000002','payment_completed',repeat('9',64));

insert into rehearsal.results
select 'paid_alert_claim_released', value::text, value
from (select public.release_payment_operator_alert_claim('evt_RehearsalPaid00000002','payment_completed',repeat('8',64)) value) x;

insert into rehearsal.results
select 'paid_alert_reclaimed', claim_outcome, claim_outcome='claimed'
from public.claim_payment_operator_alert_intent('evt_RehearsalPaid00000002','payment_completed',repeat('9',64));

insert into rehearsal.results
select 'paid_alert_marked_sent', value::text, value
from (select public.mark_payment_operator_alert_sent('evt_RehearsalPaid00000002','payment_completed',repeat('9',64)) value) x;

insert into rehearsal.results
select 'paid_alert_duplicate_is_sent', claim_outcome, claim_outcome='sent'
from public.claim_payment_operator_alert_intent('evt_RehearsalPaid00000002','payment_completed',repeat('9',64));

insert into rehearsal.results
select 'refund_event_processed', status, outcome='processed' and status='revoked'
from public.apply_guarded_entitlement_event('evt_RehearsalRefund000003','charge.refunded',false,clock_timestamp()+interval '1 second','revoke',null,null,'pi_RehearsalPaid00000002','ch_RehearsalPaid00000002',null,'charge_fully_refunded');

insert into rehearsal.results
select 'refund_blocks_active_access', count(*)::text, count(*)=0
from public.find_active_purchase_entitlement_by_access_session(
  (select entitlement_id from rehearsal.context),
  'resume_pro',repeat('7',64));

insert into rehearsal.results
select 'refund_blocks_restore_retry', restore_outcome, restore_outcome='revoked'
from public.consume_entitlement_restore_token(repeat('5',64),'resume_pro',repeat('6',64),repeat('7',64),'RSTR0002',clock_timestamp()+interval '29 days');

insert into rehearsal.results
select 'refund_alert_claimed', claim_outcome, claim_outcome='claimed'
from public.claim_payment_operator_alert_intent('evt_RehearsalRefund000003','refund_event',repeat('a',64));

reset role;

-- Simulate a worker that died after claiming. This direct clock fixture is
-- permitted only in the isolated rehearsal database.
update public.payment_operator_alert_outbox
set lease_expires_at=transaction_timestamp()-interval '1 second'
where event_key=md5('evt_RehearsalRefund000003') and alert_kind='refund_event' and status='pending';

set role hoju_app_runtime;

insert into rehearsal.results
select 'refund_alert_stale_lease_reclaimed', claim_outcome, claim_outcome='claimed'
from public.claim_payment_operator_alert_intent('evt_RehearsalRefund000003','refund_event',repeat('b',64));

insert into rehearsal.results
select 'refund_alert_marked_sent', value::text, value
from (select public.mark_payment_operator_alert_sent('evt_RehearsalRefund000003','refund_event',repeat('b',64)) value) x;

reset role;

do $$ begin
  execute format('revoke hoju_app_runtime from %I', current_user);
  execute format('revoke hoju_owner_operator from %I', current_user);
end $$;

commit;

-- Non-sensitive evidence only: fixed check names, outcomes, counts and suffixes.
select check_name, observed_value, passed from rehearsal.results order by check_name;

select
  (select state from public.first_sale_gates where product_code='resume_pro') gate_state,
  (select count(*) from public.first_sale_gate_events) gate_event_count,
  (select count(*) from public.payment_webhook_events) webhook_event_count,
  (select count(*) from public.purchase_entitlements) entitlement_count,
  (select count(*) from public.purchase_access_sessions) access_session_count,
  (select count(*) from public.purchase_restore_activations) restore_activation_count,
  (select count(*) from public.payment_operator_alert_outbox) alert_count,
  (select count(*) from public.payment_operator_alert_outbox where status='sent') sent_alert_count,
  (select count(*) from rehearsal.results where passed) passed_check_count,
  (select count(*) from rehearsal.results where not passed) failed_check_count;

select right(entitlement.stripe_checkout_session_id,8) checkout_ref_last8,
  access.access_session_ref_last8, access.session_source,
  access.created_at, access.expires_at, access.revoked_at
from public.purchase_access_sessions access
join public.purchase_entitlements entitlement on entitlement.id=access.entitlement_id
order by access.id;
