import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const [source, packageJson, readiness, checklist] = await Promise.all([
  readFile(new URL("./check-payment-launch.mjs", import.meta.url), "utf8"),
  readFile(new URL("../package.json", import.meta.url), "utf8"),
  readFile(new URL("../docs/payment-readiness.md", import.meta.url), "utf8"),
  readFile(new URL("../docs/live-payment-launch-checklist.md", import.meta.url), "utf8"),
]);

for (const flag of ["--preflight", "--verify-stripe", "--verify-database"]) {
  assert.ok(source.includes(flag), `payment launch audit is missing ${flag}`);
}

for (const boundary of [
  "PAYMENTS_ENABLED !== \"true\"",
  "current_user = 'hoju_app_runtime'",
  "PAYMENTS_AUDIT_DB_URL",
  "readOnly: true",
  "AbortSignal.timeout(10_000)",
  "20260824_entitlement_link_conflict_v1",
  "named_entitlement_link_constraint_active",
  "no_reservation_in_flight",
  "runtime_cannot_approve_next_sale",
  "runtime_cannot_mutate_gate_table",
  "runtime_cannot_mutate_entitlement_table",
  "runtime_cannot_mutate_alert_table",
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
  ENTITLEMENT_DB_URL: "postgresql://placeholder.invalid/neondb",
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
assert.match(strictWithoutEvidence.stdout, /결과: 17\/17 통과, 0개 대기/, "the missing-evidence test must prove local settings alone are insufficient");
assert.match(strictWithoutEvidence.stdout, /WAIT  Stripe 원격 사전감사 — --verify-stripe 필요/, "strict launch audit must require remote Stripe evidence outside preflight mode too");
assert.match(strictWithoutEvidence.stdout, /WAIT  Production DB 사전감사 — --verify-database 필요/, "strict launch audit must require remote database evidence outside preflight mode too");

console.log("Fail-closed payment launch preflight contract passed.");
