-- Additive migration: response-loss-safe activation -> server-tracked device access sessions.
-- Apply with PAYMENTS_ENABLED=false. Forward-fix only; never delete access evidence.
begin;

do $$
begin
  if not exists (
    select 1 from public.schema_migrations
    where version = '20260823_checkout_activation_nonce_v1'
  ) then
    raise exception 'checkout activation nonce v1 must be applied first';
  end if;
end;
$$;

create table if not exists public.purchase_access_sessions (
  id bigint generated always as identity primary key,
  access_session_hash text not null unique check (access_session_hash ~ '^[a-f0-9]{64}$'),
  access_session_ref_last8 text not null check (access_session_ref_last8 ~ '^[A-Za-z0-9_-]{8}$'),
  entitlement_id bigint not null references public.purchase_entitlements(id) on delete restrict,
  product_code text not null check (product_code in ('resume_pro', 'rental_application_pro')),
  session_source text not null check (session_source in ('activation', 'restore')),
  activation_entitlement_id bigint references public.purchase_checkout_activations(entitlement_id) on delete restrict,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  check (
    (session_source = 'activation' and activation_entitlement_id = entitlement_id)
    or (session_source = 'restore' and activation_entitlement_id is null)
  )
);

create unique index if not exists purchase_access_sessions_activation_once_idx
  on public.purchase_access_sessions (activation_entitlement_id)
  where session_source = 'activation';

create index if not exists purchase_access_sessions_entitlement_idx
  on public.purchase_access_sessions (entitlement_id, product_code);

drop function if exists public.consume_checkout_activation(text, text);
drop function if exists public.consume_checkout_activation(text, text, text);
drop function if exists public.consume_checkout_activation(text, text, text, text);
drop function if exists public.consume_checkout_activation(text, text, text, text, text, text, timestamptz);

