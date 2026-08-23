-- Forward fix: qualify the PaymentIntent/Charge link conflict target inside
-- apply_entitlement_event. PL/pgSQL output columns use the same names, so an
-- unqualified ON CONFLICT column list raises SQLSTATE 42702 at runtime.
-- Apply with PAYMENTS_ENABLED=false after least-privilege roles v1.
begin;

do $$
begin
  if not exists (
    select 1 from public.schema_migrations
    where version = '20260823_payment_least_privilege_roles_v1'
  ) then
    raise exception 'payment least-privilege roles v1 must be applied first';
  end if;
end;
$$;

set role hoju_migration_owner;

do $$
declare
  v_signature regprocedure := to_regprocedure(
    'public.apply_entitlement_event(text,text,boolean,timestamptz,text,text,text,text,text,text,text)'
  );
  v_before text;
  v_after text;
  v_ambiguous text := 'on conflict (stripe_payment_intent_id, stripe_charge_id) do nothing';
  v_qualified text := 'on conflict on constraint stripe_payment_object_links_pkey do nothing';
begin
  if v_signature is null then
    raise exception 'apply_entitlement_event contract is missing';
  end if;

  select pg_get_functiondef(v_signature) into v_before;
  if position(v_qualified in lower(v_before)) > 0 then
    return;
  end if;
  if position(v_ambiguous in lower(v_before)) = 0 then
    raise exception 'unexpected apply_entitlement_event definition; forward fix not applied';
  end if;

  v_after := replace(v_before, v_ambiguous, v_qualified);
  if v_after is not distinct from v_before
    or position(v_ambiguous in lower(v_after)) > 0
    or position(v_qualified in lower(v_after)) = 0
  then
    raise exception 'entitlement link conflict target replacement failed';
  end if;

  execute v_after;
end;
$$;

reset role;

insert into public.schema_migrations (version)
values ('20260824_entitlement_link_conflict_v1')
on conflict (version) do nothing;

commit;
