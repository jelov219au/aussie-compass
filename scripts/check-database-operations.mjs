import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [schema, recovery] = await Promise.all([
  readFile(new URL("../docs/entitlement-storage.sql", import.meta.url), "utf8"),
  readFile(new URL("../docs/database-recovery.md", import.meta.url), "utf8"),
]);

for (const contract of [
  "begin;",
  "create table if not exists schema_migrations",
  "on conflict (version) do nothing",
  "pg_advisory_xact_lock",
  "on conflict (stripe_event_id) do nothing",
  "token_hash text primary key",
  "commit;",
]) {
  assert.ok(schema.includes(contract), `Database migration contract is missing: ${contract}`);
}

for (const contract of [
  "pg_dump --format=custom",
  "pg_restore --exit-on-error",
  "Never test a restore over Production",
  "requires explicit owner approval",
  "schema_migrations",
  "SHA-256",
]) {
  assert.ok(recovery.includes(contract), `Database recovery runbook is missing: ${contract}`);
}

console.log("Database migration and recovery-operation contracts passed.");
