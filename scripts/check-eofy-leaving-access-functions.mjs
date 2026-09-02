import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";

import contracts from "../src/data/eofy-leaving-access-functions.json" with { type: "json" };
import payAccessContracts from "../src/data/pay-evidence-access-functions.json" with { type: "json" };
import payAlertContract from "../src/data/pay-evidence-alert-function.json" with { type: "json" };

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");
const normalize = (body) => body.replaceAll("\r\n", "\n");
const fingerprint = (body) => createHash("md5").update(normalize(body)).digest("hex");
const oldGuard = "p_product_code not in ('resume_pro', 'rental_application_pro')";
const payGuard = "p_product_code not in ('resume_pro', 'rental_application_pro', 'pay_evidence_pro')";
const finalGuard = "p_product_code not in ('resume_pro', 'rental_application_pro', 'pay_evidence_pro', 'eofy_pro', 'leaving_australia_pro')";
const migrationPath = "docs/migrations/20260902_eofy_leaving_access_functions_v1.sql";
const migration = await read(migrationPath);
const runner = await read("scripts/apply-eofy-leaving-access-functions.mjs");
const runtime = await read("src/lib/neonFirstSaleGate.ts");
const eofyRunner = await read("scripts/apply-eofy-migrations.mjs");
const leavingRunner = await read("scripts/apply-leaving-australia-migrations.mjs");
const eofyReadiness = await read("scripts/check-eofy-launch-readiness.mjs");
const leavingReadiness = await read("scripts/check-leaving-australia-launch-readiness.mjs");

assert.equal(contracts.length, 6);
assert.equal(new Set(contracts.map(({ signature }) => signature)).size, 6);
const accessContracts = contracts.filter(({ signature }) => !signature.includes("enqueue_payment_operator_alert_failure"));
const alertContract = contracts.find(({ signature }) => signature.includes("enqueue_payment_operator_alert_failure"));
assert.equal(accessContracts.length, 5);
assert.ok(alertContract);

function functionBody(source, signature) {
  for (const match of normalize(source).matchAll(
    /create(?: or replace)? function public\.(\w+)\(([\s\S]*?)\)\s*returns[\s\S]*?as \$\$([\s\S]*?)\$\$/gi,
  )) {
    const types = match[2].split(",").map((param) => param.trim().split(/\s+/)[1]);
    if (`public.${match[1]}(${types.join(",")})` === signature) return match[3];
  }
  return undefined;
}

for (const contract of accessContracts) {
  const payContract = payAccessContracts.find(({ signature }) => signature === contract.signature);
  assert.ok(payContract, contract.signature);
  const sourceBody = functionBody(await read(payContract.source), contract.signature);
  assert.ok(sourceBody, contract.signature);
  const payBody = sourceBody.replace(oldGuard, payGuard);
  assert.equal(fingerprint(payBody), contract.beforeHash, `${contract.signature} Pay predecessor`);
  const finalBody = payBody.replace(payGuard, finalGuard);
  assert.equal(fingerprint(finalBody), contract.afterHash, `${contract.signature} cumulative body`);
  assert.equal(finalBody.replace(finalGuard, payGuard), payBody, "only the product allowlist changes");
  assert.ok(migration.includes(
    `('${contract.signature}', '${contract.beforeHash}', '${contract.afterHash}')`,
  ));
}

