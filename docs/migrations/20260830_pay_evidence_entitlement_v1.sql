-- Add Pay Evidence Pack Pro to the paid-product entitlement and access contract.
-- Prepared locally; apply only in an owner-approved migration window while Checkout is off.
-- This is provider-neutral PostgreSQL DDL and is not connected to any live database.
-- Apply a Stripe event and its entitlement change in one database transaction.

begin;

create table if not exists schema_migrations (
  version text primary key,
  applied_at timestamptz not null default now()
);

create table if not exists payment_webhook_events (
  stripe_event_id text primary key,
  event_type text not null,
  livemode boolean not null,
  stripe_created_at timestamptz not null,
  command_action text check (command_action in ('grant', 'revoke', 'review')),
  processing_status text not null check (processing_status in ('processing', 'processed', 'failed')),
  failure_code text,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

-- Historical revoked test entitlements remain append-only accounting evidence.
-- Their legacy product codes are storage-compatible only; the application
-- runtime allowlist still permits new grants for Resume Pro and Rental Pro only.
create table if not exists purchase_entitlements (
  id bigint generated always as identity primary key,
  product_code text not null check (product_code in ('resume_pro', 'rental_application_pro', 'pay_evidence_pro')),
  status text not null check (status in ('active', 'revoked', 'review')),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  stripe_charge_id text unique,
  stripe_customer_id text,
  buyer_email_hmac text,
  last_stripe_event_id text not null references payment_webhook_events(stripe_event_id),
  last_stripe_event_created_at timestamptz not null,
  granted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    stripe_checkout_session_id is not null
    or stripe_payment_intent_id is not null
    or stripe_charge_id is not null
  )
);

-- Idempotent migration for databases created before event-order protection was added.
alter table purchase_entitlements
  add column if not exists last_stripe_event_created_at timestamptz;

update purchase_entitlements entitlement
set last_stripe_event_created_at = event.stripe_created_at
from payment_webhook_events event
where entitlement.last_stripe_event_id = event.stripe_event_id
  and entitlement.last_stripe_event_created_at is null;

alter table purchase_entitlements
  alter column last_stripe_event_created_at set not null;

-- Idempotent expansion for databases created when Resume Pro was the only product.
alter table purchase_entitlements
  drop constraint if exists purchase_entitlements_product_code_check;

alter table purchase_entitlements
  add constraint purchase_entitlements_product_code_check
  check (product_code in (
    'resume_pro', 'rental_application_pro',
    'car_buy_pro', 'eofy_pro', 'pay_evidence_pro'
  ));

create index if not exists purchase_entitlements_customer_idx
  on purchase_entitlements (stripe_customer_id)
  where stripe_customer_id is not null;

create index if not exists purchase_entitlements_email_hmac_idx
  on purchase_entitlements (buyer_email_hmac)
  where buyer_email_hmac is not null;

