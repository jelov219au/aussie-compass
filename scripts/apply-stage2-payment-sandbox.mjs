import { readFile } from "node:fs/promises";

import { Client } from "@neondatabase/serverless";

const stageTwoBranch = "codex/stage2-resume-payment-sandbox";
const enabled = process.env.VERCEL_ENV === "preview"
  && process.env.VERCEL_GIT_COMMIT_REF === stageTwoBranch
  && process.env.STAGE2_DB_MIGRATIONS_ENABLED === "true"
  && process.env.PAYMENTS_ENABLED === "true"
  && process.env.FIRST_SALE_GATE_ENABLED === "true"
  && process.env.PAYMENTS_ENTITLEMENT_STORE === "neon";

if (!enabled) {
  console.log("Stage 2 sandbox migrations skipped.");
  process.exit(0);
}

const connectionString = process.env.ENTITLEMENT_DB_URL?.trim()
  || process.env.ENTITLEMENT_DB_DATABASE_URL?.trim();

if (
  !connectionString
  || (!connectionString.startsWith("postgres://") && !connectionString.startsWith("postgresql://"))
) {
  console.error("Stage 2 sandbox migration connection is unavailable.");
  process.exit(1);
}

const migrationFiles = [
  ["entitlement baseline", new URL("../docs/entitlement-storage.sql", import.meta.url)],
  ["first-sale gate", new URL("../docs/first-sale-gate.sql", import.meta.url)],
  ["operator alert outbox", new URL("../docs/migrations/20260823_payment_operator_alert_outbox_v1.sql", import.meta.url)],
  ["checkout activation nonce", new URL("../docs/migrations/20260823_checkout_activation_nonce_v1.sql", import.meta.url)],
  ["purchase access sessions", new URL("../docs/migrations/20260823_purchase_access_sessions_v1.sql", import.meta.url)],
  ["restore activation nonce", new URL("../docs/migrations/20260823_restore_activation_nonce_v1.sql", import.meta.url)],
];

const expectedVersions = [
  "20260823_first_sale_gate_charge_link_v2",
  "20260823_payment_operator_alert_outbox_v1",
  "20260823_checkout_activation_nonce_v1",
  "20260823_purchase_access_sessions_v1",
  "20260823_restore_activation_nonce_v1",
];

const sandboxDatabase = "hoju_stage2_sandbox";
const sandboxUrl = new URL(connectionString);
sandboxUrl.pathname = `/${sandboxDatabase}`;
let client;
let activeStep = "sandbox database";

try {
  const controlClient = new Client(connectionString);
  await controlClient.connect();
  try {
    const databaseResult = await controlClient.query(
      "select exists(select 1 from pg_database where datname = $1) as exists",
      [sandboxDatabase],
    );
    if (databaseResult.rows[0]?.exists !== true) {
      await controlClient.query("create database hoju_stage2_sandbox");
    }
  } finally {
    await controlClient.end();
  }

  activeStep = "connection";
  client = new Client(sandboxUrl.toString());
  await client.connect();

  for (const [name, url] of migrationFiles) {
    activeStep = name;
    const migration = await readFile(url, "utf8");
    await client.query(migration);
  }

  activeStep = "verification";
  const versionResult = await client.query(
    `select count(*)::integer as applied
     from public.schema_migrations
     where version = any($1::text[])`,
    [expectedVersions],
  );
  const functionResult = await client.query(`
    select
      to_regprocedure('public.claim_first_sale_reservation(text,text,timestamptz,text,text,integer)') is not null as claim_function,
      to_regprocedure('public.attach_first_sale_checkout(text,bigint,text,text,timestamptz)') is not null as attach_function,
      to_regprocedure('public.release_failed_first_sale_reservation(text,bigint,text,text)') is not null as release_failed_function,
      to_regprocedure('public.release_verified_abandoned_first_sale(text,bigint,text)') is not null as release_abandoned_function,
      to_regprocedure('public.apply_first_sale_paid_event(text,text,boolean,timestamptz,text,text,integer,text,text,text,text,text)') is not null as paid_event_function
  `);
  const applied = Number(versionResult.rows[0]?.applied ?? 0);
  const functions = functionResult.rows[0] ?? {};

  if (applied !== expectedVersions.length || !Object.values(functions).every(Boolean)) {
    throw Object.assign(new Error("Stage 2 sandbox schema verification failed."), {
      code: "SCHEMA_VERIFY",
    });
  }

  console.log(`Stage 2 sandbox migrations verified (${applied}/${expectedVersions.length}).`);
} catch (error) {
  const code = typeof error === "object" && error !== null && "code" in error
    ? String(error.code).replace(/[^A-Z0-9_]/gi, "").slice(0, 24)
    : "UNKNOWN";
  const constraint = typeof error === "object" && error !== null && "constraint" in error
    ? String(error.constraint).replace(/[^A-Z0-9_]/gi, "").slice(0, 80)
    : "";
  console.error(
    `Stage 2 sandbox migration failed at ${activeStep} (${code || "UNKNOWN"}${constraint ? `:${constraint}` : ""}).`,
  );
  process.exitCode = 1;
} finally {
  try {
    await client?.end();
  } catch {
    // The build already has the migration result; never print connection details.
  }
}
