import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { neon } from "@neondatabase/serverless";

import { getEntitlementDatabaseUrl } from "@/lib/entitlementConfig";
import type {
  ClaimedPaymentOperatorAlert,
  PaymentOperatorAlertKind,
  PaymentOperatorAlertOutboxStore,
} from "@/lib/paymentAlertOutbox";

type AlertIntentRow = {
  claim_outcome: "claimed" | "sent" | "busy" | "missing";
  alert_kind: PaymentOperatorAlertKind;
  event_type: string;
  event_ref_last8: string;
  product_code: ClaimedPaymentOperatorAlert["productCode"] | null;
  checkout_ref_last8: string | null;
  payment_intent_ref_last8: string | null;
  charge_ref_last8: string | null;
  attempts: number | string;
};

function getConnectionString() {
  const value = getEntitlementDatabaseUrl();
  if (!value || (!value.startsWith("postgres://") && !value.startsWith("postgresql://"))) {
    throw new Error("The payment alert outbox database is not configured.");
  }
  return value;
}

function claimTokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function enqueueFulfillmentAttention(
  input: Parameters<PaymentOperatorAlertOutboxStore["enqueueFulfillmentAttention"]>[0],
) {
  const sql = neon(getConnectionString());
  const rows = await sql`
    select enqueue_payment_operator_alert_failure(
      ${input.eventId},
      ${input.eventType},
      ${input.livemode},
      ${input.productCode},
      ${input.checkoutSessionId},
      ${input.paymentIntentId}
    ) as enqueued
  ` as { enqueued: boolean }[];
  if (rows[0]?.enqueued !== true) throw new Error("The payment alert failure intent was not recorded.");
}

async function claim(eventId: string, alertKind: PaymentOperatorAlertKind) {
  const claimToken = randomBytes(32).toString("base64url");
  const sql = neon(getConnectionString());
  const rows = await sql`
    select * from claim_payment_operator_alert_intent(
      ${eventId},
      ${alertKind},
      ${claimTokenHash(claimToken)}
    )
  ` as AlertIntentRow[];
  const row = rows[0];
  if (!row || row.claim_outcome === "missing") return { outcome: "missing" as const };
  if (row.claim_outcome === "sent" || row.claim_outcome === "busy") {
    return { outcome: row.claim_outcome } as const;
  }

  return {
    outcome: "claimed" as const,
    intent: {
      alertKind: row.alert_kind,
      eventType: row.event_type,
      eventRefLast8: row.event_ref_last8,
      ...(row.product_code ? { productCode: row.product_code } : {}),
      ...(row.checkout_ref_last8 ? { checkoutRefLast8: row.checkout_ref_last8 } : {}),
      ...(row.payment_intent_ref_last8 ? { paymentIntentRefLast8: row.payment_intent_ref_last8 } : {}),
      ...(row.charge_ref_last8 ? { chargeRefLast8: row.charge_ref_last8 } : {}),
      attempts: Number(row.attempts),
      claimToken,
    } satisfies ClaimedPaymentOperatorAlert,
  };
}

async function markSent(eventId: string, alertKind: PaymentOperatorAlertKind, claimToken: string) {
  const sql = neon(getConnectionString());
  const rows = await sql`
    select mark_payment_operator_alert_sent(
      ${eventId},
      ${alertKind},
      ${claimTokenHash(claimToken)}
    ) as marked
  ` as { marked: boolean }[];
  return rows[0]?.marked === true;
}

async function release(eventId: string, alertKind: PaymentOperatorAlertKind, claimToken: string) {
  const sql = neon(getConnectionString());
  const rows = await sql`
    select release_payment_operator_alert_claim(
      ${eventId},
      ${alertKind},
      ${claimTokenHash(claimToken)}
    ) as released
  ` as { released: boolean }[];
  return rows[0]?.released === true;
}

export const neonPaymentAlertOutbox: PaymentOperatorAlertOutboxStore = {
  enqueueFulfillmentAttention,
  claim,
  markSent,
  release,
};

export function getConfiguredPaymentAlertOutbox() {
  return process.env.PAYMENTS_ENTITLEMENT_STORE === "neon"
    ? neonPaymentAlertOutbox
    : null;
}
