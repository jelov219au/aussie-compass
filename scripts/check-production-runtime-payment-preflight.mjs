import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { runProductionRuntimePaymentPreflight } from "../src/lib/productionRuntimePaymentPreflight.ts";
import {
  productionOperatorAuditFail,
  productionOperatorAuditPass,
  runProductionPaymentOperatorAudit,
} from "./production-payment-operator-audit.mjs";
import {
  buildRuntimePreflightRequestBody,
  buildVercelCurlArguments,
  runtimePreflightFail,
  runtimePreflightPass,
  runtimePreflightPath,
  verifyVercelProductionRuntimePreflight,
} from "./vercel-production-runtime-preflight.mjs";

const routeSource = readFileSync(new URL("../src/app/api/operator/payment-runtime-preflight/route.ts", import.meta.url), "utf8");
const helperSource = readFileSync(new URL("../src/lib/productionRuntimePaymentPreflight.ts", import.meta.url), "utf8");
const databaseSource = readFileSync(new URL("../src/lib/productionRuntimeDatabasePreflight.ts", import.meta.url), "utf8");
const verifierSource = readFileSync(new URL("./vercel-production-runtime-preflight.mjs", import.meta.url), "utf8");
const operatorAuditSource = readFileSync(new URL("./production-payment-operator-audit.mjs", import.meta.url), "utf8");
const packageSource = readFileSync(new URL("../package.json", import.meta.url), "utf8");

for (const contract of [
  'export const runtime = "nodejs"',
  'export const dynamic = "force-dynamic"',
  "export async function POST",
  "export function GET",
  "export function HEAD",
  'request.headers.get(requestHeader) === requestContract',
  'runtimeDeploymentHost.endsWith(".vercel.app")',
  'request.nextUrl.hostname.toLowerCase() === runtimeDeploymentHost',
  'process.env.VERCEL_ENV',
  'process.env.PAYMENTS_ENABLED',
  'process.env.STRIPE_MANAGED_PAYMENTS_ENABLED',
  'process.env.VERCEL_GIT_COMMIT_SHA',
  'keys.has("expectedSha")',
  'keys.has("expectedEndpointId")',
  'keys.has("challenge")',
  'keys.has("auditKeyHmac")',
  'keys.has("accountingKeyHmac")',
  'createHmac("sha256", runtimeKey)',
  "timingSafeEqual",
  "getPaymentReadiness()",
  "stripe.prices.retrieve",
  'stripe.checkout.sessions.list({ status: "open", limit: 100 })',
  "isPaymentRuntimeSchemaReady",
  "verifyProductionRuntimeDatabase",
  "runPaymentAlertTransportCheck({ sendTest: false })",
  '"Cache-Control": "no-store, max-age=0"',
  runtimePreflightPass,
  runtimePreflightFail,
]) assert.ok(routeSource.includes(contract), `runtime route is missing: ${contract}`);

