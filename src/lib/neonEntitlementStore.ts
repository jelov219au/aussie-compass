import "server-only";

import { neon } from "@neondatabase/serverless";

import { getEntitlementDatabaseUrl } from "@/lib/entitlementConfig";
import type {
  EntitlementCommand,
  EntitlementRecord,
  EntitlementStore,
  ProductCode,
  StripeEventReceipt,
} from "@/lib/entitlements";

type EntitlementRow = {
  outcome?: "processed" | "duplicate" | "ignored_stale" | "tombstoned";
  id: string | number | bigint | null;
  product_code: ProductCode | null;
  status: "active" | "revoked" | "review" | null;
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
  if (row.id === null || row.product_code === null || row.status === null) {
    throw new Error("The entitlement database returned an incomplete entitlement.");
  }
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
    select * from apply_guarded_entitlement_event(
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
    entitlement: row.id === null ? undefined : toEntitlementRecord(row),
  } as const;
}

async function consumeRestoreTokenHash(tokenHash: string, productCode: ProductCode) {
  if (!/^[a-f0-9]{64}$/i.test(tokenHash)) return null;

  const sql = neon(getConnectionString());
  const rows = await sql`
    select * from consume_entitlement_restore_token(
      ${tokenHash.toLowerCase()},
      ${productCode}
    )
  ` as EntitlementRow[];

  return rows[0] ? toEntitlementRecord(rows[0]) : null;
}

async function findActiveByCheckoutSession(checkoutSessionId: string, productCode: ProductCode) {
  if (!/^cs_(?:test|live)_[A-Za-z0-9]+$/.test(checkoutSessionId)) return null;

  const sql = neon(getConnectionString());
  const rows = await sql`
    select
      id,
      product_code,
      status,
      stripe_checkout_session_id,
      stripe_payment_intent_id,
      stripe_charge_id,
      stripe_customer_id,
      granted_at,
      revoked_at
    from purchase_entitlements
    where stripe_checkout_session_id = ${checkoutSessionId}
      and product_code = ${productCode}
      and status = 'active'
    limit 1
  ` as EntitlementRow[];

  return rows[0] ? toEntitlementRecord(rows[0]) : null;
}

async function findActiveById(entitlementId: string, productCode: ProductCode) {
  if (!/^\d+$/.test(entitlementId)) return null;

  const sql = neon(getConnectionString());
  const rows = await sql`
    select
      id,
      product_code,
      status,
      stripe_checkout_session_id,
      stripe_payment_intent_id,
      stripe_charge_id,
      stripe_customer_id,
      granted_at,
      revoked_at
    from purchase_entitlements
    where id = ${entitlementId}
      and product_code = ${productCode}
      and status = 'active'
    limit 1
  ` as EntitlementRow[];

  return rows[0] ? toEntitlementRecord(rows[0]) : null;
}

async function createRestoreTokenHash(input: {
  entitlementId: string;
  productCode: ProductCode;
  tokenHash: string;
  expiresAt: Date;
}) {
  if (!/^\d+$/.test(input.entitlementId) || !/^[a-f0-9]{64}$/i.test(input.tokenHash)) {
    throw new Error("Invalid restore-token input.");
  }

  const sql = neon(getConnectionString());
  const rows = await sql`
    select create_entitlement_restore_token(
      ${input.entitlementId},
      ${input.productCode},
      ${input.tokenHash.toLowerCase()},
      ${input.expiresAt.toISOString()}
    ) as created
  ` as { created: boolean }[];

  if (!rows[0]?.created) throw new Error("An active entitlement is required to create a restore token.");
}

export const neonEntitlementStore: EntitlementStore = {
  applyStripeEvent,
  consumeRestoreTokenHash,
  findActiveByCheckoutSession,
  findActiveById,
  createRestoreTokenHash,
};

export function getConfiguredEntitlementStore() {
  return process.env.PAYMENTS_ENTITLEMENT_STORE === "neon"
    ? neonEntitlementStore
    : null;
}
