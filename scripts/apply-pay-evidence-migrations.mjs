import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { neon } from "@neondatabase/serverless";
import accessFunctions from "../src/data/pay-evidence-access-functions.json" with { type: "json" };
import alertFunction from "../src/data/pay-evidence-alert-function.json" with { type: "json" };

const APPLY_ACK = "APPLY_PAY_EVIDENCE_MIGRATIONS_WITH_CHECKOUT_OFF";
const migrations = [
  {
    path: "../docs/migrations/20260830_pay_evidence_entitlement_v1.sql",
    version: "20260830_pay_evidence_entitlement_v1",
    appliedKey: "entitlement_applied",
  },
  {
    path: "../docs/migrations/20260831_pay_evidence_gate_constraint_prerequisite_v1.sql",
    version: "20260831_pay_evidence_gate_constraint_prerequisite_v1",
    appliedKey: "gate_constraint_prerequisite_applied",
  },
  {
    path: "../docs/migrations/20260830_pay_evidence_first_sale_gate_v1.sql",
    version: "20260830_pay_evidence_first_sale_gate_v1",
    appliedKey: "first_sale_applied",
  },
  {
    path: "../docs/migrations/20260831_pay_evidence_access_functions_v1.sql",
    version: "20260831_pay_evidence_access_functions_v1",
    appliedKey: "access_functions_applied",
  },
  {
    path: "../docs/migrations/20260831_pay_evidence_alert_runtime_v1.sql",
    version: "20260831_pay_evidence_alert_runtime_v1",
    appliedKey: "alert_runtime_applied",
  },
];

function entitlementStatementRole(statementNumber) {
  const ownerStatement = statementNumber <= 19
    || (statementNumber >= 27 && statementNumber <= 30)
    || (statementNumber >= 38 && statementNumber <= 40)
    || (statementNumber >= 42 && statementNumber <= 43)
    || (statementNumber >= 45 && statementNumber <= 49)
    || statementNumber >= 60;
  return ownerStatement ? "neondb_owner" : "hoju_migration_owner";
}

