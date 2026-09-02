import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { neon } from "@neondatabase/serverless";
import contracts from "../src/data/eofy-leaving-access-functions.json" with { type: "json" };

const APPLY_ACK = "APPLY_EOFY_LEAVING_ACCESS_FUNCTIONS_WITH_BOTH_CHECKOUTS_OFF";
const MIGRATION_VERSION = "20260902_eofy_leaving_access_functions_v1";
const MIGRATION_PATH = "../docs/migrations/20260902_eofy_leaving_access_functions_v1.sql";

function connectionString() {
  const value = process.env.ENTITLEMENT_DB_URL?.trim()
    || process.env.ENTITLEMENT_DB_DATABASE_URL?.trim();
  if (!value?.match(/^postgres(?:ql)?:\/\//)) {
    throw new Error("The entitlement database connection is unavailable.");
  }
  return value;
}

function splitSql(source) {
  const statements = [];
  let current = "";
  let mode = "normal";
  let dollarTag = "";

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (mode === "line-comment") {
      current += char;
      if (char === "\n") mode = "normal";
      continue;
    }
    if (mode === "block-comment") {
      current += char;
      if (char === "*" && next === "/") {
        current += next;
        index += 1;
        mode = "normal";
      }
      continue;
    }
    if (mode === "single-quote") {
      current += char;
      if (char === "'" && next === "'") {
        current += next;
        index += 1;
      } else if (char === "'") mode = "normal";
      continue;
    }
    if (mode === "double-quote") {
      current += char;
      if (char === '"' && next === '"') {
        current += next;
        index += 1;
      } else if (char === '"') mode = "normal";
      continue;
    }
    if (mode === "dollar-quote") {
      if (source.startsWith(dollarTag, index)) {
        current += dollarTag;
        index += dollarTag.length - 1;
        mode = "normal";
      } else current += char;
      continue;
    }
    if (char === "-" && next === "-") {
      current += char + next;
      index += 1;
      mode = "line-comment";
      continue;
    }
    if (char === "/" && next === "*") {
      current += char + next;
      index += 1;
      mode = "block-comment";
      continue;
    }
    if (char === "'") {
      current += char;
      mode = "single-quote";
      continue;
    }
    if (char === '"') {
      current += char;
      mode = "double-quote";
      continue;
    }
    if (char === "$") {
      const match = source.slice(index).match(/^\$[A-Za-z_][A-Za-z0-9_]*\$|^\$\$/);
      if (match) {
        dollarTag = match[0];
        current += dollarTag;
        index += dollarTag.length - 1;
        mode = "dollar-quote";
        continue;
      }
    }
    if (char === ";") {
      if (current.trim()) statements.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }

  assert.equal(mode, "normal", `Unclosed SQL token: ${mode}`);
  if (current.trim()) statements.push(current.trim());
  return statements.filter((statement) => {
    const command = statement
      .replace(/--.*$/gm, "")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .trim()
      .toLowerCase();
    return command !== "begin" && command !== "commit";
  });
}

const apply = process.argv.includes("--apply");
if (apply && process.env.EOFY_LEAVING_ACCESS_MIGRATION_ACK !== APPLY_ACK) {
  throw new Error("The explicit EOFY/Leaving access migration acknowledgement is missing.");
}
if (process.env.EOFY_PRO_PAYMENTS_ENABLED === "true"
  || process.env.LEAVING_AUSTRALIA_PRO_PAYMENTS_ENABLED === "true") {
  throw new Error("EOFY and Leaving Australia Checkouts must remain off during migration.");
}

const sql = neon(connectionString(), {
  fetchOptions: { signal: AbortSignal.timeout(30_000) },
});
const preflight = await sql`
  select
    current_database() = 'neondb' as database_ok,
    current_user = 'neondb_owner' as owner_ok,
    pg_has_role(current_user, 'hoju_migration_owner', 'MEMBER') as migration_role_ok,
    not exists (select 1 from public.first_sale_gates where state = 'RESERVED') as no_reservation,
    not exists (
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
    ) as prerequisites_ready,
    exists (
      select 1 from public.schema_migrations where version = ${MIGRATION_VERSION}
    ) as migration_applied
`;
const state = preflight[0];
assert.equal(state?.database_ok, true, "Unexpected database.");
assert.equal(state?.owner_ok, true, "The migration requires neondb_owner.");
assert.equal(state?.migration_role_ok, true, "neondb_owner cannot assume hoju_migration_owner.");
assert.equal(state?.no_reservation, true, "A first-sale reservation is in flight.");
assert.equal(state?.prerequisites_ready, true, "EOFY/Leaving migration prerequisites are missing.");

// Re-run the idempotent, fingerprint-guarded migration on every explicit apply.
// This repairs a later legacy baseline replay even when the version row exists.
if (apply) {
  const source = await readFile(new URL(MIGRATION_PATH, import.meta.url), "utf8");
  await sql.transaction(
    splitSql(source).map((statement) => sql.query(statement, [])),
    { isolationLevel: "Serializable" },
  );
}

const postflight = await sql`
  select
    exists (
      select 1 from public.schema_migrations where version = ${MIGRATION_VERSION}
    ) as migration_applied,
    exists (
      select 1 from pg_constraint
      where conrelid = 'public.first_sale_gates'::regclass
        and contype = 'c'
        and position('eofy_pro' in pg_get_constraintdef(oid)) > 0
        and position('leaving_australia_pro' in pg_get_constraintdef(oid)) > 0
        and position('990' in pg_get_constraintdef(oid)) > 0
        and position('1290' in pg_get_constraintdef(oid)) > 0
    )
    and exists (
      select 1 from pg_constraint
      where conrelid = 'public.first_sale_gate_events'::regclass
        and contype = 'c'
        and position('eofy_pro' in pg_get_constraintdef(oid)) > 0
        and position('leaving_australia_pro' in pg_get_constraintdef(oid)) > 0
        and position('990' in pg_get_constraintdef(oid)) > 0
        and position('1290' in pg_get_constraintdef(oid)) > 0
    )
    and position(
      'when ''eofy_pro'' then 990'
      in pg_get_functiondef(to_regprocedure(
        'public.apply_first_sale_paid_event(text,text,boolean,timestamptz,text,text,integer,text,text,text,text,text)'
      ))
    ) > 0
    and position(
      'when ''leaving_australia_pro'' then 1290'
      in pg_get_functiondef(to_regprocedure(
        'public.apply_first_sale_paid_event(text,text,boolean,timestamptz,text,text,integer,text,text,text,text,text)'
      ))
    ) > 0 as product_contract_ready
`;
const accessPostflight = await sql`
  select count(*) = 6 and coalesce(bool_and(
    p.oid is not null
    and md5(replace(p.prosrc, chr(13) || chr(10), chr(10))) = expected."afterHash"
    and p.prosecdef
    and p.proowner = to_regrole('hoju_migration_owner')
    and coalesce(p.proconfig @> array['search_path=public, pg_temp'], false)
    and coalesce(has_function_privilege('hoju_app_runtime', p.oid, 'EXECUTE'), false)
    and not exists (
      select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner)))
      where grantee = 0 and privilege_type = 'EXECUTE'
    )
  ), false) as ready
  from jsonb_to_recordset(${JSON.stringify(contracts)}::jsonb)
    as expected(signature text, "afterHash" text)
  left join pg_proc p on p.oid = to_regprocedure(expected.signature)
`;
const ready = postflight[0]?.migration_applied === true
  && postflight[0]?.product_contract_ready === true
  && accessPostflight[0]?.ready === true;

console.log(`EOFY_LEAVING_ACCESS_MIGRATION=${ready ? "PASS" : apply ? "FAIL" : "PENDING"} checkouts=off secrets_printed=no`);
if (apply) assert.equal(ready, true, "EOFY/Leaving access migration postflight failed.");
