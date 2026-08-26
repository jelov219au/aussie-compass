import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { fileURLToPath } from "node:url";

const launcherPath = fileURLToPath(new URL("./invoke-vercel-cli-with-ascii-hostname.mjs", import.meta.url));
const wrapperPath = fileURLToPath(new URL("./run-vercel-production-payment-preflight.ps1", import.meta.url));
const bootstrapPath = fileURLToPath(new URL("./run-production-payment-preflight-with-bypass.ps1", import.meta.url));
const innerPreflightPath = fileURLToPath(new URL("./run-production-payment-preflight.ps1", import.meta.url));
const packageJsonPath = fileURLToPath(new URL("../package.json", import.meta.url));
const launcher = readFileSync(launcherPath, "utf8");
const wrapper = readFileSync(wrapperPath, "utf8");
const bootstrap = readFileSync(bootstrapPath, "utf8");
const innerPreflight = readFileSync(innerPreflightPath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const envExample = readFileSync(new URL("../.env.example", import.meta.url), "utf8");

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
  "^[a-f0-9]{40}$",
  '"vercel@59.5.0"',
  "whoami --no-color *> $null",
  'Join-Path $projectRoot ".env.example"',
  "Get-Content -LiteralPath $environmentExamplePath",
  "ENTITLEMENT_DB_DATABASE_URL",
  '"VERCEL_TOKEN"',
  '"NODE_OPTIONS"',
  'SetEnvironmentVariable("VERCEL_ENV", "production", "Process")',
  "env run -e production --project aussie-compass --no-color -- powershell.exe",
  'Join-Path $PSScriptRoot "run-production-payment-preflight-with-bypass.ps1"',
  'Join-Path $PSScriptRoot "run-production-payment-preflight.ps1"',
  'Remove-Item -LiteralPath "Env:VERCEL_ENV"',
  "VERCEL_PRODUCTION_PREFLIGHT=PASS",
  "VERCEL_PRODUCTION_PREFLIGHT=FAIL",
]) assert.ok(wrapper.includes(contract), `Production operator wrapper is missing: ${contract}`);

for (const contract of [
  '[string]$ExpectedNeonEndpointId',
  '[string]$ExpectedProductionSha',
  'Read-Host "Process-only Vercel Automation Bypass secret" -AsSecureString',
  'Test-Path -LiteralPath "Env:VERCEL_AUTOMATION_BYPASS_SECRET"',
  'SetEnvironmentVariable("VERCEL_AUTOMATION_BYPASS_SECRET", $plainBypassSecret, "Process")',
  "powershell.exe -NoProfile -ExecutionPolicy Bypass -File $maskedPreflightPath",
  'Remove-Item -LiteralPath "Env:VERCEL_AUTOMATION_BYPASS_SECRET"',
  "ZeroFreeBSTR",
]) assert.ok(bootstrap.includes(contract), `child-only bypass bootstrap is missing: ${contract}`);

