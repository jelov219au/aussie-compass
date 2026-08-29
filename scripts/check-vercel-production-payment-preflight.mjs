import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const launcherPath = fileURLToPath(new URL("./invoke-vercel-cli-with-ascii-hostname.mjs", import.meta.url));
const wrapperPath = fileURLToPath(new URL("./run-vercel-production-payment-preflight.ps1", import.meta.url));
const launcher = readFileSync(launcherPath, "utf8");
const wrapper = readFileSync(wrapperPath, "utf8");
const innerPreflight = readFileSync(new URL("./run-production-payment-preflight.ps1", import.meta.url), "utf8");
const runtimeVerifier = readFileSync(new URL("./vercel-production-runtime-preflight.mjs", import.meta.url), "utf8");
const deploymentVerifier = readFileSync(new URL("./verify-production-deployment-evidence.mjs", import.meta.url), "utf8");
const packageJson = readFileSync(new URL("../package.json", import.meta.url), "utf8");

for (const contract of [
  'const EXPECTED_VERCEL_VERSION = "59.5.0"',
  'const SAFE_OPERATOR_HOSTNAME = "vercel-operator"',
  "os.hostname = () => SAFE_OPERATOR_HOSTNAME",
  "syncBuiltinESMExports()",
  'packageJson.name === "vercel"',
  "packageJson.version === EXPECTED_VERCEL_VERSION",
]) assert.ok(launcher.includes(contract), `ASCII-hostname launcher is missing: ${contract}`);

for (const contract of [
  '[string]$ExpectedNeonEndpointId',
  '[string]$ExpectedProductionSha',
  '"vercel@59.5.0"',
  "whoami --no-color *> $null",
  'Join-Path $projectRoot ".env.example"',
  "Get-Content -LiteralPath $environmentExamplePath",
  '"VERCEL_TOKEN"',
  '"NODE_OPTIONS"',
  'npm.cmd run deployment:verify-production -- --expected-sha $ExpectedProductionSha',
  "PRODUCTION_DEPLOYMENT_EVIDENCE=PASS",
  "PRODUCTION_DEPLOYMENT_URL=",
  "-DeploymentOrigin $DeploymentOrigin",
  "FIRST_SALE_PREFLIGHT=PASS mode=live payments_off=yes monitoring=smtp keys=three-distinct-rk-live required_reads=verified checkout_create=not-exercised database=strict-pass secrets_printed=no",
  "FIRST_SALE_PREFLIGHT=PASS mode=live payments_off=yes monitoring=manual keys=three-distinct-rk-live required_reads=verified checkout_create=not-exercised database=strict-pass secrets_printed=no",
  "$LASTEXITCODE = 1",
  "Get-Command npx.cmd -CommandType Application",
  "$innerPreflightRecords.Count -ne 1",
  '$monitoringMode = "smtp"',
  '$monitoringMode = "manual"',
  "monitoring=$monitoringMode",
  "monitoring=unverified",
  "VERCEL_PRODUCTION_PREFLIGHT=PASS",
  "VERCEL_PRODUCTION_PREFLIGHT=FAIL",
]) assert.ok(wrapper.includes(contract), `Production operator wrapper is missing: ${contract}`);

assert.doesNotMatch(wrapper, /env run|env pull|--token|vercel login|VERCEL_AUTOMATION_BYPASS_SECRET.*Read-Host/i, "the outer wrapper must not download Sensitive values, accept tokens, start login or prompt for bypass secrets");
assert.doesNotMatch(wrapper, /run-production-payment-preflight-with-bypass/, "the legacy bypass bootstrap must not remain in the canonical path");
assert.doesNotMatch(wrapper, /Read-Host/, "all masked audit inputs must remain owned by the inner wrapper");
assert.ok(wrapper.indexOf("deployment:verify-production") < wrapper.indexOf("-DeploymentOrigin $DeploymentOrigin"), "exact deployment evidence must precede the inner preflight");

