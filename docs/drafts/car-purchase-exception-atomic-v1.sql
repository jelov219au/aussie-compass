-- REVIEW DRAFT ONLY. Never run against a database as an application migration.
-- Current schema/function hashes, reviewed offer, and integration patches are missing.
-- The unconditional stop and final ROLLBACK are intentional. No role/price/gate
-- provisioning or runtime EXECUTE grant is supplied. See the companion contract.
begin;
do $$ begin
  raise exception 'DRAFT_NOT_APPLICABLE: car exception prerequisites and integration are unverified';
end $$;

-- Future reviewed migration must guard existing bodies/ACLs and provide the
-- outbox product/kind/type constraint changes in the same approved release.
set local statement_timeout = '10s';
set local lock_timeout = '2s';
set local role hoju_migration_owner;

create table public.car_purchase_exception_receipts (
  event_id text constraint car_purchase_exception_receipts_pkey primary key,
  event_type text not null,
  livemode boolean not null,
  stripe_created_at timestamptz not null,
  product_code text not null check (product_code = 'car_purchase_pro'),
  checkout_session_id text not null,
  payment_intent_id text not null,
  charge_id text,
  customer_id text not null,
  reference_id text not null,
  first_action text not null check (first_action in ('pending','review','revoke')),
  first_reason text not null,
  first_current_status text not null,
  received_at timestamptz not null default now(),
  check (event_id ~ '^evt_[A-Za-z0-9]{1,240}$'),
  check (checkout_session_id ~ ('^cs_' || case when livemode then 'live' else 'test' end || '_[A-Za-z0-9]{1,240}$')),
  check (payment_intent_id ~ '^pi_[A-Za-z0-9]{1,240}$'),
  check (charge_id is null or charge_id ~ '^ch_[A-Za-z0-9]{1,240}$'),
  check (customer_id ~ '^cus_[A-Za-z0-9]{1,240}$')
);

create table public.car_purchase_payment_holds (
  livemode boolean not null,
  checkout_session_id text not null,
  product_code text not null check (product_code = 'car_purchase_pro'),
  payment_intent_id text not null,
  charge_id text,
  customer_id text not null,
  pending_observed boolean not null default false,
  restriction text not null check (restriction in ('none','review','revoked')),
  sale_blocked boolean not null default true,
  last_exception_event_id text not null references public.car_purchase_exception_receipts(event_id),
  updated_at timestamptz not null default now(),
  constraint car_purchase_payment_holds_pkey primary key (livemode, checkout_session_id),
  unique (livemode, payment_intent_id),
  check (checkout_session_id ~ ('^cs_' || case when livemode then 'live' else 'test' end || '_[A-Za-z0-9]{1,240}$')),
  check (payment_intent_id ~ '^pi_[A-Za-z0-9]{1,240}$'),
  check (charge_id is null or charge_id ~ '^ch_[A-Za-z0-9]{1,240}$'),
  check (customer_id ~ '^cus_[A-Za-z0-9]{1,240}$')
);
create unique index car_purchase_payment_holds_charge_key
  on public.car_purchase_payment_holds(livemode, charge_id) where charge_id is not null;

create function public.prevent_car_purchase_exception_receipt_mutation_v1()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  raise exception 'Car exception receipts are append-only';
end $$;
create trigger car_purchase_exception_receipts_append_only
before update or delete on public.car_purchase_exception_receipts
for each row execute function public.prevent_car_purchase_exception_receipt_mutation_v1();

-- A reviewed migration may replace this only after claim, expiry release,
-- owner reopen, paid grant and guarded reversal all consult the same hold under
-- the documented locks. Keeping false makes a partial copy of this draft inert.
create function public.car_purchase_sale_hold_guards_ready_v1()
returns boolean language sql immutable parallel safe security definer
set search_path = public, pg_temp as $$ select false $$;

