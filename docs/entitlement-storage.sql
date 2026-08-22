-- Hoju Compass paid-product entitlement storage contract.
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

create table if not exists purchase_entitlements (
  id bigint generated always as identity primary key,
  product_code text not null check (product_code in ('resume_pro', 'rental_application_pro')),
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
  check (product_code in ('resume_pro', 'rental_application_pro'));

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
    or (p_product_code is not null and p_product_code not in ('resume_pro', 'rental_application_pro'))
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
    ) on conflict (stripe_payment_intent_id, stripe_charge_id) do nothing;
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
-- 9. Store only Stripe object identifiers and reason codes; never webhook payloads.

revoke insert, update, delete on entitlement_event_tombstones, stripe_payment_object_links from public;
revoke all on function prevent_entitlement_tombstone_mutation() from public;

insert into schema_migrations (version)
values ('20260818_entitlement_baseline_v1')
on conflict (version) do nothing;

insert into schema_migrations (version)
values ('20260823_entitlement_negative_event_tombstones_v1')
on conflict (version) do nothing;

commit;
