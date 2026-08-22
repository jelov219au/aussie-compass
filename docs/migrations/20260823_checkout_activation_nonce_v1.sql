-- Additive migration: durable operator outbox -> response-loss-safe activation.
-- Apply with PAYMENTS_ENABLED=false. Forward-fix only; never delete activation evidence.
begin;

do $$
begin
  if not exists (
    select 1 from public.schema_migrations
    where version = '20260823_payment_operator_alert_outbox_v1'
  ) then
    raise exception 'payment operator alert outbox v1 must be applied first';
  end if;
end;
$$;

create table if not exists public.purchase_checkout_activations (
  entitlement_id bigint primary key references public.purchase_entitlements(id) on delete restrict,
  checkout_session_key text not null unique check (checkout_session_key ~ '^[a-f0-9]{32}$'),
  checkout_ref_last8 text not null check (checkout_ref_last8 ~ '^[A-Za-z0-9_]{1,8}$'),
  activation_nonce_hash text check (activation_nonce_hash ~ '^[a-f0-9]{64}$'),
  consumed_at timestamptz not null default now(),
  released_at timestamptz
);

alter table public.purchase_checkout_activations add column if not exists activation_nonce_hash text;
alter table public.purchase_checkout_activations add column if not exists released_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conrelid = 'public.purchase_checkout_activations'::regclass
      and conname = 'purchase_checkout_activations_nonce_hash_check'
  ) then
    alter table public.purchase_checkout_activations
      add constraint purchase_checkout_activations_nonce_hash_check
      check (activation_nonce_hash is null or activation_nonce_hash ~ '^[a-f0-9]{64}$');
  end if;
end;
$$;

drop function if exists public.consume_checkout_activation(text, text);
drop function if exists public.consume_checkout_activation(text, text, text);
drop function if exists public.consume_checkout_activation(text, text, text, text);

create function public.consume_checkout_activation(
  p_checkout_session_id text, p_product_code text, p_customer_id text, p_activation_nonce_hash text
)
returns table (
  activation_outcome text, id bigint, product_code text, status text,
  stripe_checkout_session_id text, stripe_payment_intent_id text, stripe_charge_id text,
  stripe_customer_id text, granted_at timestamptz, revoked_at timestamptz
)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_entitlement public.purchase_entitlements%rowtype;
  v_activation public.purchase_checkout_activations%rowtype;
begin
  if p_checkout_session_id is null or p_checkout_session_id !~ '^cs_(test|live)_[A-Za-z0-9]+$'
    or p_product_code is null or p_product_code not in ('resume_pro', 'rental_application_pro')
    or p_customer_id is null or p_customer_id !~ '^cus_[A-Za-z0-9]+$'
    or p_activation_nonce_hash is null or p_activation_nonce_hash !~ '^[a-f0-9]{64}$'
  then raise exception 'Invalid checkout activation input'; end if;

  select entitlement.* into v_entitlement
  from public.purchase_entitlements entitlement
  where entitlement.stripe_checkout_session_id = p_checkout_session_id
    and entitlement.product_code = p_product_code
    and entitlement.stripe_customer_id = p_customer_id
  for update;

  if not found then
    return query select 'missing'::text, null::bigint, null::text, null::text, null::text,
      null::text, null::text, null::text, null::timestamptz, null::timestamptz;
    return;
  end if;

  select activation.* into v_activation
  from public.purchase_checkout_activations activation
  where activation.entitlement_id = v_entitlement.id;

  if found then
    if v_activation.released_at is not null then
      return query select 'released'::text, null::bigint, null::text, null::text, null::text,
        null::text, null::text, null::text, null::timestamptz, null::timestamptz;
      return;
    elsif v_activation.activation_nonce_hash is distinct from p_activation_nonce_hash then
      return query select 'used'::text, null::bigint, null::text, null::text, null::text,
        null::text, null::text, null::text, null::timestamptz, null::timestamptz;
      return;
    elsif v_entitlement.status = 'active' then
      return query select 'idempotent'::text, v_entitlement.id, v_entitlement.product_code,
        v_entitlement.status, v_entitlement.stripe_checkout_session_id,
        v_entitlement.stripe_payment_intent_id, v_entitlement.stripe_charge_id,
        v_entitlement.stripe_customer_id, v_entitlement.granted_at, v_entitlement.revoked_at;
      return;
    end if;
  end if;

  if v_entitlement.status in ('revoked', 'review') then
    return query select v_entitlement.status, null::bigint, null::text, null::text, null::text,
      null::text, null::text, null::text, null::timestamptz, null::timestamptz;
    return;
  end if;

  insert into public.purchase_checkout_activations (
    entitlement_id, checkout_session_key, checkout_ref_last8, activation_nonce_hash
  ) values (
    v_entitlement.id, md5(p_checkout_session_id), right(p_checkout_session_id, 8), p_activation_nonce_hash
  );

  return query select 'consumed'::text, v_entitlement.id, v_entitlement.product_code,
    v_entitlement.status, v_entitlement.stripe_checkout_session_id,
    v_entitlement.stripe_payment_intent_id, v_entitlement.stripe_charge_id,
    v_entitlement.stripe_customer_id, v_entitlement.granted_at, v_entitlement.revoked_at;