assert.doesNotMatch(routeSource, /sendTest:\s*true|sendMail\(|checkout\.sessions\.create|console\.(?:log|warn|error)/, "runtime preflight must not send mail, create Checkout or log details");
assert.doesNotMatch(routeSource, /ENTITLEMENT_DB_URL|ZOHO_SMTP_APP_PASSWORD|price\.id|product\.id|session\.id/, "runtime route must not expose raw secret and identifier fields");
assert.doesNotMatch(routeSource, /(?:canonicalPass|canonicalFail)[^\n]*(?:runtimeKey|auditKeyHmac|accountingKeyHmac|challenge)/, "fixed evidence must not expose raw or derived key material");
assert.equal((routeSource.match(/PRODUCTION_RUNTIME_PAYMENT_PREFLIGHT=PASS/g) ?? []).length, 1);
assert.equal((routeSource.match(/PRODUCTION_RUNTIME_PAYMENT_PREFLIGHT=FAIL/g) ?? []).length, 1);

for (const contract of [
  'input.environment === "production"',
  'input.paymentsEnabled === "false"',
  'input.managedPaymentsEnabled === "true"',
  "input.deploymentSha === input.expectedSha",
  "input.runtimeKeyRolesDistinct",
  "readiness.enabled === false",
  "readiness.ready === false",
  "readiness.stripeConfigured",
  "readiness.stripeProductContractConfigured",
  "readiness.managedPaymentsConfigured",
  "readiness.webhookConfigured",
  "readiness.entitlementStoreConfigured",
  "readiness.firstSaleGateConfigured",
  "readiness.accessDeliveryImplemented",
  "readiness.sellerDetailsConfigured",
  "readiness.supportConfigured",
  "readiness.operatorAlertsConfigured",
  "verifyRuntimeDatabaseRoleAndEndpoint",
]) assert.ok(helperSource.includes(contract), `runtime helper is missing: ${contract}`);

for (const contract of [
  "readOnly: true",
  'isolationLevel: "RepeatableRead"',
  "current_database() = 'neondb'",
  "current_user = 'hoju_app_runtime'",
  "runtime_role_has_safe_attributes",
  "runtime_has_no_protected_table_mutation",
  "runtime_cannot_approve_next_sale",
  "approve_next_first_sale(text,text,text,integer,text)",
  'endpointIdFromDatabaseUrl(databaseUrl) !== expectedEndpointId',
]) assert.ok(databaseSource.includes(contract), `runtime database probe is missing: ${contract}`);
assert.doesNotMatch(databaseSource, /\b(?:insert|update|delete|truncate|alter|create|drop|grant|revoke)\s+(?:into|table|role|on)\b/i, "runtime database probe must remain read-only");

for (const contract of [
  'const vercelPackage = "vercel@59.5.0"',
  '"curl"',
  '"--deployment"',
  '"--request"',
  '"POST"',
  '"x-hoju-runtime-preflight: read-only-v1"',
  '"--fail-with-body"',
  'redirect: "manual"',
  'noindex.includes("noindex")',
  '"VERCEL_AUTOMATION_BYPASS_SECRET"',
  '"VERCEL_TOKEN"',
  'argumentsList[4] !== "--expected-endpoint"',
]) assert.ok(verifierSource.includes(contract), `verifier is missing: ${contract}`);

assert.doesNotMatch(verifierSource, /env run|env pull|--token|--protection-bypass|hojucompass\.com/, "verifier must not download secrets, accept token arguments, manage bypass values or call the public origin");
assert.ok(packageSource.includes('"payments:verify-production-runtime"'));
assert.ok(packageSource.includes('"payments:operator-audit"'));
assert.ok(packageSource.includes('"test:production-runtime-preflight"'));

for (const contract of [
  "accounts.retrieveCurrent()",
  "account.charges_enabled === true",
  "account.payouts_enabled === true",
  "account.details_submitted === true",
  "requirements?.currently_due?.length",
  "requirements?.past_due?.length",
  "profile?.support_email?.trim().toLowerCase() === supportEmail",
  "statement_descriptor",
  "current_database() = 'neondb'",
  "current_user = 'hoju_payment_auditor'",
  "audit_role_has_safe_attributes",
  "audit_does_not_inherit_elevated_roles",
  "audit_has_read_only_protected_table_access",
  "required_migrations_present",
  "named_entitlement_link_constraint_active",
  "no_reservation_in_flight",
  productionOperatorAuditPass,
  productionOperatorAuditFail,
]) assert.ok(operatorAuditSource.includes(contract), `operator audit is missing: ${contract}`);
assert.doesNotMatch(operatorAuditSource, /console\.(?:warn|error)|checkout\.sessions\.create|sendMail\(|writeFile|appendFile/, "operator audit must remain read-only and fixed-output");

const readiness = {
  enabled: false,
  stripeConfigured: true,
  stripeProductContractConfigured: true,
  managedPaymentsConfigured: true,
  webhookConfigured: true,
  entitlementStoreConfigured: true,
  firstSaleGateConfigured: true,
  accessDeliveryImplemented: true,
  sellerDetailsConfigured: true,
  supportConfigured: true,
  operatorAlertsConfigured: true,
  ready: false,
};
const expectedSha = "a".repeat(40);
const expectedEndpointId = "ep-contract-primary-a1b2c3";
const challenge = "1".repeat(64);
const auditKeyHmac = "2".repeat(64);
const accountingKeyHmac = "3".repeat(64);
const requestBody = buildRuntimePreflightRequestBody({
  expectedSha,
  expectedEndpointId,
  challenge,
  auditKeyHmac,
  accountingKeyHmac,
});
const cliArguments = buildVercelCurlArguments({
  deploymentOrigin: "https://candidate-a.vercel.app",
});
assert.ok(cliArguments.includes("curl") && cliArguments.includes("--deployment") && cliArguments.includes("POST"));
assert.ok(cliArguments.includes("https://candidate-a.vercel.app"));
assert.equal(requestBody, JSON.stringify({ expectedSha, expectedEndpointId, challenge, auditKeyHmac, accountingKeyHmac }));
assert.ok(cliArguments.includes("--data-binary"));
assert.ok(cliArguments.includes("@-"));
assert.equal(cliArguments.some((argument) => [challenge, auditKeyHmac, accountingKeyHmac].some((value) => argument.includes(value))), false);
assert.equal(cliArguments.some((argument) => /--token|--protection-bypass|rk_live_|postgres(?:ql)?:\/\//.test(argument)), false);
const validInput = {
  environment: "production",
  paymentsEnabled: "false",
  managedPaymentsEnabled: "true",
  deploymentSha: expectedSha,
  expectedSha,
  runtimeKeyRolesDistinct: true,
  readiness,
};

function dependencies(overrides = {}) {
  return {
    verifyStripeProductAndZeroOpenSessions: async () => true,
    verifyRuntimeSchema: async () => true,
    verifyRuntimeDatabaseRoleAndEndpoint: async () => true,
    verifyPaymentAlertTransportWithoutSending: async () => true,
    ...overrides,
  };
}

assert.equal(await runProductionRuntimePaymentPreflight(validInput, dependencies()), true);

const operatorEnvironment = {
  PAYMENTS_STRIPE_AUDIT_KEY: "rk_live_contractauditonly",
  PAYMENTS_AUDIT_DB_URL: "postgresql://audit:contract@ep-contract-primary-a1b2c3-pooler.ap-southeast-2.aws.neon.tech/neondb",
  PAYMENTS_EXPECTED_NEON_ENDPOINT_ID: expectedEndpointId,
};
let operatorRemoteCalls = 0;
const operatorDependencies = {
  verifyStripeAccount: async () => { operatorRemoteCalls += 1; return true; },
  verifyAuditDatabase: async () => { operatorRemoteCalls += 1; return true; },
};
assert.equal(await runProductionPaymentOperatorAudit(operatorEnvironment, operatorDependencies), true);
assert.equal(operatorRemoteCalls, 2);
operatorRemoteCalls = 0;
assert.equal(await runProductionPaymentOperatorAudit({ ...operatorEnvironment, PAYMENTS_STRIPE_AUDIT_KEY: "" }, operatorDependencies), false);
assert.equal(await runProductionPaymentOperatorAudit({ ...operatorEnvironment, PAYMENTS_AUDIT_DB_URL: "postgresql://audit:contract@wrong.neon.tech/neondb" }, operatorDependencies), false);
assert.equal(operatorRemoteCalls, 0, "invalid operator inputs must stop before Stripe or Neon reads");
assert.equal(await runProductionPaymentOperatorAudit(operatorEnvironment, {
  verifyStripeAccount: async () => false,
  verifyAuditDatabase: async () => true,
}), false);
for (const invalidInput of [
  { ...validInput, environment: "preview" },
  { ...validInput, paymentsEnabled: "" },
  { ...validInput, paymentsEnabled: "true" },
  { ...validInput, managedPaymentsEnabled: "false" },
  { ...validInput, deploymentSha: "b".repeat(40) },
  { ...validInput, expectedSha: "invalid" },
  { ...validInput, runtimeKeyRolesDistinct: false },
  { ...validInput, readiness: { ...readiness, webhookConfigured: false } },
  { ...validInput, readiness: { ...readiness, ready: true } },
]) {
  let remoteCalls = 0;
  const result = await runProductionRuntimePaymentPreflight(invalidInput, dependencies({
    verifyStripeProductAndZeroOpenSessions: async () => { remoteCalls += 1; return true; },
    verifyRuntimeSchema: async () => { remoteCalls += 1; return true; },
    verifyRuntimeDatabaseRoleAndEndpoint: async () => { remoteCalls += 1; return true; },
    verifyPaymentAlertTransportWithoutSending: async () => { remoteCalls += 1; return true; },
  }));
  assert.equal(result, false);
  assert.equal(remoteCalls, 0, "invalid local runtime state must stop before network checks");
}

for (const failedDependency of [
  "verifyStripeProductAndZeroOpenSessions",
  "verifyRuntimeSchema",
  "verifyRuntimeDatabaseRoleAndEndpoint",
  "verifyPaymentAlertTransportWithoutSending",
]) {
  assert.equal(await runProductionRuntimePaymentPreflight(validInput, dependencies({
    [failedDependency]: async () => false,
  })), false);
}
assert.equal(await runProductionRuntimePaymentPreflight(validInput, dependencies({
  verifyStripeProductAndZeroOpenSessions: async () => { throw new Error("redacted fixture"); },
})), false);

const protectedFetch = async (url, options) => {
  assert.equal(url.toString(), `https://candidate-a.vercel.app${runtimePreflightPath}`);
  assert.equal(options.method, "GET");
  assert.equal(options.redirect, "manual");
  return {
    status: 302,
    headers: new Headers({ "x-robots-tag": "noindex" }),
  };
};
let invokedRuntime = null;
assert.equal(await verifyVercelProductionRuntimePreflight({
  deploymentOrigin: "https://candidate-a.vercel.app",
  expectedSha,
  expectedEndpointId,
  challenge,
  auditKeyHmac,
  accountingKeyHmac,
  fetchImpl: protectedFetch,
  runVercelCurl: async (input) => {
    invokedRuntime = input;
    return { status: 0, stdout: `${runtimePreflightPass}\n` };
  },
}), true);
assert.deepEqual(invokedRuntime, { deploymentOrigin: "https://candidate-a.vercel.app", expectedSha, expectedEndpointId, challenge, auditKeyHmac, accountingKeyHmac });

let unprotectedRuntimeCalls = 0;
assert.equal(await verifyVercelProductionRuntimePreflight({
  deploymentOrigin: "https://candidate-a.vercel.app",
  expectedSha,
  expectedEndpointId,
  challenge,
  auditKeyHmac,
  accountingKeyHmac,
  fetchImpl: async () => ({ status: 405, headers: new Headers() }),
  runVercelCurl: async () => { unprotectedRuntimeCalls += 1; return { status: 0, stdout: runtimePreflightPass }; },
}), false);
assert.equal(unprotectedRuntimeCalls, 0, "an unprotected exact deployment must fail before the runtime POST");

for (const fixture of [
  { status: 1, stdout: runtimePreflightFail },
  { status: 0, stdout: runtimePreflightFail },
  { status: 0, stdout: `${runtimePreflightPass}\nextra-output` },
  { status: 0, stdout: "" },
]) {
  assert.equal(await verifyVercelProductionRuntimePreflight({
    deploymentOrigin: "https://candidate-a.vercel.app",
    expectedSha,
    expectedEndpointId,
    challenge,
    auditKeyHmac,
    accountingKeyHmac,
    fetchImpl: protectedFetch,
    runVercelCurl: async () => fixture,
  }), false);
}

for (const deploymentOrigin of [
  "https://hojucompass.com",
  "http://candidate-a.vercel.app",
  "https://candidate-a.vercel.app/path",
  "https://candidate-a.vercel.app?token=unsafe",
]) {
  assert.equal(await verifyVercelProductionRuntimePreflight({
    deploymentOrigin,
    expectedSha,
    expectedEndpointId,
    challenge,
    auditKeyHmac,
    accountingKeyHmac,
    fetchImpl: async () => { throw new Error("must not fetch"); },
    runVercelCurl: async () => { throw new Error("must not run"); },
  }), false);
}

const invalidInvocation = spawnSync(process.execPath, [
  fileURLToPath(new URL("./vercel-production-runtime-preflight.mjs", import.meta.url)),
], { encoding: "utf8" });
assert.equal(invalidInvocation.status, 1);
assert.equal(invalidInvocation.stdout.trim(), runtimePreflightFail);
assert.doesNotMatch(`${invalidInvocation.stdout}\n${invalidInvocation.stderr}`, /rk_live_|postgres(?:ql)?:\/\/|whsec_|VERCEL_TOKEN=/);

console.log("Protected Production runtime payment preflight contracts passed.");
