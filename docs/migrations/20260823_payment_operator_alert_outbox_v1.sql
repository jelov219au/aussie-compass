-- Additive migration: first-sale charge linkage -> durable operator alert outbox.
-- Apply with PAYMENTS_ENABLED=false. Forward-fix only; do not delete alert evidence.
begin;

do $$
begin
  if not exists (
    select 1 from public.schema_migrations
    where version = '20260823_first_sale_gate_charge_link_v2'
  ) then
    raise exception 'first-sale charge-link v2 must be applied first';
  end if;
end;
$$;

create table if not exists public.payment_operator_alert_outbox (
  event_key text not null check (event_key ~ '^[a-f0-9]{32}$'),
  alert_kind text not null check (alert_kind in ('payment_completed', 'refund_event', 'dispute_event', 'fulfillment_attention')),
  event_type text not null,
  event_ref_last8 text not null check (event_ref_last8 ~ '^[A-Za-z0-9_]{1,8}$'),
  livemode boolean not null,
  product_code text check (product_code in ('resume_pro', 'rental_application_pro')),
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
  primary key (event_key, alert_kind)
);

do $$
begin
  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conrelid = 'public.payment_operator_alert_outbox'::regclass
      and conname = 'payment_operator_alert_outbox_kind_type_check_v1'
  ) then
    alter table public.payment_operator_alert_outbox
      add constraint payment_operator_alert_outbox_kind_type_check_v1 check (
        (alert_kind = 'payment_completed' and event_type in ('checkout.session.completed', 'checkout.session.async_payment_succeeded'))
        or (alert_kind = 'refund_event' and event_type in ('refund.created', 'refund.updated', 'refund.failed', 'charge.refunded'))
        or (alert_kind = 'dispute_event' and event_type in ('charge.dispute.created', 'charge.dispute.updated', 'charge.dispute.closed', 'charge.dispute.funds_reinstated'))
        or (alert_kind = 'fulfillment_attention' and event_type in ('checkout.session.completed', 'checkout.session.async_payment_succeeded'))
      );
  end if;
  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conrelid = 'public.payment_operator_alert_outbox'::regclass
      and conname = 'payment_operator_alert_outbox_status_check_v1'
  ) then
    alter table public.payment_operator_alert_outbox
      add constraint payment_operator_alert_outbox_status_check_v1 check (
        (status = 'pending' and sent_at is null)
        or (status = 'sent' and sent_at is not null and lease_token_hash is null and lease_expires_at is null)
      );
  end if;
end;
$$;

create or replace function public.payment_operator_alert_from_receipt()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_alert_kind text;
begin
  v_alert_kind := case
    when new.event_type in ('checkout.session.completed', 'checkout.session.async_payment_succeeded')
      and new.command_action = 'grant' then 'payment_completed'
    when new.event_type in ('refund.created', 'refund.updated', 'refund.failed', 'charge.refunded') then 'refund_event'
    when new.event_type in ('charge.dispute.created', 'charge.dispute.updated', 'charge.dispute.closed', 'charge.dispute.funds_reinstated') then 'dispute_event'
    else null
  end;

  if v_alert_kind is not null then
    insert into public.payment_operator_alert_outbox (
      event_key, alert_kind, event_type, event_ref_last8, livemode
    ) values (
      md5(new.stripe_event_id), v_alert_kind, new.event_type,
      right(new.stripe_event_id, 8), new.livemode
    ) on conflict (event_key, alert_kind) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists payment_operator_alert_from_receipt on public.payment_webhook_events;
create trigger payment_operator_alert_from_receipt
after insert on public.payment_webhook_events
for each row execute function public.payment_operator_alert_from_receipt();

drop function if exists public.enqueue_payment_operator_alert_failure(text, text, boolean, text, text, text);

