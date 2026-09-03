-- REVIEW DRAFT ONLY. NOT PARSED, NOT EXECUTED, NOT AN APPLICABLE MIGRATION.
-- Exact remote hashes/ACLs, car receipt migration and outbox constraints are missing.
-- Opening stop + false readiness + no runtime grants + final rollback are deliberate.
begin;
do $$ begin
  raise exception 'DRAFT_NOT_APPLICABLE: car alert schema and lease integration unverified';
end $$;
set local statement_timeout = '10s';
set local lock_timeout = '2s';
set local role hoju_migration_owner;

-- Readiness is a migration prerequisite, not the sales-enabled flag. Once reviewed
-- and connected, pausing new sales must not prevent existing alerts being delivered.
create function public.car_purchase_alert_outbox_ready_v1()
returns boolean language sql immutable parallel safe security definer
set search_path = public, pg_temp as $$ select false $$;

-- Lock only the alert row. The car receipt is append-only. Do not take product-gate
-- or payment locks here: writers already acquire those before the outbox row.
-- Empty result means neither a car receipt nor the requested keyed intent exists.
create function public.lock_car_purchase_operator_alert_v1(
  p_event_id text, p_alert_kind text, p_product_code text, p_livemode boolean, p_token_hash text
)
returns setof public.payment_operator_alert_outbox
language plpgsql volatile parallel unsafe called on null input
security definer set search_path = public, pg_temp as $$
declare
  v_receipt public.car_purchase_exception_receipts%rowtype;
  v_alert public.payment_operator_alert_outbox%rowtype;
  v_kind text;
begin
  if public.car_purchase_alert_outbox_ready_v1() is distinct from true then
    raise exception 'Car alert outbox integration is not ready';
  end if;
  if p_event_id is null or p_event_id !~ '^evt_[A-Za-z0-9]{1,240}$'
    or p_alert_kind is null or p_alert_kind not in ('fulfillment_attention','refund_event','dispute_event')
    or p_product_code is distinct from 'car_purchase_pro' or p_livemode is null
    or p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$'
  then raise exception 'Invalid car alert request'; end if;

  select r.* into v_receipt from public.car_purchase_exception_receipts r
    where r.event_id = p_event_id;
  if not found then
    if exists (select 1 from public.payment_operator_alert_outbox a
      where a.event_key = md5(p_event_id) and a.alert_kind = p_alert_kind) then
      raise exception 'Car alert has no exact receipt';
    end if;
    return;
  end if;
  if v_receipt.product_code is distinct from p_product_code
    or v_receipt.livemode is distinct from p_livemode then
    raise exception 'Car alert receipt ownership mismatch';
  end if;
  v_kind := case
    when v_receipt.event_type in ('checkout.session.completed','checkout.session.async_payment_failed') then 'fulfillment_attention'
    when v_receipt.event_type in ('charge.refunded','refund.created','refund.updated','refund.failed') then 'refund_event'
    when v_receipt.event_type in ('charge.dispute.created','charge.dispute.updated','charge.dispute.closed',
      'charge.dispute.funds_reinstated','charge.dispute.funds_withdrawn') then 'dispute_event'
    else null end;
  if v_kind is distinct from p_alert_kind
    or (v_kind = 'fulfillment_attention' and v_receipt.charge_id is not null)
    or (v_kind in ('refund_event','dispute_event') and v_receipt.charge_id is null)
  then raise exception 'Car alert receipt type mismatch'; end if;

  select a.* into v_alert from public.payment_operator_alert_outbox a
    where a.event_key = md5(v_receipt.event_id) and a.alert_kind = v_kind
    for update;
  if not found then raise exception 'Car receipt durable alert is missing'; end if;
  if v_alert.product_code is distinct from p_product_code or v_alert.livemode is distinct from p_livemode
    or v_alert.event_type is distinct from v_receipt.event_type
    or v_alert.event_ref_last8 is distinct from right(v_receipt.event_id,8)
    or v_alert.checkout_ref_last8 is distinct from right(v_receipt.checkout_session_id,8)
    or v_alert.payment_intent_ref_last8 is distinct from right(v_receipt.payment_intent_id,8)
    or v_alert.charge_ref_last8 is distinct from right(v_receipt.charge_id,8)
  then raise exception 'Car alert intent ownership mismatch'; end if;
  if v_alert.status is null or v_alert.status not in ('pending','sent')
    or v_alert.attempts is null or v_alert.attempts < 0 or v_alert.attempts > 1000
    or ((v_alert.lease_token_hash is null) <> (v_alert.lease_expires_at is null))
    or (v_alert.lease_token_hash is not null and v_alert.lease_token_hash !~ '^[a-f0-9]{64}$')
    or (v_alert.lease_expires_at is not null and not isfinite(v_alert.lease_expires_at))
    or (v_alert.status = 'sent' and (v_alert.sent_at is null or v_alert.attempts < 1 or v_alert.lease_token_hash is not null))
    or (v_alert.status = 'pending' and v_alert.sent_at is not null)
    or (v_alert.lease_token_hash is not null and v_alert.attempts < 1)
  then raise exception 'Invalid car alert delivery state'; end if;
  return next v_alert;
end $$;