create function public.apply_car_purchase_exception_event_v1(
  p_event_id text, p_event_type text, p_livemode boolean, p_stripe_created_at timestamptz,
  p_product_code text, p_checkout_session_id text, p_payment_intent_id text, p_charge_id text,
  p_customer_id text, p_action text, p_reason text, p_reference_id text, p_current_status text
)
returns table (
  outcome text, event_id text, event_type text, livemode boolean, product_code text,
  checkout_session_id text, payment_intent_id text, charge_id text, customer_id text,
  reference_id text, alert_kind text, alert_durable boolean, sale_hold_durable boolean,
  gate_state text, restriction_durable boolean, entitlement_status text
)
language plpgsql volatile parallel unsafe called on null input
security definer set search_path = public, pg_temp
as $$
declare
  v_gate public.first_sale_gates%rowtype;
  v_receipt public.car_purchase_exception_receipts%rowtype;
  v_common public.payment_webhook_events%rowtype;
  v_hold public.car_purchase_payment_holds%rowtype;
  v_entitlement public.purchase_entitlements%rowtype;
  v_alert public.payment_operator_alert_outbox%rowtype;
  v_new boolean := false;
  v_has_entitlement boolean := false;
  v_matches integer;
  v_valid boolean := false;
  v_kind text;
  v_restriction text;
  v_charge_lock text;