for (const contract of [
  '[string]$DeploymentOrigin',
  'Read-Host "One-off Stripe Account-Read audit key" -AsSecureString',
  'Read-Host "Dedicated Stripe Balance-Transactions-Read accounting key" -AsSecureString',
  "Get-HmacHex",
  "--challenge $challenge",
  "--audit-key-hmac $auditKeyHmac",
  "--accounting-key-hmac $accountingKeyHmac",
  "npm.cmd --silent run payments:verify-production-runtime",
  "$runtimeRecords.Count -ne 1",
  "operator_monitoring=smtp smtp=verify-pass",
  "operator_monitoring=manual-first-sale smtp=not-run",
  '$monitoringMode = "smtp"',
  '$monitoringMode = "manual"',
  'Read-Host "One-off hoju_payment_auditor database URL" -AsSecureString',
  "npm.cmd run payments:operator-audit",
  "npm.cmd run accounting:preflight",
  "FIRST_SALE_PREFLIGHT=PASS mode=live payments_off=yes monitoring=smtp",
  "FIRST_SALE_PREFLIGHT=PASS mode=live payments_off=yes monitoring=manual",
  "monitoring=unverified",
]) assert.ok(innerPreflight.includes(contract), `inner Production preflight is missing: ${contract}`);
assert.doesNotMatch(innerPreflight, /\$env:(?:VERCEL_ENV|PAYMENTS_ENABLED|STRIPE_SECRET_KEY|ENTITLEMENT_DB_URL)|env run|env pull/, "the inner preflight must not depend on locally unreadable Vercel Sensitive values");
assert.doesNotMatch(innerPreflight, /--audit-key(?:\s|$)|--accounting-key(?:\s|$)|--database-url(?:\s|$)/m, "raw audit values must never reach argv");
assert.ok(innerPreflight.indexOf("payments:verify-production-runtime") < innerPreflight.indexOf('Read-Host "One-off hoju_payment_auditor database URL"'), "runtime verification must pass before requesting the audit DB URL");
assert.ok(innerPreflight.indexOf("payments:operator-audit") < innerPreflight.indexOf("accounting:preflight"), "the accounting probe must follow the operator audit");

for (const boundary of [
  '"curl"',
  '"--deployment"',
  '"POST"',
  '"--challenge"',
  '"--audit-key-hmac"',
  '"--accounting-key-hmac"',
]) assert.ok(runtimeVerifier.includes(boundary), `runtime verifier is missing: ${boundary}`);
assert.doesNotMatch(runtimeVerifier, /env run|env pull|--token|--protection-bypass/, "runtime verifier must use authenticated Vercel curl without downloadable secrets or manual bypass values");

for (const contract of [
  "const protectedReadTimeoutMs = 120_000;",
  "const protectedReadMaxBuffer = 8 * 1024 * 1024;",
  "timeout: protectedReadTimeoutMs,",
  "maxBuffer: protectedReadMaxBuffer,",
  'if (result.status !== 0) throw new Error("protected deployment unavailable");',
]) assert.ok(deploymentVerifier.includes(contract), `Production deployment verifier is missing its bounded protected-read safeguard: ${contract}`);
assert.doesNotMatch(deploymentVerifier, /console\.(?:log|warn|error)\([^)]*(?:stderr|error)/, "protected-read failures must not print Vercel diagnostics that could include operator data");

assert.ok(packageJson.includes('"test:vercel-production-preflight"'));
assert.ok(packageJson.includes("npm run test:vercel-production-preflight"));
assert.ok(packageJson.includes('"test:production-runtime-preflight"'));

const powershell = process.platform === "win32"
  ? `${process.env.SystemRoot}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`
  : "pwsh";
const earlyFixtureTimeoutMs = 20_000;
function runEarlyFixture(endpoint, sha, extraEnvironment = {}) {
  const environment = { ...process.env };
  for (const name of [
    ...[...readFileSync(new URL("../.env.example", import.meta.url), "utf8").matchAll(/^\s*([A-Z][A-Z0-9_]*)\s*=/gm)].map((match) => match[1]),
    "ENTITLEMENT_DB_DATABASE_URL", "VERCEL_ENV", "VERCEL_AUTOMATION_BYPASS_SECRET", "VERCEL_TOKEN", "NODE_OPTIONS",
  ]) delete environment[name];
  Object.assign(environment, extraEnvironment);
  return spawnSync(powershell, [
    "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass",
    "-File", wrapperPath,
    "-ExpectedNeonEndpointId", endpoint,
    "-ExpectedProductionSha", sha,
  ], { encoding: "utf8", env: environment, timeout: earlyFixtureTimeoutMs });
}

for (const [label, fixture, reason] of [
  ["invalid endpoint", runEarlyFixture("invalid", "a".repeat(40)), "invalid_expected_endpoint"],
  ["invalid SHA", runEarlyFixture("ep-contract-primary-a1b2c3", "short"), "invalid_expected_production_sha"],
  ["preloaded value", runEarlyFixture("ep-contract-primary-a1b2c3", "a".repeat(40), { STRIPE_SECRET_KEY: "must-not-be-loaded" }), "operator_environment_preloaded"],
]) {
  assert.equal(fixture.status, 1, `${label} must fail before authentication or network access`);
  assert.match(fixture.stdout, new RegExp(`^VERCEL_PRODUCTION_PREFLIGHT=FAIL[^\r\n]*reason=${reason}\s*$`, "m"));
  assert.doesNotMatch(fixture.stdout, /must-not-be-loaded|FIRST_SALE_PREFLIGHT=PASS|VERCEL_PRODUCTION_PREFLIGHT=PASS/);
}

console.log("Vercel protected-runtime, no-env-download and masked operator preflight contracts passed.");