const alertSource = normalize(await read(payAlertContract.source));
const baselineAlertBody = alertSource.match(
  /create function enqueue_payment_operator_alert_failure\([\s\S]*?as \$\$([\s\S]*?)\$\$/,
)?.[1];
assert.ok(baselineAlertBody);
assert.equal(fingerprint(baselineAlertBody), alertContract.baselineHash);
const payAlertBody = baselineAlertBody
  .replace("or p_event_type not in", "or p_event_type is null or p_event_type not in")
  .replace(
    "or p_livemode is null or p_product_code <> 'resume_pro'",
    "or p_livemode is null or p_product_code is null\n    or " + payGuard,
  );
assert.equal(fingerprint(payAlertBody), alertContract.beforeHash);
assert.equal(fingerprint(payAlertBody.replace(payGuard, finalGuard)), alertContract.afterHash);

for (const guard of [
  "begin;", "commit;", "set local statement_timeout = '10s'", "set local lock_timeout = '2s'",
  "current_database() <> 'neondb'", "current_user <> 'neondb_owner'",
  "lock table public.first_sale_gates in share row exclusive mode", "state = 'RESERVED'",
  "20260831_pay_evidence_access_functions_v1", "20260831_pay_evidence_alert_runtime_v1",
  "20260830_eofy_entitlement_v1", "20260830_eofy_first_sale_gate_v1",
  "20260830_leaving_australia_entitlement_v1", "20260830_leaving_australia_first_sale_gate_v1",
  "set local role hoju_migration_owner", "set local role neondb_owner",
  "v_after.proowner is distinct from v_before.proowner",
  "v_after.proconfig is distinct from v_before.proconfig",
  "v_after.prosecdef is distinct from v_before.prosecdef",
  "v_after.provolatile is distinct from v_before.provolatile",
  "has_function_privilege('hoju_app_runtime'", "grantee = 0 and privilege_type = 'EXECUTE'",
  "when ''eofy_pro'' then 990", "when ''leaving_australia_pro'' then 1290",
  "values ('20260902_eofy_leaving_access_functions_v1')",
]) assert.ok(migration.includes(guard), guard);
assert.doesNotMatch(
  migration.replace(/^\s*--.*$/gm, ""),
  /\b(?:drop|delete|truncate|create role|alter role|grant all|revoke)\b/i,
);

for (const source of [eofyRunner, leavingRunner]) {
  assert.ok(source.includes("20260902_eofy_leaving_access_functions_v1"));
  assert.ok(source.includes("cumulative_access_applied"));
  assert.ok(source.includes("JSON.stringify(cumulativeAccessContracts)"));
  assert.ok(source.includes("const cumulativeAccessReady"));
  assert.ok(source.includes("cumulative_access=${cumulativeAccessReady ? \"PASS\" : \"PENDING\"}"));
}
for (const source of [eofyReadiness, leavingReadiness]) assert.ok(source.includes(migrationPath));
for (const source of [runner, runtime]) {
  for (const contract of [
    "count(*) = 6", 'expected."afterHash"', "left join pg_proc",
    "p.prosecdef", "search_path=public, pg_temp", "has_function_privilege",
    "grantee = 0 and privilege_type = 'EXECUTE'", "to_regprocedure(expected.signature)",
  ]) assert.ok(source.includes(contract), contract);
}
assert.ok(runtime.includes("const exactAmountGuard = `when '${requiredProductCode}' then ${requiredAmountCents}`"));

const strippedRuntime = runtime.replace(/^import .*;\r?\n/gm, "").replaceAll("export ", "");
const compiledRuntime = ts.transpileModule(strippedRuntime, {
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
    payEvidenceAccessFunctions: payAccessContracts,
    payEvidenceAlertFunction: payAlertContract,
    eofyLeavingAccessFunctions: contracts,
    AbortSignal,
    process: { env: {} },
  });
  vm.runInContext(compiledRuntime, context);
  return { result: await context.isPaymentRuntimeSchemaReady(product), calls };
}
const ready = [{ ready: true }];
const notReady = [{ ready: false }];
assert.equal((await readiness("rental_application_pro", [ready])).result, true);
assert.equal((await readiness("pay_evidence_pro", [ready, ready, ready])).result, true);
assert.equal((await readiness("pay_evidence_pro", [ready, ready, notReady, ready])).result, true);
assert.equal((await readiness("pay_evidence_pro", [ready, ready, notReady, notReady])).result, false);
for (const product of ["eofy_pro", "leaving_australia_pro"]) {
  assert.equal((await readiness(product, [ready, ready, notReady])).result, false);
  const pass = await readiness(product, [ready, ready, ready]);
  assert.equal(pass.result, true);
  assert.equal(pass.calls.length, 3);
  assert.deepEqual(JSON.parse(pass.calls[2].values[0]), contracts);
}
assert.equal((await readiness("eofy_pro", [ready, ready, new Error("DB unavailable")])).result, false);

async function runMigration({
  apply = true,
  migrationApplied = false,
  prerequisitesReady = true,
  accessReady = true,
  ack = true,
  eofyCheckout = false,
  leavingCheckout = false,
} = {}) {
  const transactions = [];
  const logs = [];
  const responses = [
    [{
      database_ok: true,
      owner_ok: true,
      migration_role_ok: true,
      no_reservation: true,
      prerequisites_ready: prerequisitesReady,
      migration_applied: migrationApplied,
    }],
    [{ migration_applied: true, product_contract_ready: true }],
    [{ ready: accessReady }],
  ];
  const sql = async () => responses.shift();
  sql.query = (statement) => statement;
  sql.transaction = async (statements, options) => transactions.push({ statements, options });
  const code = runner.replace(/^import .*;\r?\n/gm, "")
    .replaceAll(
      "import.meta.url",
      JSON.stringify(new URL("./apply-eofy-leaving-access-functions.mjs", import.meta.url).href),
    );
  await vm.runInNewContext(`(async () => { ${code}\n})()`, {
    assert,
    readFile,
    URL,
    AbortSignal,
    contracts,
    neon: () => sql,
    process: {
      argv: apply ? ["node", "runner", "--apply"] : ["node", "runner"],
      env: {
        ENTITLEMENT_DB_URL: "postgresql://synthetic.invalid/neondb",
        EOFY_LEAVING_ACCESS_MIGRATION_ACK: ack
          ? "APPLY_EOFY_LEAVING_ACCESS_FUNCTIONS_WITH_BOTH_CHECKOUTS_OFF"
          : "",
        EOFY_PRO_PAYMENTS_ENABLED: eofyCheckout ? "true" : "false",
        LEAVING_AUSTRALIA_PRO_PAYMENTS_ENABLED: leavingCheckout ? "true" : "false",
      },
    },
    console: { log: (line) => logs.push(line) },
  });
  return { transactions, logs };
}

const applied = await runMigration();
assert.equal(applied.transactions.length, 1);
assert.equal(applied.transactions[0].options.isolationLevel, "Serializable");
assert.ok(applied.transactions[0].statements.some((statement) => statement.includes("execute replace(v_definition")));
assert.ok(applied.logs[0].includes("=PASS"));
assert.equal((await runMigration({ migrationApplied: true })).transactions.length, 1);
const pending = await runMigration({ apply: false, migrationApplied: false, accessReady: false });
assert.equal(pending.transactions.length, 0);
assert.ok(pending.logs[0].includes("=PENDING"));
await assert.rejects(runMigration({ prerequisitesReady: false }), /prerequisites are missing/);
await assert.rejects(runMigration({ ack: false }), /acknowledgement/);
await assert.rejects(runMigration({ eofyCheckout: true }), /must remain off/);
await assert.rejects(runMigration({ leavingCheckout: true }), /must remain off/);
await assert.rejects(runMigration({ accessReady: false }), /postflight failed/);

console.log("EOFY_LEAVING_ACCESS_FUNCTIONS=PASS signatures=6 amounts=verified source_contracts=verified runtime_mock=verified migration_runner_mock=verified postgres_execution=not_run network=none");
