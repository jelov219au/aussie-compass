-- Forward-only repair for the CURRENT activation, restore, access-session and
-- fulfillment-alert contracts after both EOFY and Leaving Australia baselines.
-- Apply only through the guarded runner while both product Checkouts are off.
begin;
set local statement_timeout = '10s';
set local lock_timeout = '2s';

do $$
begin
  if current_database() <> 'neondb' or current_user <> 'neondb_owner' then
    raise exception 'EOFY/Leaving access migration requires neondb/neondb_owner';
  end if;
  if exists (
    select 1 from (values
      ('20260823_payment_least_privilege_roles_v1'),
      ('20260831_pay_evidence_access_functions_v1'),
      ('20260831_pay_evidence_alert_runtime_v1'),
      ('20260830_eofy_entitlement_v1'),
      ('20260830_eofy_first_sale_gate_v1'),
      ('20260830_leaving_australia_entitlement_v1'),
      ('20260830_leaving_australia_first_sale_gate_v1')
    ) required(version)
    where not exists (
      select 1 from public.schema_migrations applied where applied.version = required.version
    )
  ) then
    raise exception 'EOFY/Leaving access migration prerequisites are missing';
  end if;
end;
$$;

lock table public.first_sale_gates in share row exclusive mode;
do $$
begin
  if exists (select 1 from public.first_sale_gates where state = 'RESERVED') then
    raise exception 'EOFY/Leaving access migration refuses an in-flight reservation';
  end if;
end;
$$;

set local role hoju_migration_owner;
do $$
declare
  v_contract record;
  v_before pg_proc%rowtype;
  v_after pg_proc%rowtype;
  v_definition text;
  v_body text;
  v_old text := 'p_product_code not in (''resume_pro'', ''rental_application_pro'', ''pay_evidence_pro'')';
  v_new text := 'p_product_code not in (''resume_pro'', ''rental_application_pro'', ''pay_evidence_pro'', ''eofy_pro'', ''leaving_australia_pro'')';
begin
  for v_contract in select * from (values
    ('public.consume_checkout_activation(text,text,text,text,text,text,timestamptz)', '85690029b31b0242c8bc26238b96c443', 'c1558997ec3adf30e367b5323affb605'),
    ('public.consume_entitlement_restore_token(text,text,text,text,text,timestamptz)', 'dd0b70e0a7d7a2363e85692df6fa5ffd', '330131326fc2aaaac7b2db2c3fc46a1c'),
    ('public.release_purchase_access_session(bigint,text,text)', 'd307f351c0cda69b0b7096dfd21edb22', 'f43983d747c7c5ced37f378fbb03921e'),
    ('public.find_active_purchase_entitlement_by_access_session(bigint,text,text)', '2a8982d842510531665d4254f7f1faa3', '2a0ebb110d4f44aa2a7fafc9dadb954d'),
    ('public.create_entitlement_restore_token(bigint,text,text,timestamptz)', 'a73a7efea1f951a46e54f712b90a1411', '71ad236f9f29a337547d8a09f20a7280')
  ) expected(signature, before_hash, after_hash)
  loop
    select * into v_before from pg_proc where oid = to_regprocedure(v_contract.signature);
    if not found then
      raise exception 'EOFY/Leaving current access signature missing: %', v_contract.signature;
    end if;
    if v_before.proowner <> 'hoju_migration_owner'::regrole
      or not v_before.prosecdef
      or not coalesce(v_before.proconfig @> array['search_path=public, pg_temp'], false)
      or not has_function_privilege('hoju_app_runtime', v_before.oid, 'EXECUTE')
      or exists (
        select 1 from aclexplode(coalesce(v_before.proacl, acldefault('f', v_before.proowner)))
        where grantee = 0 and privilege_type = 'EXECUTE'
      )
    then
      raise exception 'EOFY/Leaving access ownership/security contract mismatch';
    end if;

    v_body := replace(v_before.prosrc, E'\r\n', E'\n');
    if md5(v_body) = v_contract.after_hash then
      continue;
    end if;
    if md5(v_body) <> v_contract.before_hash
      or length(v_body) - length(replace(v_body, v_old, '')) <> length(v_old)
    then
      raise exception 'Unreviewed EOFY/Leaving access body; no replacement performed';
    end if;

    v_definition := pg_get_functiondef(v_before.oid);
    execute replace(v_definition, v_old, v_new);
    select * into strict v_after from pg_proc where oid = v_before.oid;
    if md5(replace(v_after.prosrc, E'\r\n', E'\n')) <> v_contract.after_hash
      or v_after.proowner is distinct from v_before.proowner
      or v_after.proacl is distinct from v_before.proacl
      or v_after.proconfig is distinct from v_before.proconfig
      or v_after.prosecdef is distinct from v_before.prosecdef
      or v_after.provolatile is distinct from v_before.provolatile
    then
      raise exception 'EOFY/Leaving access postflight failed; transaction must roll back';
    end if;
  end loop;
end;
$$;

