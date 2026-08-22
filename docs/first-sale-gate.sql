-- Hoju Compass Resume Pro first-sale concurrency gate.
-- Provider-neutral PostgreSQL DDL. Do not apply without an owner-approved backup window.
-- The application can reserve, attach, release verified failures/expiry and lock on paid events.
-- Only a separate operator role may execute approve_next_first_sale.

begin;

create table if not exists public.schema_migrations (
  version text primary key,
  applied_at timestamptz not null default now()
);

create table if not exists public.first_sale_gates (
  product_code text primary key check (product_code = 'resume_pro'),
  state text not null default 'OPEN' check (state in ('OPEN', 'RESERVED', 'LOCKED')),
  generation bigint not null default 0 check (generation >= 0),
  environment text not null check (environment in ('live', 'test')),
  currency text not null check (currency = 'aud'),
  expected_amount_cents integer not null check (expected_amount_cents = 1990),
  claim_token_hash text,
  reservation_expires_at timestamptz,
  stripe_checkout_session_id text unique,
  sold_at timestamptz,
  sold_event_ref_last8 text,
  updated_at timestamptz not null default now(),
  check (claim_token_hash is null or claim_token_hash ~ '^[a-f0-9]{64}$'),
  check (
    (state = 'OPEN' and claim_token_hash is null and reservation_expires_at is null and stripe_checkout_session_id is null)
    or (state = 'RESERVED' and claim_token_hash is not null and reservation_expires_at is not null)
    or (state = 'LOCKED' and claim_token_hash is null and reservation_expires_at is null and sold_at is not null)
  )
);

create table if not exists public.first_sale_gate_events (
  id bigint generated always as identity primary key,
  dedupe_key text not null unique,
  gate_version text not null,
  product_code text not null check (product_code = 'resume_pro'),
  generation bigint not null,
  from_state text not null check (from_state in ('OPEN', 'RESERVED', 'SOLD', 'LOCKED')),
  to_state text not null check (to_state in ('OPEN', 'RESERVED', 'SOLD', 'LOCKED')),
  occurred_at timestamptz not null default now(),
  operating_date date not null,
  environment text not null check (environment in ('live', 'test')),
  currency text not null check (currency = 'aud'),
  expected_amount_cents integer not null check (expected_amount_cents = 1990),
  actor_type text not null check (actor_type in ('system', 'webhook', 'owner')),
  reason_code text not null,
  reservation_expires_at timestamptz,
  stripe_reference_last8 text,
  approval_reference text,
  evidence_status text check (evidence_status in ('PASS', 'MISSING', 'FAIL')),
  cash_difference_cents integer,
  payout_status text check (payout_status in ('pending', 'matched')),
  schema_version text not null,
  check (stripe_reference_last8 is null or length(stripe_reference_last8) <= 8),
  check (approval_reference is null or length(approval_reference) <= 120)
);

create or replace function public.prevent_first_sale_gate_event_mutation()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  raise exception 'first_sale_gate_events is append-only';
end;
$$;

drop trigger if exists first_sale_gate_events_append_only on public.first_sale_gate_events;
create trigger first_sale_gate_events_append_only
before update or delete on public.first_sale_gate_events
for each row execute function public.prevent_first_sale_gate_event_mutation();

