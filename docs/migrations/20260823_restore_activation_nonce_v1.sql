-- Additive migration: response-loss-safe restore code -> stable access session.
-- Apply with PAYMENTS_ENABLED=false after purchase_access_sessions_v1.
begin;

do $$
begin
  if not exists (
    select 1 from public.schema_migrations
    where version = '20260823_purchase_access_sessions_v1'
  ) then
    raise exception 'purchase access sessions v1 must be applied first';
  end if;
end;
$$;

create table if not exists public.purchase_restore_activations (
  restore_token_hash text primary key references public.purchase_restore_tokens(token_hash) on delete restrict
    check (restore_token_hash ~ '^[a-f0-9]{64}$'),
  restore_nonce_hash text not null unique check (restore_nonce_hash ~ '^[a-f0-9]{64}$'),
  entitlement_id bigint not null references public.purchase_entitlements(id) on delete restrict,
  access_session_id bigint not null unique references public.purchase_access_sessions(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists purchase_restore_activations_entitlement_idx
  on public.purchase_restore_activations (entitlement_id);

drop function if exists public.consume_entitlement_restore_token(text, text);
drop function if exists public.consume_entitlement_restore_token(text, text, text, text, timestamptz);
drop function if exists public.consume_entitlement_restore_token(text, text, text, text, text, timestamptz);

create function public.consume_entitlement_restore_token(
  p_token_hash text,
  p_product_code text,
  p_restore_nonce_hash text,
  p_access_session_hash text,
  p_access_session_ref_last8 text,
  p_access_expires_at timestamptz
)
returns table (
  restore_outcome text, id bigint, product_code text, status text,
  stripe_checkout_session_id text, stripe_payment_intent_id text, stripe_charge_id text,
  stripe_customer_id text, granted_at timestamptz, revoked_at timestamptz
)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_token public.purchase_restore_tokens%rowtype;
  v_binding public.purchase_restore_activations%rowtype;
  v_access public.purchase_access_sessions%rowtype;
  v_entitlement public.purchase_entitlements%rowtype;
begin
  if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$'
    or p_product_code is null or p_product_code not in ('resume_pro', 'rental_application_pro')
    or p_restore_nonce_hash is null or p_restore_nonce_hash !~ '^[a-f0-9]{64}$'
    or p_access_session_hash is null or p_access_session_hash !~ '^[a-f0-9]{64}$'
    or p_access_session_ref_last8 is null or p_access_session_ref_last8 !~ '^[A-Za-z0-9_-]{8}$'
    or p_access_expires_at is null or p_access_expires_at <= now()
    or p_access_expires_at > now() + interval '30 days'
  then raise exception 'Invalid restore activation input'; end if;

  select token.* into v_token
  from public.purchase_restore_tokens token
  where token.token_hash = p_token_hash
  for update;

  if not found then
    return query select 'missing'::text, null::bigint, null::text, null::text, null::text,
      null::text, null::text, null::text, null::timestamptz, null::timestamptz;
    return;
  end if;

  select binding.* into v_binding
  from public.purchase_restore_activations binding
  where binding.restore_token_hash = p_token_hash
  for update;

  if found then
    if v_binding.restore_nonce_hash is distinct from p_restore_nonce_hash then
      return query select 'used'::text, null::bigint, null::text, null::text, null::text,
        null::text, null::text, null::text, null::timestamptz, null::timestamptz;
      return;
    end if;

    select entitlement.* into v_entitlement
    from public.purchase_entitlements entitlement
    where entitlement.id = v_binding.entitlement_id
      and entitlement.product_code = p_product_code
    for update;
    if not found then raise exception 'Restore binding entitlement mismatch'; end if;

    if v_entitlement.status in ('revoked', 'review') then
      return query select v_entitlement.status, null::bigint, null::text, null::text, null::text,
        null::text, null::text, null::text, null::timestamptz, null::timestamptz;
      return;
    end if;

    select access.* into v_access
    from public.purchase_access_sessions access
    where access.id = v_binding.access_session_id
    for update;
    if not found
      or v_access.entitlement_id is distinct from v_entitlement.id
      or v_access.product_code is distinct from p_product_code
      or v_access.session_source is distinct from 'restore'
      or v_access.access_session_hash is distinct from p_access_session_hash
    then raise exception 'Restore binding access-session mismatch'; end if;

    if v_access.revoked_at is not null or v_access.expires_at <= now() then
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

  select binding.* into v_binding
  from public.purchase_restore_activations binding
  where binding.restore_nonce_hash = p_restore_nonce_hash
  for update;
  if found then
    return query select 'used'::text, null::bigint, null::text, null::text, null::text,
      null::text, null::text, null::text, null::timestamptz, null::timestamptz;
    return;
  end if;

  if v_token.used_at is not null or v_token.expires_at <= now() then
    return query select 'missing'::text, null::bigint, null::text, null::text, null::text,
      null::text, null::text, null::text, null::timestamptz, null::timestamptz;
    return;
  end if;

  select entitlement.* into v_entitlement
  from public.purchase_entitlements entitlement
  where entitlement.id = v_token.entitlement_id
    and entitlement.product_code = p_product_code
  for update;
  if not found then
    return query select 'missing'::text, null::bigint, null::text, null::text, null::text,
      null::text, null::text, null::text, null::timestamptz, null::timestamptz;
    return;
  end if;
  if v_entitlement.status in ('revoked', 'review') then
    return query select v_entitlement.status, null::bigint, null::text, null::text, null::text,
      null::text, null::text, null::text, null::timestamptz, null::timestamptz;
    return;
  end if;

  insert into public.purchase_access_sessions (
    access_session_hash, access_session_ref_last8, entitlement_id, product_code,
    session_source, activation_entitlement_id, expires_at
  ) values (
    p_access_session_hash, p_access_session_ref_last8, v_entitlement.id,
    v_entitlement.product_code, 'restore', null, p_access_expires_at
  ) returning * into v_access;

  insert into public.purchase_restore_activations (
    restore_token_hash, restore_nonce_hash, entitlement_id, access_session_id
  ) values (
    p_token_hash, p_restore_nonce_hash, v_entitlement.id, v_access.id
  );

  update public.purchase_restore_tokens token
  set used_at = now()
  where token.token_hash = p_token_hash and token.used_at is null;
  if not found then raise exception 'Restore token was consumed concurrently'; end if;

  return query select 'consumed'::text, v_entitlement.id, v_entitlement.product_code,
    v_entitlement.status, v_entitlement.stripe_checkout_session_id,
    v_entitlement.stripe_payment_intent_id, v_entitlement.stripe_charge_id,
    v_entitlement.stripe_customer_id, v_entitlement.granted_at, v_entitlement.revoked_at;
end;
$$;

revoke all on table public.purchase_restore_activations from public;
revoke all on function public.consume_entitlement_restore_token(text, text, text, text, text, timestamptz) from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'hoju_app_runtime') then
    execute 'revoke all on table public.purchase_restore_activations from hoju_app_runtime';
    execute 'grant execute on function public.consume_entitlement_restore_token(text, text, text, text, text, timestamptz) to hoju_app_runtime';
  end if;
end;
$$;

insert into public.schema_migrations (version)
values ('20260823_restore_activation_nonce_v1')
on conflict (version) do nothing;

commit;