begin
  if public.car_purchase_sale_hold_guards_ready_v1() is distinct from true then
    raise exception 'Car purchase sale-hold integration is not ready';
  end if;
  if p_event_id is null or p_event_id !~ '^evt_[A-Za-z0-9]{1,240}$'
    or p_event_type is null or p_livemode is null
    or p_stripe_created_at is null or not isfinite(p_stripe_created_at)
    or p_stripe_created_at <= '1970-01-01'::timestamptz
    or p_stripe_created_at > statement_timestamp() + interval '5 minutes'
    or p_product_code is distinct from 'car_purchase_pro'
    or p_checkout_session_id is null
    or p_checkout_session_id !~ ('^cs_' || case when p_livemode then 'live' else 'test' end || '_[A-Za-z0-9]{1,240}$')
    or p_payment_intent_id is null or p_payment_intent_id !~ '^pi_[A-Za-z0-9]{1,240}$'
    or p_customer_id is null or p_customer_id !~ '^cus_[A-Za-z0-9]{1,240}$'
    or p_action is null or p_reason is null or p_reference_id is null or p_current_status is null
  then raise exception 'Invalid car exception identity'; end if;

  if p_event_type in ('checkout.session.completed','checkout.session.async_payment_failed') then
    v_kind := 'fulfillment_attention';
    v_valid := p_charge_id is null and p_reference_id = p_checkout_session_id
      and p_current_status in ('processing','requires_payment_method','requires_confirmation',
        'requires_action','requires_capture','canceled','succeeded')
      and (
        (p_event_type = 'checkout.session.completed' and p_action = 'pending' and p_reason = 'checkout_payment_pending')
        or (p_event_type = 'checkout.session.async_payment_failed' and (
          (p_action = 'revoke' and p_reason = 'async_payment_failed' and p_current_status in ('requires_payment_method','canceled'))
          or (p_action = 'review' and p_reason = 'async_failure_requires_review')
        ))
      );
  elsif p_event_type in ('charge.dispute.created','charge.dispute.updated','charge.dispute.closed',
    'charge.dispute.funds_reinstated','charge.dispute.funds_withdrawn') then
    v_kind := 'dispute_event';
    v_valid := p_charge_id is not null and p_charge_id ~ '^ch_[A-Za-z0-9]{1,240}$'
      and p_reference_id ~ '^dp_[A-Za-z0-9]{1,240}$'
      and p_current_status in ('needs_response','under_review','lost','won','warning_needs_response',
        'warning_under_review','warning_closed','prevented')
      and (
        (p_action = 'revoke' and p_reason = 'charge_fully_refunded')
        or (p_current_status = 'lost' and p_action = 'revoke' and p_reason = 'dispute_lost')
        or (p_current_status <> 'lost' and p_event_type in ('charge.dispute.created','charge.dispute.funds_withdrawn')
          and p_action = 'revoke' and p_reason = 'dispute_opened')
        or (p_current_status <> 'lost' and p_event_type not in ('charge.dispute.created','charge.dispute.funds_withdrawn')
          and p_action = 'review' and p_reason = 'dispute_requires_review')
      );
  end if;
  if v_valid is distinct from true then raise exception 'Invalid car exception action'; end if;

  -- Same gate-first order as apply_first_sale_paid_event. Do not change lock
  -- namespaces independently from existing paid/reversal functions.
  perform pg_advisory_xact_lock(hashtext('first-sale:' || p_product_code));
  select g.* into v_gate from public.first_sale_gates g
    where g.product_code = p_product_code for update;
  if not found or v_gate.environment is distinct from (case when p_livemode then 'live' else 'test' end)
    or v_gate.state not in ('OPEN','RESERVED','LOCKED') or v_gate.currency is distinct from 'aud'
    or v_gate.expected_amount_cents is null or v_gate.expected_amount_cents <= 0
  then raise exception 'Car exception gate identity is unavailable'; end if;

  -- The gate serializes all new car writers. Discover an already linked charge
  -- before object locks so a PI-only exception can still use the same sorted pair.
  select e.stripe_charge_id into v_charge_lock from public.purchase_entitlements e
    where e.product_code = p_product_code and e.stripe_checkout_session_id = p_checkout_session_id;
  v_charge_lock := coalesce(p_charge_id, v_charge_lock);
  if v_charge_lock is not null then
    perform pg_advisory_xact_lock(hashtext(least('payment-intent:' || p_payment_intent_id, 'charge:' || v_charge_lock)));
    perform pg_advisory_xact_lock(hashtext(greatest('payment-intent:' || p_payment_intent_id, 'charge:' || v_charge_lock)));
  else
    perform pg_advisory_xact_lock(hashtext('payment-intent:' || p_payment_intent_id));
  end if;

  select count(*) into v_matches from public.purchase_entitlements e
    where e.stripe_checkout_session_id = p_checkout_session_id or e.stripe_payment_intent_id = p_payment_intent_id
      or (p_charge_id is not null and e.stripe_charge_id = p_charge_id);
  if v_matches > 1 then raise exception 'Conflicting car entitlement links'; end if;
  select e.* into v_entitlement from public.purchase_entitlements e
    where e.stripe_checkout_session_id = p_checkout_session_id or e.stripe_payment_intent_id = p_payment_intent_id
      or (p_charge_id is not null and e.stripe_charge_id = p_charge_id) for update;
  v_has_entitlement := found;
  if v_gate.stripe_checkout_session_id is distinct from p_checkout_session_id and not v_has_entitlement then
    raise exception 'A different car gate checkout requires an exact existing entitlement';
  end if;
  if v_has_entitlement and (v_entitlement.product_code is distinct from p_product_code
    or v_entitlement.stripe_checkout_session_id is distinct from p_checkout_session_id
    or v_entitlement.stripe_payment_intent_id is distinct from p_payment_intent_id
    or v_entitlement.stripe_customer_id is distinct from p_customer_id
    or (p_charge_id is not null and v_entitlement.stripe_charge_id is distinct from p_charge_id))
  then raise exception 'Car entitlement identity mismatch'; end if;

  insert into public.car_purchase_exception_receipts (
    event_id,event_type,livemode,stripe_created_at,product_code,checkout_session_id,payment_intent_id,
    charge_id,customer_id,reference_id,first_action,first_reason,first_current_status
  ) values (
    p_event_id,p_event_type,p_livemode,p_stripe_created_at,p_product_code,p_checkout_session_id,p_payment_intent_id,
    p_charge_id,p_customer_id,p_reference_id,p_action,p_reason,p_current_status
  ) on conflict on constraint car_purchase_exception_receipts_pkey do nothing returning true into v_new;
  v_new := coalesce(v_new,false);
  select r.* into strict v_receipt from public.car_purchase_exception_receipts r where r.event_id = p_event_id;
  if v_receipt.event_type is distinct from p_event_type or v_receipt.livemode is distinct from p_livemode
    or v_receipt.stripe_created_at is distinct from p_stripe_created_at or v_receipt.product_code is distinct from p_product_code
    or v_receipt.checkout_session_id is distinct from p_checkout_session_id or v_receipt.payment_intent_id is distinct from p_payment_intent_id
    or v_receipt.charge_id is distinct from p_charge_id or v_receipt.customer_id is distinct from p_customer_id
    or v_receipt.reference_id is distinct from p_reference_id
  then raise exception 'Car exception receipt ownership mismatch'; end if;

  -- Restrictive receipts also satisfy the existing entitlement last-event FK.
  -- Pending never masquerades as a generic grant/review receipt.
  select e.* into v_common from public.payment_webhook_events e where e.stripe_event_id = p_event_id for update;
  if found then
    if v_new or p_action = 'pending' or v_common.event_type is distinct from p_event_type
      or v_common.livemode is distinct from p_livemode or v_common.stripe_created_at is distinct from p_stripe_created_at
      or v_common.command_action not in ('revoke','review') or v_common.processing_status <> 'processed'
    then raise exception 'Car exception conflicts with generic receipt'; end if;
  elsif p_action <> 'pending' then
    if not v_new then raise exception 'Car exception generic receipt is missing'; end if;
    insert into public.payment_webhook_events(stripe_event_id,event_type,livemode,stripe_created_at,command_action,processing_status)
      values(p_event_id,p_event_type,p_livemode,p_stripe_created_at,p_action,'processing');
  end if;

  v_restriction := case p_action when 'revoke' then 'revoked' when 'review' then 'review' else 'none' end;
  -- Existing general refund tombstones remain authoritative regardless of age.
  if v_entitlement.status = 'revoked' or exists (
    select 1 from public.entitlement_event_tombstones t where t.livemode = p_livemode
      and (t.stripe_payment_intent_id = p_payment_intent_id or (v_charge_lock is not null and t.stripe_charge_id = v_charge_lock))
      and t.command_action = 'revoke'
  ) then v_restriction := 'revoked';
  elsif v_restriction <> 'revoked' and (v_entitlement.status = 'review' or exists (
    select 1 from public.entitlement_event_tombstones t where t.livemode = p_livemode
      and (t.stripe_payment_intent_id = p_payment_intent_id or (v_charge_lock is not null and t.stripe_charge_id = v_charge_lock))
      and t.command_action = 'review'
  )) then v_restriction := 'review'; end if;

  insert into public.car_purchase_payment_holds(
    livemode,checkout_session_id,product_code,payment_intent_id,charge_id,customer_id,
    pending_observed,restriction,sale_blocked,last_exception_event_id
  ) values(p_livemode,p_checkout_session_id,p_product_code,p_payment_intent_id,v_charge_lock,p_customer_id,
    p_action='pending',v_restriction,true,p_event_id)
  on conflict on constraint car_purchase_payment_holds_pkey do nothing;
  select h.* into strict v_hold from public.car_purchase_payment_holds h
    where h.livemode = p_livemode and h.checkout_session_id = p_checkout_session_id for update;
  if v_hold.product_code is distinct from p_product_code or v_hold.payment_intent_id is distinct from p_payment_intent_id
    or v_hold.customer_id is distinct from p_customer_id
    or (v_hold.charge_id is not null and v_charge_lock is not null and v_hold.charge_id <> v_charge_lock)
  then raise exception 'Car hold identity mismatch'; end if;
  v_restriction := case when 'revoked' in (v_hold.restriction,v_restriction) then 'revoked'
    when 'review' in (v_hold.restriction,v_restriction) then 'review' else 'none' end;
  update public.car_purchase_payment_holds h set
    charge_id = coalesce(h.charge_id,v_charge_lock), pending_observed = h.pending_observed or p_action='pending',
    restriction = v_restriction, sale_blocked = true, last_exception_event_id = p_event_id, updated_at = now()
    where h.livemode = p_livemode and h.checkout_session_id = p_checkout_session_id returning h.* into v_hold;

  if v_has_entitlement and p_action <> 'pending' and v_entitlement.status <> v_restriction then
    update public.purchase_entitlements e set status = v_restriction,
      last_stripe_event_id = p_event_id, last_stripe_event_created_at = p_stripe_created_at,
      revoked_at = case when v_restriction = 'revoked' then coalesce(e.revoked_at,now()) else e.revoked_at end,
      updated_at = now() where e.id = v_entitlement.id returning e.* into v_entitlement;
  end if;
  if v_has_entitlement and v_restriction <> 'none' and v_entitlement.status = 'active' then
    -- A pending observation may not silently revoke or acknowledge inconsistent access.
    raise exception 'Car pending observation found inconsistent restricted access';
  end if;

  -- A generic receipt trigger may already have created a sparse matching intent.
  insert into public.payment_operator_alert_outbox(
    event_key,alert_kind,event_type,event_ref_last8,livemode,product_code,
    checkout_ref_last8,payment_intent_ref_last8,charge_ref_last8
  ) values(md5(p_event_id),v_kind,p_event_type,right(p_event_id,8),p_livemode,p_product_code,
    right(p_checkout_session_id,8),right(p_payment_intent_id,8),right(p_charge_id,8))
  on conflict on constraint payment_operator_alert_outbox_pkey do nothing;
  select a.* into strict v_alert from public.payment_operator_alert_outbox a
    where a.event_key = md5(p_event_id) and a.alert_kind = v_kind for update;
  if v_alert.event_type is distinct from p_event_type or v_alert.event_ref_last8 is distinct from right(p_event_id,8)
    or v_alert.livemode is distinct from p_livemode or v_alert.status not in ('pending','sent')
    or (v_alert.product_code is not null and v_alert.product_code <> p_product_code)
    or (v_alert.checkout_ref_last8 is not null and v_alert.checkout_ref_last8 <> right(p_checkout_session_id,8))
    or (v_alert.payment_intent_ref_last8 is not null and v_alert.payment_intent_ref_last8 <> right(p_payment_intent_id,8))
    or (v_alert.charge_ref_last8 is not null and v_alert.charge_ref_last8 is distinct from right(p_charge_id,8))
  then raise exception 'Car operator alert ownership mismatch'; end if;
  update public.payment_operator_alert_outbox a set product_code = p_product_code,
    checkout_ref_last8 = right(p_checkout_session_id,8), payment_intent_ref_last8 = right(p_payment_intent_id,8),
    charge_ref_last8 = right(p_charge_id,8)
    where a.event_key = md5(p_event_id) and a.alert_kind = v_kind;
  if p_action <> 'pending' then
    update public.payment_webhook_events e set processing_status='processed',processed_at=coalesce(e.processed_at,now()),failure_code=null
      where e.stripe_event_id=p_event_id;
  end if;

  return query select case when not v_new then 'duplicate' when p_action <> 'pending' and not v_has_entitlement
    then 'tombstoned' else 'processed' end,
    p_event_id,p_event_type,p_livemode,p_product_code,p_checkout_session_id,p_payment_intent_id,p_charge_id,p_customer_id,
    p_reference_id,v_kind,true,v_hold.sale_blocked,v_gate.state,v_restriction <> 'none',
    case when v_has_entitlement then v_entitlement.status else null::text end;
end $$;

-- Runtime receives no table privileges. A final reviewed migration must apply
-- explicit grants only after companion paid/reversal/release guards and hash checks.
revoke all on table public.car_purchase_exception_receipts from public, hoju_app_runtime;
revoke all on table public.car_purchase_payment_holds from public, hoju_app_runtime;
revoke all on function public.prevent_car_purchase_exception_receipt_mutation_v1() from public, hoju_app_runtime;
revoke all on function public.car_purchase_sale_hold_guards_ready_v1() from public, hoju_app_runtime;
revoke all on function public.apply_car_purchase_exception_event_v1(text,text,boolean,timestamptz,text,text,text,text,text,text,text,text,text)
  from public, hoju_app_runtime;

-- NOT A RELEASE: no schema_migrations marker, no runtime grant, no commit.
rollback;
