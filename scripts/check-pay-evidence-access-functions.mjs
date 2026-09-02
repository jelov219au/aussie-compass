import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";
import eofyLeavingAccessFunctions from "../src/data/eofy-leaving-access-functions.json" with { type: "json" };
import contracts from "../src/data/pay-evidence-access-functions.json" with { type: "json" };
import alertContract from "../src/data/pay-evidence-alert-function.json" with { type: "json" };

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");
const normalize = (body) => body.replaceAll("\r\n", "\n");
const fingerprint = (body) => createHash("md5").update(normalize(body)).digest("hex");
const oldGuard = "p_product_code not in ('resume_pro', 'rental_application_pro')";
const newGuard = "p_product_code not in ('resume_pro', 'rental_application_pro', 'pay_evidence_pro')";
const migrationPath = "docs/migrations/20260831_pay_evidence_access_functions_v1.sql";
const migration = await read(migrationPath);
const runtime = await read("src/lib/neonFirstSaleGate.ts");
const runner = await read("scripts/apply-pay-evidence-migrations.mjs");
const launch = await read("scripts/check-pay-evidence-launch-readiness.mjs");
const alertMigrationPath = "docs/migrations/20260831_pay_evidence_alert_runtime_v1.sql";
const alertMigration = await read(alertMigrationPath);
const alertSource = normalize(await read(alertContract.source));
const alertBody = alertSource.match(/create function enqueue_payment_operator_alert_failure\([\s\S]*?as \$\$([\s\S]*?)\$\$/)?.[1];
assert.ok(alertBody);
assert.equal(fingerprint(alertBody), alertContract.beforeHash);
function repairAlert(body) {
  if (fingerprint(body) === alertContract.afterHash) return body;
  assert.equal(fingerprint(body), alertContract.beforeHash, "unreviewed alert body");
  return normalize(body)
    .replace("or p_event_type not in", "or p_event_type is null or p_event_type not in")
    .replace("or p_livemode is null or p_product_code <> 'resume_pro'",
      "or p_livemode is null or p_product_code is null\n    or " + newGuard);
}
const repairedAlert = repairAlert(alertBody);
assert.equal(fingerprint(repairedAlert), alertContract.afterHash);
assert.equal(repairAlert(repairedAlert), repairedAlert);
assert.equal(fingerprint(repairAlert(alertBody.replaceAll("\n", "\r\n"))), alertContract.afterHash);
assert.throws(() => repairAlert(alertBody + "\n-- unreviewed"), /unreviewed alert body/);
for (const guard of [
  alertContract.beforeHash, alertContract.afterHash,
  "current_database() <> 'neondb'", "current_user <> 'neondb_owner'",
  "lock table public.first_sale_gates in share row exclusive mode",
  "where state='RESERVED'", "set local role hoju_migration_owner",
  "grantee=0 and privilege_type='EXECUTE'",
  "v_after.proacl is distinct from v_before.proacl",
  "v_after.proowner is distinct from v_before.proowner",
  "v_after.proconfig is distinct from v_before.proconfig",
  "v_after.prosecdef is distinct from v_before.prosecdef",
  "v_after.provolatile is distinct from v_before.provolatile",
  "grant execute on function " + alertContract.signature + " to hoju_app_runtime",
]) assert.ok(alertMigration.includes(guard), guard);
assert.doesNotMatch(alertMigration.replace(/^\s*--.*$/gm, ""), /\b(?:drop|delete|truncate|create role|alter role|grant all)\b/i);
assert.ok(launch.includes(alertMigrationPath));
const constraintPrerequisite = await read("docs/migrations/20260831_pay_evidence_gate_constraint_prerequisite_v1.sql");
function assertConstraintPrerequisiteContract(source) {
  for (const guard of [
    "in access exclusive mode", "state = 'RESERVED'",
    "v_mentions_product_code := position('product_code' in lower(v_definition)) > 0",
    "v_mentions_expected_amount := position('expected_amount_cents' in lower(v_definition)) > 0",
    "if not v_mentions_product_code and not v_mentions_expected_amount then",
    "if not v_mentions_product_code or not v_mentions_expected_amount then",
    "Suspicious amount-like gate constraint; refusing duplicate removal",
    "not v_old.convalidated or not v_named.convalidated",
    "v_old.connoinherit is distinct from v_named.connoinherit",
    "v_definition is distinct from pg_get_constraintdef(v_named.oid)",
    "where oid = v_named.oid and convalidated",
    "v_table || '_check'", "v_table || '_expected_amount_cents_check'",
    "if not found then continue; end if;",
    "Canonical amount constraint was not preserved",
  ]) assert.ok(source.includes(guard), guard);
  assert.match(source, /if not v_mentions_product_code and not v_mentions_expected_amount then\s+continue;/);
  assert.doesNotMatch(source.replace(/^\s*--.*$/gm, ""), /\b(?:delete|truncate)\b/i);
}
assertConstraintPrerequisiteContract(constraintPrerequisite);

// Mutation checks keep the three-way contract explicit: unrelated state/audit
// constraints survive, exact amount duplicates are removable, and every
// amount-like mismatch stops before ALTER TABLE.
function classifyAutoNamedGateConstraint({
  definition,
  canonicalDefinition,
  oldType = "c",
  namedType = "c",
  oldValidated = true,
  namedValidated = true,
  sameInheritance = true,
}) {
  const normalized = definition.toLowerCase();
  const mentionsProductCode = normalized.includes("product_code");
  const mentionsExpectedAmount = normalized.includes("expected_amount_cents");
  if (!mentionsProductCode && !mentionsExpectedAmount) return "preserve";
  assert.ok(mentionsProductCode && mentionsExpectedAmount, "suspicious amount-like constraint");
  assert.ok(canonicalDefinition, "canonical amount constraint missing");
  assert.equal(oldType, "c");
  assert.equal(namedType, "c");
  assert.equal(oldValidated, true);
  assert.equal(namedValidated, true);
  assert.equal(sameInheritance, true);
  assert.equal(definition, canonicalDefinition, "unexpected amount-like constraint");
  assert.ok(definition.includes("resume_pro"));
  assert.ok(definition.includes("rental_application_pro"));
  return "drop";
}
const canonicalAmount = "CHECK (((product_code = 'resume_pro') AND (expected_amount_cents = 1990)) OR ((product_code = 'rental_application_pro') AND (expected_amount_cents = 1490)) OR ((product_code = 'pay_evidence_pro') AND (expected_amount_cents = 990)))";
assert.equal(classifyAutoNamedGateConstraint({
  definition: "CHECK (((state = 'OPEN') AND (claim_token_hash IS NULL)) OR ((state = 'RESERVED') AND (claim_token_hash IS NOT NULL)) OR (state = 'LOCKED'))",
}), "preserve", "the Production state invariant must survive the prerequisite");
assert.equal(classifyAutoNamedGateConstraint({
  definition: "CHECK ((approval_reference IS NULL) OR (length(approval_reference) <= 120))",
}), "preserve", "an unrelated audit invariant must survive the prerequisite");
assert.equal(classifyAutoNamedGateConstraint({
  definition: canonicalAmount,
  canonicalDefinition: canonicalAmount,
}), "drop", "only an exact validated amount duplicate is removable");
for (const unsafeConstraint of [
  { definition: canonicalAmount.replace("990", "991"), canonicalDefinition: canonicalAmount },
  { definition: "CHECK (product_code <> '')", canonicalDefinition: canonicalAmount },
  { definition: "CHECK (expected_amount_cents > 0)", canonicalDefinition: canonicalAmount },
  { definition: canonicalAmount, canonicalDefinition: null },
  { definition: canonicalAmount, canonicalDefinition: canonicalAmount, oldValidated: false },
]) assert.throws(
  () => classifyAutoNamedGateConstraint(unsafeConstraint),
  undefined,
  "every suspicious amount-like constraint mutation must fail closed",
);
for (const mutate of [
  (source) => source.replace("if not v_mentions_product_code and not v_mentions_expected_amount then", "if false then"),
  (source) => source.replace("if not v_mentions_product_code or not v_mentions_expected_amount then", "if false then"),
  (source) => source.replace("v_definition is distinct from pg_get_constraintdef(v_named.oid)", "false"),
]) assert.throws(
  () => assertConstraintPrerequisiteContract(mutate(constraintPrerequisite)),
  undefined,
  "constraint prerequisite safety mutation must fail its source contract",
);
assert.ok(runner.indexOf('path: "../docs/migrations/20260831_pay_evidence_gate_constraint_prerequisite_v1.sql"')
  < runner.indexOf('path: "../docs/migrations/20260830_pay_evidence_first_sale_gate_v1.sql"'));

assert.equal(contracts.length, 5);
assert.equal(new Set(contracts.map((item) => item.signature)).size, 5);
const sources = [
  "docs/entitlement-storage.sql",
  "docs/first-sale-gate.sql",
  "docs/migrations/20260823_payment_operator_alert_outbox_v1.sql",
  "docs/migrations/20260823_checkout_activation_nonce_v1.sql",
  "docs/migrations/20260823_purchase_access_sessions_v1.sql",
  "docs/migrations/20260823_restore_activation_nonce_v1.sql",
  "docs/migrations/20260823_payment_least_privilege_roles_v1.sql",
  "docs/migrations/20260824_entitlement_link_conflict_v1.sql",
  "docs/migrations/20260829_rental_first_sale_gate_v1.sql",
  "docs/migrations/20260830_pay_evidence_entitlement_v1.sql",
  "docs/migrations/20260830_pay_evidence_first_sale_gate_v1.sql",
];
const latest = new Map();
for (const path of sources) {
  const source = normalize(await read(path));
  for (const match of source.matchAll(/create(?: or replace)? function public\.(\w+)\(([\s\S]*?)\)\s*returns[\s\S]*?as \$\$([\s\S]*?)\$\$/gi)) {
    const types = match[2].split(",").map((param) => param.trim().split(/\s+/)[1]);
    latest.set("public." + match[1] + "(" + types.join(",") + ")", { path, body: match[3] });
  }
}

// This models the guarded source replacement, not PostgreSQL execution.
function repair(body, contract) {
  if (fingerprint(body) === contract.afterHash) return body;
  assert.equal(fingerprint(body), contract.beforeHash, "unreviewed body");
  assert.equal(body.split(oldGuard).length, 2, "exactly one product guard");
  const fixed = body.replace(oldGuard, newGuard);
  assert.equal(fingerprint(fixed), contract.afterHash);
  return fixed;
}
for (const contract of contracts) {
  const definition = latest.get(contract.signature);
  assert.ok(definition, contract.signature);
  assert.equal(definition.path, contract.source);
  assert.equal(fingerprint(definition.body), contract.beforeHash);
  const fixed = repair(definition.body, contract);
  assert.equal(fixed.replace(newGuard, oldGuard), definition.body, "only product allowlist changes");
  assert.equal(repair(fixed, contract), fixed, "idempotent rerun");
  assert.equal(fingerprint(repair(definition.body.replaceAll("\n", "\r\n"), contract)), contract.afterHash);
  assert.throws(() => repair(definition.body + "\n-- unreviewed change", contract), /unreviewed body/);
  assert.throws(() => repair(definition.body.replace(oldGuard, "true"), contract));
  assert.ok(migration.includes("('" + contract.signature + "', '" + contract.beforeHash + "', '" + contract.afterHash + "')"));
}
for (const guard of [
  "begin;", "commit;", "set local statement_timeout = '10s'",
  "set local lock_timeout = '2s'", "current_database() <> 'neondb'",
  "current_user <> 'neondb_owner'", "state = 'RESERVED'",
  "lock table public.first_sale_gates in share row exclusive mode",
  "set local role hoju_migration_owner", "set local role neondb_owner",
  "20260823_payment_least_privilege_roles_v1", "20260830_pay_evidence_first_sale_gate_v1",
  "v_after.proacl is distinct from v_before.proacl",
  "v_after.proowner is distinct from v_before.proowner",
  "v_after.proconfig is distinct from v_before.proconfig",
  "v_after.prosecdef is distinct from v_before.prosecdef",
  "v_after.provolatile is distinct from v_before.provolatile",
  "grantee = 0 and privilege_type = 'EXECUTE'",
]) assert.ok(migration.includes(guard), guard);
assert.doesNotMatch(migration.replace(/^\s*--.*$/gm, ""), /\b(?:drop|truncate|delete|grant|revoke)\b/i);
assert.equal((migration.match(/execute replace\(/g) ?? []).length, 1);
assert.ok(launch.includes(migrationPath));

for (const source of [runtime, runner]) {
  for (const contract of [
    "count(*) = 6", "left join pg_proc", 'expected."afterHash"',
    "p.prosecdef", "search_path=public, pg_temp",
    "grantee = 0 and privilege_type = 'EXECUTE'", "has_function_privilege",
    "chr(13) || chr(10)", "to_regprocedure(expected.signature)",
  ]) assert.ok(source.includes(contract), contract);
}

// Execute the actual server readiness function with a fake Neon transport.
// No environment secrets, real DB or network calls are used.
const stripped = runtime
  .replace(/^import .*;\r?\n/gm, "")
  .replaceAll("export ", "");
const compiled = ts.transpileModule(stripped, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
}).outputText;
async function readiness(product, responses) {
  const calls = [];
  const sql = async (strings, ...values) => {
    calls.push({ text: strings.join("?"), values });
    const next = responses.shift();
    if (next instanceof Error) throw next;
    return next;
  };
  const context = vm.createContext({
    neon: (_url, options) => {
      assert.equal(options.readOnly, true);
      return sql;
    },
    getEntitlementDatabaseUrl: () => "postgresql://synthetic.invalid/neondb",
    eofyLeavingAccessFunctions,
    payEvidenceAccessFunctions: contracts,
    payEvidenceAlertFunction: alertContract,
    AbortSignal,
    process: { env: {} },
  });
  vm.runInContext(compiled, context);
  const result = await context.isPaymentRuntimeSchemaReady(product);
  return { result, calls };
}
const ready = [{ ready: true }];
assert.equal((await readiness("pay_evidence_pro", [[{ ready: false }]])).result, false);
assert.equal((await readiness("pay_evidence_pro", [ready, []])).result, false);
assert.equal((await readiness("pay_evidence_pro", [ready, ready, [{ ready: false }]])).result, false);
assert.equal((await readiness("pay_evidence_pro", [ready, ready, []])).result, false);
assert.equal((await readiness("pay_evidence_pro", [ready, ready, [{ ready: "true" }]])).result, false);
assert.equal((await readiness("pay_evidence_pro", [ready, ready, new Error("DB unavailable")])).result, false);
const pass = await readiness("pay_evidence_pro", [ready, ready, ready]);
assert.equal(pass.result, true);
assert.equal(pass.calls.length, 3);
assert.deepEqual(JSON.parse(pass.calls[2].values[0]), [...contracts, alertContract]);
for (const product of ["rental_application_pro", "eofy_pro", "leaving_australia_pro"]) {
  const result = await readiness(product, product === "rental_application_pro" ? [ready] : [ready, ready, ready]);
  assert.equal(result.result, true);
  assert.equal(result.calls.length, product === "rental_application_pro" ? 1 : 3);
}

// Exercise the actual migration runner's selection/SQL splitter in memory.
async function runMigration({ apply = true, alreadyApplied = false, accessReady = true, ack = true, checkout = false, prerequisiteApplied = true, alertApplied = true } = {}) {
  const transactions = [];
  const logs = [];
  const responses = [
    [{
      database_ok: true, owner_ok: true, migration_role_ok: true, no_reservation: true,
      entitlement_applied: true, first_sale_applied: true, access_functions_applied: alreadyApplied,
      gate_constraint_prerequisite_applied: prerequisiteApplied,
      alert_runtime_applied: alertApplied,
    }],
    [{
      entitlement_applied: true, first_sale_applied: true,
      gate_constraint_ready: true, access_constraint_ready: true, paid_function_ready: true,
    }],
    [{ ready: accessReady }],
  ];
  const sql = async () => responses.shift();
  sql.query = (statement) => statement;
  sql.transaction = async (statements, options) => { transactions.push({ statements, options }); };
  const code = runner.replace(/^import .*;\r?\n/gm, "")
    .replaceAll("import.meta.url", JSON.stringify(new URL("./apply-pay-evidence-migrations.mjs", import.meta.url).href));
  await vm.runInNewContext("(async () => { " + code + "\n})()", {
    assert, readFile, URL, AbortSignal, accessFunctions: contracts, alertFunction: alertContract,
    neon: () => sql,
    process: { argv: apply ? ["node", "runner", "--apply"] : ["node", "runner"], env: {
      ENTITLEMENT_DB_URL: "postgresql://synthetic.invalid/neondb",
      PAY_EVIDENCE_MIGRATION_ACK: ack ? "APPLY_PAY_EVIDENCE_MIGRATIONS_WITH_CHECKOUT_OFF" : "",
      PAY_EVIDENCE_PRO_PAYMENTS_ENABLED: checkout ? "true" : "false",
    } },
    console: { log: (line) => logs.push(line) },
  });
  return { transactions, logs };
}
const applied = await runMigration();
assert.equal(applied.transactions.length, 1, "apply missing access fix even when old migrations are done");
assert.equal(applied.transactions[0].options.isolationLevel, "Serializable");
assert.equal(applied.transactions[0].statements.length, 9, "dollar-quoted DO blocks remain intact");
assert.ok(applied.transactions[0].statements.some((s) => s.includes("execute replace(v_definition")));
assert.ok(applied.logs[0].includes("=PASS"));
assert.equal((await runMigration({ alreadyApplied: true })).transactions.length, 0);
const withPrerequisite = await runMigration({ prerequisiteApplied: false });
assert.equal(withPrerequisite.transactions.length, 2);
assert.ok(withPrerequisite.transactions[0].statements.some((s) => s.includes("Canonical amount constraint missing")));
assert.ok(withPrerequisite.transactions[0].statements.some((s) => s.includes("if not v_mentions_product_code and not v_mentions_expected_amount")));
assert.ok(withPrerequisite.transactions[0].statements.some((s) => s.includes("Suspicious amount-like gate constraint")));
const productionGap = await runMigration({ prerequisiteApplied: false, alertApplied: false });
assert.equal(productionGap.transactions.length, 3, "the exact Production gap applies prerequisite, access and alert fixes in order");
assert.ok(productionGap.transactions[0].statements.some((s) => s.includes("v_table || '_check'")));
assert.ok(productionGap.transactions[1].statements.some((s) => s.includes("execute replace(v_definition")));
assert.ok(productionGap.transactions[2].statements.some((s) => s.includes("grant execute on function public.enqueue_payment_operator_alert_failure")));
const missingAlert = await runMigration({ alreadyApplied: true, alertApplied: false });
assert.equal(missingAlert.transactions.length, 1);
assert.ok(missingAlert.transactions[0].statements.some((s) => s.includes("grant execute on function public.enqueue_payment_operator_alert_failure")));
const pending = await runMigration({ apply: false, accessReady: false });
assert.equal(pending.transactions.length, 0);
assert.ok(pending.logs[0].includes("=PENDING"));
await assert.rejects(runMigration({ accessReady: false }), /postflight failed/);
await assert.rejects(runMigration({ ack: false }), /acknowledgement/);
await assert.rejects(runMigration({ checkout: true }), /Checkout must remain off/);

console.log("PAY_EVIDENCE_ACCESS_FUNCTIONS=PASS signatures=5 alert_contract=verified source_contracts=verified runtime_mock=verified migration_runner_mock=verified postgres_execution=not_run network=none");
