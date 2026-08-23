import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const [source, packageJson, readiness, checklist, auditRoleGrants, productionAudit, envExample, releaseManifest] = await Promise.all([
  readFile(new URL("./check-payment-launch.mjs", import.meta.url), "utf8"),
  readFile(new URL("../package.json", import.meta.url), "utf8"),
  readFile(new URL("../docs/payment-readiness.md", import.meta.url), "utf8"),
  readFile(new URL("../docs/live-payment-launch-checklist.md", import.meta.url), "utf8"),
  readFile(new URL("../docs/payment-audit-role-grants.sql", import.meta.url), "utf8"),
  readFile(new URL("../docs/production-first-sale-readiness-audit-2026-08-24.md", import.meta.url), "utf8"),
  readFile(new URL("../.env.example", import.meta.url), "utf8"),
  readFile(new URL("../docs/release-candidate-manifest-2026-08-23.md", import.meta.url), "utf8"),
]);
const compactProductionAudit = productionAudit.replace(/\s+/g, " ");

for (const flag of ["--preflight", "--verify-stripe", "--verify-database"]) {
  assert.ok(source.includes(flag), `payment launch audit is missing ${flag}`);
}

for (const boundary of [
  "PAYMENTS_ENABLED !== \"true\"",
  "current_user = 'hoju_app_runtime'",
  "current_user = 'hoju_payment_auditor'",
  "PAYMENTS_AUDIT_DB_URL",
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
  "stripe.accounts.retrieveCurrent()",
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
  '"운영 결제 알림"',
]) {
  assert.ok(source.includes(boundary), `payment launch preflight is missing: ${boundary}`);
}

assert.doesNotMatch(source, /console\.(?:log|warn|error)\([^\n]*(?:entitlementDatabaseUrl|STRIPE_SECRET_KEY|price\.id|product\.id|session\.id)/, "the launch audit must never print secrets, connection strings or Stripe IDs");
assert.ok(packageJson.includes('"test:payment-launch-preflight"'), "the preflight contract test must be exposed through package scripts");
assert.ok(packageJson.includes("npm run test:payment-launch-preflight"), "the full quality gate must include the preflight contract");

const command = "npm run payments:check -- --preflight --strict --verify-stripe --verify-database";
assert.ok(readiness.includes(command), "payment readiness must document the fail-closed preflight command");
assert.ok(checklist.includes(command), "the live launch checklist must document the fail-closed preflight command");

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
assert.ok(envExample.includes("PAYMENTS_EXPECTED_NEON_ENDPOINT_ID="), "the environment example must expose the required non-secret endpoint pin by name");
for (const auditOnlyVariable of ["PAYMENTS_AUDIT_DB_URL", "PAYMENTS_EXPECTED_NEON_ENDPOINT_ID"]) {
  assert.ok(releaseManifest.includes(`- \`${auditOnlyVariable}\``), `the protected Preview exclusion list must include audit-only variable: ${auditOnlyVariable}`);
}

const sanitizedEnv = {
  ...process.env,
  PAYMENTS_ENABLED: "false",
  STRIPE_SECRET_KEY: "",
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
assert.match(dryRun.stdout, /WAIT  운영 결제 알림 — SMTP 인증·발신자·지원 수신함 일치/, "preflight must expose an invalid operator-alert configuration");
assert.match(dryRun.stdout, /WAIT  Stripe 원격 사전감사 — --verify-stripe 필요/, "strict preflight must require remote Stripe evidence");
assert.match(dryRun.stdout, /WAIT  Production DB 사전감사 — --verify-database 필요/, "strict preflight must require remote database evidence");

const apparentlyReadyEnv = {
  ...sanitizedEnv,
  VERCEL_ENV: "production",
  PAYMENTS_ENABLED: "true",
  STRIPE_SECRET_KEY: "rk_live_placeholder_for_contract_test_only",
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
  NEXT_PUBLIC_SUPPORT_EMAIL: "support@example.invalid",
  PAYMENT_ALERTS_ENABLED: "true",
  PAYMENT_ALERT_TO_EMAIL: "support@example.invalid",
  PAYMENT_ALERT_FROM_EMAIL: "support@example.invalid",
  ZOHO_SMTP_HOST: "smtp.example.invalid",
  ZOHO_SMTP_PORT: "465",
  ZOHO_SMTP_USER: "support@example.invalid",
  ZOHO_SMTP_APP_PASSWORD: "contract-test-placeholder",
};
const strictWithoutEvidence = spawnSync(process.execPath, [fileURLToPath(new URL("./check-payment-launch.mjs", import.meta.url)), "--strict"], {
  encoding: "utf8",
  env: apparentlyReadyEnv,
});
assert.equal(strictWithoutEvidence.status, 1, "strict launch audit must fail when remote verification flags are omitted even if every local setting appears ready");
assert.match(strictWithoutEvidence.stdout, /결과: 19\/19 통과, 0개 대기/, "the missing-evidence test must prove local settings alone are insufficient");
assert.match(strictWithoutEvidence.stdout, /WAIT  Stripe 원격 사전감사 — --verify-stripe 필요/, "strict launch audit must require remote Stripe evidence outside preflight mode too");
assert.match(strictWithoutEvidence.stdout, /WAIT  Production DB 사전감사 — --verify-database 필요/, "strict launch audit must require remote database evidence outside preflight mode too");

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

console.log("Fail-closed payment launch preflight contract passed.");
