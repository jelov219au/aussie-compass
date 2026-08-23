import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [
  schema,
  firstSaleSchema,
  outboxMigration,
  activationMigration,
  accessSessionMigration,
  restoreActivationMigration,
  leastPrivilegeMigration,
  recovery,
  runbook,
  launchPacket,
  liveLaunchChecklist,
  manifest,
  paymentReadiness,
  firstSaleAdapter,
  entitlementAdapter,
  alertOutboxAdapter,
] = await Promise.all([
  readFile(new URL("../docs/entitlement-storage.sql", import.meta.url), "utf8"),
  readFile(new URL("../docs/first-sale-gate.sql", import.meta.url), "utf8"),
  readFile(new URL("../docs/migrations/20260823_payment_operator_alert_outbox_v1.sql", import.meta.url), "utf8"),
  readFile(new URL("../docs/migrations/20260823_checkout_activation_nonce_v1.sql", import.meta.url), "utf8"),
  readFile(new URL("../docs/migrations/20260823_purchase_access_sessions_v1.sql", import.meta.url), "utf8"),
  readFile(new URL("../docs/migrations/20260823_restore_activation_nonce_v1.sql", import.meta.url), "utf8"),
  readFile(new URL("../docs/migrations/20260823_payment_least_privilege_roles_v1.sql", import.meta.url), "utf8"),
  readFile(new URL("../docs/database-recovery.md", import.meta.url), "utf8"),
  readFile(new URL("../docs/first-sale-gate-runbook.md", import.meta.url), "utf8"),
  readFile(new URL("../docs/first-payment-24-hour-operations-packet.md", import.meta.url), "utf8"),
  readFile(new URL("../docs/live-payment-launch-checklist.md", import.meta.url), "utf8"),
  readFile(new URL("../docs/release-candidate-manifest-2026-08-23.md", import.meta.url), "utf8"),
  readFile(new URL("../docs/payment-readiness.md", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/neonFirstSaleGate.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/neonEntitlementStore.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/neonPaymentAlertOutbox.ts", import.meta.url), "utf8"),
]);

const runtimeWrapperSignatures = new Map([
  ["claim_first_sale_reservation", "public.claim_first_sale_reservation(text,text,timestamptz,text,text,integer)"],
  ["attach_first_sale_checkout", "public.attach_first_sale_checkout(text,bigint,text,text,timestamptz)"],
  ["release_failed_first_sale_reservation", "public.release_failed_first_sale_reservation(text,bigint,text,text)"],
  ["release_verified_abandoned_first_sale", "public.release_verified_abandoned_first_sale(text,bigint,text)"],
  ["apply_first_sale_paid_event", "public.apply_first_sale_paid_event(text,text,boolean,timestamptz,text,text,integer,text,text,text,text,text)"],
  ["apply_guarded_entitlement_event", "public.apply_guarded_entitlement_event(text,text,boolean,timestamptz,text,text,text,text,text,text,text)"],
  ["consume_entitlement_restore_token", "public.consume_entitlement_restore_token(text,text,text,text,text,timestamptz)"],
  ["create_entitlement_restore_token", "public.create_entitlement_restore_token(bigint,text,text,timestamptz)"],
  ["enqueue_payment_operator_alert_failure", "public.enqueue_payment_operator_alert_failure(text,text,boolean,text,text,text)"],
  ["claim_payment_operator_alert_intent", "public.claim_payment_operator_alert_intent(text,text,text)"],
  ["mark_payment_operator_alert_sent", "public.mark_payment_operator_alert_sent(text,text,text)"],
  ["release_payment_operator_alert_claim", "public.release_payment_operator_alert_claim(text,text,text)"],
  ["consume_checkout_activation", "public.consume_checkout_activation(text,text,text,text,text,text,timestamptz)"],
  ["release_purchase_access_session", "public.release_purchase_access_session(bigint,text,text)"],
  ["find_active_purchase_entitlement_by_access_session", "public.find_active_purchase_entitlement_by_access_session(bigint,text,text)"],
  ["find_active_purchase_entitlement_by_checkout", "public.find_active_purchase_entitlement_by_checkout(text,text)"],
  ["find_active_purchase_entitlement_by_id", "public.find_active_purchase_entitlement_by_id(bigint,text)"],
]);
const runtimeWrapperCheckNames = new Map([
  ["claim_first_sale_reservation", "runtime_can_claim_reservation"],
  ["attach_first_sale_checkout", "runtime_can_attach_checkout"],
  ["release_failed_first_sale_reservation", "runtime_can_release_failed_reservation"],
  ["release_verified_abandoned_first_sale", "runtime_can_release_verified_abandoned_reservation"],
  ["apply_first_sale_paid_event", "runtime_can_apply_charge_aware_paid_event"],
  ["apply_guarded_entitlement_event", "runtime_can_apply_guarded_entitlement_event"],
  ["consume_entitlement_restore_token", "runtime_can_consume_restore_token"],
  ["create_entitlement_restore_token", "runtime_can_create_restore_token"],
  ["enqueue_payment_operator_alert_failure", "runtime_can_enqueue_failure_alert"],
  ["claim_payment_operator_alert_intent", "runtime_can_claim_alert"],
  ["mark_payment_operator_alert_sent", "runtime_can_mark_alert_sent"],
  ["release_payment_operator_alert_claim", "runtime_can_release_alert_claim"],
  ["consume_checkout_activation", "runtime_can_consume_activation"],
  ["release_purchase_access_session", "runtime_can_release_access_session"],
  ["find_active_purchase_entitlement_by_access_session", "runtime_can_validate_access_session"],
  ["find_active_purchase_entitlement_by_checkout", "runtime_can_read_active_by_checkout"],
  ["find_active_purchase_entitlement_by_id", "runtime_can_read_active_by_id"],
]);
const compactFunctionContractSql = [firstSaleSchema, outboxMigration, activationMigration, accessSessionMigration, restoreActivationMigration]
  .join("\n")
  .replace(/\s+/g, "");

const expectedAdapterCalls = new Map([
  ["neonFirstSaleGate.ts", new Set([
    "claim_first_sale_reservation",
    "attach_first_sale_checkout",
    "release_failed_first_sale_reservation",
    "release_verified_abandoned_first_sale",
    "apply_first_sale_paid_event",
  ])],
  ["neonEntitlementStore.ts", new Set([
    "apply_guarded_entitlement_event",
    "consume_entitlement_restore_token",
    "create_entitlement_restore_token",
    "consume_checkout_activation",
    "release_purchase_access_session",
    "find_active_purchase_entitlement_by_access_session",
    "find_active_purchase_entitlement_by_checkout",
    "find_active_purchase_entitlement_by_id",
  ])],
  ["neonPaymentAlertOutbox.ts", new Set([
    "enqueue_payment_operator_alert_failure",
    "claim_payment_operator_alert_intent",
    "mark_payment_operator_alert_sent",
    "release_payment_operator_alert_claim",
  ])],
]);

function extractSqlFunctionCalls(source) {
  const calls = new Map();
  const starts = source.matchAll(/\bselect\s+(?:\*\s+from\s+)?([a-z_][a-z0-9_]*)\s*\(/gi);

  for (const match of starts) {
    const functionName = match[1];
    const openParen = match.index + match[0].lastIndexOf("(");
    let sqlDepth = 1;
    let interpolationDepth = 0;
    let argumentCount = 0;

    for (let index = openParen + 1; index < source.length && sqlDepth > 0; index += 1) {
      if (interpolationDepth === 0 && source[index] === "$" && source[index + 1] === "{") {
        interpolationDepth = 1;
        argumentCount += 1;
        index += 1;
        continue;
      }
      if (interpolationDepth > 0) {
        if (source[index] === "{") interpolationDepth += 1;
        if (source[index] === "}") interpolationDepth -= 1;
        continue;
      }
      if (source[index] === "(") sqlDepth += 1;
      if (source[index] === ")") sqlDepth -= 1;
    }

    calls.set(functionName, argumentCount);
  }

  return calls;
}

for (const [fileName, source] of [
  ["neonFirstSaleGate.ts", firstSaleAdapter],
  ["neonEntitlementStore.ts", entitlementAdapter],
  ["neonPaymentAlertOutbox.ts", alertOutboxAdapter],
]) {
  const extractedCalls = extractSqlFunctionCalls(source);
  const actual = [...extractedCalls.keys()].sort();
  const expected = [...expectedAdapterCalls.get(fileName)].sort();
  assert.deepEqual(actual, expected, `${fileName} DB calls and the privilege allowlist diverged`);

  for (const [functionName, actualArgumentCount] of extractedCalls) {
    const signature = runtimeWrapperSignatures.get(functionName);
    const signatureArguments = signature.slice(signature.indexOf("(") + 1, -1);
    const expectedArgumentCount = signatureArguments === "" ? 0 : signatureArguments.split(",").length;
    assert.equal(
      actualArgumentCount,
      expectedArgumentCount,
      `${fileName} call arity and catalog signature diverged for ${functionName}`,
    );
  }
}

assert.deepEqual(
  [...new Set([...expectedAdapterCalls.values()].flatMap((calls) => [...calls]))].sort(),
  [...runtimeWrapperSignatures.keys()].sort(),
  "every runtime wrapper must be called by an audited adapter exactly once in the allowlist",
);

for (const [functionName, signature] of runtimeWrapperSignatures) {
  assert.ok(runbook.includes(`('${signature}')`), `Privilege SQL is missing runtime wrapper ${signature}`);
  assert.ok(compactFunctionContractSql.includes(`function${signature}`), `Migration grant/revoke template is missing ${signature}`);
  assert.ok(runbook.includes(`has_function_privilege('hoju_app_runtime', to_regprocedure('${signature}')`), `Privilege SQL does not test runtime EXECUTE for ${functionName}`);
  assert.ok(runbook.includes(`as ${runtimeWrapperCheckNames.get(functionName)}`), `Privilege SQL does not name the result for ${functionName}`);
}

for (const signature of [
  "public.apply_entitlement_event(text,text,boolean,timestamptz,text,text,text,text,text,text,text)",
  "public.lock_first_sale_from_paid_event(text,text,text,boolean,timestamptz)",
  "public.record_payment_operator_alert_intent(text,text,boolean,text)",
  "public.payment_operator_alert_from_receipt()",
  "public.prevent_first_sale_gate_event_mutation()",
  "public.prevent_entitlement_tombstone_mutation()",
  "public.release_checkout_activation(bigint,text)",
]) {
  assert.ok(runbook.includes(`('${signature}')`), `Privilege SQL is missing private helper ${signature}`);
  assert.ok(compactFunctionContractSql.includes(`function${signature}`), `Migration revoke template is missing private helper ${signature}`);
}

for (const contract of [
  "runtime_cannot_execute_private_helpers",
  "operator_cannot_execute_private_helpers",
  "runtime_cannot_execute_internal_alert_enqueue",
  "operator_cannot_execute_internal_alert_enqueue",
  "runtime_cannot_execute_alert_receipt_trigger",
  "operator_cannot_execute_alert_receipt_trigger",
  "public_cannot_execute_protected_functions",
  "operator_can_approve_next_sale",
  "runtime_cannot_approve_next_sale",
  "operator_cannot_execute_runtime_wrappers",
  "runtime_has_no_protected_table_privileges",
  "operator_has_no_protected_table_privileges",
  "public_has_no_protected_table_privileges",
  "runtime_cannot_create_in_public_schema",
  "operator_cannot_create_in_public_schema",
  "public_cannot_create_in_public_schema",
  "operator_does_not_inherit_runtime_role",
  "runtime_does_not_inherit_operator_role",
  "all_privilege_checks_pass",
  "failure_alert_enqueue_returns_boolean",
  "values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'), ('TRUNCATE')",
  "select bool_and(value = 'true')",
]) {
  assert.ok(runbook.includes(contract), `Executable privilege evidence is missing: ${contract}`);
}

for (const tableName of [
  "payment_webhook_events",
  "purchase_entitlements",
  "purchase_restore_tokens",
  "purchase_checkout_activations",
  "purchase_access_sessions",
  "purchase_restore_activations",
  "entitlement_event_tombstones",
  "stripe_payment_object_links",
  "payment_operator_alert_outbox",
  "first_sale_gates",
  "first_sale_gate_events",
]) {
  assert.ok(runbook.includes(`('public.${tableName}')`), `Privilege SQL is missing protected table public.${tableName}`);
}

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
  "create table if not exists purchase_access_sessions",
  "create table if not exists purchase_restore_activations",
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
  ["access sessions", accessSessionMigration, "20260823_checkout_activation_nonce_v1", "20260823_purchase_access_sessions_v1"],
  ["restore activation", restoreActivationMigration, "20260823_purchase_access_sessions_v1", "20260823_restore_activation_nonce_v1"],
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
  "begin;",
  "20260823_restore_activation_nonce_v1",
  "hoju_migration_owner",
  "hoju_app_runtime",
  "hoju_owner_operator",
  "runtime role must not inherit neon_superuser",
  "owner to hoju_migration_owner",
  "set role hoju_migration_owner",
  "reset role",
  "revoke create on schema public from public, hoju_app_runtime, hoju_owner_operator",
  "grant execute on function public.approve_next_first_sale(text, text, text, integer, text) to hoju_owner_operator",
  "20260823_payment_least_privilege_roles_v1",
  "commit;",
]) assert.ok(leastPrivilegeMigration.includes(contract), `least-privilege migration is missing: ${contract}`);
assert.doesNotMatch(
  leastPrivilegeMigration,
  /revoke execute on all functions in schema public/i,
  "payment hardening must not change unrelated public-schema function ACLs",
);
for (const signature of runtimeWrapperSignatures.values()) {
  assert.ok(
    leastPrivilegeMigration.includes(`grant execute on function ${signature.replaceAll(",", ", ")} to hoju_app_runtime`),
    `least-privilege migration does not grant the audited runtime wrapper: ${signature}`,
  );
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

for (const contract of [
  "create table if not exists public.purchase_access_sessions",
  "access_session_hash text not null unique",
  "session_source in ('activation', 'restore')",
  "consume_checkout_activation(text, text, text, text, text, text, timestamptz)",
  "consume_entitlement_restore_token(text, text, text, text, timestamptz)",
  "find_active_purchase_entitlement_by_access_session(bigint, text, text)",
  "release_purchase_access_session(bigint, text, text)",
  "20260823_purchase_access_sessions_v1",
]) assert.ok(accessSessionMigration.includes(contract), `access-session migration is missing: ${contract}`);

for (const contract of [
  "create table if not exists public.purchase_restore_activations",
  "restore_nonce_hash text not null unique",
  "drop function if exists public.consume_entitlement_restore_token(text, text, text, text, timestamptz)",
  "consume_entitlement_restore_token(text, text, text, text, text, timestamptz)",
  "'idempotent'::text",
  "access.revoked_at is not null or v_access.expires_at <= now()",
  "grant execute on function public.consume_entitlement_restore_token(text, text, text, text, text, timestamptz) to hoju_app_runtime",
  "20260823_restore_activation_nonce_v1",
]) assert.ok(restoreActivationMigration.includes(contract), `restore-activation migration is missing: ${contract}`);

assert.ok(
  runbook.indexOf("20260823_first_sale_gate_charge_link_v2")
    < runbook.indexOf("docs/migrations/20260823_payment_operator_alert_outbox_v1.sql")
    && runbook.indexOf("docs/migrations/20260823_payment_operator_alert_outbox_v1.sql")
      < runbook.indexOf("docs/migrations/20260823_checkout_activation_nonce_v1.sql"),
  "the runbook must preserve charge-link v2 -> outbox v1 -> activation v1 order",
);
assert.ok(
  runbook.indexOf("docs/migrations/20260823_checkout_activation_nonce_v1.sql")
    < runbook.indexOf("docs/migrations/20260823_purchase_access_sessions_v1.sql"),
  "the runbook must apply access sessions after activation nonce v1",
);
assert.ok(
  runbook.indexOf("docs/migrations/20260823_purchase_access_sessions_v1.sql")
    < runbook.indexOf("docs/migrations/20260823_restore_activation_nonce_v1.sql"),
  "the runbook must apply restore activation after access sessions v1",
);

const expectedRestoreEvidence = new Map([
  ["restore_binding_row_count", "1"],
  ["same_token_hash", "true"],
  ["same_nonce_hash", "true"],
  ["same_pair_retry_outcome", "idempotent"],
  ["access_session_suffix_same", "true"],
  ["access_session_reference_scope", "suffix_only"],
  ["retry_new_access_session_count", "0"],
  ["retry_new_binding_count", "0"],
  ["different_nonce_outcome", "used"],
  ["different_nonce_cookie_issued", "false"],
  ["released_same_pair_outcome", "released"],
  ["released_retry_cookie_issued", "false"],
  ["raw_nonce_in_same_tab_session_storage", "true"],
  ["raw_nonce_persisted_server_side", "false"],
  ["raw_nonce_copied_to_operational_packet", "false"],
  ["raw_restore_code_in_session_storage", "false"],
  ["raw_restore_code_persisted_server_side", "false"],
  ["pii_persisted_server_side", "false"],
  ["full_identifier_persisted_server_side", "false"],
]);

function parseRestoreEvidence(source) {
  const sectionStart = source.indexOf("#### Restore-session 응답 유실 증거");
  const sectionEnd = source.indexOf("- **15분 PASS:**", sectionStart);
  if (sectionStart < 0 || sectionEnd < 0) return null;

  const parsed = new Map();
  for (const line of source.slice(sectionStart, sectionEnd).split(/\r?\n/)) {
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    const field = cells[0]?.match(/^`([^`]+)`$/)?.[1];
    const value = cells[1]?.match(/^`([^`]+)`$/)?.[1];
    if (!field || !value) continue;
    if (parsed.has(field)) return null;
    parsed.set(field, value);
  }
  return parsed;
}

function restoreEvidencePasses(source) {
  const parsed = parseRestoreEvidence(source);
  return Boolean(parsed)
    && parsed.size === expectedRestoreEvidence.size
    && [...expectedRestoreEvidence].every(([field, value]) => parsed.get(field) === value);
}

assert.equal(restoreEvidencePasses(launchPacket), true, "restore-session evidence must contain every exact expected value");
const restoreEvidenceMutations = new Map([
  ["1", "2"],
  ["true", "false"],
  ["idempotent", "duplicate"],
  ["suffix_only", "full_id"],
  ["0", "1"],
  ["used", "duplicate"],
  ["released", "idempotent"],
  ["false", "true"],
]);
for (const [field, value] of expectedRestoreEvidence) {
  const unsafeValue = restoreEvidenceMutations.get(value);
  assert.ok(unsafeValue, `missing restore evidence mutation fixture for ${field}=${value}`);
  const exactRowPrefix = `| \`${field}\` | \`${value}\` |`;
  assert.ok(launchPacket.includes(exactRowPrefix), `restore evidence row is missing: ${field}`);
  const mutated = launchPacket.replace(exactRowPrefix, `| \`${field}\` | \`${unsafeValue}\` |`);
  assert.equal(
    restoreEvidencePasses(mutated),
    false,
    `restore evidence mutation must fail: ${field}=${value} -> ${unsafeValue}`,
  );
}

for (const contract of [
  "Outbox",
  "pending_count",
  "sent_count",
  "attempts",
  "실제 mailbox 수신",
  "consumed/idempotent/released",
  "response-loss same-nonce stable-session PASS",
  "different-nonce DENIED",
  "SMTP 재시도나 동일 Message-ID의 중복 이메일은 회계 사건이 아니다",
  "15분 안에",
  "24시간 안에",
  "active·unexpired·unrevoked",
  "`created_at`·`expires_at`·`revoked_at` 증거 시각",
  "Restore-session 응답 유실 증거",
  "원문 nonce는 동일 탭 재시도를 위해 `sessionStorage`에만 일시 저장",
  "원문 nonce는 DB·서버 로그·분석·운영 패킷에는 저장하지 않으며",
  "raw restore code는 `sessionStorage`에 저장하지 않는다",
  "15분 PASS",
  "15분 HOLD",
  "24시간 PASS",
  "24시간 HOLD",
  "2-/5-argument restore consume 부재·6-argument 단일 존재",
  "PUBLIC EXECUTE false",
  "runtime 직접 보호 테이블 권한 false",
]) assert.ok(launchPacket.includes(contract), `launch packet is missing: ${contract}`);
assert.ok(
  launchPacket.indexOf("same_pair_retry_outcome") < launchPacket.indexOf("retry_new_access_session_count")
    && launchPacket.indexOf("different_nonce_outcome") < launchPacket.indexOf("released_same_pair_outcome"),
  "restore-session evidence must preserve idempotent retry, different-nonce denial and released-pair denial",
);
assert.doesNotMatch(
  launchPacket,
  /\b(?:cs_(?:test|live)|pi_|ch_|re_)[A-Za-z0-9]{16,}\b/,
  "the launch packet must not contain a full payment or session identifier example",
);

for (const contract of [
  "20260823_payment_operator_alert_outbox_v1",
  "20260823_checkout_activation_nonce_v1",
  "20260823_purchase_access_sessions_v1",
  "20260823_restore_activation_nonce_v1",
  "catalog and effective-privilege evidence",
  "12-/7-/6-argument functions",
  "active, unexpired and unrevoked",
  "`created_at`, `expires_at` and `revoked_at`",
  "raw session ID, cookie, customer email or full Stripe ID",
]) assert.ok(liveLaunchChecklist.includes(contract), `live launch checklist is missing access evidence: ${contract}`);
assert.ok(
  liveLaunchChecklist.indexOf("20260823_payment_operator_alert_outbox_v1")
    < liveLaunchChecklist.indexOf("20260823_checkout_activation_nonce_v1")
    && liveLaunchChecklist.indexOf("20260823_checkout_activation_nonce_v1")
      < liveLaunchChecklist.indexOf("20260823_purchase_access_sessions_v1")
    && liveLaunchChecklist.indexOf("20260823_purchase_access_sessions_v1")
      < liveLaunchChecklist.indexOf("20260823_restore_activation_nonce_v1"),
  "the live checklist must preserve outbox -> activation -> access session -> restore activation order",
);

for (const document of [manifest, paymentReadiness]) {
  for (const version of [
    "20260823_first_sale_gate_charge_link_v2",
    "20260823_payment_operator_alert_outbox_v1",
    "20260823_checkout_activation_nonce_v1",
    "20260823_purchase_access_sessions_v1",
    "20260823_restore_activation_nonce_v1",
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
  "purchase_access_sessions",
  "purchase_restore_activations",
  "SHA-256",
]) {
  assert.ok(recovery.includes(contract), `Database recovery runbook is missing: ${contract}`);
}

console.log("Database migration and recovery-operation contracts passed.");