do $$
declare
  v_before pg_proc%rowtype;
  v_after pg_proc%rowtype;
  v_body text;
  v_definition text;
  v_pay_guard text := 'p_product_code not in (''resume_pro'', ''rental_application_pro'', ''pay_evidence_pro'')';
  v_final_guard text := 'p_product_code not in (''resume_pro'', ''rental_application_pro'', ''pay_evidence_pro'', ''eofy_pro'', ''leaving_australia_pro'')';
begin
  select * into strict v_before from pg_proc
    where oid = to_regprocedure('public.enqueue_payment_operator_alert_failure(text,text,boolean,text,text,text)');
  if v_before.proowner <> 'hoju_migration_owner'::regrole
    or not v_before.prosecdef
    or not coalesce(v_before.proconfig @> array['search_path=public, pg_temp'], false)
    or exists (
      select 1 from aclexplode(coalesce(v_before.proacl, acldefault('f', v_before.proowner)))
      where grantee = 0 and privilege_type = 'EXECUTE'
    )
  then
    raise exception 'Unexpected EOFY/Leaving alert ownership/security contract';
  end if;

  v_body := replace(v_before.prosrc, E'\r\n', E'\n');
  if md5(v_body) = '02e61f2ca7f50247b7be6bb99b5e0bc6' then
    null;
  elsif md5(v_body) = '43be66ffe2c5f87e587e6607b7e3838d' then
    v_definition := replace(pg_get_functiondef(v_before.oid), v_pay_guard, v_final_guard);
    execute v_definition;
  elsif md5(v_body) = '27479297ed351ade7e65fbd8c4eaf413' then
    v_definition := pg_get_functiondef(v_before.oid);
    v_definition := replace(v_definition, 'or p_event_type not in', 'or p_event_type is null or p_event_type not in');
    v_definition := replace(
      v_definition,
      'or p_livemode is null or p_product_code <> ''resume_pro''',
      E'or p_livemode is null or p_product_code is null\n    or ' || v_final_guard
    );
    execute v_definition;
  else
    raise exception 'Unreviewed EOFY/Leaving alert body; no replacement performed';
  end if;

  select * into strict v_after from pg_proc where oid = v_before.oid;
  if md5(replace(v_after.prosrc, E'\r\n', E'\n')) <> '02e61f2ca7f50247b7be6bb99b5e0bc6'
    or v_after.proowner is distinct from v_before.proowner
    or v_after.proacl is distinct from v_before.proacl
    or v_after.proconfig is distinct from v_before.proconfig
    or v_after.prosecdef is distinct from v_before.prosecdef
    or v_after.provolatile is distinct from v_before.provolatile
  then
    raise exception 'EOFY/Leaving alert postflight failed; transaction must roll back';
  end if;
end;
$$;

grant execute on function public.enqueue_payment_operator_alert_failure(text,text,boolean,text,text,text) to hoju_app_runtime;

do $$
declare
  v_signature text;
  v_hash text;
begin
  for v_signature, v_hash in select * from (values
    ('public.consume_checkout_activation(text,text,text,text,text,text,timestamptz)', 'c1558997ec3adf30e367b5323affb605'),
    ('public.consume_entitlement_restore_token(text,text,text,text,text,timestamptz)', '330131326fc2aaaac7b2db2c3fc46a1c'),
    ('public.release_purchase_access_session(bigint,text,text)', 'f43983d747c7c5ced37f378fbb03921e'),
    ('public.find_active_purchase_entitlement_by_access_session(bigint,text,text)', '2a0ebb110d4f44aa2a7fafc9dadb954d'),
    ('public.create_entitlement_restore_token(bigint,text,text,timestamptz)', '71ad236f9f29a337547d8a09f20a7280'),
    ('public.enqueue_payment_operator_alert_failure(text,text,boolean,text,text,text)', '02e61f2ca7f50247b7be6bb99b5e0bc6')
  ) expected(signature, body_hash)
  loop
    if to_regprocedure(v_signature) is null
      or md5(replace((select prosrc from pg_proc where oid = to_regprocedure(v_signature)), E'\r\n', E'\n')) <> v_hash
      or not has_function_privilege('hoju_app_runtime', to_regprocedure(v_signature), 'EXECUTE')
      or exists (
        select 1 from aclexplode(coalesce(
          (select proacl from pg_proc where oid = to_regprocedure(v_signature)),
          acldefault('f', 'hoju_migration_owner'::regrole)
        )) where grantee = 0 and privilege_type = 'EXECUTE'
      )
    then
      raise exception 'EOFY/Leaving exact runtime function postflight failed: %', v_signature;
    end if;
  end loop;

  if position('when ''eofy_pro'' then 990' in pg_get_functiondef(to_regprocedure(
      'public.apply_first_sale_paid_event(text,text,boolean,timestamptz,text,text,integer,text,text,text,text,text)'
    ))) = 0
    or position('when ''leaving_australia_pro'' then 1290' in pg_get_functiondef(to_regprocedure(
      'public.apply_first_sale_paid_event(text,text,boolean,timestamptz,text,text,integer,text,text,text,text,text)'
    ))) = 0
  then
    raise exception 'EOFY/Leaving exact paid amount contract is missing';
  end if;
end;
$$;

set local role neondb_owner;
insert into public.schema_migrations(version)
values ('20260902_eofy_leaving_access_functions_v1')
on conflict (version) do nothing;
commit;
