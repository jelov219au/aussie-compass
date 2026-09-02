-- Owner-only recovery for a fully refunded Resume Pro verification purchase.
-- Stripe must be verified separately before calling this function. The database
-- independently requires the exact LOCKED sale and its processed full-refund
-- receipt/tombstone, so ordinary paid sales remain locked.
begin;

do $$
begin
  if not exists (
    select 1 from public.schema_migrations
    where version = '20260823_payment_least_privilege_roles_v1'
  ) then
    raise exception 'payment least-privilege roles v1 must be applied first';
  end if;
  if not exists (select 1 from pg_roles where rolname = 'hoju_migration_owner')
    or not exists (select 1 from pg_roles where rolname = 'hoju_owner_operator')
  then
    raise exception 'required payment owner roles are missing';
  end if;
  if exists (select 1 from public.first_sale_gates where state = 'RESERVED') then
    raise exception 'a first-sale reservation is in flight';
  end if;
end;
$$;

set local role hoju_migration_owner;

create or replace function public.reopen_fully_refunded_resume_verification_sale(
  p_generation bigint,
  p_checkout_session_id text,
  p_payment_intent_id text,
  p_charge_id text,
  p_owner_approval_reference text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_gate public.first_sale_gates%rowtype;
  v_approval_reference text;
  v_refund_event_id text;
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

  -- This is a one-generation recovery, not a reusable customer-refund path.
  if p_generation is distinct from 1
    or p_checkout_session_id is null
    or p_checkout_session_id !~ '^cs_live_[A-Za-z0-9]+$'
    or p_payment_intent_id is null
    or p_payment_intent_id !~ '^pi_[A-Za-z0-9]+$'
    or p_charge_id is null
    or p_charge_id !~ '^ch_[A-Za-z0-9]+$'
    or p_owner_approval_reference is null
    or v_approval_reference = ''
    or v_approval_reference !~ '[[:alnum:]]'
    or length(v_approval_reference) < 12
    or length(v_approval_reference) > 120
  then
    return false;
  end if;

  perform pg_advisory_xact_lock(hashtext('first-sale:resume_pro'));

  select * into v_gate
  from public.first_sale_gates
  where product_code = 'resume_pro'
  for update;

  if v_gate.state is distinct from 'LOCKED'
    or v_gate.generation is distinct from p_generation
    or v_gate.environment is distinct from 'live'
    or v_gate.currency is distinct from 'aud'
    or v_gate.expected_amount_cents is distinct from 1990
    or v_gate.stripe_checkout_session_id is distinct from p_checkout_session_id
    or v_gate.sold_at is null
  then
    return false;
  end if;

  select entitlement.last_stripe_event_id into v_refund_event_id
  from public.purchase_entitlements entitlement
  join public.payment_webhook_events event
    on event.stripe_event_id = entitlement.last_stripe_event_id
  join public.entitlement_event_tombstones tombstone
    on tombstone.stripe_event_id = event.stripe_event_id
  where entitlement.product_code = 'resume_pro'
    and entitlement.status = 'revoked'
    and entitlement.stripe_checkout_session_id = p_checkout_session_id
    and entitlement.stripe_payment_intent_id = p_payment_intent_id
    and entitlement.stripe_charge_id = p_charge_id
    and entitlement.revoked_at is not null
    and entitlement.last_stripe_event_created_at >= v_gate.sold_at
    and event.event_type = 'charge.refunded'
    and event.livemode = true
    and event.command_action = 'revoke'
    and event.processing_status = 'processed'
    and event.failure_code is null
    and event.processed_at is not null
    and tombstone.event_type = 'charge.refunded'
    and tombstone.livemode = true
    and tombstone.command_action = 'revoke'
    and tombstone.reason_code = 'charge_fully_refunded'
    and tombstone.stripe_payment_intent_id = p_payment_intent_id
    and tombstone.stripe_charge_id = p_charge_id
    and tombstone.stripe_created_at = event.stripe_created_at;

  if v_refund_event_id is null then
    return false;
  end if;

  update public.first_sale_gates
  set state = 'OPEN',
      stripe_checkout_session_id = null,
      sold_at = null,
      sold_event_ref_last8 = null,
      updated_at = now()
  where product_code = 'resume_pro';

  insert into public.first_sale_gate_events (
    dedupe_key, gate_version, product_code, generation, from_state, to_state,
    operating_date, environment, currency, expected_amount_cents, actor_type,
    reason_code, stripe_reference_last8, approval_reference, evidence_status,
    cash_difference_cents, payout_status, schema_version
  ) values (
    'owner-refund-reopen:resume_pro:' || p_generation,
    'first-sale-v1', 'resume_pro', p_generation, 'LOCKED', 'OPEN',
    (now() at time zone 'Australia/Sydney')::date, 'live', 'aud', 1990,
    'owner', 'verified_internal_full_refund_reopen',
    right(p_checkout_session_id, 8), v_approval_reference, 'PASS', null,
    'pending', '20260902_resume_refunded_verification_reopen_v1'
  );

  return true;
end;
$$;

revoke all on function public.reopen_fully_refunded_resume_verification_sale(
  bigint, text, text, text, text
) from public, hoju_app_runtime;
grant execute on function public.reopen_fully_refunded_resume_verification_sale(
  bigint, text, text, text, text
) to hoju_owner_operator;

reset role;

insert into public.schema_migrations (version)
values ('20260902_resume_refunded_verification_reopen_v1')
on conflict (version) do nothing;

commit;
