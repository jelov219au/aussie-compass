-- Move the open Resume Pro first-sale contract from A$19.90 to A$9.90.
-- Apply only in an owner-approved production window while Resume Checkout is off.
-- Historical A$19.90 audit events remain valid evidence and are intentionally retained.

begin;

set local statement_timeout = '10s';
set local lock_timeout = '2s';

do $$
begin
  if current_database() is distinct from 'neondb'
    or current_user is distinct from 'neondb_owner'
  then
    raise exception 'Resume Pro price migration requires neondb_owner on neondb';
  end if;

  if exists (
    select 1 from public.schema_migrations
    where version = '20260911_resume_pro_price_990_v1'
  ) then
    raise exception '20260911_resume_pro_price_990_v1 is already applied';
  end if;

  if exists (select 1 from public.first_sale_gates where state = 'RESERVED') then
    raise exception 'A first-sale reservation is in flight';
  end if;

  if not exists (
    select 1 from public.first_sale_gates
    where product_code = 'resume_pro'
      and state = 'OPEN'
      and environment = 'live'
      and currency = 'aud'
      and expected_amount_cents = 1990
  ) then
    raise exception 'The open A$19.90 Resume Pro gate is required before this price migration';
  end if;

  if to_regprocedure('public.claim_first_sale_reservation(text,text,timestamptz,text,text,integer)') is null
    or to_regprocedure('public.apply_first_sale_paid_event(text,text,boolean,timestamptz,text,text,integer,text,text,text,text,text)') is null
  then
    raise exception 'The current first-sale functions are required';
  end if;
end;
$$;

alter table public.first_sale_gates
  drop constraint if exists first_sale_gates_expected_amount_cents_check;

update public.first_sale_gates
set expected_amount_cents = 990,
    updated_at = now()
where product_code = 'resume_pro'
  and state = 'OPEN'
  and environment = 'live'
  and currency = 'aud'
  and expected_amount_cents = 1990;

alter table public.first_sale_gates
  add constraint first_sale_gates_expected_amount_cents_check
    check (
      (product_code = 'resume_pro' and expected_amount_cents = 990)
      or (product_code = 'rental_application_pro' and expected_amount_cents = 1490)
      or (product_code = 'pay_evidence_pro' and expected_amount_cents = 990)
      or (product_code = 'eofy_pro' and expected_amount_cents = 990)
      or (product_code = 'leaving_australia_pro' and expected_amount_cents = 1290)
      or (product_code = 'car_purchase_pro' and expected_amount_cents = 1490)
    );

alter table public.first_sale_gate_events
  drop constraint if exists first_sale_gate_events_expected_amount_cents_check;

alter table public.first_sale_gate_events
  add constraint first_sale_gate_events_expected_amount_cents_check
    check (
      -- Old Resume Pro records are immutable accounting and refund evidence.
      (product_code = 'resume_pro' and expected_amount_cents in (990, 1990))
      or (product_code = 'rental_application_pro' and expected_amount_cents = 1490)
      or (product_code = 'pay_evidence_pro' and expected_amount_cents = 990)
      or (product_code = 'eofy_pro' and expected_amount_cents = 990)
      or (product_code = 'leaving_australia_pro' and expected_amount_cents = 1290)
      or (product_code = 'car_purchase_pro' and expected_amount_cents = 1490)
    );

-- Preserve the reviewed, security-definer implementations and change only the
-- exact Resume Pro amount guard in their current definitions.
set local role hoju_migration_owner;

do $$
declare
  v_signature text;
  v_definition text;
  v_replacements integer;
begin
  foreach v_signature in array array[
    'public.claim_first_sale_reservation(text,text,timestamptz,text,text,integer)',
    'public.apply_first_sale_paid_event(text,text,boolean,timestamptz,text,text,integer,text,text,text,text,text)'
  ]
  loop
    select pg_get_functiondef(to_regprocedure(v_signature)) into v_definition;
    v_replacements := (length(v_definition) - length(replace(v_definition, 'when ''resume_pro'' then 1990', '')))
      / length('when ''resume_pro'' then 1990');
    if v_replacements <> 1 then
      raise exception 'Unexpected Resume Pro amount guard shape in %', v_signature;
    end if;
    execute replace(v_definition, 'when ''resume_pro'' then 1990', 'when ''resume_pro'' then 990');
  end loop;
end;
$$;

reset role;

insert into public.schema_migrations (version)
values ('20260911_resume_pro_price_990_v1')
on conflict (version) do nothing;

commit;
