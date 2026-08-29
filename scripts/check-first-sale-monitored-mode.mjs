import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  firstSaleMonitoredModeOwnerAck,
  getFirstSaleMonitoredModeStatus,
} from "../src/lib/firstSaleMonitoredMode.ts";

const original = { ...process.env };

function setEnvironment(overrides = {}) {
  process.env.VERCEL_ENV = "production";
  process.env.FIRST_SALE_GATE_ENABLED = "true";
  process.env.PAYMENTS_ENTITLEMENT_STORE = "neon";
  process.env.FIRST_SALE_MONITORED_MODE_ENABLED = "true";
  process.env.FIRST_SALE_MONITORED_MODE_OWNER_ACK = firstSaleMonitoredModeOwnerAck;
  Object.assign(process.env, overrides);
}

try {
  setEnvironment();
  assert.equal(getFirstSaleMonitoredModeStatus().configured, true);

  for (const overrides of [
    { VERCEL_ENV: "preview" },
    { FIRST_SALE_GATE_ENABLED: "false" },
    { PAYMENTS_ENTITLEMENT_STORE: "" },
    { FIRST_SALE_MONITORED_MODE_ENABLED: "false" },
    { FIRST_SALE_MONITORED_MODE_OWNER_ACK: "" },
    { FIRST_SALE_MONITORED_MODE_OWNER_ACK: "true" },
  ]) {
    setEnvironment(overrides);
    assert.equal(getFirstSaleMonitoredModeStatus().configured, false);
  }
} finally {
  for (const key of Object.keys(process.env)) {
    if (!(key in original)) delete process.env[key];
  }
  Object.assign(process.env, original);
}

const [commerce, webhook, monitoredMode, preflight, envExample] = await Promise.all([
  readFile(new URL("../src/lib/commerce.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/app/api/stripe/webhook/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/firstSaleMonitoredMode.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/productionRuntimePaymentPreflight.ts", import.meta.url), "utf8"),
  readFile(new URL("../.env.example", import.meta.url), "utf8"),
]);

assert.ok(commerce.includes("operatorAlertsConfigured || firstSaleMonitoredModeConfigured"));
assert.ok(preflight.includes("input.readiness.firstSaleMonitoredModeConfigured"));
assert.ok(webhook.includes("The durable payment operator alert outbox is unavailable."));
assert.ok(webhook.includes("Manual first-sale monitoring required."));
assert.ok(webhook.includes("firstSaleManualMonitoringTarget"));
assert.ok(monitoredMode.includes("stripe_dashboard_and_runtime_logs"));
assert.ok(webhook.includes("smtpDeliveryFailed = true"));
assert.ok(webhook.includes("if (!monitoredMode || !smtpDeliveryFailed) throw error"));
assert.ok(webhook.includes('reason: "smtp_not_configured"') || webhook.includes('"smtp_not_configured"'));
assert.ok(webhook.indexOf("entitlementPersisted = true") < webhook.indexOf("logFirstSaleManualMonitoring(event"));
assert.ok(webhook.indexOf("matchesCheckoutProductEntitlementContract") < webhook.indexOf("isFirstSaleMonitoredModeConfigured"));
assert.ok(envExample.includes("FIRST_SALE_MONITORED_MODE_ENABLED=false"));
assert.ok(envExample.includes("FIRST_SALE_MONITORED_MODE_OWNER_ACK="));

console.log("Explicit single first-sale manual monitoring contracts passed.");
