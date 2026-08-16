-- Hoju Compass Resume Pro entitlement storage contract.
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
  product_code text not null check (product_code in ('resume_pro')),
  status text not null check (status in ('active', 'revoked', 'review')),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  stripe_charge_id text unique,
  stripe_customer_id text,
  buyer_email_hmac text,
  last_stripe_event_id text not null references payment_webhook_events(stripe_event_id),
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

-- Security requirements for the future adapter:
-- 1. Never store raw restore tokens; persist only a SHA-256 hash.
-- 2. Compute buyer_email_hmac server-side with a separate secret so raw emails are not searchable in the table.
-- 3. Give the application role only SELECT/INSERT/UPDATE on these tables.
-- 4. Insert payment_webhook_events first; a duplicate primary key means the Stripe event was already handled.
-- 5. Do not store the full Stripe webhook payload unless a separate retention and privacy policy is approved.
