import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const script = readFileSync(new URL("./run-pay-evidence-operator-key-preflight.ps1", import.meta.url), "utf8");
const launcher = readFileSync(new URL("./start-pay-evidence-operator-key-preflight.ps1", import.meta.url), "utf8");

for (const contract of [
  '[string]$ExpectedNeonEndpointId',
  'Read-Host "Stripe Account-Read restricted key" -AsSecureString',
  'Read-Host "Stripe Balance-Transactions-Read restricted key" -AsSecureString',
  'Read-Host "One-off hoju_payment_auditor Neon URL" -AsSecureString',
  "PAYMENTS_STRIPE_AUDIT_KEY",
  "STRIPE_ACCOUNTING_KEY",
  "PAYMENTS_AUDIT_DB_URL",
  "PAYMENTS_EXPECTED_NEON_ENDPOINT_ID",
  "npm.cmd run payments:operator-audit",
  "npm.cmd run accounting:preflight",
  "ZeroFreeBSTR",
  "PAY_EVIDENCE_OPERATOR_KEYS=PASS",
  "persisted=no",
  "runtime_distinctness=pending-deployment-hmac",
  "secrets_printed=no",
  "PauseBeforeExit",
  "dependency_runtime_unavailable",
  "await Promise.all([import('stripe'), import('@neondatabase/serverless')])",
]) assert.ok(script.includes(contract), `Pay Evidence key preflight contract is missing: ${contract}`);

assert.doesNotMatch(script, /\.env|SetEnvironmentVariable\([^,]+,[^,]+,\s*"User"|SetEnvironmentVariable\([^,]+,[^,]+,\s*"Machine"/i);
assert.doesNotMatch(script, /Write-(?:Host|Output)[^\r\n]*plain(?:Audit|Accounting)/i);
assert.ok(script.indexOf("payments:operator-audit") < script.indexOf("accounting:preflight"));
assert.ok(script.indexOf("Remove-Item") < script.indexOf("PAY_EVIDENCE_OPERATOR_KEYS=PASS"));

for (const contract of [
  "Start-Process",
  '-FilePath "powershell.exe"',
  "-WindowStyle Normal",
  "-PauseBeforeExit",
  "$process.WaitForExit()",
  "PAY_EVIDENCE_EXTERNAL_KEY_WINDOW=PASS",
  "input=external-powershell",
  "secrets_printed=no",
  "dependency_runtime_unavailable",
  "await Promise.all([import('stripe'), import('@neondatabase/serverless')])",
]) assert.ok(launcher.includes(contract), `External PowerShell launcher contract is missing: ${contract}`);
assert.ok(!launcher.includes("-WindowStyle Hidden"), "key entry must never use a hidden PowerShell window");
assert.ok(!launcher.includes("-RedirectStandard"), "interactive key entry must remain attached to the external window");
assert.ok(launcher.indexOf("dependency_runtime_unavailable") < launcher.indexOf("Start-Process"), "dependencies must pass before the secret-input window opens");

console.log("PAY_EVIDENCE_OPERATOR_KEY_PREFLIGHT=PASS input=external-powershell masked_prompts=three persisted=no permission_checks=two runtime_distinctness=deferred");
