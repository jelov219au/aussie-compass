import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { neon } from "@neondatabase/serverless";

const acknowledgement = "APPLY_RESUME_PRO_PRICE_990_WITH_CHECKOUT_OFF";
const migrationVersion = "20260911_resume_pro_price_990_v1";
const migrationPath = "../docs/migrations/20260911_resume_pro_price_990_v1.sql";
const apply = process.argv.includes("--apply");

if (apply && process.env.RESUME_PRO_PRICE_MIGRATION_ACK !== acknowledgement) {
  throw new Error("The explicit Resume Pro price migration acknowledgement is missing.");
}

if (process.env.PAYMENTS_ENABLED === "true") {
  throw new Error("Resume Pro Checkout must remain off during the price migration.");
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
      if (char === "*" && next === "/") { current += next; index += 1; mode = "normal"; }
      continue;
    }
    if (mode === "single-quote") {
      current += char;
      if (char === "'" && next === "'") { current += next; index += 1; } else if (char === "'") mode = "normal";
      continue;
    }
    if (mode === "dollar-quote") {
      if (source.startsWith(dollarTag, index)) { current += dollarTag; index += dollarTag.length - 1; mode = "normal"; } else current += char;
      continue;
    }
    if (char === "-" && next === "-") { current += char + next; index += 1; mode = "line-comment"; continue; }
    if (char === "/" && next === "*") { current += char + next; index += 1; mode = "block-comment"; continue; }
    if (char === "'") { current += char; mode = "single-quote"; continue; }
    if (char === "$") {
      const match = source.slice(index).match(/^\$[A-Za-z_][A-Za-z0-9_]*\$|^\$\$/);
      if (match) { dollarTag = match[0]; current += dollarTag; index += dollarTag.length - 1; mode = "dollar-quote"; continue; }
    }
    if (char === ";") { if (current.trim()) statements.push(current.trim()); current = ""; continue; }
    current += char;
  }
  assert.equal(mode, "normal", `Unclosed SQL token: ${mode}`);
  return statements.filter((statement) => !["begin", "commit"].includes(statement.replace(/--.*$/gm, "").trim().toLowerCase()));
}

const sql = neon(connectionString(), { fetchOptions: { signal: AbortSignal.timeout(30_000) } });
const preflight = await sql`
  select
    current_database() = 'neondb' as database_ok,
    current_user = 'neondb_owner' as owner_ok,
    pg_has_role(current_user, 'hoju_migration_owner', 'MEMBER') as migration_role_ok,
    not exists (select 1 from public.first_sale_gates where state = 'RESERVED') as no_reservation,
    exists (
      select 1 from public.first_sale_gates
      where product_code = 'resume_pro' and state = 'OPEN' and environment = 'live'
        and currency = 'aud' and expected_amount_cents = 1990
    ) as open_resume_gate,
    exists (select 1 from public.schema_migrations where version = ${migrationVersion}) as already_applied
`;
const state = preflight[0];
assert.equal(state?.database_ok, true, "Unexpected database.");
assert.equal(state?.owner_ok, true, "The migration requires neondb_owner.");
assert.equal(state?.migration_role_ok, true, "neondb_owner cannot assume hoju_migration_owner.");
assert.equal(state?.no_reservation, true, "A first-sale reservation is in flight.");
assert.equal(state?.already_applied, false, "The Resume Pro price migration is already applied.");
assert.equal(state?.open_resume_gate, true, "The open A$19.90 Resume Pro gate is not ready to migrate.");

if (apply) {
  const source = await readFile(new URL(migrationPath, import.meta.url), "utf8");
  await sql.transaction(splitSql(source).map((statement) => sql.query(statement, [])), { isolationLevel: "Serializable" });
}

const postflight = await sql`
  select
    exists (select 1 from public.schema_migrations where version = ${migrationVersion}) as migration_applied,
    exists (
      select 1 from public.first_sale_gates
      where product_code = 'resume_pro' and state = 'OPEN' and environment = 'live'
        and currency = 'aud' and expected_amount_cents = 990
    ) as gate_price_ready,
    position('when ''resume_pro'' then 990' in pg_get_functiondef(to_regprocedure(
      'public.claim_first_sale_reservation(text,text,timestamptz,text,text,integer)'
    ))) > 0 as claim_guard_ready,
    position('when ''resume_pro'' then 990' in pg_get_functiondef(to_regprocedure(
      'public.apply_first_sale_paid_event(text,text,boolean,timestamptz,text,text,integer,text,text,text,text,text)'
    ))) > 0 as paid_guard_ready
`;
const result = postflight[0];
const ready = result?.migration_applied === true
  && result?.gate_price_ready === true
  && result?.claim_guard_ready === true
  && result?.paid_guard_ready === true;

console.log(`RESUME_PRO_PRICE_990_MIGRATION=${ready ? "PASS" : apply ? "FAIL" : "PENDING"} checkout=off secrets_printed=no`);
if (apply) assert.equal(ready, true, "Resume Pro price migration postflight failed.");
