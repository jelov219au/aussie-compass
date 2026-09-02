-- Repair only the reviewed alert function reset by the Pay Evidence baseline.
-- Restore NULL guards, supported products, and the runtime's existing EXECUTE.
-- No alert is enqueued by this migration. No table/login privilege is granted.
begin;
set local statement_timeout = '10s';
set local lock_timeout = '2s';
do $$
begin
  if current_database() <> 'neondb' or current_user <> 'neondb_owner' then
    raise exception 'Alert repair requires neondb/neondb_owner';
  end if;
  if not exists(select 1 from public.schema_migrations where version='20260831_pay_evidence_access_functions_v1')
    or not exists(select 1 from public.schema_migrations where version='20260823_payment_least_privilege_roles_v1')
  then raise exception 'Pay Evidence access and least-privilege prerequisites required'; end if;
end;
$$;
lock table public.first_sale_gates in share row exclusive mode;
do $$
begin
  if exists(select 1 from public.first_sale_gates where state='RESERVED') then
    raise exception 'Alert repair refuses in-flight reservation';
  end if;
end;
$$;
set local role hoju_migration_owner;
do $$
declare
  v_before pg_proc%rowtype;
  v_after pg_proc%rowtype;
  v_body text;
  v_definition text;
begin
  select * into strict v_before from pg_proc
    where oid=to_regprocedure('public.enqueue_payment_operator_alert_failure(text,text,boolean,text,text,text)');
  if v_before.proowner <> 'hoju_migration_owner'::regrole
    or not v_before.prosecdef
    or not coalesce(v_before.proconfig @> array['search_path=public, pg_temp'],false)
    or exists(select 1 from aclexplode(coalesce(v_before.proacl,acldefault('f',v_before.proowner)))
      where grantee=0 and privilege_type='EXECUTE')
  then raise exception 'Unexpected alert ownership/security contract'; end if;
  v_body := replace(v_before.prosrc,E'\r\n',E'\n');
  if md5(v_body) = '43be66ffe2c5f87e587e6607b7e3838d' then return; end if;
  if md5(v_body) <> '27479297ed351ade7e65fbd8c4eaf413' then
    raise exception 'Unreviewed alert body; no repair performed';
  end if;
  v_definition := pg_get_functiondef(v_before.oid);
  v_definition := replace(v_definition,'or p_event_type not in','or p_event_type is null or p_event_type not in');
  v_definition := replace(v_definition,
    'or p_livemode is null or p_product_code <> ''resume_pro''',
    E'or p_livemode is null or p_product_code is null\n    or p_product_code not in (''resume_pro'', ''rental_application_pro'', ''pay_evidence_pro'')');
  execute v_definition;
  select * into strict v_after from pg_proc where oid=v_before.oid;
  if md5(replace(v_after.prosrc,E'\r\n',E'\n')) <> '43be66ffe2c5f87e587e6607b7e3838d'
    or v_after.proowner is distinct from v_before.proowner
    or v_after.proacl is distinct from v_before.proacl
    or v_after.proconfig is distinct from v_before.proconfig
    or v_after.prosecdef is distinct from v_before.prosecdef
    or v_after.provolatile is distinct from v_before.provolatile
  then raise exception 'Alert repair failed preservation checks'; end if;
end;
$$;
grant execute on function public.enqueue_payment_operator_alert_failure(text,text,boolean,text,text,text) to hoju_app_runtime;
do $$
begin
  if not has_function_privilege('hoju_app_runtime','public.enqueue_payment_operator_alert_failure(text,text,boolean,text,text,text)','EXECUTE') then
    raise exception 'Runtime alert execute contract missing';
  end if;
end;
$$;
set local role neondb_owner;
insert into public.schema_migrations(version) values ('20260831_pay_evidence_alert_runtime_v1')
on conflict(version) do nothing;
commit;
