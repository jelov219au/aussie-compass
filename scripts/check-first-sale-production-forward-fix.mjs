import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [auditSql, ticket, migration] = await Promise.all([
  readFile(new URL("./first-sale-production-forward-fix-audit.sql", import.meta.url), "utf8"),
  readFile(new URL("../docs/production-entitlement-link-forward-fix-ticket.md", import.meta.url), "utf8"),
  readFile(new URL("../docs/migrations/20260824_entitlement_link_conflict_v1.sql", import.meta.url), "utf8"),
]);

for (const contract of [
  "begin transaction isolation level repeatable read read only",
  "set local statement_timeout = '10s'",
  "set local lock_timeout = '2s'",
  "current_database() = 'neondb'",
  "current_user = 'neondb_owner'",
  "20260823_payment_least_privilege_roles_v1",
  "20260824_entitlement_link_conflict_v1",
  "on conflict on constraint stripe_payment_object_links_pkey do nothing",
  "on conflict (stripe_payment_intent_id, stripe_charge_id) do nothing",
  "state = 'RESERVED'",
  "preflight_can_apply_once",
  "postflight_pass",
  "commit;",
]) assert.ok(auditSql.includes(contract), `Production forward-fix audit is missing: ${contract}`);

const executableAudit = auditSql.replace(/^\s*--.*$/gm, "");
assert.doesNotMatch(
  executableAudit,
  /\b(insert|update|delete|truncate|drop|alter|create|grant|revoke|execute)\b/i,
  "Production forward-fix audit must remain read-only",
);
assert.doesNotMatch(
  auditSql,
  /\b\w+\.stripe_(checkout_session|payment_intent|charge|customer)_id\b/i,
  "Production audit must not select full Stripe identifiers",
);

for (const boundary of [
  "prepared HOLD ticket",
  "PAYMENTS_ENABLED=false",
  "public Checkout HTTP 503",
  "second-person branch/database selection check",
  "preflight_can_apply_once=true",
  "Run only `docs/migrations/20260824_entitlement_link_conflict_v1.sql`",
  "Require every statement to succeed through the final `COMMIT`",
  "10-second statement timeout",
  "2-second lock timeout",
  "prevents a new reservation from racing the check",
  "postflight_pass=true",
  "every boolean must be true",
  "first customer payment **NO-GO**",
]) assert.ok(ticket.includes(boundary), `Production forward-fix ticket is missing: ${boundary}`);

for (const guard of [
  "set local statement_timeout = '10s'",
  "set local lock_timeout = '2s'",
  "lock table public.first_sale_gates in share row exclusive mode",
  "current_database() <> 'neondb'",
  "current_user <> 'neondb_owner'",
  "state = 'RESERVED'",
  "forward fix refuses an in-flight first-sale reservation",
  "set role hoju_migration_owner",
  "unexpected apply_entitlement_event definition; forward fix not applied",
  "20260824_entitlement_link_conflict_v1",
  "commit;",
]) assert.ok(migration.includes(guard), `Production forward-fix migration is missing: ${guard}`);

console.log("Production entitlement-link forward-fix audit and HOLD ticket contract passed.");