create function public.consume_checkout_activation(
  p_checkout_session_id text,
  p_product_code text,
  p_customer_id text,
  p_activation_nonce_hash text,
  p_access_session_hash text,
  p_access_session_ref_last8 text,
  p_access_expires_at timestamptz
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
  v_access public.purchase_access_sessions%rowtype;
begin
  if p_checkout_session_id is null or p_checkout_session_id !~ '^cs_(test|live)_[A-Za-z0-9]+$'
    or p_product_code is null or p_product_code not in ('resume_pro', 'rental_application_pro')
    or p_customer_id is null or p_customer_id !~ '^cus_[A-Za-z0-9]+$'
    or p_activation_nonce_hash is null or p_activation_nonce_hash !~ '^[a-f0-9]{64}$'
    or p_access_session_hash is null or p_access_session_hash !~ '^[a-f0-9]{64}$'
    or p_access_session_ref_last8 is null or p_access_session_ref_last8 !~ '^[A-Za-z0-9_-]{8}$'
    or p_access_expires_at is null or p_access_expires_at <= now()
    or p_access_expires_at > now() + interval '30 days'
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
  where activation.entitlement_id = v_entitlement.id
  for update;

  if found then
    if v_activation.released_at is not null then
      return query select 'released'::text, null::bigint, null::text, null::text, null::text,
        null::text, null::text, null::text, null::timestamptz, null::timestamptz;
      return;
    elsif v_activation.activation_nonce_hash is distinct from p_activation_nonce_hash then
      return query select 'used'::text, null::bigint, null::text, null::text, null::text,
        null::text, null::text, null::text, null::timestamptz, null::timestamptz;
      return;
    end if;
  end if;

  if v_entitlement.status in ('revoked', 'review') then
    return query select v_entitlement.status, null::bigint, null::text, null::text, null::text,
      null::text, null::text, null::text, null::timestamptz, null::timestamptz;
    return;
  end if;

  select access.* into v_access
  from public.purchase_access_sessions access
  where access.activation_entitlement_id = v_entitlement.id
    and access.session_source = 'activation'
  for update;

  if found then
    if v_access.access_session_hash is distinct from p_access_session_hash then
      return query select 'used'::text, null::bigint, null::text, null::text, null::text,
        null::text, null::text, null::text, null::timestamptz, null::timestamptz;
      return;
    elsif v_access.revoked_at is not null or v_access.expires_at <= now() then
      return query select 'released'::text, null::bigint, null::text, null::text, null::text,
        null::text, null::text, null::text, null::timestamptz, null::timestamptz;
      return;
    end if;

    return query select 'idempotent'::text, v_entitlement.id, v_entitlement.product_code,
      v_entitlement.status, v_entitlement.stripe_checkout_session_id,
      v_entitlement.stripe_payment_intent_id, v_entitlement.stripe_charge_id,
      v_entitlement.stripe_customer_id, v_entitlement.granted_at, v_entitlement.revoked_at;
    return;
  end if;

  if v_activation.entitlement_id is null then
    insert into public.purchase_checkout_activations (
      entitlement_id, checkout_session_key, checkout_ref_last8, activation_nonce_hash
    ) values (
      v_entitlement.id, md5(p_checkout_session_id), right(p_checkout_session_id, 8),
      p_activation_nonce_hash
    );
  end if;

  insert into public.purchase_access_sessions (
    access_session_hash, access_session_ref_last8, entitlement_id, product_code,
    session_source, activation_entitlement_id, expires_at
  ) values (
    p_access_session_hash, p_access_session_ref_last8, v_entitlement.id,
    v_entitlement.product_code, 'activation', v_entitlement.id, p_access_expires_at
  );

  return query select 'consumed'::text, v_entitlement.id, v_entitlement.product_code,
    v_entitlement.status, v_entitlement.stripe_checkout_session_id,
    v_entitlement.stripe_payment_intent_id, v_entitlement.stripe_charge_id,
    v_entitlement.stripe_customer_id, v_entitlement.granted_at, v_entitlement.revoked_at;
end;
$$;

drop function if exists public.consume_entitlement_restore_token(text, text);
drop function if exists public.consume_entitlement_restore_token(text, text, text, text, timestamptz);

create function public.consume_entitlement_restore_token(
  p_token_hash text,
  p_product_code text,
  p_access_session_hash text,
  p_access_session_ref_last8 text,
  p_access_expires_at timestamptz
)
returns table (
  id bigint, product_code text, status text, stripe_checkout_session_id text,
  stripe_payment_intent_id text, stripe_charge_id text, stripe_customer_id text,
  granted_at timestamptz, revoked_at timestamptz
)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_entitlement public.purchase_entitlements%rowtype;
  v_token_hash text;
begin
  if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$'
    or p_product_code is null or p_product_code not in ('resume_pro', 'rental_application_pro')
    or p_access_session_hash is null or p_access_session_hash !~ '^[a-f0-9]{64}$'
    or p_access_session_ref_last8 is null or p_access_session_ref_last8 !~ '^[A-Za-z0-9_-]{8}$'
    or p_access_expires_at is null or p_access_expires_at <= now()
    or p_access_expires_at > now() + interval '30 days'
  then raise exception 'Invalid restore-token input'; end if;

  select entitlement.* into v_entitlement
  from public.purchase_restore_tokens token
  join public.purchase_entitlements entitlement on entitlement.id = token.entitlement_id
  where token.token_hash = p_token_hash
    and token.used_at is null and token.expires_at > now()
    and entitlement.product_code = p_product_code and entitlement.status = 'active'
  for update of entitlement;

  if not found then return; end if;

  select token.token_hash into v_token_hash
  from public.purchase_restore_tokens token
  where token.token_hash = p_token_hash and token.entitlement_id = v_entitlement.id
    and token.used_at is null and token.expires_at > now()
  for update;
  if not found then return; end if;

  insert into public.purchase_access_sessions (
    access_session_hash, access_session_ref_last8, entitlement_id, product_code,
    session_source, activation_entitlement_id, expires_at
  ) values (
    p_access_session_hash, p_access_session_ref_last8, v_entitlement.id,
    v_entitlement.product_code, 'restore', null, p_access_expires_at
  );

  update public.purchase_restore_tokens token
  set used_at = now()
  where token.token_hash = v_token_hash and token.used_at is null;
  if not found then raise exception 'Restore token was consumed concurrently'; end if;

  return query select v_entitlement.id, v_entitlement.product_code, v_entitlement.status,
    v_entitlement.stripe_checkout_session_id, v_entitlement.stripe_payment_intent_id,
    v_entitlement.stripe_charge_id, v_entitlement.stripe_customer_id,
    v_entitlement.granted_at, v_entitlement.revoked_at;
end;
$$;

drop function if exists public.find_active_purchase_entitlement_by_access_session(bigint, text, text);
create function public.find_active_purchase_entitlement_by_access_session(
  p_entitlement_id bigint, p_product_code text, p_access_session_hash text
)
returns table (
  id bigint, product_code text, status text, stripe_checkout_session_id text,
  stripe_payment_intent_id text, stripe_charge_id text, stripe_customer_id text,
  granted_at timestamptz, revoked_at timestamptz
)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if p_entitlement_id is null or p_entitlement_id < 1
    or p_product_code is null or p_product_code not in ('resume_pro', 'rental_application_pro')
    or p_access_session_hash is null or p_access_session_hash !~ '^[a-f0-9]{64}$'
  then raise exception 'Invalid access-session lookup input'; end if;

  return query select entitlement.id, entitlement.product_code, entitlement.status,
    entitlement.stripe_checkout_session_id, entitlement.stripe_payment_intent_id,
    entitlement.stripe_charge_id, entitlement.stripe_customer_id,
    entitlement.granted_at, entitlement.revoked_at
  from public.purchase_access_sessions access
  join public.purchase_entitlements entitlement on entitlement.id = access.entitlement_id
  where access.entitlement_id = p_entitlement_id
    and access.product_code = p_product_code
    and access.access_session_hash = p_access_session_hash
    and access.revoked_at is null and access.expires_at > now()
    and entitlement.product_code = p_product_code and entitlement.status = 'active'
  limit 1;
end;
$$;

drop function if exists public.release_purchase_access_session(bigint, text, text);
create function public.release_purchase_access_session(
  p_entitlement_id bigint, p_product_code text, p_access_session_hash text
)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_access public.purchase_access_sessions%rowtype;
begin
  if p_entitlement_id is null or p_entitlement_id < 1
    or p_product_code is null or p_product_code not in ('resume_pro', 'rental_application_pro')
    or p_access_session_hash is null or p_access_session_hash !~ '^[a-f0-9]{64}$'
  then raise exception 'Invalid access-session release input'; end if;

  select access.* into v_access
  from public.purchase_access_sessions access
  where access.entitlement_id = p_entitlement_id
    and access.product_code = p_product_code
    and access.access_session_hash = p_access_session_hash
  for update;
  if not found then return false; end if;

  update public.purchase_access_sessions access
  set revoked_at = coalesce(access.revoked_at, now())
  where access.id = v_access.id;

  if v_access.session_source = 'activation' then
    update public.purchase_checkout_activations activation
    set released_at = coalesce(activation.released_at, now())
    where activation.entitlement_id = v_access.activation_entitlement_id;
    if not found then raise exception 'Activation binding is missing'; end if;
  end if;

  return true;
end;
$$;

revoke all on table public.purchase_access_sessions from public;
revoke all on function public.consume_checkout_activation(text, text, text, text, text, text, timestamptz) from public;
revoke all on function public.consume_entitlement_restore_token(text, text, text, text, timestamptz) from public;
revoke all on function public.find_active_purchase_entitlement_by_access_session(bigint, text, text) from public;
revoke all on function public.release_purchase_access_session(bigint, text, text) from public;
revoke all on function public.release_checkout_activation(bigint, text) from public;

insert into public.schema_migrations (version)
values ('20260823_purchase_access_sessions_v1')
on conflict (version) do nothing;

commit;
