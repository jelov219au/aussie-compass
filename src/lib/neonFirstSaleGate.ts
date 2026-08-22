import "server-only";

import { neon } from "@neondatabase/serverless";

import { getEntitlementDatabaseUrl } from "@/lib/entitlementConfig";
import type { FirstSaleClaimResult, FirstSaleGateStore } from "@/lib/firstSaleGate";

type ClaimRow = {
  outcome: FirstSaleClaimResult["outcome"];
  generation: number | string | null;
  stripe_checkout_session_id: string | null;
};

function getConnectionString() {
  const value = getEntitlementDatabaseUrl();

  if (!value || (!value.startsWith("postgres://") && !value.startsWith("postgresql://"))) {
    throw new Error("The first-sale gate database is not configured.");
  }

  return value;
}

async function claimReservation(
  input: Parameters<FirstSaleGateStore["claimReservation"]>[0],
): Promise<FirstSaleClaimResult> {
  const sql = neon(getConnectionString());
  const rows = await sql`
    select * from claim_first_sale_reservation(
      ${input.productCode},
      ${input.claimTokenHash},
      ${input.expiresAt.toISOString()},
      ${input.environment},
      ${input.currency},
      ${input.amountCents}
    )
  ` as ClaimRow[];
  const row = rows[0];

  if (!row) throw new Error("The first-sale gate returned no claim result.");

  if (row.outcome === "claimed") {
    return {
      outcome: "claimed",
      generation: Number(row.generation),
      claimTokenHash: input.claimTokenHash,
      idempotencyKey: `resume_pro_first_sale_${input.claimTokenHash}`,
      expiresAt: input.expiresAt,
    };
  }

  if (row.outcome === "verify_expiry" && row.stripe_checkout_session_id) {
    return {
      outcome: "verify_expiry",
      generation: Number(row.generation),
      checkoutSessionId: row.stripe_checkout_session_id,
    };
  }

  if (row.outcome === "reserved" || row.outcome === "locked" || row.outcome === "manual_review") {
    return { outcome: row.outcome };
  }

  throw new Error("The first-sale gate returned an invalid claim result.");
}

async function attachCheckoutSession(
  input: Parameters<FirstSaleGateStore["attachCheckoutSession"]>[0],
) {
  const sql = neon(getConnectionString());
  const rows = await sql`
    select attach_first_sale_checkout(
      ${input.productCode},
      ${input.generation},
      ${input.claimTokenHash},
      ${input.checkoutSessionId},
      ${input.expiresAt.toISOString()}
    ) as attached
  ` as { attached: boolean }[];
  return rows[0]?.attached === true;
}

async function releaseFailedReservation(
  input: Parameters<FirstSaleGateStore["releaseFailedReservation"]>[0],
) {
  const sql = neon(getConnectionString());
  const rows = await sql`
    select release_failed_first_sale_reservation(
      ${input.productCode},
      ${input.generation},
      ${input.claimTokenHash},
      ${input.reason}
    ) as released
  ` as { released: boolean }[];
  return rows[0]?.released === true;
}

async function releaseVerifiedAbandoned(
  input: Parameters<FirstSaleGateStore["releaseVerifiedAbandoned"]>[0],
) {
  const sql = neon(getConnectionString());
  const rows = await sql`
    select release_verified_abandoned_first_sale(
      ${input.productCode},
      ${input.generation},
      ${input.checkoutSessionId}
    ) as released
  ` as { released: boolean }[];
  return rows[0]?.released === true;
}

async function applyPaidEventAndEntitlement(
  input: Parameters<FirstSaleGateStore["applyPaidEventAndEntitlement"]>[0],
) {
  const sql = neon(getConnectionString());
  const { receipt, command } = input;
  const rows = await sql`
    select apply_first_sale_paid_event(
      ${receipt.eventId},
      ${receipt.eventType},
      ${receipt.livemode},
      ${receipt.createdAt.toISOString()},
      ${command.productCode},
      ${command.currency},
      ${command.amountTotal},
      ${command.checkoutSessionId},
      ${command.paymentIntentId ?? null},
      ${command.customerId ?? null},
      ${command.reason}
    ) as outcome
  ` as { outcome: "processed" | "duplicate" | "ignored_stale" }[];
  const outcome = rows[0]?.outcome;

  if (outcome !== "processed" && outcome !== "duplicate" && outcome !== "ignored_stale") {
    throw new Error("The first-sale paid transaction returned an invalid result.");
  }

  return { outcome };
}

export const neonFirstSaleGate: FirstSaleGateStore = {
  claimReservation,
  attachCheckoutSession,
  releaseFailedReservation,
  releaseVerifiedAbandoned,
  applyPaidEventAndEntitlement,
};

export function getConfiguredFirstSaleGate() {
  return process.env.FIRST_SALE_GATE_ENABLED === "true"
    && process.env.PAYMENTS_ENTITLEMENT_STORE === "neon"
    ? neonFirstSaleGate
    : null;
}