function entitlementMigrationQueries(sql, statements) {
  assert.equal(statements.length, 67, "Unexpected Pay Evidence entitlement migration shape.");

  const queries = [];
  let activeRole = "";
  const switchRole = (role) => {
    if (role === activeRole) return;
    queries.push(sql.query(`set local role ${role}`, []));
    activeRole = role;
  };

  statements.forEach((statement, index) => {
    const statementNumber = index + 1;

    // Production intentionally separates table and function ownership. The
    // temporary grant lets the table owner recreate the existing trigger;
    // it is revoked in the same transaction immediately afterwards.
    if (statementNumber === 42) {
      switchRole("hoju_migration_owner");
      queries.push(sql.query(
        "grant execute on function public.prevent_entitlement_tombstone_mutation() to neondb_owner",
        [],
      ));
    }

    switchRole(entitlementStatementRole(statementNumber));
    queries.push(sql.query(statement, []));

    if (statementNumber === 43) {
      switchRole("hoju_migration_owner");
      queries.push(sql.query(
        "revoke execute on function public.prevent_entitlement_tombstone_mutation() from neondb_owner",
        [],
      ));
    }
  });

  return queries;
}

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
      } else if (char === "'") {
        mode = "normal";
      }
      continue;
    }
    if (mode === "double-quote") {
      current += char;
      if (char === '"' && next === '"') {
        current += next;
        index += 1;
      } else if (char === '"') {
        mode = "normal";
      }
      continue;
    }
    if (mode === "dollar-quote") {
      if (source.startsWith(dollarTag, index)) {
        current += dollarTag;
        index += dollarTag.length - 1;
        mode = "normal";
      } else {
        current += char;
      }
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
if (apply && process.env.PAY_EVIDENCE_MIGRATION_ACK !== APPLY_ACK) {
  throw new Error("The explicit Pay Evidence migration acknowledgement is missing.");
}
if (process.env.PAY_EVIDENCE_PRO_PAYMENTS_ENABLED === "true") {
  throw new Error("Pay Evidence Checkout must remain off during migration.");
}

const sql = neon(connectionString(), {
  fetchOptions: { signal: AbortSignal.timeout(30_000) },
});
const preflight = await sql`
  select
    current_database() = 'neondb' as database_ok,
    current_user = 'neondb_owner' as owner_ok,
    pg_has_role(current_user, 'hoju_migration_owner', 'MEMBER') as migration_role_ok,
    not exists (
      select 1 from public.first_sale_gates where state = 'RESERVED'
    ) as no_reservation,
    exists (
      select 1 from public.schema_migrations
      where version = '20260830_pay_evidence_entitlement_v1'
    ) as entitlement_applied,
    exists (
      select 1 from public.schema_migrations
      where version = '20260830_pay_evidence_first_sale_gate_v1'
    ) as first_sale_applied,
    exists (
      select 1 from public.schema_migrations
      where version = '20260831_pay_evidence_access_functions_v1'
    ) as access_functions_applied,
    exists (
      select 1 from public.schema_migrations
      where version = '20260831_pay_evidence_gate_constraint_prerequisite_v1'
    ) as gate_constraint_prerequisite_applied,
    exists (
      select 1 from public.schema_migrations
      where version = '20260831_pay_evidence_alert_runtime_v1'
    ) as alert_runtime_applied
`;
const state = preflight[0];
assert.equal(state?.database_ok, true, "Unexpected database.");
assert.equal(state?.owner_ok, true, "The migration requires neondb_owner.");
assert.equal(state?.migration_role_ok, true, "neondb_owner cannot assume hoju_migration_owner.");
assert.equal(state?.no_reservation, true, "A first-sale reservation is in flight.");

if (apply && migrations.some((migration) => !state[migration.appliedKey])) {
  for (const migration of migrations) {
    if (state[migration.appliedKey]) continue;

    const source = await readFile(new URL(migration.path, import.meta.url), "utf8");
    const statements = splitSql(source);
    const queries = migration.version === "20260830_pay_evidence_entitlement_v1"
      ? entitlementMigrationQueries(sql, statements)
      : statements.map((statement) => sql.query(statement, []));
    await sql.transaction(
      queries,
      { isolationLevel: "Serializable" },
    );
  }
}

const postflight = await sql`
  select
    exists (
      select 1 from public.schema_migrations
      where version = '20260830_pay_evidence_entitlement_v1'
    ) as entitlement_applied,
    exists (
      select 1 from public.schema_migrations
      where version = '20260830_pay_evidence_first_sale_gate_v1'
    ) as first_sale_applied,
    exists (
      select 1 from pg_constraint
      where conrelid = 'public.first_sale_gates'::regclass
        and position('pay_evidence_pro' in pg_get_constraintdef(oid)) > 0
    ) as gate_constraint_ready,
    exists (
      select 1 from pg_constraint
      where conrelid = 'public.purchase_access_sessions'::regclass
        and position('pay_evidence_pro' in pg_get_constraintdef(oid)) > 0
    ) as access_constraint_ready,
    position(
      'pay_evidence_pro'
      in pg_get_functiondef(to_regprocedure(
        'public.apply_first_sale_paid_event(text,text,boolean,timestamptz,text,text,integer,text,text,text,text,text)'
      ))
    ) > 0 as paid_function_ready
`;
const accessPostflight = await sql`
  select
    exists (
      select 1 from public.schema_migrations
      where version = '20260831_pay_evidence_access_functions_v1'
    )
    and exists (
      select 1 from public.schema_migrations
      where version = '20260831_pay_evidence_alert_runtime_v1'
    )
    and count(*) = 6 and coalesce(bool_and(
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
  from jsonb_to_recordset(${JSON.stringify([...accessFunctions, alertFunction])}::jsonb)
    as expected(signature text, "afterHash" text)
  left join pg_proc p on p.oid = to_regprocedure(expected.signature)
`;
const result = postflight[0];
const ready = result?.entitlement_applied === true
  && result?.first_sale_applied === true
  && result?.gate_constraint_ready === true
  && result?.access_constraint_ready === true
  && result?.paid_function_ready === true
  && accessPostflight[0]?.ready === true;

console.log(`PAY_EVIDENCE_MIGRATION=${ready ? "PASS" : apply ? "FAIL" : "PENDING"} checkout=off secrets_printed=no`);
if (apply) assert.equal(ready, true, "Pay Evidence migration postflight failed.");
