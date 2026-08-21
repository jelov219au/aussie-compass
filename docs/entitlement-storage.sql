-- Hoju Compass paid-product entitlement storage contract.
-- This is provider-neutral PostgreSQL DDL and is not connected to any live database.
-- Apply a Stripe event and its entitlement change in one database transaction.

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

create table if not exists purchase_entitlements (
  id bigint generated always as identity primary key,
  product_code text not null check (product_code in ('resume_pro', 'rental_application_pro', 'pay_evidence_pro', 'car_buy_pro')),
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
  check (product_code in ('resume_pro', 'rental_application_pro', 'pay_evidence_pro', 'car_buy_pro'));

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
as $$
declare
  v_inserted_event_id text;
  v_entitlement_id bigint;
  v_current_status text;
  v_last_event_created_at timestamptz;
  v_should_apply boolean := true;
  v_status text;
begin
  if p_action not in ('grant', 'revoke', 'review') then
    raise exception 'Unsupported entitlement action';
  end if;

  perform pg_advisory_xact_lock(hashtext(coalesce(
    p_payment_intent_id,
    p_checkout_session_id,
    p_charge_id,
    p_event_id
  )));

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
    return;
  end if;

  v_status := case p_action
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
    if v_current_status = 'revoked' and p_action = 'review' then
      v_should_apply := false;
    else
      -- Stripe does not guarantee webhook delivery order. A newer event wins.
      -- When two events share Stripe's second-level timestamp, prefer the safer
      -- state: revoked, then review, then active.
      v_should_apply := p_stripe_created_at > v_last_event_created_at
        or (
          p_stripe_created_at = v_last_event_created_at
          and case p_action
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
      raise exception 'No entitlement matches Stripe event %', p_event_id;
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
      p_payment_intent_id,
      p_charge_id,
      p_customer_id,
      p_event_id,
      p_stripe_created_at,
      case when v_status = 'active' then now() end,
      case when v_status = 'revoked' then now() end
    )
    returning purchase_entitlements.id into v_entitlement_id;
  elsif v_should_apply then
    update purchase_entitlements entitlement
    set
      status = v_status,
      stripe_checkout_session_id = coalesce(entitlement.stripe_checkout_session_id, p_checkout_session_id),
      stripe_payment_intent_id = coalesce(entitlement.stripe_payment_intent_id, p_payment_intent_id),
      stripe_charge_id = coalesce(entitlement.stripe_charge_id, p_charge_id),
      stripe_customer_id = coalesce(entitlement.stripe_customer_id, p_customer_id),
      last_stripe_event_id = p_event_id,
      last_stripe_event_created_at = p_stripe_created_at,
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
-- 3. Give the application role only SELECT/INSERT/UPDATE on these tables.
-- 4. Insert payment_webhook_events first; a duplicate primary key means the Stripe event was already handled.
-- 5. Do not store the full Stripe webhook payload unless a separate retention and privacy policy is approved.
-- 6. Preserve last_stripe_event_created_at so delayed events cannot overwrite a newer entitlement state.
-- 7. Preserve revoked when later refund lifecycle events only request manual review.
