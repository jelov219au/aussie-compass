import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [schema, firstSaleSchema, outboxMigration, activationMigration, recovery, runbook, launchPacket, manifest, paymentReadiness] = await Promise.all([
  readFile(new URL("../docs/entitlement-storage.sql", import.meta.url), "utf8"),
  readFile(new URL("../docs/first-sale-gate.sql", import.meta.url), "utf8"),
  readFile(new URL("../docs/migrations/20260823_payment_operator_alert_outbox_v1.sql", import.meta.url), "utf8"),
  readFile(new URL("../docs/migrations/20260823_checkout_activation_nonce_v1.sql", import.meta.url), "utf8"),
  readFile(new URL("../docs/database-recovery.md", import.meta.url), "utf8"),
  readFile(new URL("../docs/first-sale-gate-runbook.md", import.meta.url), "utf8"),
  readFile(new URL("../docs/first-payment-24-hour-operations-packet.md", import.meta.url), "utf8"),
  readFile(new URL("../docs/release-candidate-manifest-2026-08-23.md", import.meta.url), "utf8"),
  readFile(new URL("../docs/payment-readiness.md", import.meta.url), "utf8"),
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
  "create table if not exists payment_operator_alert_outbox",
  "create table if not exists purchase_checkout_activations",
  "20260823_payment_operator_alert_outbox_v1",
  "20260823_checkout_activation_once_v1",
  "20260823_checkout_activation_nonce_v1",
  "commit;",
]) {
  assert.ok(schema.includes(contract), `Database migration contract is missing: ${contract}`);
}

for (const [name, migration, prerequisite, version] of [
  ["outbox", outboxMigration, "20260823_first_sale_gate_charge_link_v2", "20260823_payment_operator_alert_outbox_v1"],
  ["activation", activationMigration, "20260823_payment_operator_alert_outbox_v1", "20260823_checkout_activation_nonce_v1"],
]) {
  for (const contract of ["begin;", "commit;", prerequisite, version, "public.schema_migrations", "on conflict (version) do nothing"]) {
    assert.ok(migration.includes(contract), `${name} additive migration is missing: ${contract}`);
  }
  for (const line of migration.split(/\r?\n/)) {
    const normalized = line.trim().toLowerCase();
    if (/^(create table|create or replace function|create function|alter table|drop function|insert into|update |delete from)/.test(normalized)) {
      assert.match(normalized, /\bpublic\./, `${name} migration has an unqualified object reference: ${normalized}`);
    }
  }
}

for (const contract of [
  "claim_outcome text",
  "'claimed'::text",
  "'sent'::text",
  "'busy'::text",
  "payment_operator_alert_from_receipt",
  "revoke all on table public.payment_operator_alert_outbox from public",
]) assert.ok(outboxMigration.includes(contract), `outbox migration is missing: ${contract}`);

for (const contract of [
  "activation_nonce_hash",
  "released_at timestamptz",
  "consume_checkout_activation(text, text, text, text)",
  "find_active_purchase_entitlement_by_checkout",
  "find_active_purchase_entitlement_by_id",
  "revoke select, insert, update, delete on table public.purchase_checkout_activations, public.purchase_entitlements from public",
]) assert.ok(activationMigration.includes(contract), `activation migration is missing: ${contract}`);

assert.ok(
  runbook.indexOf("20260823_first_sale_gate_charge_link_v2")
    < runbook.indexOf("docs/migrations/20260823_payment_operator_alert_outbox_v1.sql")
    && runbook.indexOf("docs/migrations/20260823_payment_operator_alert_outbox_v1.sql")
      < runbook.indexOf("docs/migrations/20260823_checkout_activation_nonce_v1.sql"),
  "the runbook must preserve charge-link v2 -> outbox v1 -> activation v1 order",
);

for (const contract of [
  "Outbox",
  "pending_count",
  "sent_count",
  "attempts",
  "실제 mailbox 수신",
  "consumed/idempotent/released",
  "response-loss same-nonce PASS",
  "different-nonce DENIED",
  "SMTP 재시도나 동일 Message-ID의 중복 이메일은 회계 사건이 아니다",
  "15분 안에",
  "24시간 안에",
]) assert.ok(launchPacket.includes(contract), `launch packet is missing: ${contract}`);

for (const document of [manifest, paymentReadiness]) {
  for (const version of [
    "20260823_first_sale_gate_charge_link_v2",
    "20260823_payment_operator_alert_outbox_v1",
    "20260823_checkout_activation_nonce_v1",
  ]) assert.ok(document.includes(version), `release documentation is missing migration ${version}`);
  assert.match(document, /response-loss|응답 유실/);
}

for (const contract of [
  "pg_dump --format=custom",
  "pg_restore --exit-on-error",
  "Never test a restore over Production",
  "requires explicit owner approval",
  "schema_migrations",
  "payment_operator_alert_outbox",
  "purchase_checkout_activations",
  "SHA-256",
]) {
  assert.ok(recovery.includes(contract), `Database recovery runbook is missing: ${contract}`);
}

console.log("Database migration and recovery-operation contracts passed.");
