import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { runPayEvidenceProductionRuntimePreflight } from "../src/lib/payEvidenceProductionRuntimePreflight.ts";
import {
  buildPayEvidenceRuntimePreflightRequestBody,
  buildPayEvidenceVercelCurlArguments,
  payEvidenceRuntimePreflightFail,
  payEvidenceRuntimePreflightMonitoredPass,
  payEvidenceRuntimePreflightPass,
  payEvidenceRuntimePreflightPath,
  verifyPayEvidenceProductionRuntimePreflight,
} from "./pay-evidence-production-runtime-preflight.mjs";

const routeSource = readFileSync(new URL("../src/app/api/operator/pay-evidence-runtime-preflight/route.ts", import.meta.url), "utf8");
const helperSource = readFileSync(new URL("../src/lib/payEvidenceProductionRuntimePreflight.ts", import.meta.url), "utf8");
const verifierSource = readFileSync(new URL("./pay-evidence-production-runtime-preflight.mjs", import.meta.url), "utf8");
const innerSource = readFileSync(new URL("./run-pay-evidence-production-runtime-preflight.ps1", import.meta.url), "utf8");
const launcherSource = readFileSync(new URL("./start-pay-evidence-production-runtime-preflight.ps1", import.meta.url), "utf8");
const genericRouteSource = readFileSync(new URL("../src/app/api/operator/payment-runtime-preflight/route.ts", import.meta.url), "utf8");

for (const contract of [
  'export const runtime = "nodejs"',
  'export const dynamic = "force-dynamic"',
  'const requestContract = "pay-evidence-read-only-v1"',
  'const requestHeader = "x-hoju-pay-evidence-runtime-preflight"',
  'runtimeDeploymentHost.endsWith(".vercel.app")',
  'request.nextUrl.hostname.toLowerCase() === runtimeDeploymentHost',
  "getPayEvidencePaymentReadiness()",
  "process.env.PAYMENTS_ENABLED",
  "process.env.PAY_EVIDENCE_PRO_PAYMENTS_ENABLED",
  "process.env.STRIPE_PAY_EVIDENCE_PRO_PRICE_ID",
  'price.type !== "one_time"',
  'price.currency !== "aud"',
  "price.unit_amount !== 990",
  'price.tax_behavior !== "inclusive"',
  'price.metadata.product_code !== "pay_evidence_pro"',
  'price.metadata.billing_model !== "one_time"',
  'price.product.metadata.product_code !== "pay_evidence_pro"',
  'price.product.metadata.billing_model !== "one_time"',
  'stripe.checkout.sessions.list({ status: "open", limit: 100 })',
  "stripe.checkout.sessions.listLineItems",
  'session.metadata?.product_code === "pay_evidence_pro"',
  'isPaymentRuntimeSchemaReady("pay_evidence_pro")',
  "verifyProductionRuntimeDatabase",
  "runPaymentAlertTransportCheck({ sendTest: false })",
  'createHmac("sha256", runtimeKey)',
  "timingSafeEqual",
  payEvidenceRuntimePreflightPass,
  payEvidenceRuntimePreflightMonitoredPass,
  payEvidenceRuntimePreflightFail,
]) assert.ok(routeSource.includes(contract), `Pay Evidence runtime route is missing: ${contract}`);

