import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [schema, firstSaleSchema, recovery] = await Promise.all([
  readFile(new URL("../docs/entitlement-storage.sql", import.meta.url), "utf8"),
  readFile(new URL("../docs/first-sale-gate.sql", import.meta.url), "utf8"),
  readFile(new URL("../docs/database-recovery.md", import.meta.url), "utf8"),
]);

for (const contract of [
  "begin;",
  "create table if not exists public.first_sale_gates",
  "create table if not exists public.first_sale_gate_events",
  "first_sale_gate_events is append-only",
  "security definer",
  "set search_path = public, pg_temp",
  "pg_advisory_xact_lock",
  "apply_first_sale_paid_event",
  "approve_next_first_sale",
  "revoke all on function public.approve_next_first_sale",
  "revoke create on schema public from public",
  "revoke all on table public.first_sale_gates, public.first_sale_gate_events from public",
  "apply_guarded_entitlement_event",
  "p_evidence_status is distinct from 'PASS'",
  "p_cash_difference_cents is null",
  "p_payout_status is distinct from 'matched'",
  "on conflict (version) do nothing",
  "commit;",
]) {
  assert.ok(firstSaleSchema.includes(contract), `First-sale migration contract is missing: ${contract}`);
}

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
