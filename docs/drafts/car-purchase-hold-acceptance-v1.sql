-- REVIEW FIXTURE, NOT EXECUTED. Requires final integrated SQL in an approved
-- isolated test database, never production. Do not remove the stop as a shortcut.
begin;
do $$ begin raise exception 'DRAFT_NOT_APPLICABLE: SQL acceptance target is not approved'; end $$;
set local statement_timeout = '10s';
set local lock_timeout = '2s';
set local role hoju_migration_owner;

do $$
declare
  v_price integer := nullif(current_setting('hoju.fixture_car_price_cents',true),'')::integer;
  v_at timestamptz := now()-interval '1 hour';
  v_result record;
  v_previous text;
  v_cases integer := 0;
begin
  if current_setting('hoju.fixture_mode',true) is distinct from 'isolated_car_acceptance'
    or v_price is null or v_price <= 0
    or public.car_purchase_sale_hold_guards_ready_v1() is distinct from true
  then raise exception 'Approved isolated fixture configuration is required'; end if;
  if exists(select 1 from public.first_sale_gates where product_code='car_purchase_pro')
    or exists(select 1 from public.purchase_entitlements where product_code='car_purchase_pro')
    or exists(select 1 from public.car_purchase_payment_holds)
    or exists(select 1 from public.car_purchase_exception_receipts)
  then raise exception 'Car fixture requires an unused isolated product state'; end if;

  -- Synthetic state only, rolled back. Amount comes from the isolated test
  -- configuration; this file supplies no offer or production price.
  insert into public.first_sale_gates(product_code,state,generation,environment,currency,expected_amount_cents,
    claim_token_hash,reservation_expires_at,stripe_checkout_session_id)
  values('car_purchase_pro','RESERVED',1,'test','aud',v_price,repeat('a',64),now()+interval '31 minutes','cs_test_carFixture1');

  select * into strict v_result from public.apply_car_purchase_exception_event_v1(
    'evt_carPending1','checkout.session.completed',false,v_at,'car_purchase_pro','cs_test_carFixture1',
    'pi_carFixture1',null,'cus_carFixture1','pending','checkout_payment_pending','cs_test_carFixture1','processing');
  if v_result.outcome <> 'processed' or v_result.alert_kind <> 'fulfillment_attention'
    or v_result.alert_durable is distinct from true or v_result.sale_hold_durable is distinct from true
    or v_result.restriction_durable is distinct from false or v_result.entitlement_status is not null
    or exists(select 1 from public.payment_webhook_events where stripe_event_id='evt_carPending1')
    or exists(select 1 from public.purchase_entitlements where stripe_checkout_session_id='cs_test_carFixture1')
  then raise exception 'pending receipt must not grant/review/create a generic receipt'; end if;
  v_cases:=v_cases+1;

  select * into strict v_result from public.apply_car_purchase_exception_event_v1(
    'evt_carPending1','checkout.session.completed',false,v_at,'car_purchase_pro','cs_test_carFixture1',
    'pi_carFixture1',null,'cus_carFixture1','pending','checkout_payment_pending','cs_test_carFixture1','processing');
  if v_result.outcome <> 'duplicate'
    or (select count(*) from public.car_purchase_exception_receipts where event_id='evt_carPending1') <> 1
    or (select count(*) from public.payment_operator_alert_outbox where event_key=md5('evt_carPending1')) <> 1
  then raise exception 'pending duplicate must preserve exactly one receipt/intent'; end if;
  v_cases:=v_cases+1;

  -- Pending is not a restrictive tombstone and must permit verified settlement.
  perform public.apply_first_sale_paid_event('evt_carPaid1','checkout.session.async_payment_succeeded',false,v_at+interval '5 minutes',
    'car_purchase_pro','aud',v_price,'cs_test_carFixture1','pi_carFixture1','ch_carFixture1','cus_carFixture1','async_payment_succeeded');
  if not exists(select 1 from public.purchase_entitlements where stripe_checkout_session_id='cs_test_carFixture1' and status='active')
    or not exists(select 1 from public.first_sale_gates where product_code='car_purchase_pro' and state='LOCKED')
  then raise exception 'pending-only hold must permit paid settlement'; end if;
  v_cases:=v_cases+1;

  select * into strict v_result from public.apply_car_purchase_exception_event_v1(
    'evt_carLatePending1','checkout.session.completed',false,v_at-interval '1 day','car_purchase_pro','cs_test_carFixture1',
    'pi_carFixture1',null,'cus_carFixture1','pending','checkout_payment_pending','cs_test_carFixture1','succeeded');
  if v_result.entitlement_status <> 'active' or v_result.restriction_durable is distinct from false
  then raise exception 'old pending receipt must not downgrade settled access'; end if;
  v_cases:=v_cases+1;

  select * into strict v_result from public.apply_car_purchase_exception_event_v1(
    'evt_carWon1','charge.dispute.closed',false,v_at-interval '1 day','car_purchase_pro','cs_test_carFixture1',
    'pi_carFixture1','ch_carFixture1','cus_carFixture1','review','dispute_requires_review','dp_carFixture1','won');
  if v_result.entitlement_status <> 'review' or v_result.restriction_durable is distinct from true
    or v_result.alert_kind <> 'dispute_event'
  then raise exception 'won/older event must restrict for review, never grant'; end if;
  v_cases:=v_cases+1;

  begin
    perform public.apply_first_sale_paid_event('evt_carLatePaid1','checkout.session.async_payment_succeeded',false,v_at+interval '10 minutes',
      'car_purchase_pro','aud',v_price,'cs_test_carFixture1','pi_carFixture1','ch_carFixture1','cus_carFixture1','async_payment_succeeded');
    raise exception 'FIXTURE_EXPECTED_RESTRICTION_REJECTION';
  exception when others then
    if sqlerrm <> 'Car purchase grant is blocked by a durable restriction' then raise; end if;
  end;
  if exists(select 1 from public.payment_webhook_events where stripe_event_id='evt_carLatePaid1')
    or not exists(select 1 from public.purchase_entitlements where stripe_checkout_session_id='cs_test_carFixture1' and status='review')
  then raise exception 'blocked late grant must leave no paid receipt or active access'; end if;
  v_cases:=v_cases+1;

  if public.approve_next_first_sale('car_purchase_pro','synthetic fixture approval','PASS',0,'matched') is distinct from false
    or not exists(select 1 from public.first_sale_gates where product_code='car_purchase_pro' and state='LOCKED')
  then raise exception 'ordinary owner reopen must not clear an unresolved hold'; end if;
  v_cases:=v_cases+1;

  -- Isolate a later generation using fixture setup (not the owner API). An old
  -- order dispute must still restrict that order without overwriting this gate.
  update public.first_sale_gates set state='RESERVED',generation=2,stripe_checkout_session_id='cs_test_carFixture2',
    claim_token_hash=repeat('b',64),reservation_expires_at=now()+interval '31 minutes',sold_at=null,sold_event_ref_last8=null
    where product_code='car_purchase_pro';
  select * into strict v_result from public.apply_car_purchase_exception_event_v1(
    'evt_carLost1','charge.dispute.closed',false,v_at+interval '12 minutes','car_purchase_pro','cs_test_carFixture1',
    'pi_carFixture1','ch_carFixture1','cus_carFixture1','revoke','dispute_lost','dp_carFixture1','lost');
  if v_result.entitlement_status <> 'revoked'
    or not exists(select 1 from public.first_sale_gates where product_code='car_purchase_pro'
      and stripe_checkout_session_id='cs_test_carFixture2' and generation=2 and state='RESERVED')
  then raise exception 'late older-order restriction must preserve the newer gate'; end if;
  v_cases:=v_cases+1;

  -- A conflicting outbox row must roll back every attempted exception change.
  select last_exception_event_id into v_previous from public.car_purchase_payment_holds
    where checkout_session_id='cs_test_carFixture1' and livemode=false;
  insert into public.payment_operator_alert_outbox(event_key,alert_kind,event_type,event_ref_last8,livemode,product_code,checkout_ref_last8)
    values(md5('evt_carConflict1'),'dispute_event','charge.dispute.updated',right('evt_carConflict1',8),false,'car_purchase_pro','WRONG123');
  begin
    perform public.apply_car_purchase_exception_event_v1(
      'evt_carConflict1','charge.dispute.updated',false,v_at+interval '13 minutes','car_purchase_pro','cs_test_carFixture1',
      'pi_carFixture1','ch_carFixture1','cus_carFixture1','review','dispute_requires_review','dp_carFixture1','under_review');
    raise exception 'FIXTURE_EXPECTED_ALERT_REJECTION';
  exception when others then
    if sqlerrm <> 'Car operator alert ownership mismatch' then raise; end if;
  end;
  if exists(select 1 from public.car_purchase_exception_receipts where event_id='evt_carConflict1')
    or exists(select 1 from public.payment_webhook_events where stripe_event_id='evt_carConflict1')
    or (select last_exception_event_id from public.car_purchase_payment_holds
      where checkout_session_id='cs_test_carFixture1' and livemode=false) is distinct from v_previous
  then raise exception 'outbox error must roll back receipt and hold changes'; end if;
  v_cases:=v_cases+1;

  -- Delete only this synthetic fixture intent, within the surrounding rollback.
  delete from public.payment_operator_alert_outbox where event_key=md5('evt_carPending1') and alert_kind='fulfillment_attention';
  select * into strict v_result from public.apply_car_purchase_exception_event_v1(
    'evt_carPending1','checkout.session.completed',false,v_at,'car_purchase_pro','cs_test_carFixture1',
    'pi_carFixture1',null,'cus_carFixture1','pending','checkout_payment_pending','cs_test_carFixture1','succeeded');
  if v_result.outcome <> 'duplicate' or v_result.alert_durable is distinct from true or v_result.entitlement_status <> 'revoked'
  then raise exception 'duplicate must backfill alert and preserve stronger restriction'; end if;
  v_cases:=v_cases+1;

  select * into strict v_result from public.apply_car_purchase_exception_event_v1(
    'evt_carFailure2','checkout.session.async_payment_failed',false,v_at,'car_purchase_pro','cs_test_carFixture2',
    'pi_carFixture2',null,'cus_carFixture2','revoke','async_payment_failed','cs_test_carFixture2','requires_payment_method');
  if v_result.outcome <> 'tombstoned' or v_result.entitlement_status is not null or v_result.restriction_durable is distinct from true
  then raise exception 'before-grant failure must retain a restriction without granting'; end if;
  v_cases:=v_cases+1;

  raise notice 'Car hold sequential SQL acceptance cases: %',v_cases;
end $$;
rollback;
