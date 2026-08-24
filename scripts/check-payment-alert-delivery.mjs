import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const [alerts, verifier, wrapper, manifest, docs] = await Promise.all([
  readFile(new URL("../src/lib/paymentAlerts.ts", import.meta.url), "utf8"),
  readFile(new URL("./verify-payment-alert-transport.mjs", import.meta.url), "utf8"),
  readFile(new URL("./run-payment-alert-transport-check.ps1", import.meta.url), "utf8"),
  readFile(new URL("../package.json", import.meta.url), "utf8"),
  readFile(new URL("../docs/payment-alerts.md", import.meta.url), "utf8"),
]);
const compactDocs = docs.replace(/\s+/g, " ");

for (const contract of [
  'process.env.VERCEL_ENV !== "production"',
  'process.env.PAYMENTS_ENABLED !== "false"',
  "await transporter.verify()",
  'process.env.PAYMENT_ALERT_TEST_ACK !== paymentAlertTestAck',
  'subject: "[Hoju Compass] 결제 알림 전달 테스트 — 실제 결제 아님"',
  "실제 결제, 환불 또는 고객 활동이 아닙니다.",
  "transporter.close()",
]) assert.ok(alerts.includes(contract), `payment alert delivery check is missing: ${contract}`);

assert.doesNotMatch(alerts, /PAYMENT_ALERT_TEST_ACK\s*===?\s*["'](?:true|1|yes)["']/i, "a weak send acknowledgement must not be accepted");
assert.ok(verifier.includes('process.argv.includes("--send-test")'), "the verifier needs an explicit send flag");
assert.doesNotMatch(verifier, /console\.(?:log|error)\([^\n]*(?:ZOHO_SMTP_APP_PASSWORD|plainPassword|config\.(?:to|from|user|host))/, "the verifier must not print mail credentials or addresses");
const transportCheckBody = alerts.slice(
  alerts.indexOf("export async function runPaymentAlertTransportCheck"),
  alerts.indexOf("export async function sendStripeOperatorAlert"),
);
assert.equal((transportCheckBody.match(/transporter\.sendMail\(/g) ?? []).length, 1, "the acknowledged delivery-test path must contain exactly one SMTP send call");
assert.ok(transportCheckBody.indexOf("PAYMENT_ALERT_TEST_ACK") < transportCheckBody.indexOf("transporter.sendMail"), "the exact acknowledgement must be checked before the one-message send path");
assert.ok(transportCheckBody.indexOf("await transporter.verify()") < transportCheckBody.indexOf("transporter.sendMail"), "SMTP authentication must pass before the one-message send path");

for (const boundary of [
  "Read-Host \"Zoho payment-alert app password\" -AsSecureString",
  "SecureStringToBSTR",
  "ZeroFreeBSTR",
  '[Environment]::SetEnvironmentVariable("ZOHO_SMTP_APP_PASSWORD", $plainPassword, "Process")',
  '$env:PAYMENTS_ENABLED = "false"',
  '$env:PAYMENT_ALERT_TEST_ACK = "SEND_ONE_MONITORED_SUPPORT_TEST"',
  '$SmtpHost -cne "smtppro.zoho.com"',
  "$SmtpPort -ne 465",
  'Test-Path -LiteralPath "Env:ZOHO_SMTP_APP_PASSWORD"',
  'Test-Path -LiteralPath "Env:PAYMENT_ALERT_TEST_ACK"',
  "$originalEnvironment[$name]",
  '[Environment]::SetEnvironmentVariable($name, $originalEnvironment[$name], "Process")',
  'Remove-Item -LiteralPath "Env:ZOHO_SMTP_APP_PASSWORD"',
  'Remove-Item -LiteralPath "Env:PAYMENT_ALERT_TEST_ACK"',
  '(Test-Path -LiteralPath "Env:ZOHO_SMTP_APP_PASSWORD") -or (Test-Path -LiteralPath "Env:PAYMENT_ALERT_TEST_ACK")',
  'npm.cmd run payments:alerts:verify *> $null',
  'npm.cmd run payments:alerts:verify -- --send-test *> $null',
  'PAYMENT_ALERT_TRANSPORT=PASS mode=production payments_off=yes smtp=verified',
  'PAYMENT_ALERT_TRANSPORT=NO-GO mode=production payments_off=required smtp=unverified',
  'message_sent=unverified secrets_printed=no reason=$failureReason',
]) assert.ok(wrapper.includes(boundary), `secure alert wrapper is missing: ${boundary}`);
assert.ok(wrapper.indexOf('SetEnvironmentVariable("ZOHO_SMTP_APP_PASSWORD"') < wrapper.indexOf("npm.cmd run payments:alerts:verify"), "the masked app password must be process-scoped before transport verification starts");
assert.ok(wrapper.indexOf("npm.cmd run payments:alerts:verify") < wrapper.indexOf('Remove-Item -LiteralPath "Env:ZOHO_SMTP_APP_PASSWORD"'), "the app password must be removed after the transport verification attempt");
assert.ok(wrapper.indexOf("try {") < wrapper.indexOf('$SmtpHost -cne "smtppro.zoho.com"'), "endpoint and preloaded-secret failures must be inside the canonical fail-closed lifecycle");
assert.ok(wrapper.indexOf('Remove-Item -LiteralPath "Env:ZOHO_SMTP_APP_PASSWORD"') < wrapper.indexOf('Write-Output "PAYMENT_ALERT_TRANSPORT=NO-GO'), "the canonical NO-GO must be emitted only after process-credential cleanup");
assert.ok(wrapper.indexOf("ZeroFreeBSTR") < wrapper.indexOf('Write-Output "PAYMENT_ALERT_TRANSPORT=PASS'), "the canonical PASS must be emitted only after unmanaged credential cleanup");
assert.doesNotMatch(wrapper, /\$env:ZOHO_SMTP_APP_PASSWORD\s*=\s*["']/, "the wrapper must not assign a plaintext SMTP password literal");

assert.ok(manifest.includes('"payments:alerts:verify"'), "package scripts must expose the operator transport check");
assert.ok(manifest.includes('"test:payment-alert-delivery"'), "package scripts must expose the delivery contract test");
assert.ok(manifest.includes("npm run test:payment-alert-delivery"), "the full quality gate must include the delivery contract test");
for (const command of [
  ".\\scripts\\run-payment-alert-transport-check.ps1",
  ".\\scripts\\run-payment-alert-transport-check.ps1 -SendTest",
]) assert.ok(docs.includes(command), `payment alert runbook is missing: ${command}`);
for (const documentedResult of [
  "PAYMENT_ALERT_TRANSPORT=PASS mode=production payments_off=yes smtp=verified send_requested=no message_sent=no secrets_printed=no",
  "PAYMENT_ALERT_TRANSPORT=PASS mode=production payments_off=yes smtp=verified send_requested=yes message_sent=one secrets_printed=no",
  "PAYMENT_ALERT_TRANSPORT=NO-GO mode=production payments_off=required smtp=unverified",
  "inspect the monitored inbox before any later retry",
]) assert.ok(compactDocs.includes(documentedResult), `payment alert runbook is missing canonical behavior: ${documentedResult}`);

const dryRun = spawnSync(process.execPath, [fileURLToPath(new URL("./verify-payment-alert-transport.mjs", import.meta.url))], {
  encoding: "utf8",
  env: {
    ...process.env,
    VERCEL_ENV: "production",
    PAYMENTS_ENABLED: "false",
    PAYMENT_ALERTS_ENABLED: "false",
    ZOHO_SMTP_APP_PASSWORD: "",
  },
});
assert.equal(dryRun.status, 1, "the verifier must fail closed before network access when mail configuration is absent");
assert.match(dryRun.stderr, /WAIT  결제 알림 전달 검증/, "the failed verifier needs a generic operator-safe result");
assert.doesNotMatch(`${dryRun.stdout}\n${dryRun.stderr}`, /support@|smtppro|password|credential/i, "the failed verifier must not print configuration details");

const unacknowledgedSend = spawnSync(process.execPath, [
  fileURLToPath(new URL("./verify-payment-alert-transport.mjs", import.meta.url)),
  "--send-test",
], {
  encoding: "utf8",
  env: {
    ...process.env,
    VERCEL_ENV: "production",
    PAYMENTS_ENABLED: "false",
    PAYMENT_ALERTS_ENABLED: "true",
    PAYMENT_ALERT_TO_EMAIL: "support@hojucompass.com",
    PAYMENT_ALERT_FROM_EMAIL: "support@hojucompass.com",
    NEXT_PUBLIC_SUPPORT_EMAIL: "support@hojucompass.com",
    ZOHO_SMTP_HOST: "smtp.invalid",
    ZOHO_SMTP_PORT: "465",
    ZOHO_SMTP_USER: "support@hojucompass.com",
    ZOHO_SMTP_APP_PASSWORD: "unused-test-password",
    PAYMENT_ALERT_TEST_ACK: "",
  },
});
assert.equal(unacknowledgedSend.status, 1, "--send-test without the exact acknowledgement must fail before SMTP access");
assert.match(unacknowledgedSend.stderr, /WAIT  결제 알림 전달 검증/);
assert.doesNotMatch(`${unacknowledgedSend.stdout}\n${unacknowledgedSend.stderr}`, /smtp\.invalid|support@|unused-test-password/i);

function runWrapperEarlyFailure(args = [], overrides = {}, input = "") {
  const fixtureEnv = { ...process.env };
  delete fixtureEnv.ZOHO_SMTP_APP_PASSWORD;
  delete fixtureEnv.PAYMENT_ALERT_TEST_ACK;
  Object.assign(fixtureEnv, overrides);
  const powershell = `${process.env.SystemRoot}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`;
  return spawnSync(powershell, [
    "-NoProfile",
    "-NonInteractive",
    "-ExecutionPolicy", "Bypass",
    "-File", fileURLToPath(new URL("./run-payment-alert-transport-check.ps1", import.meta.url)),
    ...args,
  ], { encoding: "utf8", env: fixtureEnv, input, timeout: 10_000 });
}

for (const [label, fixture, reason] of [
  ["invalid endpoint pin", runWrapperEarlyFailure(["-SmtpHost", "smtp.invalid"]), "endpoint_pin_invalid"],
  ["preloaded credential", runWrapperEarlyFailure([], { ZOHO_SMTP_APP_PASSWORD: "fixture-secret-must-not-print" }), "preloaded_credential"],
  ["preloaded acknowledgement", runWrapperEarlyFailure([], { PAYMENT_ALERT_TEST_ACK: "fixture-ack-must-not-print" }), "preloaded_acknowledgement"],
  ["cancelled credential prompt", runWrapperEarlyFailure([], {}, "\r\n"), "credential_cancelled"],
]) {
  assert.equal(fixture.status, 1, `${label} must exit 1 before SMTP access`);
  assert.equal((fixture.stdout.match(/PAYMENT_ALERT_TRANSPORT=NO-GO/g) ?? []).length, 1, `${label} must emit one canonical NO-GO`);
  assert.match(fixture.stdout, new RegExp(`PAYMENT_ALERT_TRANSPORT=NO-GO[^\\r\\n]*secrets_printed=no[^\\r\\n]*reason=${reason}`));
  assert.doesNotMatch(`${fixture.stdout}\n${fixture.stderr}`, /PAYMENT_ALERT_TRANSPORT=PASS|fixture-secret|fixture-ack|smtp\.invalid/i, `${label} must not print PASS, secrets or the rejected endpoint`);
}

console.log("Payment alert transport and one-message delivery-test contracts passed.");