create or replace function public.claim_first_sale_reservation(
  p_product_code text,
  p_claim_token_hash text,
  p_reservation_expires_at timestamptz,
  p_environment text,
  p_currency text,
  p_expected_amount_cents integer
)
returns table (
  outcome text,
  generation bigint,
  stripe_checkout_session_id text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_gate public.first_sale_gates%rowtype;
  v_generation bigint;
begin
  if p_product_code is null
    or p_product_code is distinct from 'resume_pro'
    or p_claim_token_hash is null
    or p_claim_token_hash !~ '^[a-f0-9]{64}$'
    or p_reservation_expires_at is null
    or p_environment is null
    or p_environment not in ('live', 'test')
    or p_currency is null
    or p_currency is distinct from 'aud'
    or p_expected_amount_cents is null
    or p_expected_amount_cents is distinct from 1990
    or p_reservation_expires_at < now() + interval '30 minutes'
    or p_reservation_expires_at > now() + interval '35 minutes'
  then
    raise exception 'Invalid first-sale claim contract';
  end if;

  perform pg_advisory_xact_lock(hashtext('first-sale:' || p_product_code));

  insert into public.first_sale_gates (
    product_code,
    environment,
    currency,
    expected_amount_cents
  ) values (
    p_product_code,
    p_environment,
    p_currency,
    p_expected_amount_cents
  )
  on conflict (product_code) do nothing;

  select * into v_gate
  from public.first_sale_gates
  where product_code = p_product_code
  for update;

  if v_gate.environment is distinct from p_environment
    or v_gate.currency is distinct from p_currency
    or v_gate.expected_amount_cents is distinct from p_expected_amount_cents
  then
    raise exception 'First-sale gate environment or price contract mismatch';
  end if;

  if v_gate.state = 'LOCKED' then
    return query select 'locked'::text, v_gate.generation, null::text;
    return;
  end if;

  if v_gate.state = 'RESERVED' then
    if v_gate.reservation_expires_at > now() then
      return query select 'reserved'::text, v_gate.generation, null::text;
    elsif v_gate.stripe_checkout_session_id is null then
      -- An indeterminate Stripe create result is never treated as abandoned.
      return query select 'manual_review'::text, v_gate.generation, null::text;
    else
      return query select 'verify_expiry'::text, v_gate.generation, v_gate.stripe_checkout_session_id;
    end if;
    return;
  end if;

  v_generation := v_gate.generation + 1;

  update public.first_sale_gates
  set
    state = 'RESERVED',
    generation = v_generation,
    claim_token_hash = p_claim_token_hash,
    reservation_expires_at = p_reservation_expires_at,
    stripe_checkout_session_id = null,
    sold_at = null,
    sold_event_ref_last8 = null,
    updated_at = now()
  where product_code = p_product_code;

  insert into public.first_sale_gate_events (
    dedupe_key, gate_version, product_code, generation, from_state, to_state,
    operating_date, environment, currency, expected_amount_cents, actor_type,
    reason_code, reservation_expires_at, schema_version
  ) values (
    'reserve:' || p_product_code || ':' || v_generation,
    'first-sale-v1', p_product_code, v_generation, 'OPEN', 'RESERVED',
    (now() at time zone 'Australia/Sydney')::date, p_environment, p_currency,
    p_expected_amount_cents, 'system', 'atomic_claim', p_reservation_expires_at,
    '20260823_first_sale_gate_v1'
  ) on conflict (dedupe_key) do nothing;

  return query select 'claimed'::text, v_generation, null::text;
end;
$$;

create or replace function public.attach_first_sale_checkout(
  p_product_code text,
  p_generation bigint,
  p_claim_token_hash text,
  p_checkout_session_id text,
  p_checkout_expires_at timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_gate public.first_sale_gates%rowtype;
begin
  if p_product_code is null
    or p_product_code is distinct from 'resume_pro'
    or p_generation is null
    or p_generation < 1
    or p_claim_token_hash is null
    or p_claim_token_hash !~ '^[a-f0-9]{64}$'
    or p_checkout_session_id is null
    or p_checkout_session_id !~ '^cs_(test|live)_[A-Za-z0-9]+$'
    or p_checkout_expires_at is null
    or p_checkout_expires_at <= now()
  then
    raise exception 'Invalid Checkout attachment';
  end if;

  perform pg_advisory_xact_lock(hashtext('first-sale:' || p_product_code));
  select * into v_gate from public.first_sale_gates where product_code = p_product_code for update;

  if v_gate.state is distinct from 'RESERVED'
    or v_gate.generation is distinct from p_generation
    or v_gate.claim_token_hash is distinct from p_claim_token_hash
  then
    return false;
  end if;

  if v_gate.stripe_checkout_session_id is not null then
    return v_gate.stripe_checkout_session_id is not distinct from p_checkout_session_id;
  end if;

  update public.first_sale_gates
  set stripe_checkout_session_id = p_checkout_session_id,
      reservation_expires_at = p_checkout_expires_at,
      updated_at = now()
  where product_code = p_product_code;

  insert into public.first_sale_gate_events (
    dedupe_key, gate_version, product_code, generation, from_state, to_state,
    operating_date, environment, currency, expected_amount_cents, actor_type,
    reason_code, reservation_expires_at, stripe_reference_last8, schema_version
  ) values (
    'attach:' || p_product_code || ':' || p_generation,
    'first-sale-v1', p_product_code, p_generation, 'RESERVED', 'RESERVED',
    (now() at time zone 'Australia/Sydney')::date, v_gate.environment, v_gate.currency,
    v_gate.expected_amount_cents, 'system', 'checkout_attached', p_checkout_expires_at,
    right(p_checkout_session_id, 8), '20260823_first_sale_gate_v1'
  ) on conflict (dedupe_key) do nothing;

  return true;
end;
$$;

create or replace function public.release_failed_first_sale_reservation(
  p_product_code text,
  p_generation bigint,
  p_claim_token_hash text,
  p_reason_code text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_gate public.first_sale_gates%rowtype;
begin
  if p_product_code is null
    or p_product_code is distinct from 'resume_pro'
    or p_generation is null
    or p_generation < 1
    or p_claim_token_hash is null
    or p_claim_token_hash !~ '^[a-f0-9]{64}$'
    or p_reason_code is null
    or p_reason_code is distinct from 'stripe_rejected_before_session'
  then
    raise exception 'Unsupported first-sale failure release reason';
  end if;

  perform pg_advisory_xact_lock(hashtext('first-sale:' || p_product_code));
  select * into v_gate from public.first_sale_gates where product_code = p_product_code for update;

  if v_gate.state is distinct from 'RESERVED'
    or v_gate.generation is distinct from p_generation
    or v_gate.claim_token_hash is distinct from p_claim_token_hash
    or v_gate.stripe_checkout_session_id is not null
  then
    return false;
  end if;

  update public.first_sale_gates
  set state = 'OPEN', claim_token_hash = null, reservation_expires_at = null,
      stripe_checkout_session_id = null, updated_at = now()
  where product_code = p_product_code;

  insert into public.first_sale_gate_events (
    dedupe_key, gate_version, product_code, generation, from_state, to_state,
    operating_date, environment, currency, expected_amount_cents, actor_type,
    reason_code, reservation_expires_at, schema_version
  ) values (
    'release-failed:' || p_product_code || ':' || p_generation,
    'first-sale-v1', p_product_code, p_generation, 'RESERVED', 'OPEN',
    (now() at time zone 'Australia/Sydney')::date, v_gate.environment, v_gate.currency,
    v_gate.expected_amount_cents, 'system', p_reason_code,
    v_gate.reservation_expires_at, '20260823_first_sale_gate_v1'
  ) on conflict (dedupe_key) do nothing;

  return true;
end;
$$;

create or replace function public.release_verified_abandoned_first_sale(
  p_product_code text,
  p_generation bigint,
  p_checkout_session_id text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_gate public.first_sale_gates%rowtype;
begin
  if p_product_code is null
    or p_product_code is distinct from 'resume_pro'
    or p_generation is null
    or p_generation < 1
    or p_checkout_session_id is null
    or p_checkout_session_id !~ '^cs_(test|live)_[A-Za-z0-9]+$'
  then
    raise exception 'Invalid verified-abandonment release contract';
  end if;

  perform pg_advisory_xact_lock(hashtext('first-sale:' || p_product_code));
  select * into v_gate from public.first_sale_gates where product_code = p_product_code for update;

  if v_gate.state is distinct from 'RESERVED'
    or v_gate.generation is distinct from p_generation
    or v_gate.stripe_checkout_session_id is distinct from p_checkout_session_id
    or v_gate.reservation_expires_at is null
    or v_gate.reservation_expires_at > now()
  then
    return false;
  end if;

  update public.first_sale_gates
  set state = 'OPEN', claim_token_hash = null, reservation_expires_at = null,
      stripe_checkout_session_id = null, updated_at = now()
  where product_code = p_product_code;

  insert into public.first_sale_gate_events (
    dedupe_key, gate_version, product_code, generation, from_state, to_state,
    operating_date, environment, currency, expected_amount_cents, actor_type,
    reason_code, reservation_expires_at, stripe_reference_last8, schema_version
  ) values (
    'release-expired:' || p_product_code || ':' || p_generation,
    'first-sale-v1', p_product_code, p_generation, 'RESERVED', 'OPEN',
    (now() at time zone 'Australia/Sydney')::date, v_gate.environment, v_gate.currency,
    v_gate.expected_amount_cents, 'system', 'verified_expired_unpaid_no_intent',
    v_gate.reservation_expires_at, right(p_checkout_session_id, 8),
    '20260823_first_sale_gate_v1'
  ) on conflict (dedupe_key) do nothing;

  return true;
end;
$$;

create or replace function public.lock_first_sale_from_paid_event(
  p_product_code text,
  p_stripe_event_id text,
  p_checkout_session_id text,
  p_livemode boolean,
  p_stripe_created_at timestamptz
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_gate public.first_sale_gates%rowtype;
  v_environment text := case when p_livemode then 'live' else 'test' end;
  v_dedupe_key text := 'paid:' || md5(p_stripe_event_id);
begin
  if p_product_code is null
    or p_product_code is distinct from 'resume_pro'
    or p_stripe_event_id is null
    or p_stripe_event_id !~ '^evt_[A-Za-z0-9]+$'
    or p_checkout_session_id is null
    or p_checkout_session_id !~ '^cs_(test|live)_[A-Za-z0-9]+$'
    or p_livemode is null
    or p_stripe_created_at is null
  then
    raise exception 'Invalid first-sale paid event contract';
  end if;

  perform pg_advisory_xact_lock(hashtext('first-sale:' || p_product_code));

  if exists (select 1 from public.first_sale_gate_events where dedupe_key = v_dedupe_key || ':sold') then
    return 'duplicate';
  end if;

  select * into v_gate from public.first_sale_gates where product_code = p_product_code for update;

  if v_gate.product_code is null
    or v_gate.environment is distinct from v_environment
  then
    raise exception 'First-sale paid event environment mismatch';
  end if;

  if v_gate.state = 'LOCKED' then
    -- Only the exact signed event may take the idempotent path. Another event,
    -- even for the same Session, must never reach entitlement processing.
    raise exception 'First-sale gate is locked by another paid event';
  end if;

  if v_gate.state is distinct from 'RESERVED'
    or v_gate.stripe_checkout_session_id is null
    or v_gate.stripe_checkout_session_id is distinct from p_checkout_session_id
  then
    raise exception 'Paid event does not match the active first-sale reservation';
  end if;

  insert into public.first_sale_gate_events (
    dedupe_key, gate_version, product_code, generation, from_state, to_state,
    occurred_at, operating_date, environment, currency, expected_amount_cents,
    actor_type, reason_code, stripe_reference_last8, schema_version
  ) values (
    v_dedupe_key || ':sold', 'first-sale-v1', p_product_code, v_gate.generation,
    v_gate.state, 'SOLD', p_stripe_created_at,
    (p_stripe_created_at at time zone 'Australia/Sydney')::date,
    v_gate.environment, v_gate.currency, v_gate.expected_amount_cents,
    'webhook', 'verified_paid', right(p_checkout_session_id, 8),
    '20260823_first_sale_gate_v1'
  );

  insert into public.first_sale_gate_events (
    dedupe_key, gate_version, product_code, generation, from_state, to_state,
    occurred_at, operating_date, environment, currency, expected_amount_cents,
    actor_type, reason_code, stripe_reference_last8, schema_version
  ) values (
    v_dedupe_key || ':locked', 'first-sale-v1', p_product_code, v_gate.generation,
    'SOLD', 'LOCKED', p_stripe_created_at,
    (p_stripe_created_at at time zone 'Australia/Sydney')::date,
    v_gate.environment, v_gate.currency, v_gate.expected_amount_cents,
    'webhook', 'first_paid_sale_locked', right(p_checkout_session_id, 8),
    '20260823_first_sale_gate_v1'
  );

  update public.first_sale_gates
  set state = 'LOCKED', claim_token_hash = null, reservation_expires_at = null,
      stripe_checkout_session_id = p_checkout_session_id, sold_at = p_stripe_created_at,
      sold_event_ref_last8 = right(p_stripe_event_id, 8), updated_at = now()
  where product_code = p_product_code;

  return 'locked';
end;
$$;

create or replace function public.approve_next_first_sale(
  p_product_code text,
  p_owner_approval_reference text,
  p_evidence_status text,
  p_cash_difference_cents integer,
  p_payout_status text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_gate public.first_sale_gates%rowtype;
  v_approval_reference text;
begin
  v_approval_reference := btrim(regexp_replace(
    translate(
      p_owner_approval_reference,
      U&'\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\200B\2028\2029\202F\205F\2060\3000\FEFF',
      ''
    ),
    '[[:cntrl:]]',
    '',
    'g'
  ));

  if p_product_code is null
    or p_product_code is distinct from 'resume_pro'
    or p_owner_approval_reference is null
    or v_approval_reference = ''
    or v_approval_reference !~ '[[:alnum:]]'
    or length(v_approval_reference) < 4
    or length(v_approval_reference) > 120
    or p_evidence_status is distinct from 'PASS'
    or p_cash_difference_cents is null
    or abs(p_cash_difference_cents) > 1
    or p_payout_status is distinct from 'matched'
  then
    return false;
  end if;

  perform pg_advisory_xact_lock(hashtext('first-sale:' || p_product_code));
  select * into v_gate from public.first_sale_gates where product_code = p_product_code for update;

  if v_gate.state is distinct from 'LOCKED' then return false; end if;

  update public.first_sale_gates
  set state = 'OPEN', stripe_checkout_session_id = null, sold_at = null,
      sold_event_ref_last8 = null, updated_at = now()
  where product_code = p_product_code;

  insert into public.first_sale_gate_events (
    dedupe_key, gate_version, product_code, generation, from_state, to_state,
    operating_date, environment, currency, expected_amount_cents, actor_type,
    reason_code, approval_reference, evidence_status, cash_difference_cents,
    payout_status, schema_version
  ) values (
    'owner-reopen:' || p_product_code || ':' || (v_gate.generation + 1),
    'first-sale-v1', p_product_code, v_gate.generation, 'LOCKED', 'OPEN',
    (now() at time zone 'Australia/Sydney')::date, v_gate.environment, v_gate.currency,
    v_gate.expected_amount_cents, 'owner', 'owner_approved_next_sale',
    v_approval_reference, p_evidence_status, p_cash_difference_cents,
    p_payout_status, '20260823_first_sale_gate_v1'
  );

  return true;
end;
$$;

-- PostgreSQL overloads functions by argument types. Remove both historical
-- paid-event signatures before installing the charge-aware atomic contract so
-- no stale EXECUTE grant can keep an older bypass callable.
drop function if exists public.apply_first_sale_paid_event(
  text, text, boolean, timestamptz, text, text, text, text, text
);
drop function if exists public.apply_first_sale_paid_event(
  text, text, boolean, timestamptz, text, text, integer, text, text, text, text
);

create or replace function public.apply_first_sale_paid_event(
  p_event_id text,
  p_event_type text,
  p_livemode boolean,
  p_stripe_created_at timestamptz,
  p_product_code text,
  p_currency text,
  p_amount_total integer,
  p_checkout_session_id text,
  p_payment_intent_id text,
  p_charge_id text,
  p_customer_id text,
  p_reason text
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_gate_outcome text;
  v_entitlement_outcome text;
begin
  if p_event_id is null
    or p_event_id !~ '^evt_[A-Za-z0-9]+$'
    or p_event_type is null
    or p_event_type not in ('checkout.session.completed', 'checkout.session.async_payment_succeeded')
    or p_livemode is null
    or p_stripe_created_at is null
    or p_product_code is null
    or p_product_code is distinct from 'resume_pro'
    or p_currency is null
    or p_currency is distinct from 'aud'
    or p_amount_total is null
    or p_amount_total is distinct from 1990
    or p_checkout_session_id is null
    or p_checkout_session_id !~ '^cs_(test|live)_[A-Za-z0-9]+$'
    or p_payment_intent_id is null
    or p_payment_intent_id !~ '^pi_[A-Za-z0-9]+$'
    or p_charge_id is null
    or p_charge_id !~ '^ch_[A-Za-z0-9]+$'
    or p_customer_id is null
    or p_customer_id !~ '^cus_[A-Za-z0-9]+$'
    or p_reason is null
    or p_reason not in ('checkout_paid', 'async_payment_succeeded')
  then
    raise exception 'Invalid first-sale entitlement contract';
  end if;

  -- Both transitions share this database transaction. If entitlement delivery
  -- fails, the gate lock rolls back and Stripe retries the signed event.
  v_gate_outcome := public.lock_first_sale_from_paid_event(
    p_product_code,
    p_event_id,
    p_checkout_session_id,
    p_livemode,
    p_stripe_created_at
  );

  select result.outcome into v_entitlement_outcome
  from public.apply_entitlement_event(
    p_event_id,
    p_event_type,
    p_livemode,
    p_stripe_created_at,
    'grant',
    p_product_code,
    p_checkout_session_id,
    p_payment_intent_id,
    p_charge_id,
    p_customer_id,
    p_reason
  ) result;

  if v_gate_outcome not in ('locked', 'duplicate')
    or v_entitlement_outcome not in ('processed', 'duplicate', 'ignored_stale')
  then
    raise exception 'Invalid first-sale paid transaction result';
  end if;

  return v_entitlement_outcome;
end;
$$;

create or replace function public.apply_guarded_entitlement_event(
  p_event_id text,
  p_event_type text,
  p_livemode boolean,
  p_stripe_created_at timestamptz,
  p_action text,
  p_product_code text,
  p_checkout_session_id text,
  p_payment_intent_id text,
  p_charge_id text,
  p_customer_id text,
  p_reason text
)
returns table (
  outcome text,
  id bigint,
  product_code text,
  status text,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  stripe_charge_id text,
  stripe_customer_id text,
  granted_at timestamptz,
  revoked_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_action = 'grant' and p_product_code = 'resume_pro' then
    raise exception 'Resume Pro grant requires apply_first_sale_paid_event';
  end if;

  return query
  select * from public.apply_entitlement_event(
    p_event_id,
    p_event_type,
    p_livemode,
    p_stripe_created_at,
    p_action,
    p_product_code,
    p_checkout_session_id,
    p_payment_intent_id,
    p_charge_id,
    p_customer_id,
    p_reason
  );
end;
$$;

create or replace function public.consume_entitlement_restore_token(
  p_token_hash text,
  p_product_code text
)
returns table (
  id bigint,
  product_code text,
  status text,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  stripe_charge_id text,
  stripe_customer_id text,
  granted_at timestamptz,
  revoked_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_token_hash is null
    or p_token_hash !~ '^[a-fA-F0-9]{64}$'
    or p_product_code is null
    or p_product_code not in ('resume_pro', 'rental_application_pro')
  then
    raise exception 'Invalid restore-token consumption contract';
  end if;

  return query
  with active_entitlement as materialized (
    select entitlement.id
    from public.purchase_entitlements entitlement
    where entitlement.product_code = p_product_code
      and entitlement.status = 'active'
    for update
  ), consumed as (
    update public.purchase_restore_tokens
    set used_at = now()
    where token_hash = lower(p_token_hash)
      and p_token_hash ~ '^[a-fA-F0-9]{64}$'
      and used_at is null
      and expires_at > now()
      and entitlement_id in (select id from active_entitlement)
    returning entitlement_id
  )
  select
    entitlement.id,
    entitlement.product_code,
    entitlement.status,
    entitlement.stripe_checkout_session_id,
    entitlement.stripe_payment_intent_id,
    entitlement.stripe_charge_id,
    entitlement.stripe_customer_id,
    entitlement.granted_at,
    entitlement.revoked_at
  from public.purchase_entitlements entitlement
  join consumed on consumed.entitlement_id = entitlement.id
  join active_entitlement on active_entitlement.id = entitlement.id
  where entitlement.status = 'active';
end;
$$;

create or replace function public.create_entitlement_restore_token(
  p_entitlement_id bigint,
  p_product_code text,
  p_token_hash text,
  p_expires_at timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_inserted text;
  v_active_entitlement_id bigint;
begin
  if p_entitlement_id is null
    or p_entitlement_id < 1
    or p_product_code is null
    or p_product_code not in ('resume_pro', 'rental_application_pro')
    or p_token_hash is null
    or p_token_hash !~ '^[a-fA-F0-9]{64}$'
    or p_expires_at is null
    or p_expires_at <= now()
    or p_expires_at > now() + interval '30 days'
  then
    raise exception 'Invalid restore-token contract';
  end if;

  perform pg_advisory_xact_lock(hashtext('restore-token:' || p_entitlement_id::text));

  select entitlement.id into v_active_entitlement_id
  from public.purchase_entitlements entitlement
  where entitlement.id = p_entitlement_id
    and entitlement.product_code = p_product_code
    and entitlement.status = 'active'
  for update;

  if v_active_entitlement_id is null then
    return false;
  end if;

  update public.purchase_restore_tokens
  set used_at = now()
  where entitlement_id = v_active_entitlement_id
    and used_at is null;

  insert into public.purchase_restore_tokens (token_hash, entitlement_id, expires_at)
  values (lower(p_token_hash), v_active_entitlement_id, p_expires_at)
  returning token_hash into v_inserted;

  return v_inserted is not null;
end;
$$;

-- Least-privilege boundary. The migration owner must be a non-login role that
-- owns these SECURITY DEFINER functions. Replace the role placeholders in the
-- deployment ticket only; do not paste a live role name into this repository.
revoke create on schema public from public;
revoke all on table public.first_sale_gates, public.first_sale_gate_events from public;
revoke insert, update, delete on table public.payment_webhook_events, public.purchase_entitlements, public.purchase_restore_tokens, public.entitlement_event_tombstones, public.stripe_payment_object_links from public;
revoke all on function public.apply_entitlement_event(text, text, boolean, timestamptz, text, text, text, text, text, text, text) from public;
revoke all on function public.claim_first_sale_reservation(text, text, timestamptz, text, text, integer) from public;
revoke all on function public.attach_first_sale_checkout(text, bigint, text, text, timestamptz) from public;
revoke all on function public.release_failed_first_sale_reservation(text, bigint, text, text) from public;
revoke all on function public.release_verified_abandoned_first_sale(text, bigint, text) from public;
revoke all on function public.lock_first_sale_from_paid_event(text, text, text, boolean, timestamptz) from public;
revoke all on function public.apply_first_sale_paid_event(text, text, boolean, timestamptz, text, text, integer, text, text, text, text, text) from public;
revoke all on function public.apply_guarded_entitlement_event(text, text, boolean, timestamptz, text, text, text, text, text, text, text) from public;
revoke all on function public.consume_entitlement_restore_token(text, text) from public;
revoke all on function public.create_entitlement_restore_token(bigint, text, text, timestamptz) from public;
revoke all on function public.approve_next_first_sale(text, text, text, integer, text) from public;
revoke all on function public.prevent_first_sale_gate_event_mutation() from public;
revoke all on function public.prevent_entitlement_tombstone_mutation() from public;

-- Owner-approved deployment template (intentionally comments):
-- revoke create on schema public from hoju_app_runtime;
-- revoke all on public.first_sale_gates, public.first_sale_gate_events from hoju_app_runtime;
-- revoke insert, update, delete on public.payment_webhook_events, public.purchase_entitlements, public.purchase_restore_tokens, public.entitlement_event_tombstones, public.stripe_payment_object_links from hoju_app_runtime;
-- revoke execute on function public.apply_entitlement_event(text, text, boolean, timestamptz, text, text, text, text, text, text, text) from hoju_app_runtime;
-- grant execute on function public.claim_first_sale_reservation(text, text, timestamptz, text, text, integer) to hoju_app_runtime;
-- grant execute on function public.attach_first_sale_checkout(text, bigint, text, text, timestamptz) to hoju_app_runtime;
-- grant execute on function public.release_failed_first_sale_reservation(text, bigint, text, text) to hoju_app_runtime;
-- grant execute on function public.release_verified_abandoned_first_sale(text, bigint, text) to hoju_app_runtime;
-- grant execute on function public.apply_first_sale_paid_event(text, text, boolean, timestamptz, text, text, integer, text, text, text, text, text) to hoju_app_runtime;
-- grant execute on function public.apply_guarded_entitlement_event(text, text, boolean, timestamptz, text, text, text, text, text, text, text) to hoju_app_runtime;
-- grant execute on function public.consume_entitlement_restore_token(text, text) to hoju_app_runtime;
-- grant execute on function public.create_entitlement_restore_token(bigint, text, text, timestamptz) to hoju_app_runtime;
-- grant execute on function public.approve_next_first_sale(text, text, text, integer, text) to hoju_owner_operator;

insert into public.schema_migrations (version)
values ('20260823_first_sale_gate_v1')
on conflict (version) do nothing;

insert into public.schema_migrations (version)
values ('20260823_first_sale_gate_charge_link_v2')
on conflict (version) do nothing;

commit;
