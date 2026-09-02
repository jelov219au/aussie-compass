-- Fresh bootstrap may retain auto-named copies of the same amount CHECK.
-- Remove only exact, validated duplicates BEFORE Pay Evidence gate expansion.
-- Preserve the canonical amount CHECK and every state/audit constraint.
begin;
set local statement_timeout = '10s';
set local lock_timeout = '2s';
do $$
begin
  if current_database() <> 'neondb' or current_user <> 'neondb_owner' then
    raise exception 'Gate constraint prerequisite requires neondb/neondb_owner';
  end if;
  if not exists (
    select 1 from public.schema_migrations
    where version = '20260829_rental_first_sale_gate_v1'
  ) then raise exception 'Existing named gate constraints must be installed first'; end if;
end;
$$;
lock table public.first_sale_gates, public.first_sale_gate_events in access exclusive mode;
do $$
declare
  v_table text;
  v_old pg_constraint%rowtype;
  v_named pg_constraint%rowtype;
  v_definition text;
  v_mentions_product_code boolean;
  v_mentions_expected_amount boolean;
begin
  if exists (select 1 from public.first_sale_gates where state = 'RESERVED') then
    raise exception 'Gate constraint prerequisite refuses an in-flight reservation';
  end if;
  foreach v_table in array array['first_sale_gates', 'first_sale_gate_events']
  loop
    select * into v_old from pg_constraint
      where conrelid = to_regclass('public.' || v_table) and conname = v_table || '_check';
    if not found then continue; end if;
    v_definition := pg_get_constraintdef(v_old.oid);
    v_mentions_product_code := position('product_code' in lower(v_definition)) > 0;
    v_mentions_expected_amount := position('expected_amount_cents' in lower(v_definition)) > 0;

    -- PostgreSQL can assign the same generic _check name to an unrelated
    -- table-level state/audit invariant. It is not an amount duplicate and
    -- must remain untouched. A constraint that mentions either amount key is
    -- amount-like, so an incomplete or non-canonical shape must fail closed.
    if not v_mentions_product_code and not v_mentions_expected_amount then
      continue;
    end if;
    if not v_mentions_product_code or not v_mentions_expected_amount then
      raise exception 'Suspicious amount-like gate constraint; refusing duplicate removal';
    end if;

    select * into v_named from pg_constraint
      where conrelid = v_old.conrelid and conname = v_table || '_expected_amount_cents_check';
    if not found then raise exception 'Canonical amount constraint missing'; end if;
    if v_old.contype <> 'c' or v_named.contype <> 'c'
      or not v_old.convalidated or not v_named.convalidated
      or v_old.connoinherit is distinct from v_named.connoinherit
      or v_definition is distinct from pg_get_constraintdef(v_named.oid)
      or position('resume_pro' in v_definition) = 0
      or position('rental_application_pro' in v_definition) = 0
    then raise exception 'Unexpected gate constraint; refusing duplicate removal'; end if;
    execute format('alter table public.%I drop constraint %I', v_table, v_old.conname);
    if not exists (
      select 1 from pg_constraint where oid = v_named.oid and convalidated
        and pg_get_constraintdef(oid) = v_definition
    ) then raise exception 'Canonical amount constraint was not preserved'; end if;
  end loop;
end;
$$;
insert into public.schema_migrations(version)
values ('20260831_pay_evidence_gate_constraint_prerequisite_v1')
on conflict (version) do nothing;
commit;
