import "server-only";

import { neon } from "@neondatabase/serverless";

import { getEntitlementDatabaseUrl } from "@/lib/entitlementConfig";
import type {
  EntitlementCommand,
  EntitlementRecord,
  EntitlementStore,
  StripeEventReceipt,
} from "@/lib/entitlements";

type EntitlementRow = {
  outcome?: "processed" | "duplicate";
  id: string | number | bigint;
  product_code: "resume_pro";
  status: "active" | "revoked" | "review";
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  stripe_customer_id: string | null;
  granted_at: Date | string | null;
  revoked_at: Date | string | null;
};

function getConnectionString() {
  const value = getEntitlementDatabaseUrl();

  if (!value || (!value.startsWith("postgres://") && !value.startsWith("postgresql://"))) {
    throw new Error("The entitlement database is not configured as a Postgres connection string.");
  }

  return value;
}

function optionalDate(value: Date | string | null) {
  return value ? new Date(value) : undefined;
}

function toEntitlementRecord(row: EntitlementRow): EntitlementRecord {
  return {
    id: String(row.id),
    productCode: row.product_code,
    status: row.status,
    checkoutSessionId: row.stripe_checkout_session_id ?? undefined,
    paymentIntentId: row.stripe_payment_intent_id ?? undefined,
    chargeId: row.stripe_charge_id ?? undefined,
    customerId: row.stripe_customer_id ?? undefined,
    grantedAt: optionalDate(row.granted_at),
    revokedAt: optionalDate(row.revoked_at),
  };
}

async function applyStripeEvent(input: {
  receipt: StripeEventReceipt;
  command: EntitlementCommand;
}) {
  const sql = neon(getConnectionString());
  const { receipt, command } = input;
  const rows = await sql`
    select * from apply_entitlement_event(
      ${receipt.eventId},
      ${receipt.eventType},
      ${receipt.livemode},
      ${receipt.createdAt.toISOString()},
      ${command.action},
      ${command.productCode ?? null},
      ${command.checkoutSessionId ?? null},
      ${command.paymentIntentId ?? null},
      ${command.chargeId ?? null},
      ${command.customerId ?? null},
      ${command.reason}
    )
  ` as EntitlementRow[];
  const row = rows[0];

  if (!row) throw new Error("The entitlement database returned no result.");

  return {
    outcome: row.outcome ?? "processed",
    entitlement: toEntitlementRecord(row),
  } as const;
}

async function consumeRestoreTokenHash(tokenHash: string) {
  if (!/^[a-f0-9]{64}$/i.test(tokenHash)) return null;

  const sql = neon(getConnectionString());
  const rows = await sql`
    with consumed as (
      update purchase_restore_tokens
      set used_at = now()
      where token_hash = ${tokenHash.toLowerCase()}
        and used_at is null
        and expires_at > now()
      returning entitlement_id
    )
    select
      entitlement.id,
      entitlement.product_code,
      entitlement.status,
      entitlement.stripe_checkout_session_id,
      entitlement.stripe_payment_intent_id,
      entitlement.stripe_charge_id,
      entitlement.stripe_customer_id,
      entitlement.granted_at,
      entitlement.revoked_at
    from purchase_entitlements entitlement
    join consumed on consumed.entitlement_id = entitlement.id
  ` as EntitlementRow[];

  return rows[0] ? toEntitlementRecord(rows[0]) : null;
}

export const neonEntitlementStore: EntitlementStore = {
  applyStripeEvent,
  consumeRestoreTokenHash,
};

export function getConfiguredEntitlementStore() {
  return process.env.PAYMENTS_ENTITLEMENT_STORE === "neon"
    ? neonEntitlementStore
    : null;
}