create table if not exists purchase_restore_tokens (
  token_hash text primary key,
  entitlement_id bigint not null references purchase_entitlements(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists purchase_restore_tokens_entitlement_idx
  on purchase_restore_tokens (entitlement_id);

-- A paid Checkout URL binds one browser nonce hash. The same browser can
-- recover a lost Set-Cookie response with that nonce; another browser must
-- use a one-time restore token issued from the authenticated workspace.
create table if not exists purchase_checkout_activations (
  entitlement_id bigint primary key references purchase_entitlements(id) on delete restrict,
  checkout_session_key text not null unique check (checkout_session_key ~ '^[a-f0-9]{32}$'),
  checkout_ref_last8 text not null check (checkout_ref_last8 ~ '^[A-Za-z0-9_]{1,8}$'),
  activation_nonce_hash text check (activation_nonce_hash ~ '^[a-f0-9]{64}$'),
  consumed_at timestamptz not null default now(),
  released_at timestamptz
);

-- Every browser access cookie is bound to one server-tracked, revocable device
-- session. Only a SHA-256 hash and a short fixed reference are stored here.
create table if not exists purchase_access_sessions (
  id bigint generated always as identity primary key,
  access_session_hash text not null unique check (access_session_hash ~ '^[a-f0-9]{64}$'),
  access_session_ref_last8 text not null check (access_session_ref_last8 ~ '^[A-Za-z0-9_-]{8}$'),
  entitlement_id bigint not null references purchase_entitlements(id) on delete restrict,
  product_code text not null check (product_code in ('resume_pro', 'rental_application_pro', 'pay_evidence_pro')),
  session_source text not null check (session_source in ('activation', 'restore')),
  activation_entitlement_id bigint references purchase_checkout_activations(entitlement_id) on delete restrict,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  check (
    (session_source = 'activation' and activation_entitlement_id = entitlement_id)
    or (session_source = 'restore' and activation_entitlement_id is null)
  )
);

-- A consumed restore token binds one browser nonce hash to one server access
-- session. Only hashes and relational identifiers are retained.
create table if not exists purchase_restore_activations (
  restore_token_hash text primary key references purchase_restore_tokens(token_hash) on delete restrict
    check (restore_token_hash ~ '^[a-f0-9]{64}$'),
  restore_nonce_hash text not null unique check (restore_nonce_hash ~ '^[a-f0-9]{64}$'),
  entitlement_id bigint not null references purchase_entitlements(id) on delete restrict,
  access_session_id bigint not null unique references purchase_access_sessions(id) on delete restrict,
  created_at timestamptz not null default now()
);

alter table public.purchase_access_sessions
  drop constraint if exists purchase_access_sessions_product_code_check;
alter table public.purchase_access_sessions
  add constraint purchase_access_sessions_product_code_check
  check (product_code in ('resume_pro', 'rental_application_pro', 'pay_evidence_pro'));

alter table public.purchase_checkout_activations
  add column if not exists activation_nonce_hash text;
alter table public.purchase_checkout_activations
  add column if not exists released_at timestamptz;

drop function if exists consume_checkout_activation(text, text);
drop function if exists consume_checkout_activation(text, text, text);
drop function if exists consume_checkout_activation(text, text, text, text);

create or replace function consume_checkout_activation(
  p_checkout_session_id text,
  p_product_code text,
  p_customer_id text,
  p_activation_nonce_hash text
)
returns table (
  activation_outcome text,
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
declare
  v_entitlement public.purchase_entitlements%rowtype;
  v_activation public.purchase_checkout_activations%rowtype;
begin
  if p_checkout_session_id is null
    or p_checkout_session_id !~ '^cs_(test|live)_[A-Za-z0-9]+$'
    or p_product_code is null
    or p_product_code not in ('resume_pro', 'rental_application_pro', 'pay_evidence_pro')
    or p_customer_id is null
    or p_customer_id !~ '^cus_[A-Za-z0-9]+$'
    or p_activation_nonce_hash is null
    or p_activation_nonce_hash !~ '^[a-f0-9]{64}$'
  then
    raise exception 'Invalid checkout activation input';
  end if;

  select entitlement.* into v_entitlement
  from public.purchase_entitlements entitlement
  where entitlement.stripe_checkout_session_id = p_checkout_session_id
    and entitlement.product_code = p_product_code
    and entitlement.stripe_customer_id = p_customer_id
  for update;

  if not found then
    return query select 'missing'::text, null::bigint, null::text, null::text,
      null::text, null::text, null::text, null::text, null::timestamptz, null::timestamptz;
    return;
  end if;

  select activation.* into v_activation
  from public.purchase_checkout_activations activation
  where activation.entitlement_id = v_entitlement.id;

  if found then
    if v_activation.released_at is not null then
      return query select 'released'::text, null::bigint, null::text, null::text,
        null::text, null::text, null::text, null::text, null::timestamptz, null::timestamptz;
      return;
    elsif v_activation.activation_nonce_hash is distinct from p_activation_nonce_hash then
      return query select 'used'::text, null::bigint, null::text, null::text,
        null::text, null::text, null::text, null::text, null::timestamptz, null::timestamptz;
      return;
    elsif v_entitlement.status = 'active' then
      return query select
        'idempotent'::text, v_entitlement.id, v_entitlement.product_code, v_entitlement.status,
        v_entitlement.stripe_checkout_session_id, v_entitlement.stripe_payment_intent_id,
        v_entitlement.stripe_charge_id, v_entitlement.stripe_customer_id,
        v_entitlement.granted_at, v_entitlement.revoked_at;
      return;
    end if;
  end if;

  if v_entitlement.status = 'revoked' then
    return query select 'revoked'::text, null::bigint, null::text, null::text,
      null::text, null::text, null::text, null::text, null::timestamptz, null::timestamptz;
    return;
  elsif v_entitlement.status = 'review' then
    return query select 'review'::text, null::bigint, null::text, null::text,
      null::text, null::text, null::text, null::text, null::timestamptz, null::timestamptz;
    return;
  end if;

  insert into public.purchase_checkout_activations (
    entitlement_id,
    checkout_session_key,
    checkout_ref_last8,
    activation_nonce_hash
  ) values (
    v_entitlement.id,
    md5(p_checkout_session_id),
    right(p_checkout_session_id, 8),
    p_activation_nonce_hash
  );

  return query select
    'consumed'::text, v_entitlement.id, v_entitlement.product_code, v_entitlement.status,
    v_entitlement.stripe_checkout_session_id, v_entitlement.stripe_payment_intent_id,
    v_entitlement.stripe_charge_id, v_entitlement.stripe_customer_id,
    v_entitlement.granted_at, v_entitlement.revoked_at;
end;
$$;

create or replace function release_checkout_activation(
  p_entitlement_id bigint,
  p_product_code text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_entitlement_id is null
    or p_product_code is null
    or p_product_code not in ('resume_pro', 'rental_application_pro', 'pay_evidence_pro')
  then
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

create or replace function find_active_purchase_entitlement_by_checkout(
  p_checkout_session_id text,
  p_product_code text
)
returns table (id bigint, product_code text, status text, granted_at timestamptz, revoked_at timestamptz)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if p_checkout_session_id is null or p_checkout_session_id !~ '^cs_(test|live)_[A-Za-z0-9]+$'
    or p_product_code is null or p_product_code not in ('resume_pro', 'rental_application_pro', 'pay_evidence_pro') then
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

create or replace function find_active_purchase_entitlement_by_id(
  p_entitlement_id bigint,
  p_product_code text
)
returns table (id bigint, product_code text, status text, granted_at timestamptz, revoked_at timestamptz)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if p_entitlement_id is null or p_product_code is null
    or p_product_code not in ('resume_pro', 'rental_application_pro', 'pay_evidence_pro') then
    raise exception 'Invalid entitlement lookup input';
  end if;
  return query select entitlement.id, entitlement.product_code, entitlement.status,
    entitlement.granted_at, entitlement.revoked_at
  from public.purchase_entitlements entitlement
  where entitlement.id = p_entitlement_id and entitlement.product_code = p_product_code
    and entitlement.status = 'active' limit 1;
end;
$$;

-- Negative Stripe events can arrive before the paid Checkout event that names
-- the product. Keep a non-PII, append-only receipt keyed by Stripe object IDs so
-- a late grant cannot revive access that was already refunded or disputed.
create table if not exists entitlement_event_tombstones (
  stripe_event_id text primary key references payment_webhook_events(stripe_event_id),
  event_type text not null,
  livemode boolean not null,
  stripe_created_at timestamptz not null,
  command_action text not null check (command_action in ('revoke', 'review')),
  stripe_payment_intent_id text,
  stripe_charge_id text,
  reason_code text not null,
  created_at timestamptz not null default now(),
  check (stripe_payment_intent_id is not null or stripe_charge_id is not null)
);

-- Crash-safe, non-PII delivery intents for the private operator mailbox. The
-- Stripe event identifier is never stored here: md5(event_id) is only an
-- idempotency lookup key and the visible reference is limited to its suffix.
create table if not exists payment_operator_alert_outbox (
  event_key text not null check (event_key ~ '^[a-f0-9]{32}$'),
  alert_kind text not null check (alert_kind in (
    'payment_completed', 'refund_event', 'dispute_event', 'fulfillment_attention'
  )),
  event_type text not null,
  event_ref_last8 text not null check (event_ref_last8 ~ '^[A-Za-z0-9_]{1,8}$'),
  livemode boolean not null,
  product_code text check (product_code in ('resume_pro', 'rental_application_pro', 'pay_evidence_pro')),
  checkout_ref_last8 text check (checkout_ref_last8 ~ '^[A-Za-z0-9_]{1,8}$'),
  payment_intent_ref_last8 text check (payment_intent_ref_last8 ~ '^[A-Za-z0-9_]{1,8}$'),
  charge_ref_last8 text check (charge_ref_last8 ~ '^[A-Za-z0-9_]{1,8}$'),
  status text not null default 'pending' check (status in ('pending', 'sent')),
  attempts integer not null default 0 check (attempts >= 0),
  last_attempt_at timestamptz,
  sent_at timestamptz,
  lease_token_hash text check (lease_token_hash ~ '^[a-f0-9]{64}$'),
  lease_expires_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (event_key, alert_kind),
  check (
    (alert_kind = 'payment_completed' and event_type in (
      'checkout.session.completed', 'checkout.session.async_payment_succeeded'
    ))
    or (alert_kind = 'refund_event' and event_type in (
      'refund.created', 'refund.updated', 'refund.failed', 'charge.refunded'
    ))
    or (alert_kind = 'dispute_event' and event_type in (
      'charge.dispute.created', 'charge.dispute.updated',
      'charge.dispute.closed', 'charge.dispute.funds_reinstated'
    ))
    or (alert_kind = 'fulfillment_attention' and event_type in (
      'checkout.session.completed', 'checkout.session.async_payment_succeeded'
    ))
  ),
  check (
    (status = 'pending' and sent_at is null)
    or (status = 'sent' and sent_at is not null and lease_token_hash is null and lease_expires_at is null)
  )
);

alter table public.payment_operator_alert_outbox
  drop constraint if exists payment_operator_alert_outbox_product_code_check;
alter table public.payment_operator_alert_outbox
  add constraint payment_operator_alert_outbox_product_code_check
  check (product_code in ('resume_pro', 'rental_application_pro', 'pay_evidence_pro'));

drop function if exists record_payment_operator_alert_intent(text, text, boolean);

create or replace function record_payment_operator_alert_intent(
  p_event_id text,
  p_event_type text,
  p_livemode boolean,
  p_action text
)
returns boolean
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_alert_kind text;
begin
  v_alert_kind := case
    when p_event_type in ('checkout.session.completed', 'checkout.session.async_payment_succeeded')
      and p_action = 'grant' then 'payment_completed'
    when p_event_type in ('refund.created', 'refund.updated', 'refund.failed', 'charge.refunded') then 'refund_event'
    when p_event_type in ('charge.dispute.created', 'charge.dispute.updated', 'charge.dispute.closed', 'charge.dispute.funds_reinstated') then 'dispute_event'
  end;

  if v_alert_kind is null then return false; end if;
  if p_event_id is null or p_event_id !~ '^evt_[A-Za-z0-9]+$' or p_livemode is null then
    raise exception 'Invalid payment operator alert intent';
  end if;

  insert into public.payment_operator_alert_outbox (
    event_key, alert_kind, event_type, event_ref_last8, livemode
  ) values (
    md5(p_event_id), v_alert_kind, p_event_type, right(p_event_id, 8), p_livemode
  ) on conflict (event_key, alert_kind) do nothing;
  return true;
end;
$$;

drop function if exists enqueue_payment_operator_alert_failure(text, text, boolean, text, text, text);

create function enqueue_payment_operator_alert_failure(
  p_event_id text,
  p_event_type text,
  p_livemode boolean,
  p_product_code text,
  p_checkout_session_id text,
  p_payment_intent_id text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_event_id is null or p_event_id !~ '^evt_[A-Za-z0-9]+$'
    or p_event_type not in ('checkout.session.completed', 'checkout.session.async_payment_succeeded')
    or p_livemode is null or p_product_code <> 'resume_pro'
    or p_checkout_session_id is null or p_checkout_session_id !~ '^cs_(test|live)_[A-Za-z0-9]+$'
    or p_payment_intent_id is null or p_payment_intent_id !~ '^pi_[A-Za-z0-9]+$'
  then
    raise exception 'Invalid fulfillment alert intent';
  end if;

  insert into public.payment_operator_alert_outbox (
    event_key, alert_kind, event_type, event_ref_last8, livemode, product_code,
    checkout_ref_last8, payment_intent_ref_last8
  ) values (
    md5(p_event_id), 'fulfillment_attention', p_event_type, right(p_event_id, 8),
    p_livemode, p_product_code, right(p_checkout_session_id, 8), right(p_payment_intent_id, 8)
  ) on conflict (event_key, alert_kind) do nothing;
  return true;
end;
$$;

create or replace function claim_payment_operator_alert_intent(
  p_event_id text,
  p_alert_kind text,
  p_claim_token_hash text
)
returns table (
  claim_outcome text, alert_kind text, event_type text, event_ref_last8 text, product_code text,
  checkout_ref_last8 text, payment_intent_ref_last8 text, charge_ref_last8 text,
  attempts integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_intent public.payment_operator_alert_outbox%rowtype;
begin
  if p_event_id is null or p_event_id !~ '^evt_[A-Za-z0-9]+$'
    or p_alert_kind is null or p_alert_kind not in (
      'payment_completed', 'refund_event', 'dispute_event', 'fulfillment_attention'
    )
    or p_claim_token_hash is null or p_claim_token_hash !~ '^[a-f0-9]{64}$'
  then
    raise exception 'Invalid payment operator alert claim';
  end if;

  update public.payment_operator_alert_outbox alert
  set attempts = alert.attempts + 1,
      last_attempt_at = now(),
      lease_token_hash = p_claim_token_hash,
      lease_expires_at = now() + interval '2 minutes'
  where alert.event_key = md5(p_event_id)
    and alert.alert_kind = p_alert_kind
    and alert.status = 'pending'
    and (alert.lease_expires_at is null or alert.lease_expires_at < now())
  returning alert.* into v_intent;

  if found then
    return query select
      'claimed'::text, v_intent.alert_kind, v_intent.event_type,
      v_intent.event_ref_last8, v_intent.product_code,
      v_intent.checkout_ref_last8, v_intent.payment_intent_ref_last8,
      v_intent.charge_ref_last8, v_intent.attempts;
    return;
  end if;

  select alert.* into v_intent
  from public.payment_operator_alert_outbox alert
  where alert.event_key = md5(p_event_id)
    and alert.alert_kind = p_alert_kind;

  if not found then
    return query select 'missing'::text, null::text, null::text, null::text,
      null::text, null::text, null::text, null::text, null::integer;
  elsif v_intent.status = 'sent' then
    return query select 'sent'::text, null::text, null::text, v_intent.event_ref_last8,
      null::text, null::text, null::text, null::text, v_intent.attempts;
  else
    -- Another worker owns a live lease. Returning busy instead of an empty row
    -- prevents the webhook from acknowledging before that worker marks sent.
    return query select 'busy'::text, null::text, null::text, v_intent.event_ref_last8,
      null::text, null::text, null::text, null::text, v_intent.attempts;
  end if;
end;
$$;

create or replace function mark_payment_operator_alert_sent(
  p_event_id text, p_alert_kind text, p_claim_token_hash text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.payment_operator_alert_outbox alert
  set status = 'sent', sent_at = now(), lease_token_hash = null, lease_expires_at = null
  where alert.event_key = md5(p_event_id) and alert.alert_kind = p_alert_kind
    and alert.status = 'pending' and alert.lease_token_hash = p_claim_token_hash
    and p_event_id ~ '^evt_[A-Za-z0-9]+$' and p_claim_token_hash ~ '^[a-f0-9]{64}$';
  return found;
end;
$$;

create or replace function release_payment_operator_alert_claim(
  p_event_id text, p_alert_kind text, p_claim_token_hash text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.payment_operator_alert_outbox alert
  set lease_token_hash = null, lease_expires_at = null
  where alert.event_key = md5(p_event_id) and alert.alert_kind = p_alert_kind
    and alert.status = 'pending' and alert.lease_token_hash = p_claim_token_hash
    and p_event_id ~ '^evt_[A-Za-z0-9]+$' and p_claim_token_hash ~ '^[a-f0-9]{64}$';
  return found;
end;
$$;

create index if not exists entitlement_event_tombstones_payment_intent_idx
  on entitlement_event_tombstones (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

create index if not exists entitlement_event_tombstones_charge_idx
  on entitlement_event_tombstones (stripe_charge_id)
  where stripe_charge_id is not null;

create table if not exists stripe_payment_object_links (
  stripe_payment_intent_id text not null,
  stripe_charge_id text not null,
  first_seen_at timestamptz not null default now(),
  primary key (stripe_payment_intent_id, stripe_charge_id)
);

create or replace function prevent_entitlement_tombstone_mutation()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  raise exception 'entitlement_event_tombstones is append-only';
end;
$$;

drop trigger if exists entitlement_event_tombstones_append_only on entitlement_event_tombstones;
create trigger entitlement_event_tombstones_append_only
before update or delete on entitlement_event_tombstones
for each row execute function prevent_entitlement_tombstone_mutation();

create or replace function apply_entitlement_event(
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
security invoker
set search_path = public, pg_temp
as $$
declare
  v_inserted_event_id text;
  v_entitlement_id bigint;
  v_current_status text;
  v_last_event_created_at timestamptz;
  v_should_apply boolean := true;
  v_status text;
  v_effective_action text := p_action;
  v_effective_event_id text := p_event_id;
  v_effective_event_created_at timestamptz := p_stripe_created_at;
  v_effective_payment_intent_id text := p_payment_intent_id;
  v_effective_charge_id text := p_charge_id;
  v_tombstone entitlement_event_tombstones%rowtype;
begin
  if p_event_id is null
    or p_event_id !~ '^evt_[A-Za-z0-9]+$'
    or p_event_type is null
    or p_event_type not in (
      'checkout.session.completed',
      'checkout.session.async_payment_succeeded',
      'checkout.session.async_payment_failed',
      'refund.created',
      'refund.updated',
      'refund.failed',
      'charge.refunded',
      'charge.dispute.created',
      'charge.dispute.updated',
      'charge.dispute.closed',
      'charge.dispute.funds_reinstated'
    )
    or p_livemode is null
    or p_stripe_created_at is null
    or p_action is null
    or p_action not in ('grant', 'revoke', 'review')
    or p_reason is null
    or p_reason not in (
      'checkout_requires_review',
      'async_payment_failed',
      'async_payment_succeeded',
      'checkout_paid',
      'refund_succeeded_requires_amount_check',
      'refund_status_requires_review',
      'charge_fully_refunded',
      'charge_partially_refunded',
      'dispute_opened',
      'dispute_won_or_funds_reinstated',
      'dispute_lost',
      'dispute_status_requires_review'
    )
    or (p_product_code is not null and p_product_code not in ('resume_pro', 'rental_application_pro', 'pay_evidence_pro'))
    or (p_checkout_session_id is not null and p_checkout_session_id !~ '^cs_(test|live)_[A-Za-z0-9]+$')
    or (p_checkout_session_id is not null and p_livemode and p_checkout_session_id !~ '^cs_live_')
    or (p_checkout_session_id is not null and not p_livemode and p_checkout_session_id !~ '^cs_test_')
    or (p_payment_intent_id is not null and p_payment_intent_id !~ '^pi_[A-Za-z0-9]+$')
    or (p_charge_id is not null and p_charge_id !~ '^ch_[A-Za-z0-9]+$')
    or (p_customer_id is not null and p_customer_id !~ '^cus_[A-Za-z0-9]+$')
    or (p_checkout_session_id is null and p_payment_intent_id is null and p_charge_id is null)
    or (
      p_event_type in (
        'checkout.session.completed',
        'checkout.session.async_payment_succeeded',
        'checkout.session.async_payment_failed'
      )
      and (p_product_code is null or p_checkout_session_id is null)
    )
    or (
      p_event_type in (
        'refund.created',
        'refund.updated',
        'refund.failed',
        'charge.refunded',
        'charge.dispute.created',
        'charge.dispute.updated',
        'charge.dispute.closed',
        'charge.dispute.funds_reinstated'
      )
      and (
        p_product_code is not null
        or p_checkout_session_id is not null
        or (p_payment_intent_id is null and p_charge_id is null)
      )
    )
    or (
      p_action = 'grant'
      and p_event_type in ('charge.dispute.closed', 'charge.dispute.funds_reinstated')
      and (
        p_reason is distinct from 'dispute_won_or_funds_reinstated'
        or p_product_code is not null
        or p_checkout_session_id is not null
      )
    )
    or (
      p_action = 'grant'
      and p_event_type = 'charge.dispute.updated'
      and p_reason = 'dispute_won_or_funds_reinstated'
      and (p_product_code is not null or p_checkout_session_id is not null)
    )
    or not (
      (p_event_type = 'checkout.session.completed' and (
        (p_action = 'grant' and p_reason = 'checkout_paid')
        or (p_action = 'review' and p_reason = 'checkout_requires_review')
      ))
      or (p_event_type = 'checkout.session.async_payment_succeeded'
        and p_action = 'grant' and p_reason = 'async_payment_succeeded')
      or (p_event_type = 'checkout.session.async_payment_failed'
        and p_action = 'revoke' and p_reason = 'async_payment_failed')
      or (p_event_type in ('refund.created', 'refund.updated')
        and p_action = 'review'
        and p_reason in ('refund_succeeded_requires_amount_check', 'refund_status_requires_review'))
      or (p_event_type = 'refund.failed'
        and p_action = 'review' and p_reason = 'refund_status_requires_review')
      or (p_event_type = 'charge.refunded' and (
        (p_action = 'revoke' and p_reason = 'charge_fully_refunded')
        or (p_action = 'review' and p_reason = 'charge_partially_refunded')
      ))
      or (p_event_type = 'charge.dispute.created'
        and p_action = 'revoke' and p_reason = 'dispute_opened')
      or (p_event_type = 'charge.dispute.updated' and (
        (p_action = 'grant' and p_reason = 'dispute_won_or_funds_reinstated')
        or (p_action = 'review' and p_reason = 'dispute_status_requires_review')
      ))
      or (p_event_type = 'charge.dispute.closed' and (
        (p_action = 'grant' and p_reason = 'dispute_won_or_funds_reinstated')
        or (p_action = 'revoke' and p_reason = 'dispute_lost')
        or (p_action = 'review' and p_reason = 'dispute_status_requires_review')
      ))
      or (p_event_type = 'charge.dispute.funds_reinstated'
        and p_action = 'grant' and p_reason = 'dispute_won_or_funds_reinstated')
    )
  then
    raise exception 'Invalid entitlement event contract';
  end if;

  -- A paid Checkout knows both its PaymentIntent and latest Charge, while a
  -- refund/dispute can arrive with only one of them. Lock every known payment
  -- object in stable lexical order so PI-only and charge-only delivery races
  -- serialize with the grant transaction without deadlocking each other.
  if p_payment_intent_id is not null and p_charge_id is not null then
    perform pg_advisory_xact_lock(hashtext(least(
      'payment-intent:' || p_payment_intent_id,
      'charge:' || p_charge_id
    )));
    perform pg_advisory_xact_lock(hashtext(greatest(
      'payment-intent:' || p_payment_intent_id,
      'charge:' || p_charge_id
    )));
  elsif p_payment_intent_id is not null then
    perform pg_advisory_xact_lock(hashtext('payment-intent:' || p_payment_intent_id));
  elsif p_charge_id is not null then
    perform pg_advisory_xact_lock(hashtext('charge:' || p_charge_id));
  else
    perform pg_advisory_xact_lock(hashtext('checkout:' || p_checkout_session_id));
  end if;

  insert into payment_webhook_events (
    stripe_event_id,
    event_type,
    livemode,
    stripe_created_at,
    command_action,
    processing_status
  ) values (
    p_event_id,
    p_event_type,
    p_livemode,
    p_stripe_created_at,
    p_action,
    'processing'
  )
  on conflict (stripe_event_id) do nothing
  returning stripe_event_id into v_inserted_event_id;

  -- The delivery intent is part of the same transaction as the receipt and
  -- entitlement mutation. A duplicate signed Stripe delivery can backfill an
  -- intent created before this migration, but cannot create a second one.
  perform public.record_payment_operator_alert_intent(
    p_event_id,
    p_event_type,
    p_livemode,
    p_action
  );

  if v_inserted_event_id is not null
    and p_payment_intent_id is not null
    and p_charge_id is not null
  then
    insert into stripe_payment_object_links (
      stripe_payment_intent_id,
      stripe_charge_id
    ) values (
      p_payment_intent_id,
      p_charge_id
    ) on conflict on constraint stripe_payment_object_links_pkey do nothing;
  end if;

  if v_inserted_event_id is not null and p_action in ('revoke', 'review') then
    insert into entitlement_event_tombstones (
      stripe_event_id,
      event_type,
      livemode,
      stripe_created_at,
      command_action,
      stripe_payment_intent_id,
      stripe_charge_id,
      reason_code
    ) values (
      p_event_id,
      p_event_type,
      p_livemode,
      p_stripe_created_at,
      p_action,
      p_payment_intent_id,
      p_charge_id,
      p_reason
    );
  end if;

  select
    entitlement.id,
    entitlement.status,
    entitlement.last_stripe_event_created_at
  into
    v_entitlement_id,
    v_current_status,
    v_last_event_created_at
  from purchase_entitlements entitlement
  where (p_checkout_session_id is not null and entitlement.stripe_checkout_session_id = p_checkout_session_id)
     or (p_payment_intent_id is not null and entitlement.stripe_payment_intent_id = p_payment_intent_id)
     or (p_charge_id is not null and entitlement.stripe_charge_id = p_charge_id)
  order by entitlement.id
  limit 1
  for update;

  if v_inserted_event_id is null then
    return query
    select
      'duplicate'::text,
      entitlement.id,
      entitlement.product_code,
      entitlement.status,
      entitlement.stripe_checkout_session_id,
      entitlement.stripe_payment_intent_id,
      entitlement.stripe_charge_id,
      entitlement.stripe_customer_id,
      entitlement.granted_at,
      entitlement.revoked_at
    from purchase_entitlements entitlement
    where entitlement.id = v_entitlement_id;
    if not found then
      return query select
        'duplicate'::text,
        null::bigint,
        null::text,
        null::text,
        null::text,
        null::text,
        null::text,
        null::text,
        null::timestamptz,
        null::timestamptz;
    end if;
    return;
  end if;

  select tombstone.* into v_tombstone
  from entitlement_event_tombstones tombstone
  where tombstone.livemode is not distinct from p_livemode
    and (
      (p_payment_intent_id is not null and tombstone.stripe_payment_intent_id = p_payment_intent_id)
      or (p_charge_id is not null and tombstone.stripe_charge_id = p_charge_id)
      or (
        p_payment_intent_id is not null
        and tombstone.stripe_charge_id is not null
        and exists (
          select 1 from stripe_payment_object_links link
          where link.stripe_payment_intent_id = p_payment_intent_id
            and link.stripe_charge_id = tombstone.stripe_charge_id
        )
      )
      or (
        p_charge_id is not null
        and tombstone.stripe_payment_intent_id is not null
        and exists (
          select 1 from stripe_payment_object_links link
          where link.stripe_charge_id = p_charge_id
            and link.stripe_payment_intent_id = tombstone.stripe_payment_intent_id
        )
      )
    )
  order by
    tombstone.stripe_created_at desc,
    case tombstone.command_action when 'revoke' then 3 else 2 end desc,
    tombstone.stripe_event_id desc
  limit 1;

  if v_tombstone.stripe_event_id is not null
    and (
      v_tombstone.stripe_created_at > p_stripe_created_at
      or (
        v_tombstone.stripe_created_at = p_stripe_created_at
        and case v_tombstone.command_action when 'revoke' then 3 else 2 end
          > case p_action when 'revoke' then 3 when 'review' then 2 else 1 end
      )
    )
  then
    v_effective_action := v_tombstone.command_action;
    v_effective_event_id := v_tombstone.stripe_event_id;
    v_effective_event_created_at := v_tombstone.stripe_created_at;
    v_effective_payment_intent_id := coalesce(p_payment_intent_id, v_tombstone.stripe_payment_intent_id);
    v_effective_charge_id := coalesce(p_charge_id, v_tombstone.stripe_charge_id);
  end if;

  v_status := case v_effective_action
    when 'grant' then 'active'
    when 'revoke' then 'revoked'
    else 'review'
  end;

  if v_entitlement_id is not null then
    -- A review event must never weaken an already revoked entitlement. Stripe
    -- can deliver refund.created/refund.updated after charge.refunded, and both
    -- states block access, but preserving revoked makes the completed refund
    -- authoritative. A later explicit grant (for example a won dispute) can
    -- still restore access.
    if v_current_status = 'revoked' and v_effective_action = 'review' then
      v_should_apply := false;
    else
      -- Stripe does not guarantee webhook delivery order. A newer event wins.
      -- When two events share Stripe's second-level timestamp, prefer the safer
      -- state: revoked, then review, then active.
      v_should_apply := v_effective_event_created_at > v_last_event_created_at
        or (
          v_effective_event_created_at = v_last_event_created_at
          and case v_effective_action
            when 'revoke' then 3
            when 'review' then 2
            else 1
          end > case v_current_status
            when 'revoked' then 3
            when 'review' then 2
            else 1
          end
        );
    end if;
  end if;

  if v_entitlement_id is null then
    if p_product_code is null then
      if p_action = 'grant' then
        raise exception 'A recovery grant requires an existing entitlement match';
      end if;

      update payment_webhook_events
      set processing_status = 'processed', failure_code = null, processed_at = now()
      where stripe_event_id = p_event_id;

      return query select
        'tombstoned'::text,
        null::bigint,
        null::text,
        null::text,
        null::text,
        p_payment_intent_id,
        p_charge_id,
        null::text,
        null::timestamptz,
        null::timestamptz;
      return;
    end if;

    insert into purchase_entitlements (
      product_code,
      status,
      stripe_checkout_session_id,
      stripe_payment_intent_id,
      stripe_charge_id,
      stripe_customer_id,
      last_stripe_event_id,
      last_stripe_event_created_at,
      granted_at,
      revoked_at
    ) values (
      p_product_code,
      v_status,
      p_checkout_session_id,
      v_effective_payment_intent_id,
      v_effective_charge_id,
      p_customer_id,
      v_effective_event_id,
      v_effective_event_created_at,
      case when v_status = 'active' then now() end,
      case when v_status = 'revoked' then now() end
    )
    returning purchase_entitlements.id into v_entitlement_id;
  elsif v_should_apply then
    update purchase_entitlements entitlement
    set
      status = v_status,
      stripe_checkout_session_id = coalesce(entitlement.stripe_checkout_session_id, p_checkout_session_id),
      stripe_payment_intent_id = coalesce(entitlement.stripe_payment_intent_id, v_effective_payment_intent_id),
      stripe_charge_id = coalesce(entitlement.stripe_charge_id, v_effective_charge_id),
      stripe_customer_id = coalesce(entitlement.stripe_customer_id, p_customer_id),
      last_stripe_event_id = v_effective_event_id,
      last_stripe_event_created_at = v_effective_event_created_at,
      granted_at = case when v_status = 'active' then coalesce(entitlement.granted_at, now()) else entitlement.granted_at end,
      revoked_at = case when v_status = 'revoked' then now() when v_status = 'active' then null else entitlement.revoked_at end,
      updated_at = now()
    where entitlement.id = v_entitlement_id;
  end if;

  update payment_webhook_events
  set
    processing_status = 'processed',
    failure_code = null,
    processed_at = now()
  where stripe_event_id = p_event_id;

  return query
  select
    case when v_should_apply then 'processed' else 'ignored_stale' end::text,
    entitlement.id,
    entitlement.product_code,
    entitlement.status,
    entitlement.stripe_checkout_session_id,
    entitlement.stripe_payment_intent_id,
    entitlement.stripe_charge_id,
    entitlement.stripe_customer_id,
    entitlement.granted_at,
    entitlement.revoked_at
  from purchase_entitlements entitlement
  where entitlement.id = v_entitlement_id;
end;
$$;

-- Security requirements for the future adapter:
-- 1. Never store raw restore tokens; persist only a SHA-256 hash.
-- 2. Compute buyer_email_hmac server-side with a separate secret so raw emails are not searchable in the table.
-- 3. Do not grant the application role direct table DML; use only the guarded
--    SECURITY DEFINER wrappers installed by docs/first-sale-gate.sql.
-- 4. Insert payment_webhook_events first; a duplicate primary key means the Stripe event was already handled.
-- 5. Do not store the full Stripe webhook payload unless a separate retention and privacy policy is approved.
-- 6. Preserve last_stripe_event_created_at so delayed events cannot overwrite a newer entitlement state.
-- 7. Preserve revoked when later refund lifecycle events only request manual review.
-- 8. Persist refund/dispute tombstones before any matching grant and compare by
--    Stripe created_at, with revoke > review > active for same-second events.
-- 9. Store only Stripe object identifiers and reason codes in entitlement
--    records; operator outbox rows store only hashed lookup keys and suffixes.
-- 10. Never store customer email, card data, a full Stripe ID, arbitrary JSON
--     or a webhook payload in payment_operator_alert_outbox.
-- 11. A Checkout Session binds one browser nonce hash. The same nonce can
--     recover a lost response while release permanently closes that binding.

revoke all on table payment_operator_alert_outbox from public;
revoke all on table purchase_access_sessions from public;
revoke all on table purchase_restore_activations from public;
revoke insert, update, delete on purchase_checkout_activations from public;
revoke insert, update, delete on entitlement_event_tombstones, stripe_payment_object_links from public;
revoke all on function prevent_entitlement_tombstone_mutation() from public;
revoke all on function record_payment_operator_alert_intent(text, text, boolean, text) from public;
revoke all on function enqueue_payment_operator_alert_failure(text, text, boolean, text, text, text) from public;
revoke all on function claim_payment_operator_alert_intent(text, text, text) from public;
revoke all on function mark_payment_operator_alert_sent(text, text, text) from public;
revoke all on function release_payment_operator_alert_claim(text, text, text) from public;
revoke all on function consume_checkout_activation(text, text, text, text) from public;
revoke all on function release_checkout_activation(bigint, text) from public;
revoke all on function find_active_purchase_entitlement_by_checkout(text, text) from public;
revoke all on function find_active_purchase_entitlement_by_id(bigint, text) from public;

insert into schema_migrations (version)
values ('20260818_entitlement_baseline_v1')
on conflict (version) do nothing;

insert into schema_migrations (version)
values ('20260823_entitlement_negative_event_tombstones_v1')
on conflict (version) do nothing;

insert into schema_migrations (version)
values ('20260823_payment_operator_alert_outbox_v1')
on conflict (version) do nothing;

insert into schema_migrations (version)
values ('20260823_checkout_activation_once_v1')
on conflict (version) do nothing;

insert into schema_migrations (version)
values ('20260823_checkout_activation_nonce_v1')
on conflict (version) do nothing;

insert into schema_migrations (version)
values ('20260823_purchase_access_sessions_v1')
on conflict (version) do nothing;

insert into schema_migrations (version)
values ('20260823_restore_activation_nonce_v1')
on conflict (version) do nothing;

insert into schema_migrations (version)
values ('20260830_pay_evidence_entitlement_v1')
on conflict (version) do nothing;

commit;
