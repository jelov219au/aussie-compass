-- Hoju Compass optional Web Push reminder storage.
-- Apply to the same private Neon database used by paid-product entitlements.

create table if not exists push_subscriptions (
  id bigserial primary key,
  public_id uuid not null unique,
  endpoint_hash char(64) not null unique,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  timezone varchar(64) not null,
  management_token_hash char(64) not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_success_at timestamptz,
  deactivated_at timestamptz
);

create table if not exists push_reminders (
  id bigserial primary key,
  subscription_id bigint not null references push_subscriptions(id) on delete cascade,
  reminder_key uuid not null,
  title varchar(80) not null,
  category varchar(30) not null,
  due_date date not null,
  lead_days smallint not null check (lead_days between 0 and 365),
  last_sent_for date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subscription_id, reminder_key)
);

create index if not exists push_reminders_due_idx
  on push_reminders (due_date, last_sent_for);

create index if not exists push_subscriptions_active_idx
  on push_subscriptions (active) where active = true;
