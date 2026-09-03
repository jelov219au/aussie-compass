import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const env = (name) => (process.env[name] ?? "").trim();
const expectedStripeMode = env("VERCEL_ENV") === "production" ? "live" : "test";
const stripeKeyMode = env("STRIPE_SECRET_KEY").match(/^(?:sk|rk)_(test|live)_/)?.[1];
const required = [
  ["PAYMENTS_ENABLED", () => env("PAYMENTS_ENABLED") === "true"],
  ["LEAVING_AUSTRALIA_PRO_PAYMENTS_ENABLED", () => env("LEAVING_AUSTRALIA_PRO_PAYMENTS_ENABLED") === "true"],
  ["STRIPE_SECRET_KEY", () => stripeKeyMode === expectedStripeMode],
  ["STRIPE_WEBHOOK_SECRET", () => /^whsec_/.test(env("STRIPE_WEBHOOK_SECRET"))],
  ["STRIPE_LEAVING_AUSTRALIA_PRO_PRICE_ID", () => /^price_/.test(env("STRIPE_LEAVING_AUSTRALIA_PRO_PRICE_ID"))],
  ["STRIPE_MANAGED_PAYMENTS_ENABLED", () => env("STRIPE_MANAGED_PAYMENTS_ENABLED") === "true"],
  ["STRIPE_RESUME_PRO_PRICE_ID", () => /^price_/.test(env("STRIPE_RESUME_PRO_PRICE_ID"))],
  ["STRIPE_RESUME_PRO_PRODUCT_ID", () => /^prod_/.test(env("STRIPE_RESUME_PRO_PRODUCT_ID"))],
  ["STRIPE_RESUME_PRO_TAX_CODE", () => /^txcd_/.test(env("STRIPE_RESUME_PRO_TAX_CODE"))],
  ["PAYMENTS_ENTITLEMENT_STORE", () => env("PAYMENTS_ENTITLEMENT_STORE") === "neon"],
  ["FIRST_SALE_GATE_ENABLED", () => env("FIRST_SALE_GATE_ENABLED") === "true"],
  ["ENTITLEMENT_DB_URL or ENTITLEMENT_DB_DATABASE_URL", () => /^postgres(ql)?:\/\//.test(env("ENTITLEMENT_DB_URL") || env("ENTITLEMENT_DB_DATABASE_URL"))],
  ["ENTITLEMENT_SESSION_SECRET", () => env("ENTITLEMENT_SESSION_SECRET").length >= 32],
  ["BUSINESS_LEGAL_NAME", () => env("BUSINESS_LEGAL_NAME").length > 0],
  ["BUSINESS_ABN", () => /^\d{11}$/.test(env("BUSINESS_ABN").replace(/\D/g, ""))],
  ["NEXT_PUBLIC_SUPPORT_EMAIL", () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env("NEXT_PUBLIC_SUPPORT_EMAIL"))],
  ["operator monitoring configuration", () => (
    env("PAYMENT_ALERTS_ENABLED") === "true"
      && env("ZOHO_SMTP_APP_PASSWORD").length > 0
      && env("ZOHO_SMTP_USER") === "owner@hojucompass.com"
    ) || (
      env("FIRST_SALE_MONITORED_MODE_ENABLED") === "true"
      && env("FIRST_SALE_MONITORED_MODE_OWNER_ACK") === "SINGLE_FIRST_SALE_MANUAL_MONITORING_APPROVED"
    )],
];
const migrations = [
  "../docs/migrations/20260830_leaving_australia_entitlement_v1.sql",
  "../docs/migrations/20260830_leaving_australia_first_sale_gate_v1.sql",
  "../docs/migrations/20260902_eofy_leaving_access_functions_v1.sql",
];
const missing = required
  .filter(([, validate]) => !validate())
  .map(([name]) => name);
const missingMigrations = migrations.filter((path) => !existsSync(fileURLToPath(new URL(path, import.meta.url))));

console.log("Leaving Australia Pack Pro local launch gate");
console.log(`- local contracts: ${missingMigrations.length ? "INCOMPLETE" : "READY"}`);
console.log(`- external keys/config: ${missing.length ? "WAITING" : "PRESENT"}`);
if (missing.length) console.log(`- required names: ${missing.join(", ")}`);
if (missingMigrations.length) console.log(`- missing migrations: ${missingMigrations.join(", ")}`);
console.log("- no secret values were printed and no external service was contacted");

if (missing.length || missingMigrations.length) process.exitCode = 2;
