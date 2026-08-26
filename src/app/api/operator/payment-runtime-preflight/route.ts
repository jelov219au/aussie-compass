import { NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

import { getPaymentReadiness } from "@/lib/commerce";
import { isPaymentRuntimeSchemaReady } from "@/lib/neonFirstSaleGate";
import { runPaymentAlertTransportCheck } from "@/lib/paymentAlerts";
import { verifyProductionRuntimeDatabase } from "@/lib/productionRuntimeDatabasePreflight";
import { runProductionRuntimePaymentPreflight } from "@/lib/productionRuntimePaymentPreflight";
import { assertResumeProStripeProduct, getResumeProStripeProductConfig } from "@/lib/resumeProStripeProduct";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestContract = "read-only-v1";
const requestHeader = "x-hoju-runtime-preflight";
const maximumBodyBytes = 512;
const exactShaPattern = /^[a-f0-9]{40}$/;
const canonicalPass = "PRODUCTION_RUNTIME_PAYMENT_PREFLIGHT=PASS environment=production source_sha=exact payments=off managed_payments=configured config=verified stripe=read-only-pass open_sessions=zero database=runtime-schema-pass smtp=verify-pass email_sent=no secrets_printed=no";
const canonicalFail = "PRODUCTION_RUNTIME_PAYMENT_PREFLIGHT=FAIL environment=unverified source_sha=unverified payments=unverified managed_payments=unverified config=unverified stripe=unverified open_sessions=unverified database=unverified smtp=unverified email_sent=no secrets_printed=no launch=NO-GO";
type RuntimeDependency = "stripe" | "schema" | "database" | "smtp";
type RuntimeDependencyOutcome = "not-run" | "pass" | "fail" | "error";
type RuntimeDependencyOutcomes = Record<RuntimeDependency, RuntimeDependencyOutcome>;

function fixedResponse(body: string, status: number) {
  return new Response(`${body}\n`, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function failClosed(status = 404) {
  return fixedResponse(canonicalFail, status);
}

function isExactProtectedDeploymentRequest(request: NextRequest) {
  const runtimeDeploymentHost = process.env.VERCEL_URL?.trim().toLowerCase() ?? "";
  return runtimeDeploymentHost.endsWith(".vercel.app")
    && request.nextUrl.hostname.toLowerCase() === runtimeDeploymentHost
    && request.headers.get(requestHeader) === requestContract;
}

async function readExpectedPins(request: NextRequest) {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== "application/json") return null;

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (!Number.isFinite(declaredLength) || declaredLength < 0 || declaredLength > maximumBodyBytes) return null;

  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody, "utf8") > maximumBodyBytes) return null;

  try {
    const parsed = JSON.parse(rawBody) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const entries = Object.entries(parsed);
    const keys = new Set(entries.map(([key]) => key));
    if (
      entries.length !== 5
      || !keys.has("expectedSha")
      || !keys.has("expectedEndpointId")
      || !keys.has("challenge")
      || !keys.has("auditKeyHmac")
      || !keys.has("accountingKeyHmac")
    ) return null;
    const expectedSha = Reflect.get(parsed, "expectedSha") as unknown;
    const expectedEndpointId = Reflect.get(parsed, "expectedEndpointId") as unknown;
    const challenge = Reflect.get(parsed, "challenge") as unknown;
    const auditKeyHmac = Reflect.get(parsed, "auditKeyHmac") as unknown;
    const accountingKeyHmac = Reflect.get(parsed, "accountingKeyHmac") as unknown;
    if (
      typeof expectedSha !== "string"
      || !exactShaPattern.test(expectedSha)
      || typeof expectedEndpointId !== "string"
      || !/^ep-[a-z0-9-]+$/.test(expectedEndpointId)
      || typeof challenge !== "string"
      || !/^[a-f0-9]{64}$/.test(challenge)
      || typeof auditKeyHmac !== "string"
      || !/^[a-f0-9]{64}$/.test(auditKeyHmac)
      || typeof accountingKeyHmac !== "string"
      || !/^[a-f0-9]{64}$/.test(accountingKeyHmac)
    ) return null;
    return { expectedSha, expectedEndpointId, challenge, auditKeyHmac, accountingKeyHmac };
  } catch {
    return null;
  }
}

function hmacBuffer(value: string) {
  return Buffer.from(value, "hex");
}

function runtimeKeyRolesAreDistinct(pins: Awaited<ReturnType<typeof readExpectedPins>>) {
  if (!pins) return false;
  const runtimeKey = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  if (!/^rk_live_[A-Za-z0-9]+$/.test(runtimeKey)) return false;

  const runtimeKeyHmac = createHmac("sha256", runtimeKey).update(pins.challenge, "utf8").digest();
  const auditKeyHmac = hmacBuffer(pins.auditKeyHmac);
  const accountingKeyHmac = hmacBuffer(pins.accountingKeyHmac);
  return !timingSafeEqual(runtimeKeyHmac, auditKeyHmac)
    && !timingSafeEqual(runtimeKeyHmac, accountingKeyHmac)
    && !timingSafeEqual(auditKeyHmac, accountingKeyHmac);
}

