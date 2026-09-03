-- REVIEW DRAFT: companion functions, NOT an applicable migration.
-- Regenerate with verified remote hashes, ACLs and insertion points. No grant/commit.
begin;
do $$ begin raise exception 'DRAFT_NOT_APPLICABLE: car hold integration is unverified'; end $$;
set local role hoju_migration_owner;

-- Call only while holding the existing first-sale:<product> transaction lock.
-- This affects admission/release/reopen, not settlement of an already paid order.
create function public.car_purchase_sale_hold_blocks_v1(p_product_code text, p_livemode boolean)
returns boolean language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if p_product_code is null or p_livemode is null then return true; end if;
  if p_product_code <> 'car_purchase_pro' then return false; end if;
  if public.car_purchase_sale_hold_guards_ready_v1() is distinct from true then return true; end if;
  return exists(select 1 from public.car_purchase_payment_holds h
    where h.product_code=p_product_code and h.livemode=p_livemode and h.sale_blocked);
end $$;

-- Call in BOTH the paid wrapper and the generic grant function, before any
-- gate mutation or payment-object lock. A pending-only hold permits settlement;
-- a restriction, however old, never permits automatic grant/restoration.
create function public.assert_car_purchase_grant_allowed_v1(
  p_product_code text,p_livemode boolean,p_checkout_session_id text,
  p_payment_intent_id text,p_charge_id text,p_customer_id text
)
returns void language plpgsql volatile parallel unsafe security definer
set search_path = public, pg_temp as $$
begin
  if p_product_code is distinct from 'car_purchase_pro' or p_livemode is null
    or p_checkout_session_id is null
    or p_checkout_session_id !~ ('^cs_' || case when p_livemode then 'live' else 'test' end || '_[A-Za-z0-9]{1,240}$')
    or p_payment_intent_id is null or p_payment_intent_id !~ '^pi_[A-Za-z0-9]{1,240}$'
    or p_charge_id is null or p_charge_id !~ '^ch_[A-Za-z0-9]{1,240}$'
    or p_customer_id is null or p_customer_id !~ '^cus_[A-Za-z0-9]{1,240}$'
  then raise exception 'Invalid car grant guard identity'; end if;
  if public.car_purchase_sale_hold_guards_ready_v1() is distinct from true then
    raise exception 'Car purchase sale-hold integration is not ready';
  end if;
  perform pg_advisory_xact_lock(hashtext('first-sale:' || p_product_code));
  perform pg_advisory_xact_lock(hashtext(least('payment-intent:' || p_payment_intent_id,'charge:' || p_charge_id)));
  perform pg_advisory_xact_lock(hashtext(greatest('payment-intent:' || p_payment_intent_id,'charge:' || p_charge_id)));

  if exists(select 1 from public.car_purchase_payment_holds h
    where (h.checkout_session_id=p_checkout_session_id or h.payment_intent_id=p_payment_intent_id or h.charge_id=p_charge_id)
      and (h.product_code is distinct from p_product_code or h.livemode is distinct from p_livemode
        or h.checkout_session_id is distinct from p_checkout_session_id or h.payment_intent_id is distinct from p_payment_intent_id
        or h.customer_id is distinct from p_customer_id or (h.charge_id is not null and h.charge_id <> p_charge_id)))
    or exists(select 1 from public.purchase_entitlements e
      where (e.stripe_checkout_session_id=p_checkout_session_id or e.stripe_payment_intent_id=p_payment_intent_id or e.stripe_charge_id=p_charge_id)
        and (e.product_code is distinct from p_product_code or e.stripe_checkout_session_id is distinct from p_checkout_session_id
          or e.stripe_payment_intent_id is distinct from p_payment_intent_id or e.stripe_charge_id is distinct from p_charge_id
          or e.stripe_customer_id is distinct from p_customer_id))
  then raise exception 'Car grant guard relationship mismatch'; end if;

  if exists(select 1 from public.car_purchase_payment_holds h
    where h.product_code=p_product_code and h.livemode=p_livemode
      and (h.checkout_session_id=p_checkout_session_id or h.payment_intent_id=p_payment_intent_id or h.charge_id=p_charge_id)
      and h.restriction in ('review','revoked'))
    or exists(select 1 from public.purchase_entitlements e
      where e.product_code=p_product_code and e.stripe_checkout_session_id=p_checkout_session_id and e.status in ('review','revoked'))
    or exists(select 1 from public.entitlement_event_tombstones t
      where t.livemode=p_livemode and t.command_action in ('revoke','review')
        and (t.stripe_payment_intent_id=p_payment_intent_id or t.stripe_charge_id=p_charge_id
          or exists(select 1 from public.stripe_payment_object_links l
            where (l.stripe_payment_intent_id=p_payment_intent_id and l.stripe_charge_id=t.stripe_charge_id)
              or (l.stripe_charge_id=p_charge_id and l.stripe_payment_intent_id=t.stripe_payment_intent_id))))
  then raise exception 'Car purchase grant is blocked by a durable restriction'; end if;
end $$;

revoke all on function public.car_purchase_sale_hold_blocks_v1(text,boolean) from public,hoju_app_runtime;
revoke all on function public.assert_car_purchase_grant_allowed_v1(text,boolean,text,text,text,text) from public,hoju_app_runtime;
-- Internal functions run under the existing migration/function owner. The app
-- needs no separate EXECUTE grant to call these helpers directly.
rollback;