create function public.claim_car_purchase_operator_alert_v1(
  p_event_id text, p_alert_kind text, p_product_code text, p_livemode boolean, p_token_hash text
)
returns table (
  claim_outcome text,event_id text,livemode boolean,alert_kind text,event_type text,event_ref_last8 text,
  product_code text,checkout_ref_last8 text,payment_intent_ref_last8 text,charge_ref_last8 text,attempts integer
)
language plpgsql volatile parallel unsafe called on null input
security definer set search_path = public, pg_temp as $$
declare
  v_alert public.payment_operator_alert_outbox%rowtype;
  v_now timestamptz;
  v_outcome text;
begin
  select a.* into v_alert from public.lock_car_purchase_operator_alert_v1(
    p_event_id,p_alert_kind,p_product_code,p_livemode,p_token_hash) a;
  if not found then
    return query select 'missing'::text,p_event_id,p_livemode,p_alert_kind,null::text,right(p_event_id,8),
      p_product_code,null::text,null::text,null::text,0;
    return;
  end if;
  v_now := clock_timestamp(); -- after any row-lock wait
  if v_alert.status = 'sent' then
    v_outcome := 'sent';
  elsif v_alert.lease_expires_at > v_now then
    v_outcome := 'busy';
  else
    if v_alert.attempts >= 1000 then raise exception 'Car alert retry limit requires operator review'; end if;
    update public.payment_operator_alert_outbox a
      set attempts = a.attempts + 1,last_attempt_at = v_now,
        lease_token_hash = p_token_hash,lease_expires_at = v_now + interval '2 minutes'
      where a.event_key = md5(p_event_id) and a.alert_kind = p_alert_kind
        and a.product_code = p_product_code and a.livemode = p_livemode and a.status = 'pending'
      returning a.* into strict v_alert;
    v_outcome := 'claimed';
  end if;
  return query select v_outcome,p_event_id,v_alert.livemode,v_alert.alert_kind,v_alert.event_type,
    v_alert.event_ref_last8,v_alert.product_code,v_alert.checkout_ref_last8,v_alert.payment_intent_ref_last8,
    v_alert.charge_ref_last8,v_alert.attempts;
end $$;

-- Private shared mutation; runtime receives EXECUTE only on reviewed wrappers.
create function public.finish_car_purchase_operator_alert_v1(
  p_event_id text,p_alert_kind text,p_product_code text,p_livemode boolean,p_token_hash text,p_mark boolean
)
returns boolean language plpgsql volatile parallel unsafe called on null input
security definer set search_path = public, pg_temp as $$
declare
  v_alert public.payment_operator_alert_outbox%rowtype;
  v_now timestamptz;
begin
  if p_mark is null then raise exception 'Invalid car alert finish operation'; end if;
  select a.* into v_alert from public.lock_car_purchase_operator_alert_v1(
    p_event_id,p_alert_kind,p_product_code,p_livemode,p_token_hash) a;
  if not found then return false; end if;
  v_now := clock_timestamp();
  if v_alert.status <> 'pending' or v_alert.lease_token_hash is distinct from p_token_hash then return false; end if;
  -- An expired owner cannot mark success, even before another owner reclaims.
  -- It may release its own expired lease. Neither action can affect a newer token.
  if p_mark and (v_alert.lease_expires_at is null or v_alert.lease_expires_at <= v_now) then return false; end if;
  update public.payment_operator_alert_outbox a
    set status = case when p_mark then 'sent' else 'pending' end,
      sent_at = case when p_mark then v_now else null end,
      lease_token_hash = null,lease_expires_at = null
    where a.event_key = md5(p_event_id) and a.alert_kind = p_alert_kind
      and a.product_code = p_product_code and a.livemode = p_livemode
      and a.status = 'pending' and a.lease_token_hash = p_token_hash;
  return found;
end $$;

create function public.mark_car_purchase_operator_alert_sent_v1(
  p_event_id text,p_alert_kind text,p_product_code text,p_livemode boolean,p_token_hash text
)
returns boolean language sql volatile parallel unsafe called on null input
security definer set search_path = public, pg_temp as $$
  select public.finish_car_purchase_operator_alert_v1($1,$2,$3,$4,$5,true)
$$;
create function public.release_car_purchase_operator_alert_claim_v1(
  p_event_id text,p_alert_kind text,p_product_code text,p_livemode boolean,p_token_hash text
)
returns boolean language sql volatile parallel unsafe called on null input
security definer set search_path = public, pg_temp as $$
  select public.finish_car_purchase_operator_alert_v1($1,$2,$3,$4,$5,false)
$$;

revoke all on function public.car_purchase_alert_outbox_ready_v1() from public;
revoke all on function public.lock_car_purchase_operator_alert_v1(text,text,text,boolean,text) from public;
revoke all on function public.claim_car_purchase_operator_alert_v1(text,text,text,boolean,text) from public;
revoke all on function public.finish_car_purchase_operator_alert_v1(text,text,text,boolean,text,boolean) from public;
revoke all on function public.mark_car_purchase_operator_alert_sent_v1(text,text,text,boolean,text) from public;
revoke all on function public.release_car_purchase_operator_alert_claim_v1(text,text,text,boolean,text) from public;
-- No runtime grant, migration marker or COMMIT. No product/price provisioning.
rollback;