async function verifyStripeProductAndZeroOpenSessions() {
  const stripe = getStripe();
  const config = getResumeProStripeProductConfig();
  const [price, sessions] = await Promise.all([
    stripe.prices.retrieve(config.priceId, { expand: ["product"] }),
    stripe.checkout.sessions.list({ status: "open", limit: 100 }),
  ]);
  assertResumeProStripeProduct(price, config, true);
  return sessions.data.length === 0 && sessions.has_more === false;
}

async function verifyPaymentAlertTransportWithoutSending() {
  const result = await runPaymentAlertTransportCheck({ sendTest: false });
  return result.transportVerified === true && result.testSent === false;
}

async function observeRuntimeDependency(
  outcomes: RuntimeDependencyOutcomes,
  dependency: RuntimeDependency,
  verify: () => Promise<boolean>,
) {
  try {
    const passed = await verify();
    outcomes[dependency] = passed ? "pass" : "fail";
    return passed;
  } catch {
    outcomes[dependency] = "error";
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isExactProtectedDeploymentRequest(request)) return failClosed();

    const pins = await readExpectedPins(request);
    if (!pins) return failClosed(400);

    const dependencyOutcomes: RuntimeDependencyOutcomes = {
      stripe: "not-run",
      schema: "not-run",
      database: "not-run",
      smtp: "not-run",
    };
    const runtimeKeyRolesDistinct = runtimeKeyRolesAreDistinct(pins);
    const readiness = getPaymentReadiness();
    const passed = await runProductionRuntimePaymentPreflight({
      environment: process.env.VERCEL_ENV,
      paymentsEnabled: process.env.PAYMENTS_ENABLED,
      managedPaymentsEnabled: process.env.STRIPE_MANAGED_PAYMENTS_ENABLED,
      deploymentSha: process.env.VERCEL_GIT_COMMIT_SHA,
      expectedSha: pins.expectedSha,
      runtimeKeyRolesDistinct,
      readiness,
    }, {
      verifyStripeProductAndZeroOpenSessions: () => observeRuntimeDependency(
        dependencyOutcomes,
        "stripe",
        verifyStripeProductAndZeroOpenSessions,
      ),
      verifyRuntimeSchema: () => observeRuntimeDependency(
        dependencyOutcomes,
        "schema",
        isPaymentRuntimeSchemaReady,
      ),
      verifyRuntimeDatabaseRoleAndEndpoint: () => observeRuntimeDependency(
        dependencyOutcomes,
        "database",
        () => verifyProductionRuntimeDatabase(pins.expectedEndpointId),
      ),
      verifyPaymentAlertTransportWithoutSending: () => observeRuntimeDependency(
        dependencyOutcomes,
        "smtp",
        verifyPaymentAlertTransportWithoutSending,
      ),
    });

    if (!passed) {
      const configuration = {
        environment: process.env.VERCEL_ENV === "production",
        paymentsOff: process.env.PAYMENTS_ENABLED === "false",
        managedPayments: process.env.STRIPE_MANAGED_PAYMENTS_ENABLED === "true",
        sourceShaExact: process.env.VERCEL_GIT_COMMIT_SHA === pins.expectedSha,
        runtimeKeyRolesDistinct,
        readiness: {
          paymentsDisabled: readiness.enabled === false,
          launchDisabled: readiness.ready === false,
          stripeConfigured: readiness.stripeConfigured,
          stripeProductContractConfigured: readiness.stripeProductContractConfigured,
          managedPaymentsConfigured: readiness.managedPaymentsConfigured,
          webhookConfigured: readiness.webhookConfigured,
          entitlementStoreConfigured: readiness.entitlementStoreConfigured,
          firstSaleGateConfigured: readiness.firstSaleGateConfigured,
          accessDeliveryImplemented: readiness.accessDeliveryImplemented,
          sellerDetailsConfigured: readiness.sellerDetailsConfigured,
          supportConfigured: readiness.supportConfigured,
          operatorAlertsConfigured: readiness.operatorAlertsConfigured,
        },
      };
      console.warn("[payments] Protected runtime preflight failed.", {
        configuration,
        dependencies: dependencyOutcomes,
      });
    }

    return passed ? fixedResponse(canonicalPass, 200) : failClosed(503);
  } catch {
    return failClosed(503);
  }
}

export function GET() {
  return failClosed(405);
}

export function HEAD() {
  return new Response(null, {
    status: 405,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