assert.doesNotMatch(wrapper, /--token|env pull|vercel login/i, "the wrapper must neither accept a token nor persist environment values or start login");
assert.doesNotMatch(wrapper, /Read-Host|plainBypassSecret|SetEnvironmentVariable\("VERCEL_AUTOMATION_BYPASS_SECRET"/, "the npx/Vercel parent wrapper must never receive the Automation Bypass secret");
assert.doesNotMatch(wrapper, /Read-Host[^\n]*(?:PAYMENTS_STRIPE_AUDIT_KEY|STRIPE_ACCOUNTING_KEY|PAYMENTS_AUDIT_DB_URL)/, "audit, accounting and DB secrets must remain owned by the existing masked wrapper");
assert.doesNotMatch(bootstrap, /Read-Host[^\n]*(?:PAYMENTS_STRIPE_AUDIT_KEY|STRIPE_ACCOUNTING_KEY|PAYMENTS_AUDIT_DB_URL)/, "the bypass bootstrap must not take ownership of audit, accounting or DB prompts");
for (const contract of [
  '[string]$ExpectedNeonEndpointId',
  '[string]$ExpectedProductionSha',
  '$env:VERCEL_ENV -cne "production"',
  '$env:PAYMENTS_ENABLED -cne "false"',
  'Read-Host "One-off Stripe Account-Read audit key" -AsSecureString',
  'Read-Host "Dedicated Stripe Balance-Transactions-Read accounting key" -AsSecureString',
  'Read-Host "One-off hoju_payment_auditor database URL" -AsSecureString',
  "FIRST_SALE_PREFLIGHT=PASS",
]) assert.ok(innerPreflight.includes(contract), `existing masked Production preflight is missing: ${contract}`);
assert.ok(packageJson.includes('"test:vercel-production-preflight"'), "the operator contract must be exposed through package scripts");
assert.ok(packageJson.includes("npm run test:vercel-production-preflight"), "the quality gate must include the operator contract");

const fixtureRoot = mkdtempSync(join(tmpdir(), "hoju-vercel-operator-contract-"));
try {
  const fakeBin = join(fixtureRoot, "bin");
  const fakePackageRoot = join(fixtureRoot, "vercel");
  mkdirSync(fakeBin, { recursive: true });
  mkdirSync(join(fakePackageRoot, "dist"), { recursive: true });
  writeFileSync(join(fakePackageRoot, "package.json"), JSON.stringify({ name: "vercel", version: "59.5.0", type: "module" }));
  writeFileSync(join(fakePackageRoot, "dist", "vc.js"), `
    import { hostname } from "node:os";
    const value = hostname();
    console.log(JSON.stringify({ ascii: [...value].every((character) => character.codePointAt(0) <= 127), value, args: process.argv.slice(2) }));
  `);

  const launcherFixture = spawnSync(process.execPath, [launcherPath, "--version"], {
    encoding: "utf8",
    env: { ...process.env, PATH: `${fakeBin}${delimiter}${process.env.PATH ?? ""}` },
  });
  assert.equal(launcherFixture.status, 0, "the launcher must execute a pinned Vercel package fixture");
  const launcherResult = JSON.parse(launcherFixture.stdout.trim());
  assert.deepEqual(launcherResult, { ascii: true, value: "vercel-operator", args: ["--version"] });

  const copiedScripts = join(fixtureRoot, "scripts");
  mkdirSync(copiedScripts, { recursive: true });
  const copiedWrapper = join(copiedScripts, "run-vercel-production-payment-preflight.ps1");
  const copiedBootstrap = join(copiedScripts, "run-production-payment-preflight-with-bypass.ps1");
  writeFileSync(copiedWrapper, wrapper);
  writeFileSync(copiedBootstrap, bootstrap);
  writeFileSync(join(copiedScripts, "invoke-vercel-cli-with-ascii-hostname.mjs"), launcher);
  writeFileSync(join(fixtureRoot, ".env.example"), envExample);
  writeFileSync(join(copiedScripts, "run-production-payment-preflight.ps1"), `
    if ($env:VERCEL_AUTOMATION_BYPASS_SECRET -cne "operator-bypass-contract-only") { exit 91 }
    Write-Host "INNER_MASKED_FIXTURE=PASS"
    exit 0
  `);

  const argumentLog = join(fixtureRoot, "arguments.log");
  writeFileSync(join(fakeBin, "npx.cmd"), `@echo off\r\nif defined VERCEL_AUTOMATION_BYPASS_SECRET exit /b 91\r\n>> "%HOJU_TEST_ARGUMENT_LOG%" echo %*\r\nexit /b 0\r\n`);

  const powershell = `${process.env.SystemRoot}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`;
  const baseEnv = { ...process.env, PATH: `${fakeBin}${delimiter}${process.env.PATH ?? ""}`, HOJU_TEST_ARGUMENT_LOG: argumentLog };
  const projectVariableNames = [...envExample.matchAll(/^\s*([A-Z][A-Z0-9_]*)\s*=/gm)].map((match) => match[1]);
  for (const variableName of [
    ...projectVariableNames,
    "ENTITLEMENT_DB_DATABASE_URL", "VERCEL_ENV", "VERCEL_AUTOMATION_BYPASS_SECRET", "VERCEL_TOKEN", "NODE_OPTIONS",
  ]) delete baseEnv[variableName];

  const wrapperFixtureCommand = Buffer.from(`
    & $env:HOJU_TEST_WRAPPER_PATH -ExpectedNeonEndpointId $env:HOJU_TEST_ENDPOINT -ExpectedProductionSha $env:HOJU_TEST_SHA
    exit $LASTEXITCODE
  `, "utf16le").toString("base64");

  const runWrapper = (endpoint, sha, env = baseEnv) => spawnSync(powershell, [
    "-NoProfile", "-ExecutionPolicy", "Bypass", "-EncodedCommand", wrapperFixtureCommand,
  ], {
    encoding: "utf8",
    env: {
      ...env,
      HOJU_TEST_WRAPPER_PATH: copiedWrapper,
      HOJU_TEST_ENDPOINT: endpoint,
      HOJU_TEST_SHA: sha,
    },
    timeout: 10_000,
  });

  const invalid = runWrapper("not-an-endpoint", "a".repeat(40));
  assert.equal(invalid.status, 1);
  assert.match(invalid.stdout, /VERCEL_PRODUCTION_PREFLIGHT=FAIL[^\r\n]*reason=invalid_expected_endpoint/);

  const preloaded = runWrapper("ep-contract-primary-a1b2c3", "a".repeat(40), { ...baseEnv, NEXT_PUBLIC_SUPPORT_EMAIL: "stale-process-value" });
  assert.equal(preloaded.status, 1);
  assert.match(preloaded.stdout, /VERCEL_PRODUCTION_PREFLIGHT=FAIL[^\r\n]*reason=operator_environment_preloaded/);

  const passing = runWrapper("ep-contract-primary-a1b2c3", "a".repeat(40));
  assert.equal(passing.status, 0, passing.stderr);
  assert.match(passing.stdout, /VERCEL_PRODUCTION_PREFLIGHT=PASS[^\r\n]*payments=off[^\r\n]*secrets_printed=no/);

  const invokedArguments = readFileSync(argumentLog, "utf8");
  assert.match(invokedArguments, /whoami --no-color/);
  assert.match(invokedArguments, /env run -e production --project aussie-compass --no-color -- powershell\.exe/);
  assert.match(invokedArguments, /run-production-payment-preflight-with-bypass\.ps1/);
  assert.match(invokedArguments, /-ExpectedNeonEndpointId ep-contract-primary-a1b2c3 -ExpectedProductionSha a{40}/);
  assert.doesNotMatch(invokedArguments, /operator-bypass-contract-only|--token|VERCEL_TOKEN/);

  const bootstrapFixtureCommand = Buffer.from(`
    $contractSecureInput = [System.Security.SecureString]::new()
    foreach ($character in $env:HOJU_TEST_MASKED_INPUT.ToCharArray()) {
      $contractSecureInput.AppendChar($character)
    }
    $contractSecureInput.MakeReadOnly()
    function global:Read-Host {
      param([string]$Prompt, [switch]$AsSecureString)
      return $contractSecureInput
    }
    & $env:HOJU_TEST_BOOTSTRAP_PATH -ExpectedNeonEndpointId $env:HOJU_TEST_ENDPOINT -ExpectedProductionSha $env:HOJU_TEST_SHA
    $bootstrapExitCode = $LASTEXITCODE
    if (Test-Path -LiteralPath "Env:VERCEL_AUTOMATION_BYPASS_SECRET") { exit 92 }
    exit $bootstrapExitCode
  `, "utf16le").toString("base64");
  const runBootstrap = (env = baseEnv) => spawnSync(powershell, [
    "-NoProfile", "-ExecutionPolicy", "Bypass", "-EncodedCommand", bootstrapFixtureCommand,
  ], {
    encoding: "utf8",
    env: {
      ...env,
      HOJU_TEST_MASKED_INPUT: "operator-bypass-contract-only",
      HOJU_TEST_BOOTSTRAP_PATH: copiedBootstrap,
      HOJU_TEST_ENDPOINT: "ep-contract-primary-a1b2c3",
      HOJU_TEST_SHA: "a".repeat(40),
    },
    timeout: 10_000,
  });

  const deployedBypass = runBootstrap({ ...baseEnv, VERCEL_AUTOMATION_BYPASS_SECRET: "must-not-be-deployed" });
  assert.equal(deployedBypass.status, 1, "a bypass value downloaded from Vercel must fail before the masked prompt");

  const bootstrapPassing = runBootstrap();
  assert.equal(bootstrapPassing.status, 0, bootstrapPassing.stderr);
  assert.match(bootstrapPassing.stdout, /INNER_MASKED_FIXTURE=PASS/);
  assert.doesNotMatch(`${bootstrapPassing.stdout}\n${bootstrapPassing.stderr}`, /operator-bypass-contract-only/);
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true });
}

console.log("Vercel Production operator preload, no-file env injection and masked-preflight contracts passed.");