assert.doesNotMatch(routeSource, /sendTest:\s*true|sendMail\(|checkout\.sessions\.create|prices\.create|products\.create/, "runtime route must remain read-only");
assert.doesNotMatch(routeSource, /ENTITLEMENT_DB_URL|ZOHO_SMTP_APP_PASSWORD|console\.(?:log|error)/, "runtime route must not expose secrets or unrestricted diagnostics");
assert.equal((routeSource.match(/console\.warn/g) ?? []).length, 1);
assert.ok(genericRouteSource.includes('process.env.PAYMENTS_ENABLED') && genericRouteSource.includes('paymentsOff: process.env.PAYMENTS_ENABLED === "false"'), "generic first-launch preflight must remain unchanged");

for (const contract of [
  'input.environment === "production"',
  'input.sharedPaymentsEnabled === "true"',
  'input.payEvidencePaymentsEnabled === "false"',
  'input.managedPaymentsEnabled === "true"',
  "input.deploymentSha === input.expectedSha",
  "input.runtimeKeyRolesDistinct",
  "readiness.enabled === false",
  "readiness.ready === false",
  "readiness.productEnabled === false",
  "readiness.productPriceConfigured",
  "verifyPayEvidenceStripeProductAndOpenSessions",
  "verifyRuntimeSchema",
  "verifyRuntimeDatabaseRoleAndEndpoint",
  "verifyPaymentAlertTransportWithoutSending",
]) assert.ok(helperSource.includes(contract), `Pay Evidence helper is missing: ${contract}`);

for (const contract of [
  'const vercelPackage = "vercel@59.5.0"',
  '"x-hoju-pay-evidence-runtime-preflight: pay-evidence-read-only-v1"',
  '"--deployment"',
  '"POST"',
  'redirect: "manual"',
  '"VERCEL_AUTOMATION_BYPASS_SECRET"',
  '"VERCEL_TOKEN"',
]) assert.ok(verifierSource.includes(contract), `Pay Evidence verifier is missing: ${contract}`);
assert.doesNotMatch(verifierSource, /env run|env pull|--token|--protection-bypass|hojucompass\.com/, "verifier must not download or accept secrets");

for (const contract of [
  'Read-Host "Stripe Account-Read restricted key" -AsSecureString',
  'Read-Host "Stripe Balance-Transactions-Read restricted key" -AsSecureString',
  'Read-Host "One-off hoju_payment_auditor Neon URL" -AsSecureString',
  "await Promise.all([import('stripe'), import('@neondatabase/serverless')])",
  "Get-HmacHex",
  "--audit-key-hmac $auditKeyHmac",
  "--accounting-key-hmac $accountingKeyHmac",
  "npm.cmd run payments:operator-audit",
  "npm.cmd run accounting:preflight",
  "ZeroFreeBSTR",
  "PAY_EVIDENCE_FIRST_SALE_PREFLIGHT=PASS",
  "transactions=none",
  "secrets_printed=no",
]) assert.ok(innerSource.includes(contract), `external runtime child is missing: ${contract}`);
assert.doesNotMatch(innerSource, /--audit-key(?:\s|$)|--accounting-key(?:\s|$)|--database-url(?:\s|$)|SetEnvironmentVariable\([^,]+,[^,]+,\s*"(?:User|Machine)"/m);
assert.ok(innerSource.indexOf("dependency_runtime_unavailable") < innerSource.indexOf('Read-Host "Stripe Account-Read restricted key"'));

for (const contract of [
  "Start-Process",
  '-FilePath "powershell.exe"',
  "-WindowStyle Normal",
  "-PauseBeforeExit",
  "$process.WaitForExit()",
  "PAY_EVIDENCE_EXTERNAL_RUNTIME_WINDOW=PASS",
  "input=external-powershell",
]) assert.ok(launcherSource.includes(contract), `external runtime launcher is missing: ${contract}`);
assert.doesNotMatch(launcherSource, /-WindowStyle Hidden|-RedirectStandard/);
assert.ok(launcherSource.indexOf("dependency_runtime_unavailable") < launcherSource.indexOf("Start-Process"));

const expectedSha = "a".repeat(40);
const expectedEndpointId = "ep-contract-primary-a1b2c3";
const challenge = "1".repeat(64);
const auditKeyHmac = "2".repeat(64);
const accountingKeyHmac = "3".repeat(64);
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
  firstSaleMonitoredModeConfigured: false,
  productEnabled: false,
  productPriceConfigured: true,
  ready: false,
};
const validInput = {
  environment: "production",
  sharedPaymentsEnabled: "true",
  payEvidencePaymentsEnabled: "false",
  managedPaymentsEnabled: "true",
  deploymentSha: expectedSha,
  expectedSha,
  runtimeKeyRolesDistinct: true,
  readiness,
};
function dependencies(overrides = {}) {
  return {
    verifyPayEvidenceStripeProductAndOpenSessions: async () => true,
    verifyRuntimeSchema: async () => true,
    verifyRuntimeDatabaseRoleAndEndpoint: async () => true,
    verifyPaymentAlertTransportWithoutSending: async () => true,
    ...overrides,
  };
}
assert.equal(await runPayEvidenceProductionRuntimePreflight(validInput, dependencies()), true);

let monitoredSmtpCalls = 0;
assert.equal(await runPayEvidenceProductionRuntimePreflight({
  ...validInput,
  readiness: { ...readiness, operatorAlertsConfigured: false, firstSaleMonitoredModeConfigured: true },
}, dependencies({
  verifyPaymentAlertTransportWithoutSending: async () => { monitoredSmtpCalls += 1; return false; },
})), true);
assert.equal(monitoredSmtpCalls, 0);

for (const invalidInput of [
  { ...validInput, environment: "preview" },
  { ...validInput, sharedPaymentsEnabled: "false" },
  { ...validInput, payEvidencePaymentsEnabled: "true" },
  { ...validInput, managedPaymentsEnabled: "false" },
  { ...validInput, deploymentSha: "b".repeat(40) },
  { ...validInput, runtimeKeyRolesDistinct: false },
  { ...validInput, readiness: { ...readiness, productPriceConfigured: false } },
  { ...validInput, readiness: { ...readiness, operatorAlertsConfigured: false } },
]) {
  let remoteCalls = 0;
  const result = await runPayEvidenceProductionRuntimePreflight(invalidInput, dependencies({
    verifyPayEvidenceStripeProductAndOpenSessions: async () => { remoteCalls += 1; return true; },
  }));
  assert.equal(result, false);
  assert.equal(remoteCalls, 0);
}
for (const failedDependency of [
  "verifyPayEvidenceStripeProductAndOpenSessions",
  "verifyRuntimeSchema",
  "verifyRuntimeDatabaseRoleAndEndpoint",
  "verifyPaymentAlertTransportWithoutSending",
]) {
  assert.equal(await runPayEvidenceProductionRuntimePreflight(validInput, dependencies({ [failedDependency]: async () => false })), false);
}

const requestBody = buildPayEvidenceRuntimePreflightRequestBody({ expectedSha, expectedEndpointId, challenge, auditKeyHmac, accountingKeyHmac });
assert.equal(requestBody, JSON.stringify({ expectedSha, expectedEndpointId, challenge, auditKeyHmac, accountingKeyHmac }));
const cliArguments = buildPayEvidenceVercelCurlArguments({ deploymentOrigin: "https://candidate-a.vercel.app" });
assert.ok(cliArguments.includes(payEvidenceRuntimePreflightPath) && cliArguments.includes("@-"));
assert.equal(cliArguments.some((argument) => [challenge, auditKeyHmac, accountingKeyHmac].some((value) => argument.includes(value))), false);

const protectedFetch = async (url, options) => {
  assert.equal(url.toString(), `https://candidate-a.vercel.app${payEvidenceRuntimePreflightPath}`);
  assert.equal(options.method, "GET");
  return { status: 302, headers: new Headers({ "x-robots-tag": "noindex" }) };
};
assert.equal(await verifyPayEvidenceProductionRuntimePreflight({
  deploymentOrigin: "https://candidate-a.vercel.app",
  expectedSha,
  expectedEndpointId,
  challenge,
  auditKeyHmac,
  accountingKeyHmac,
  fetchImpl: protectedFetch,
  runVercelCurl: async () => ({ status: 0, stdout: `${payEvidenceRuntimePreflightPass}\n` }),
}), true);
assert.equal(await verifyPayEvidenceProductionRuntimePreflight({
  deploymentOrigin: "https://candidate-a.vercel.app",
  expectedSha,
  expectedEndpointId,
  challenge,
  auditKeyHmac,
  accountingKeyHmac,
  fetchImpl: protectedFetch,
  runVercelCurl: async () => ({ status: 0, stdout: `${payEvidenceRuntimePreflightMonitoredPass}\n` }),
}), true);
assert.equal(await verifyPayEvidenceProductionRuntimePreflight({
  deploymentOrigin: "https://candidate-a.vercel.app",
  expectedSha,
  expectedEndpointId,
  challenge,
  auditKeyHmac,
  accountingKeyHmac,
  fetchImpl: async () => ({ status: 405, headers: new Headers() }),
  runVercelCurl: async () => ({ status: 0, stdout: payEvidenceRuntimePreflightPass }),
}), false);

const invalidInvocation = spawnSync(process.execPath, [
  fileURLToPath(new URL("./pay-evidence-production-runtime-preflight.mjs", import.meta.url)),
], { encoding: "utf8" });
assert.equal(invalidInvocation.status, 1);
assert.equal(invalidInvocation.stdout.trim(), payEvidenceRuntimePreflightFail);
assert.doesNotMatch(`${invalidInvocation.stdout}\n${invalidInvocation.stderr}`, /rk_live_|postgres(?:ql)?:\/\/|whsec_|VERCEL_TOKEN=/);

console.log("Pay Evidence product-scoped Production runtime preflight contracts passed.");
