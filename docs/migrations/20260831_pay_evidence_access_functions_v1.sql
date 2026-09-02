-- Forward-only compatibility fix for the five CURRENT device/restore signatures.
-- Apply only after verifying the approved project/endpoint and Checkout OFF.
-- This file cannot attest an application's environment flags or project identity.
-- Body fingerprints identify reviewed source, not an authorization/crypto boundary.
begin;
set local statement_timeout = '10s';
set local lock_timeout = '2s';

do $$
begin
  if current_database() <> 'neondb' or current_user <> 'neondb_owner' then
    raise exception 'Pay Evidence access migration requires neondb/neondb_owner';
  end if;
  if exists (
    select 1 from (values
      ('20260823_payment_least_privilege_roles_v1'),
      ('20260823_purchase_access_sessions_v1'),
      ('20260823_restore_activation_nonce_v1'),
      ('20260830_pay_evidence_entitlement_v1'),
      ('20260830_pay_evidence_first_sale_gate_v1')
    ) required(version)
    where not exists (
      select 1 from public.schema_migrations applied where applied.version = required.version
    )
  ) then
    raise exception 'Pay Evidence access migration prerequisites are missing';
  end if;
end;
$$;

-- Prevent a new first-sale claim racing the no-reservation check.
lock table public.first_sale_gates in share row exclusive mode;
do $$
begin
  if exists (select 1 from public.first_sale_gates where state = 'RESERVED') then
    raise exception 'Pay Evidence access migration refuses an in-flight reservation';
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
  v_old text := 'p_product_code not in (''resume_pro'', ''rental_application_pro'')';
  v_new text := 'p_product_code not in (''resume_pro'', ''rental_application_pro'', ''pay_evidence_pro'')';
begin
  for v_contract in select * from (values
    ('public.consume_checkout_activation(text,text,text,text,text,text,timestamptz)', '91827a3d877e7f69704e6f39eb93a972', '85690029b31b0242c8bc26238b96c443'),
    ('public.consume_entitlement_restore_token(text,text,text,text,text,timestamptz)', '2da1a234bc08992181db3f57a60b9fb3', 'dd0b70e0a7d7a2363e85692df6fa5ffd'),
    ('public.release_purchase_access_session(bigint,text,text)', '98ae8b52e8efd77bd789f77f634f1260', 'd307f351c0cda69b0b7096dfd21edb22'),
    ('public.find_active_purchase_entitlement_by_access_session(bigint,text,text)', 'cb36d83e50cbc090618ec6bb48a77eeb', '2a8982d842510531665d4254f7f1faa3'),
    ('public.create_entitlement_restore_token(bigint,text,text,timestamptz)', 'd738cfcc6ee1c8ee1d3e065a4f1d4bf4', 'a73a7efea1f951a46e54f712b90a1411')
  ) expected(signature, before_hash, after_hash)
  loop
    select * into v_before from pg_proc where oid = to_regprocedure(v_contract.signature);
    if not found then
      raise exception 'Pay Evidence current access signature missing: %', v_contract.signature;
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
      raise exception 'Pay Evidence access ownership/security contract mismatch';
    end if;

    v_body := replace(v_before.prosrc, E'\r\n', E'\n');
    if md5(v_body) = v_contract.after_hash then
      continue; -- Already repaired; still checked security/ACL above.
    end if;
    if md5(v_body) <> v_contract.before_hash
      or length(v_body) - length(replace(v_body, v_old, '')) <> length(v_old)
    then
      raise exception 'Unreviewed Pay Evidence access body; no replacement performed';
    end if;

    -- Only the product guard changes. Preserve locks, nonce binding, release,
    -- expiry, refund checks, return types and SECURITY DEFINER properties.
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
      raise exception 'Pay Evidence access postflight failed; transaction must roll back';
    end if;
  end loop;
end;
$$;
set local role neondb_owner;
insert into public.schema_migrations(version)
values ('20260831_pay_evidence_access_functions_v1')
on conflict (version) do nothing;
commit;
