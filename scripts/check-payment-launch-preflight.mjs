import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const [source, secureRunner, packageJson, readiness, checklist, auditRoleGrants, productionAudit, envExample, releaseManifest, runtimePreflight, monitoredMode, alertRunbook, mobileOwnerChecklist] = await Promise.all([
  readFile(new URL("./check-payment-launch.mjs", import.meta.url), "utf8"),
  readFile(new URL("./run-production-payment-preflight.ps1", import.meta.url), "utf8"),
  readFile(new URL("../package.json", import.meta.url), "utf8"),
  readFile(new URL("../docs/payment-readiness.md", import.meta.url), "utf8"),
  readFile(new URL("../docs/live-payment-launch-checklist.md", import.meta.url), "utf8"),
  readFile(new URL("../docs/payment-audit-role-grants.sql", import.meta.url), "utf8"),
  readFile(new URL("../docs/production-first-sale-readiness-audit-2026-08-24.md", import.meta.url), "utf8"),
  readFile(new URL("../.env.example", import.meta.url), "utf8"),
  readFile(new URL("../docs/release-candidate-manifest-2026-08-23.md", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/productionRuntimePaymentPreflight.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/firstSaleMonitoredMode.ts", import.meta.url), "utf8"),
  readFile(new URL("../docs/payment-alerts.md", import.meta.url), "utf8"),
  readFile(new URL("../docs/first-sale-mobile-owner-checklist.md", import.meta.url), "utf8"),
]);
const compactProductionAudit = productionAudit.replace(/\s+/g, " ");

for (const flag of ["--preflight", "--verify-stripe", "--verify-database"]) {
  assert.ok(source.includes(flag), `payment launch audit is missing ${flag}`);
}

for (const boundary of [
  "PAYMENTS_ENABLED === \"false\"",
  "const failClosedAudit = strict || preflight",
  "current_user = 'hoju_app_runtime'",
  "current_user = 'hoju_payment_auditor'",
  "PAYMENTS_AUDIT_DB_URL",
  "PAYMENTS_STRIPE_AUDIT_KEY",
  "PAYMENTS_EXPECTED_NEON_ENDPOINT_ID",
  "hostname.endsWith(\".neon.tech\")",
  'endpointLabel.endsWith("-pooler")',
  "runtimeNeonEndpointId === expectedNeonEndpointId",
  "auditNeonEndpointId === expectedNeonEndpointId",
  "readOnly: true",
  "AbortSignal.timeout(10_000)",
  "20260824_entitlement_link_conflict_v1",
  "named_entitlement_link_constraint_active",
  "no_reservation_in_flight",
  "runtime_cannot_approve_next_sale",
  "runtime_cannot_mutate_gate_table",
  "runtime_cannot_mutate_entitlement_table",
  "runtime_cannot_mutate_alert_table",
  "least_privilege_audit_role",
  "audit_role_has_safe_attributes",
  "audit_does_not_inherit_elevated_roles",
  "audit_can_read_migration_ledger",
  "audit_can_read_first_sale_gate",
  "audit_cannot_create_in_public_schema",
  "audit_has_no_protected_table_mutation",
  "audit_cannot_execute_payment_functions",
  "not pg_has_role(current_user, 'neon_superuser', 'MEMBER')",
  "sessions.data.length === 0 && sessions.has_more === false",
  "stripeAuditKey !== runtimeStripeKey",
  "auditStripe.accounts.retrieveCurrent()",
  "account.charges_enabled === true",
  "account.payouts_enabled === true",
  "account.details_submitted === true",
  "requirements?.currently_due?.length ?? 0",
  "requirements?.past_due?.length ?? 0",
  "profile?.support_email?.trim().toLowerCase()",
  "accountSupportEmail === supportEmail.toLowerCase()",
  "account.settings?.payments?.statement_descriptor?.trim()",
  "&& stripeAccountVerified",
  "&& stripeSupportProfileVerified",
  "paymentAlertsConfigured()",
  "isFirstSaleMonitoredModeConfigured()",
  '"운영 결제 감시"',
  "preflightRemoteBoundaryReady",
  "runtimeStripeRemoteBoundaryReady",
  "stripeAuditRemoteBoundaryReady",
  "databaseRemoteBoundaryReady",
  "로컬 키·상품·모드 경계 미통과, 원격 조회 생략",
  "승인 endpoint와 두 연결의 로컬 경계 미통과, 원격 조회 생략",
]) {
  assert.ok(source.includes(boundary), `payment launch preflight is missing: ${boundary}`);
}

assert.doesNotMatch(source, /console\.(?:log|warn|error)\([^\n]*(?:entitlementDatabaseUrl|STRIPE_SECRET_KEY|price\.id|product\.id|session\.id)/, "the launch audit must never print secrets, connection strings or Stripe IDs");
assert.equal((source.match(/accounts\.retrieveCurrent\(\)/g) ?? []).length, 1, "only the dedicated operator audit client may read the Stripe Account");
assert.match(source, /const auditStripe = new Stripe\(stripeAuditKey,[\s\S]*auditStripe\.accounts\.retrieveCurrent\(\)/, "Stripe Account evidence must use only the separated audit key");
assert.ok(packageJson.includes('"test:payment-launch-preflight"'), "the preflight contract test must be exposed through package scripts");
assert.ok(packageJson.includes("npm run test:payment-launch-preflight"), "the full quality gate must include the preflight contract");

const command = "npm run payments:operator-audit";
const accountingCommand = "npm run accounting:preflight";
const documentedIntegratedPass = "FIRST_SALE_PREFLIGHT=PASS mode=live payments_off=yes monitoring=<smtp|manual> keys=three-distinct-rk-live required_reads=verified checkout_create=not-exercised database=strict-pass secrets_printed=no";
const innerSmtpPass = "FIRST_SALE_PREFLIGHT=PASS mode=live payments_off=yes monitoring=smtp keys=three-distinct-rk-live required_reads=verified checkout_create=not-exercised database=strict-pass secrets_printed=no";
const innerManualPass = "FIRST_SALE_PREFLIGHT=PASS mode=live payments_off=yes monitoring=manual keys=three-distinct-rk-live required_reads=verified checkout_create=not-exercised database=strict-pass secrets_printed=no";
assert.ok(readiness.includes(command), "payment readiness must document the fail-closed preflight command");
assert.ok(checklist.includes(command), "the live launch checklist must document the fail-closed preflight command");
for (const [label, document] of [["payment readiness", readiness], ["live launch checklist", checklist]]) {
  assert.ok(document.includes(accountingCommand), `${label} must document the integrated accounting permission preflight`);
  assert.ok(document.includes("same masked accounting key") || document.includes("same prompted accounting key"), `${label} must bind accounting permission evidence to the key checked for role separation`);
  assert.ok(document.includes(documentedIntegratedPass), `${label} must name the monitoring-qualified integrated first-sale PASS`);
  assert.ok(document.indexOf(command) < document.indexOf(accountingCommand), `${label} must place accounting permission verification after the strict payment/database audit`);
  assert.ok(document.indexOf(accountingCommand) < document.indexOf(documentedIntegratedPass), `${label} must place the final first-sale PASS after both permission preflights`);
  assert.ok(document.includes("same concrete monitoring value"), `${label} must bind outer and inner PASS to one concrete monitoring mode`);
  assert.match(document, /placeholder[^\r\n]*(?:mismatch|불일치)|(?:placeholder|mismatch)[^\r\n]*(?:NO-GO|`NO-GO`)/i, `${label} must reject placeholder or mismatched monitoring evidence`);
  assert.doesNotMatch(document, /(?:never assigns or uses|is never assigned to the process)[^\n]*accounting key|accounting key[^\n]*(?:never assigned|requires the separate accounting preflight|remains separately fail-closed)/i, `${label} must not claim the accounting key is excluded from the integrated wrapper`);
}
assert.ok(checklist.includes("this single integrated result satisfies the Balance Transactions read check"), "the first-customer checklist must use one integrated accounting criterion");
assert.ok(checklist.includes("is not a second launch prerequisite in the same approval window"), "the standalone accounting wrapper must be classified only as later independent revalidation");
assert.doesNotMatch(checklist, /- \[ \][^\n]*run-accounting-preflight\.ps1[^\n]*(?:Record PASS only|remains launch `NO-GO`)/, "the checklist must not require a duplicate standalone accounting launch gate");
for (const secureBoundary of [
  '[string]$DeploymentOrigin',
  'Read-Host "One-off Stripe Account-Read audit key" -AsSecureString',
  'Read-Host "Dedicated Stripe Balance-Transactions-Read accounting key" -AsSecureString',
  'Read-Host "One-off hoju_payment_auditor database URL" -AsSecureString',
  "SecureStringToBSTR",
  "PtrToStringBSTR",
  'SetEnvironmentVariable("PAYMENTS_STRIPE_AUDIT_KEY", $plainAuditKey, "Process")',
  'SetEnvironmentVariable("PAYMENTS_AUDIT_DB_URL", $plainAuditDatabaseUrl, "Process")',
  'SetEnvironmentVariable("STRIPE_ACCOUNTING_KEY", $plainAccountingKey, "Process")',
  'foreach ($variableName in @("PAYMENTS_STRIPE_AUDIT_KEY", "STRIPE_ACCOUNTING_KEY", "PAYMENTS_AUDIT_DB_URL", "PAYMENTS_EXPECTED_NEON_ENDPOINT_ID"))',
  '$plainAuditKey -ceq $plainAccountingKey',
  'Write-KeyRoleFailure "role_reuse" "no"',
  'Get-HmacHex $plainAuditKey $challenge',
  'Get-HmacHex $plainAccountingKey $challenge',
  '--audit-key-hmac $auditKeyHmac --accounting-key-hmac $accountingKeyHmac',
  'STRIPE_KEY_ROLES=PASS mode=live distinct=yes permissions=separate-preflights-required secrets_printed=no',
  "ZeroFreeBSTR",
  '[string]$ExpectedProductionSha',
  "invalid_expected_production_sha",
  'npm.cmd --silent run payments:verify-production-runtime',
  'npm.cmd run payments:operator-audit',
  'npm.cmd run accounting:preflight',
  innerSmtpPass,
  innerManualPass,
  'FIRST_SALE_PREFLIGHT=FAIL mode=live payments_off=required monitoring=unverified keys=unverified required_operations=unverified database=unverified secrets_printed=no launch=NO-GO',
]) assert.ok(secureRunner.includes(secureBoundary), `secure Production preflight is missing: ${secureBoundary}`);
assert.equal((secureRunner.match(/ZeroFreeBSTR\(/g) ?? []).length, 3, "all three masked plaintext buffers must be zeroed");
assert.doesNotMatch(secureRunner, /Write-Host[^\n]*(?:plainAuditKey|plainAccountingKey|STRIPE_SECRET_KEY)/, "the role-separation result must not print a Stripe key");
assert.doesNotMatch(secureRunner, /\$env:(?:VERCEL_ENV|PAYMENTS_ENABLED|STRIPE_SECRET_KEY|ENTITLEMENT_DB_URL)/, "the local inner preflight must not depend on unreadable Vercel Sensitive values");
assert.ok(secureRunner.indexOf("npm.cmd --silent run payments:verify-production-runtime") < secureRunner.indexOf('Read-Host "One-off hoju_payment_auditor database URL"'), "runtime evidence must pass before the audit DB prompt");
assert.ok(secureRunner.indexOf('SetEnvironmentVariable("PAYMENTS_STRIPE_AUDIT_KEY"') < secureRunner.indexOf("npm.cmd run payments:operator-audit"), "temporary audit credentials must be process-scoped before the local operator audit");
assert.ok(secureRunner.indexOf('SetEnvironmentVariable("STRIPE_ACCOUNTING_KEY"') < secureRunner.indexOf("npm.cmd run accounting:preflight"), "the exact accounting key checked for role separation must be permission-tested in the same process");
assert.ok(secureRunner.indexOf("npm.cmd run payments:operator-audit") < secureRunner.indexOf("npm.cmd run accounting:preflight"), "accounting permission verification must follow the Account and audit-DB checks");
assert.ok(secureRunner.indexOf("ZeroFreeBSTR") < secureRunner.lastIndexOf("FIRST_SALE_PREFLIGHT=PASS"), "the final first-sale PASS must follow unmanaged secret-buffer cleanup");
assert.equal((secureRunner.match(/STRIPE_KEY_ROLES=PASS/g) ?? []).length, 1, "key-role PASS must be emitted once, after every required permission preflight");

function runEarlyPowerShellFixture(endpointId, overrides = {}, expectedProductionSha = "a".repeat(40)) {
  const fixtureEnv = { ...process.env };
  for (const name of ["PAYMENTS_STRIPE_AUDIT_KEY", "STRIPE_ACCOUNTING_KEY", "PAYMENTS_AUDIT_DB_URL", "PAYMENTS_EXPECTED_NEON_ENDPOINT_ID"]) delete fixtureEnv[name];
  Object.assign(fixtureEnv, overrides);
  const powershell = process.platform === "win32"
    ? `${process.env.SystemRoot}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`
    : "pwsh";
  return spawnSync(powershell, [
    "-NoProfile",
    "-NonInteractive",
    "-ExecutionPolicy", "Bypass",
    "-File", fileURLToPath(new URL("./run-production-payment-preflight.ps1", import.meta.url)),
    "-ExpectedNeonEndpointId", endpointId,
    "-ExpectedProductionSha", expectedProductionSha,
    "-DeploymentOrigin", "https://candidate-a.vercel.app/",
  ], { encoding: "utf8", env: fixtureEnv, timeout: 10_000 });
}

for (const [label, fixture, reason] of [
  ["invalid endpoint", runEarlyPowerShellFixture("not-an-endpoint"), "invalid_expected_endpoint"],
  ["invalid Production SHA", runEarlyPowerShellFixture("ep-contract-primary-a1b2c3", {}, "not-a-full-sha"), "invalid_expected_production_sha"],
  ["preloaded audit key", runEarlyPowerShellFixture("ep-contract-primary-a1b2c3", { PAYMENTS_STRIPE_AUDIT_KEY: "rk_live_preloaded" }), "operator_secret_preloaded"],
]) {
  assert.equal(fixture.status, 1, `${label} must exit 1 before any prompt or remote access`);
  assert.equal((fixture.stdout.match(/FIRST_SALE_PREFLIGHT=FAIL/g) ?? []).length, 1, `${label} must emit one canonical FAIL`);
  assert.match(fixture.stdout, new RegExp(`FIRST_SALE_PREFLIGHT=FAIL[^\\r\\n]*secrets_printed=no[^\\r\\n]*launch=NO-GO reason=${reason}`));
  assert.doesNotMatch(fixture.stdout, /FIRST_SALE_PREFLIGHT=PASS|STRIPE_KEY_ROLES=PASS/, `${label} must never emit PASS`);
  assert.doesNotMatch(fixture.stdout, /rk_live_|postgresql:\/\//, `${label} must not print fixture secrets or database URLs`);
}

assert.ok(readiness.includes(".\\scripts\\run-vercel-production-payment-preflight.ps1"), "payment readiness must route live audits through the clean Vercel Production wrapper");
assert.ok(checklist.includes(".\\scripts\\run-vercel-production-payment-preflight.ps1"), "the live launch checklist must route live audits through the clean Vercel Production wrapper");
for (const document of [readiness, checklist]) {
  assert.ok(document.includes("VERCEL_PRODUCTION_PREFLIGHT=PASS") && document.includes("FIRST_SALE_PREFLIGHT=PASS"), "live launch instructions must require both canonical PASS lines");
  assert.ok(!document.includes("load the project-specific Automation Bypass value only into that process"), "live launch instructions must not preload the Automation Bypass into the Vercel parent process");
}
for (const [label, document] of [["payment readiness", readiness], ["live launch checklist", checklist]]) {
  assert.ok(document.includes("-ExpectedProductionSha <full-owner-approved-sha>"), `${label} must pass the full owner-approved SHA to the integrated wrapper`);
  assert.ok(document.includes("redeploy") && document.includes("same approved") && document.includes("exact-SHA"), `${label} must require a same-SHA redeploy and exact-SHA recheck after the managed-payments setting changes`);
}

for (const contract of [
  "current_database() <> 'neondb'",
  "current_user <> 'neondb_owner'",
  "hoju_payment_auditor",
  "audit_role.rolcanlogin",
  "audit_role.rolinherit",
  "pg_has_role('hoju_payment_auditor', 'neon_superuser', 'MEMBER')",
  "revoke create on schema public from hoju_payment_auditor",
  "grant select on table",
  "public.schema_migrations",
  "public.first_sale_gates",
  "revoke execute on function public.approve_next_first_sale",
]) {
  assert.ok(auditRoleGrants.includes(contract), `payment audit role grants are missing: ${contract}`);
}
assert.doesNotMatch(auditRoleGrants, /\bpassword\s+'[^<]/i, "the tracked audit-role grant file must not contain a password");
assert.ok(readiness.includes("docs/payment-audit-role-grants.sql"), "payment readiness must link the audit-role grant template");
assert.ok(readiness.includes("SQL, not the Neon Console, CLI or API"), "payment readiness must prevent a neon_superuser audit login");
assert.ok(checklist.includes("hoju_payment_auditor"), "the launch checklist must require the named audit role");
assert.ok(
  productionAudit.includes("`hoju_payment_auditor`") && productionAudit.includes("login was created through SQL"),
  "the Production audit must record the dedicated audit login evidence",
);
assert.ok(productionAudit.includes("`required_migrations_present=false`"), "the Production audit must preserve the fail-closed migration result");
assert.ok(compactProductionAudit.includes("found no `PAYMENTS_EXPECTED_NEON_ENDPOINT_ID` result"), "the Production audit must preserve the observed missing endpoint-pin state");
for (const deploymentIdentityBoundary of [
  "## 0. Production deployment identity",
  "full candidate SHA",
  "git rev-parse HEAD",
  "-ExpectedProductionSha <full-owner-approved-sha>",
  "git merge-base --is-ancestor 2f886c2 <production-source-sha>",
  "successful Vercel status on a commit",
]) assert.ok(checklist.includes(deploymentIdentityBoundary), `the launch checklist is missing deployment identity boundary: ${deploymentIdentityBoundary}`);
for (const currentReleaseBoundary of [
  "- [ ] Immediately before the release audit",
  "Any later commit creates a new candidate",
  "Historical evidence for an earlier Production SHA does not satisfy this release",
  "keep `PAYMENTS_ENABLED=false` throughout setup and preflight",
  "set `STRIPE_MANAGED_PAYMENTS_ENABLED=true`, as required by the executable payment-off preflight",
  "setting `PAYMENTS_ENABLED=true` remains a separate later owner decision",
  "restore every required Production environment value while payments are off",
  "verify or apply the required database migrations in the documented order while payments are off",
  "promote the exact approved candidate while payments are off",
  "canonical outer preflight pinned to that full SHA",
  "do not drop or reverse the additive payment evidence migrations",
]) assert.ok(checklist.includes(currentReleaseBoundary), `the launch checklist is missing the current release/rollback boundary: ${currentReleaseBoundary}`);
const executablePreflightOrder = checklist.match(/Keep this order fail-closed:[^\r\n]+/)?.[0] ?? "";
assert.ok(
  runtimePreflight.includes('input.paymentsEnabled === "false"')
    && runtimePreflight.includes('input.managedPaymentsEnabled === "true"'),
  "the executable runtime preflight must keep Checkout off while requiring Managed Payments readiness",
);
assert.doesNotMatch(
  executablePreflightOrder,
  /`PAYMENTS_ENABLED=false` and `STRIPE_MANAGED_PAYMENTS_ENABLED=false`/,
  "the executable preflight order must not disable its required Managed Payments readiness setting",
);
for (const monitoredBoundary of [
  'FIRST_SALE_MONITORED_MODE_ENABLED?.trim().toLowerCase() === "true"',
  "FIRST_SALE_MONITORED_MODE_OWNER_ACK",
  "firstSaleMonitoredModeOwnerAck",
  'process.env.VERCEL_ENV === "production"',
  'process.env.FIRST_SALE_GATE_ENABLED === "true"',
  'process.env.PAYMENTS_ENTITLEMENT_STORE === "neon"',
]) assert.ok(monitoredMode.includes(monitoredBoundary), `first-sale monitored mode is missing its fail-closed boundary: ${monitoredBoundary}`);
for (const alertBoundary of [
  "`PAYMENT_ALERTS_ENABLED=true`",
  ".\\scripts\\run-payment-alert-transport-check.ps1 -SendTest",
  "Record only the received",
]) assert.ok(alertRunbook.includes(alertBoundary), `the payment-alert runbook is missing: ${alertBoundary}`);
const smtpReceiptGate = mobileOwnerChecklist.indexOf("no-send SMTP 인증 PASS");
const productionRehearsalGate = mobileOwnerChecklist.indexOf("PRODUCTION_PAYMENT_PATH_EVIDENCE=PASS");
const ownerSaleApprovalGate = mobileOwnerChecklist.indexOf("한 건의 첫 판매만 명시적으로 승인");
assert.ok(
  smtpReceiptGate >= 0 && smtpReceiptGate < productionRehearsalGate && productionRehearsalGate < ownerSaleApprovalGate,
  "SMTP receipt, payment-off Production rehearsal and owner single-sale approval must remain ordered fail-closed gates",
);
const deploymentIdentitySection = checklist.match(/## 0\. Production deployment identity([\s\S]*?)## 1\. Business identity/)?.[1] ?? "";
assert.doesNotMatch(deploymentIdentitySection, /\b[0-9a-f]{40}\b/, "the deployment checklist must not hardcode a candidate or Production SHA that becomes stale after the next commit");
assert.doesNotMatch(
  checklist,
  /- \[x\][^\r\n]*(?:full Production Source SHA|exact-SHA Production origin|PRODUCTION_DEPLOYMENT_EVIDENCE=PASS)/,
  "deployment identity must remain unchecked until the fixed candidate is the exact payment-off Production deployment",
);
for (const observedDeploymentBoundary of [
  "commit `2f886c2`",
  "does not prove Production promotion",
  "`/resume-pro/restore?status=invalid`",
  "`resume-pro-restore-notice`",
  "`aria-atomic=\"true\"`",
  "deployment identity remains `MISSING`",
  documentedIntegratedPass,
]) assert.ok(productionAudit.includes(observedDeploymentBoundary), `the Production audit is missing the current fail-closed deployment evidence: ${observedDeploymentBoundary}`);
assert.ok(compactProductionAudit.includes("same masked accounting key must pass the integrated accounting preflight"), "the Production audit must use the same integrated three-key preflight as the canonical runbook");
assert.ok(productionAudit.includes("scripts/run-vercel-production-payment-preflight.ps1 -ExpectedNeonEndpointId <approved-primary-endpoint> -ExpectedProductionSha <full-owner-approved-sha>"), "the authoritative Production audit must route operators through the clean Vercel wrapper with both pins");
assert.ok(productionAudit.includes("without downloading Sensitive env or requesting") && productionAudit.includes("outer `VERCEL_PRODUCTION_PREFLIGHT=PASS`"), "the Production audit must preserve the non-readable Sensitive-env boundary and require both canonical PASS lines");
assert.doesNotMatch(productionAudit, /^1\. Run `scripts\/run-production-payment-preflight\.ps1`/m, "the authoritative Production audit must not route operators directly to the inner masked wrapper");
assert.doesNotMatch(productionAudit, /^8\. Run the protected live accounting preflight/m, "the Production audit must not retain a duplicate standalone accounting launch blocker");
assert.ok(envExample.includes("PAYMENTS_EXPECTED_NEON_ENDPOINT_ID="), "the environment example must expose the required non-secret endpoint pin by name");
assert.ok(envExample.includes("PAYMENTS_STRIPE_AUDIT_KEY="), "the environment example must expose the one-off Stripe Account audit key by name");
assert.ok(envExample.includes("STRIPE_MANAGED_PAYMENTS_ENABLED=false") && !envExample.includes("STRIPE_MANAGED_PAYMENTS_ENABLED=true"), "the environment example must keep Managed Payments fail-closed by default");
assert.ok(!readiness.includes("Production payments were opened after"), "payment readiness must not present the historical controlled test as current availability");
assert.ok(readiness.includes("historical test does not prove current launch readiness") && readiness.includes("authoritative 24 August Production audit is `NO-GO`"), "payment readiness must identify the current source of truth and safe defaults");
assert.ok(checklist.includes("then disabled again") && checklist.includes("Production remains OFF for the first customer"), "the live checklist must distinguish the historical controlled test from current launch approval");
for (const managedPaymentsPrerequisite of [
  "terms of service are accepted",
  "eligible digital product",
  "2025-03-31.basil",
]) {
  assert.ok(checklist.includes(managedPaymentsPrerequisite), `the live checklist is missing a Stripe-documented Managed Payments prerequisite: ${managedPaymentsPrerequisite}`);
}
for (const officialManagedPaymentsUrl of [
  "https://docs.stripe.com/payments/managed-payments/how-it-works",
  "https://docs.stripe.com/payments/managed-payments/set-up",
  "https://docs.stripe.com/payments/managed-payments/tax-compliance",
]) {
  assert.ok(readiness.includes(officialManagedPaymentsUrl), `payment readiness is missing official Stripe basis: ${officialManagedPaymentsUrl}`);
}
assert.ok(checklist.includes("not first-sale prerequisites") && checklist.includes("second Resume Pro sale remains `NO-GO`"), "post-payment tax/document observations must not over-block the single first sale");
for (const auditOnlyVariable of ["PAYMENTS_AUDIT_DB_URL", "PAYMENTS_STRIPE_AUDIT_KEY", "PAYMENTS_EXPECTED_NEON_ENDPOINT_ID"]) {
  assert.ok(releaseManifest.includes(`- \`${auditOnlyVariable}\``), `the protected Preview exclusion list must include audit-only variable: ${auditOnlyVariable}`);
}

const sanitizedEnv = {
  ...process.env,
  PAYMENTS_ENABLED: "false",
  STRIPE_SECRET_KEY: "",
  PAYMENTS_STRIPE_AUDIT_KEY: "",
  STRIPE_WEBHOOK_SECRET: "",
  STRIPE_RESUME_PRO_PRICE_ID: "",
  STRIPE_RESUME_PRO_PRODUCT_ID: "",
  STRIPE_RESUME_PRO_TAX_CODE: "",
  ENTITLEMENT_DB_URL: "",
  ENTITLEMENT_DB_DATABASE_URL: "",
  PAYMENTS_AUDIT_DB_URL: "",
  PAYMENTS_EXPECTED_NEON_ENDPOINT_ID: "",
  PAYMENT_ALERTS_ENABLED: "false",
  PAYMENT_ALERT_TO_EMAIL: "",
  PAYMENT_ALERT_FROM_EMAIL: "",
  ZOHO_SMTP_HOST: "",
  ZOHO_SMTP_PORT: "",
  ZOHO_SMTP_USER: "",
  ZOHO_SMTP_APP_PASSWORD: "",
};
const dryRun = spawnSync(process.execPath, [fileURLToPath(new URL("./check-payment-launch.mjs", import.meta.url)), "--preflight", "--strict"], {
  encoding: "utf8",
  env: sanitizedEnv,
});
assert.equal(dryRun.status, 1, "strict preflight must fail when remote Stripe and database evidence are absent");
assert.match(dryRun.stdout, /PASS  결제 스위치 — PAYMENTS_ENABLED=false/, "preflight must require Checkout to remain off during the audit");
assert.match(dryRun.stdout, /WAIT  운영 결제 감시 — SMTP 알림 또는 owner 승인 단일판매 수동감시/, "preflight must expose an invalid operator-monitoring configuration");
assert.match(dryRun.stdout, /WAIT  Stripe 원격 사전감사 — --verify-stripe 필요/, "strict preflight must require remote Stripe evidence");
assert.match(dryRun.stdout, /WAIT  Production DB 사전감사 — --verify-database 필요/, "strict preflight must require remote database evidence");

const apparentlyReadyEnv = {
  ...sanitizedEnv,
  VERCEL_ENV: "production",
  PAYMENTS_ENABLED: "true",
  STRIPE_SECRET_KEY: "rk_live_placeholder_for_contract_test_only",
  PAYMENTS_STRIPE_AUDIT_KEY: "rk_live_audit_placeholder_for_contract_test_only",
  STRIPE_WEBHOOK_SECRET: "whsec_placeholder_for_contract_test_only",
  STRIPE_RESUME_PRO_PRICE_ID: "price_placeholder",
  STRIPE_RESUME_PRO_PRODUCT_ID: "prod_placeholder",
  STRIPE_RESUME_PRO_TAX_CODE: "txcd_placeholder",
  STRIPE_MANAGED_PAYMENTS_ENABLED: "true",
  PAYMENTS_ENTITLEMENT_STORE: "neon",
  ENTITLEMENT_DB_URL: "postgresql://runtime:placeholder@ep-contract-primary-a1b2c3.ap-southeast-2.aws.neon.tech/neondb",
  PAYMENTS_AUDIT_DB_URL: "postgresql://audit:placeholder@ep-contract-primary-a1b2c3-pooler.ap-southeast-2.aws.neon.tech/neondb",
  PAYMENTS_EXPECTED_NEON_ENDPOINT_ID: "ep-contract-primary-a1b2c3",
  FIRST_SALE_GATE_ENABLED: "true",
  ENTITLEMENT_SESSION_SECRET: "contract-test-placeholder-32-chars-minimum",
  BUSINESS_LEGAL_NAME: "Contract Test Seller",
  BUSINESS_ABN: "12345678901",
  NEXT_PUBLIC_SUPPORT_EMAIL: "support@hojucompass.com",
  PAYMENT_ALERTS_ENABLED: "true",
  PAYMENT_ALERT_TO_EMAIL: "support@hojucompass.com",
  PAYMENT_ALERT_FROM_EMAIL: "support@hojucompass.com",
  ZOHO_SMTP_HOST: "smtppro.zoho.com.au",
  ZOHO_SMTP_PORT: "465",
  ZOHO_SMTP_USER: "owner@hojucompass.com",
  ZOHO_SMTP_APP_PASSWORD: "contract-test-placeholder",
};
const strictWithoutEvidence = spawnSync(process.execPath, [fileURLToPath(new URL("./check-payment-launch.mjs", import.meta.url)), "--strict"], {
  encoding: "utf8",
  env: apparentlyReadyEnv,
});
assert.equal(strictWithoutEvidence.status, 1, "strict launch audit must fail when remote verification flags are omitted even if every local setting appears ready");
assert.match(strictWithoutEvidence.stdout, /결과: 20\/20 통과, 0개 대기/, "the missing-evidence test must prove local settings alone are insufficient");
assert.match(strictWithoutEvidence.stdout, /WAIT  Stripe 원격 사전감사 — --verify-stripe 필요/, "strict launch audit must require remote Stripe evidence outside preflight mode too");
assert.match(strictWithoutEvidence.stdout, /WAIT  Production DB 사전감사 — --verify-database 필요/, "strict launch audit must require remote database evidence outside preflight mode too");

const preflightWithoutStrictOrEvidence = spawnSync(process.execPath, [fileURLToPath(new URL("./check-payment-launch.mjs", import.meta.url)), "--preflight"], {
  encoding: "utf8",
  env: { ...apparentlyReadyEnv, PAYMENTS_ENABLED: "false" },
});
assert.equal(preflightWithoutStrictOrEvidence.status, 1, "preflight mode itself must fail closed when remote verification flags are omitted");
assert.match(preflightWithoutStrictOrEvidence.stdout, /PASS  결제 스위치 — PAYMENTS_ENABLED=false/, "preflight-only mode must prove Checkout is explicitly off");
assert.match(preflightWithoutStrictOrEvidence.stdout, /WAIT  Stripe 원격 사전감사 — --verify-stripe 필요/, "preflight-only mode must require remote Stripe evidence");
assert.match(preflightWithoutStrictOrEvidence.stdout, /WAIT  Production DB 사전감사 — --verify-database 필요/, "preflight-only mode must require remote database evidence");

function runEndpointBoundary(overrides) {
  return spawnSync(process.execPath, [fileURLToPath(new URL("./check-payment-launch.mjs", import.meta.url)), "--strict"], {
    encoding: "utf8",
    env: { ...apparentlyReadyEnv, ...overrides },
  });
}

const wrongRuntimeEndpoint = runEndpointBoundary({
  ENTITLEMENT_DB_URL: "postgresql://runtime:placeholder@ep-preview-branch-d4e5f6.ap-southeast-2.aws.neon.tech/neondb",
});
assert.match(wrongRuntimeEndpoint.stdout, /WAIT  Neon endpoint 고정/, "a runtime connection to another Neon endpoint must fail the pinned endpoint check");
assert.match(wrongRuntimeEndpoint.stdout, /PASS  감사 DB endpoint 일치/, "the runtime mismatch test must isolate the runtime boundary");

const wrongAuditEndpoint = runEndpointBoundary({
  PAYMENTS_AUDIT_DB_URL: "postgresql://audit:placeholder@ep-preview-branch-d4e5f6-pooler.ap-southeast-2.aws.neon.tech/neondb",
});
assert.match(wrongAuditEndpoint.stdout, /PASS  Neon endpoint 고정/, "the audit mismatch test must preserve the runtime endpoint pass");
assert.match(wrongAuditEndpoint.stdout, /WAIT  감사 DB endpoint 일치/, "an audit connection to another Neon endpoint must fail closed");

const spoofedNeonHost = runEndpointBoundary({
  PAYMENTS_AUDIT_DB_URL: "postgresql://audit:placeholder@ep-contract-primary-a1b2c3.neon.tech.example.invalid/neondb",
});
assert.match(spoofedNeonHost.stdout, /WAIT  감사 DB endpoint 일치/, "a hostname outside neon.tech must not satisfy the endpoint pin");

const reusedRuntimeStripeKey = runEndpointBoundary({
  PAYMENTS_STRIPE_AUDIT_KEY: apparentlyReadyEnv.STRIPE_SECRET_KEY,
});
assert.match(reusedRuntimeStripeKey.stdout, /WAIT  Stripe 감사 키 분리/, "the Account audit must reject reuse of the Checkout runtime key");
assert.match(reusedRuntimeStripeKey.stdout, /결과: 19\/20 통과, 1개 대기/, "runtime-key reuse must remain a launch blocker even when other local settings pass");

const fullAccessStripeAuditKey = runEndpointBoundary({
  PAYMENTS_STRIPE_AUDIT_KEY: "sk" + "_live_audit_placeholder_for_contract_test_only",
});
assert.match(fullAccessStripeAuditKey.stdout, /WAIT  Stripe 감사 키 분리/, "the operator audit must reject a full-access secret key");

const wrongModeStripeAuditKey = runEndpointBoundary({
  PAYMENTS_STRIPE_AUDIT_KEY: "rk_test_audit_placeholder_for_contract_test_only",
});
assert.match(wrongModeStripeAuditKey.stdout, /WAIT  Stripe 감사 키 분리/, "the operator audit must reject a key from the wrong Stripe mode");

function runPaymentsOffBoundary(overrides) {
  return spawnSync(process.execPath, [fileURLToPath(new URL("./check-payment-launch.mjs", import.meta.url)), "--preflight", "--strict"], {
    encoding: "utf8",
    env: { ...apparentlyReadyEnv, PAYMENTS_ENABLED: "false", ...overrides },
  });
}

for (const [label, overrides, expectedWait] of [
  ["Managed Payments switch", { STRIPE_MANAGED_PAYMENTS_ENABLED: "" }, /WAIT  Managed Payments — 활성화/],
  ["entitlement session secret", { ENTITLEMENT_SESSION_SECRET: "" }, /WAIT  접근 세션 서명 — 32자 이상/],
  ["runtime entitlement database", { ENTITLEMENT_DB_URL: "", ENTITLEMENT_DB_DATABASE_URL: "" }, /WAIT  이용권 DB — Postgres 연결/],
]) {
  const fixture = runPaymentsOffBoundary(overrides);
  assert.equal(fixture.status, 1, `${label} must remain a strict launch blocker`);
  assert.match(fixture.stdout, /PASS  결제 스위치 — PAYMENTS_ENABLED=false/, `${label} must be audited only while Checkout remains off`);
  assert.match(fixture.stdout, expectedWait, `${label} must be reported as WAIT`);
  assert.doesNotMatch(fixture.stdout, /결과: 20\/20 통과, 0개 대기/, `${label} must not produce a locally ready launch result`);
}

const guardedRemoteAttempt = spawnSync(process.execPath, [fileURLToPath(new URL("./check-payment-launch.mjs", import.meta.url)), "--preflight", "--strict", "--verify-stripe", "--verify-database"], {
  encoding: "utf8",
  env: sanitizedEnv,
  timeout: 5_000,
});
assert.equal(guardedRemoteAttempt.status, 1, "an invalid local target boundary must fail closed");
assert.match(guardedRemoteAttempt.stdout, /Stripe 런타임 원격 사전감사 — 로컬 키·상품·모드 경계 미통과, 원격 조회 생략/, "Stripe reads must be skipped before the local target boundary passes");
assert.match(guardedRemoteAttempt.stdout, /Production DB 사전감사 — 승인 endpoint와 두 연결의 로컬 경계 미통과, 원격 조회 생략/, "database reads must be skipped before both connections match the approved endpoint");

const missingExplicitOffState = spawnSync(process.execPath, [fileURLToPath(new URL("./check-payment-launch.mjs", import.meta.url)), "--preflight", "--strict", "--verify-stripe", "--verify-database"], {
  encoding: "utf8",
  env: { ...apparentlyReadyEnv, PAYMENTS_ENABLED: "" },
  timeout: 5_000,
});
assert.equal(missingExplicitOffState.status, 1, "remote preflight must require an explicit false payment switch");
assert.match(missingExplicitOffState.stdout, /WAIT  결제 스위치 — PAYMENTS_ENABLED=false/, "a missing payment switch must be shown as a local preflight blocker");
assert.match(missingExplicitOffState.stdout, /결과: 19\/20 통과, 1개 대기/, "a missing payment switch must not be reported as a fully passing local configuration");
assert.match(missingExplicitOffState.stdout, /Stripe 런타임 원격 사전감사 — 로컬 키·상품·모드 경계 미통과, 원격 조회 생략/, "Stripe reads must be skipped when PAYMENTS_ENABLED=false is not explicit");
assert.match(missingExplicitOffState.stdout, /Production DB 사전감사 — 승인 endpoint와 두 연결의 로컬 경계 미통과, 원격 조회 생략/, "database reads must be skipped when PAYMENTS_ENABLED=false is not explicit");

console.log("Fail-closed payment launch preflight contract passed.");