end;
$$;

create or replace function public.release_checkout_activation(p_entitlement_id bigint, p_product_code text)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_entitlement_id is null or p_product_code is null
    or p_product_code not in ('resume_pro', 'rental_application_pro') then
    raise exception 'Invalid checkout activation release input';
  end if;
  update public.purchase_checkout_activations activation
  set released_at = coalesce(activation.released_at, now())
  from public.purchase_entitlements entitlement
  where activation.entitlement_id = p_entitlement_id
    and entitlement.id = activation.entitlement_id
    and entitlement.product_code = p_product_code;
  return found;
end;
$$;

create or replace function public.find_active_purchase_entitlement_by_checkout(
  p_checkout_session_id text, p_product_code text
)
returns table (id bigint, product_code text, status text, granted_at timestamptz, revoked_at timestamptz)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if p_checkout_session_id is null or p_checkout_session_id !~ '^cs_(test|live)_[A-Za-z0-9]+$'
    or p_product_code is null or p_product_code not in ('resume_pro', 'rental_application_pro') then
    raise exception 'Invalid entitlement lookup input';
  end if;
  return query select entitlement.id, entitlement.product_code, entitlement.status,
    entitlement.granted_at, entitlement.revoked_at
  from public.purchase_entitlements entitlement
  where entitlement.stripe_checkout_session_id = p_checkout_session_id
    and entitlement.product_code = p_product_code and entitlement.status = 'active'
  limit 1;
end;
$$;

create or replace function public.find_active_purchase_entitlement_by_id(
  p_entitlement_id bigint, p_product_code text
)
returns table (id bigint, product_code text, status text, granted_at timestamptz, revoked_at timestamptz)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if p_entitlement_id is null or p_product_code is null
    or p_product_code not in ('resume_pro', 'rental_application_pro') then
    raise exception 'Invalid entitlement lookup input';
  end if;
  return query select entitlement.id, entitlement.product_code, entitlement.status,
    entitlement.granted_at, entitlement.revoked_at
  from public.purchase_entitlements entitlement
  where entitlement.id = p_entitlement_id and entitlement.product_code = p_product_code
    and entitlement.status = 'active' limit 1;
end;
$$;

revoke select, insert, update, delete on table public.purchase_checkout_activations, public.purchase_entitlements from public;
revoke all on function public.consume_checkout_activation(text, text, text, text) from public;
revoke all on function public.release_checkout_activation(bigint, text) from public;
revoke all on function public.find_active_purchase_entitlement_by_checkout(text, text) from public;
revoke all on function public.find_active_purchase_entitlement_by_id(bigint, text) from public;

insert into public.schema_migrations (version)
values ('20260823_checkout_activation_nonce_v1')
on conflict (version) do nothing;

commit;