create function public.enqueue_payment_operator_alert_failure(
  p_event_id text, p_event_type text, p_livemode boolean, p_product_code text,
  p_checkout_session_id text, p_payment_intent_id text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_event_id is null or p_event_id !~ '^evt_[A-Za-z0-9]+$'
    or p_event_type is null or p_event_type not in ('checkout.session.completed', 'checkout.session.async_payment_succeeded')
    or p_livemode is null or p_product_code is null
    or p_product_code not in ('resume_pro', 'rental_application_pro')
    or p_checkout_session_id is null or p_checkout_session_id !~ '^cs_(test|live)_[A-Za-z0-9]+$'
    or p_payment_intent_id is null or p_payment_intent_id !~ '^pi_[A-Za-z0-9]+$'
  then
    raise exception 'Invalid fulfillment alert input';
  end if;

  insert into public.payment_operator_alert_outbox (
    event_key, alert_kind, event_type, event_ref_last8, livemode,
    product_code, checkout_ref_last8, payment_intent_ref_last8
  ) values (
    md5(p_event_id), 'fulfillment_attention', p_event_type, right(p_event_id, 8), p_livemode,
    p_product_code, right(p_checkout_session_id, 8), right(p_payment_intent_id, 8)
  ) on conflict (event_key, alert_kind) do nothing;
  return true;
end;
$$;

create or replace function public.claim_payment_operator_alert_intent(
  p_event_id text, p_alert_kind text, p_claim_token_hash text
)
returns table (
  claim_outcome text, alert_kind text, event_type text, event_ref_last8 text, product_code text,
  checkout_ref_last8 text, payment_intent_ref_last8 text, charge_ref_last8 text, attempts integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_intent public.payment_operator_alert_outbox%rowtype;
begin
  if p_event_id is null or p_event_id !~ '^evt_[A-Za-z0-9]+$'
    or p_alert_kind is null or p_alert_kind not in ('payment_completed', 'refund_event', 'dispute_event', 'fulfillment_attention')
    or p_claim_token_hash is null or p_claim_token_hash !~ '^[a-f0-9]{64}$'
  then
    raise exception 'Invalid payment operator alert claim';
  end if;

  update public.payment_operator_alert_outbox alert
  set attempts = alert.attempts + 1, last_attempt_at = now(),
      lease_token_hash = p_claim_token_hash, lease_expires_at = now() + interval '2 minutes'
  where alert.event_key = md5(p_event_id) and alert.alert_kind = p_alert_kind
    and alert.status = 'pending'
    and (alert.lease_expires_at is null or alert.lease_expires_at < now())
  returning alert.* into v_intent;

  if found then
    return query select 'claimed'::text, v_intent.alert_kind, v_intent.event_type,
      v_intent.event_ref_last8, v_intent.product_code, v_intent.checkout_ref_last8,
      v_intent.payment_intent_ref_last8, v_intent.charge_ref_last8, v_intent.attempts;
    return;
  end if;

  select alert.* into v_intent from public.payment_operator_alert_outbox alert
  where alert.event_key = md5(p_event_id) and alert.alert_kind = p_alert_kind;
  if not found then
    return query select 'missing'::text, null::text, null::text, null::text, null::text,
      null::text, null::text, null::text, null::integer;
  elsif v_intent.status = 'sent' then
    return query select 'sent'::text, null::text, null::text, v_intent.event_ref_last8, null::text,
      null::text, null::text, null::text, v_intent.attempts;
  else
    return query select 'busy'::text, null::text, null::text, v_intent.event_ref_last8, null::text,
      null::text, null::text, null::text, v_intent.attempts;
  end if;
end;
$$;

create or replace function public.mark_payment_operator_alert_sent(
  p_event_id text, p_alert_kind text, p_claim_token_hash text
)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_event_id is null or p_event_id !~ '^evt_[A-Za-z0-9]+$'
    or p_alert_kind is null or p_alert_kind not in ('payment_completed', 'refund_event', 'dispute_event', 'fulfillment_attention')
    or p_claim_token_hash is null or p_claim_token_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid payment operator alert completion';
  end if;
  update public.payment_operator_alert_outbox alert
  set status = 'sent', sent_at = now(), lease_token_hash = null, lease_expires_at = null
  where alert.event_key = md5(p_event_id) and alert.alert_kind = p_alert_kind
    and alert.status = 'pending' and alert.lease_token_hash = p_claim_token_hash;
  return found;
end;
$$;

create or replace function public.release_payment_operator_alert_claim(
  p_event_id text, p_alert_kind text, p_claim_token_hash text
)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_event_id is null or p_event_id !~ '^evt_[A-Za-z0-9]+$'
    or p_alert_kind is null or p_alert_kind not in ('payment_completed', 'refund_event', 'dispute_event', 'fulfillment_attention')
    or p_claim_token_hash is null or p_claim_token_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid payment operator alert release';
  end if;
  update public.payment_operator_alert_outbox alert
  set lease_token_hash = null, lease_expires_at = null
  where alert.event_key = md5(p_event_id) and alert.alert_kind = p_alert_kind
    and alert.status = 'pending' and alert.lease_token_hash = p_claim_token_hash;
  return found;
end;
$$;

revoke all on table public.payment_operator_alert_outbox from public;
revoke all on function public.payment_operator_alert_from_receipt() from public;
revoke all on function public.enqueue_payment_operator_alert_failure(text, text, boolean, text, text, text) from public;
revoke all on function public.claim_payment_operator_alert_intent(text, text, text) from public;
revoke all on function public.mark_payment_operator_alert_sent(text, text, text) from public;
revoke all on function public.release_payment_operator_alert_claim(text, text, text) from public;

insert into public.schema_migrations (version)
values ('20260823_payment_operator_alert_outbox_v1')
on conflict (version) do nothing;

commit;
