import "server-only";
import type { CarPurchaseAccessStore } from "./carPurchaseProAccessLifecycle";

// Inject an approved server query client only after the car-product DB migration is verified.
// This module opens no connection and is not wired into the closed production runtime.
export type CarPurchaseAccessQuery = (statement: string, values: readonly string[]) => Promise<unknown>;
const productCode = "car_purchase_pro";
const hash = (value: string) => /^[a-f0-9]{64}$/.test(value);
function id(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "bigint" && typeof value !== "number") return null;
  if (typeof value === "number" && !Number.isSafeInteger(value)) return null;
  const text = String(value);
  return /^[1-9]\d{0,18}$/.test(text) && BigInt(text) <= BigInt("9223372036854775807") ? text : null;
}
type Row = Record<string, unknown>;
function one(result: unknown, optional = false): Row | null {
  if (!Array.isArray(result) || result.length > 1) throw new Error("Invalid car access database result.");
  if (optional && result.length === 0) return null;
  const row: unknown = result[0];
  if (!row || typeof row !== "object" || Array.isArray(row)) throw new Error("Invalid car access database result.");
  return row as Row;
}
function entitlement(row: Row) {
  const entitlementId = id(row.id);
  if (!entitlementId || row.product_code !== productCode || row.status !== "active") throw new Error("Invalid car access entitlement.");
  return { id: entitlementId, productCode, status: "active",
    checkoutSessionId: typeof row.stripe_checkout_session_id === "string" ? row.stripe_checkout_session_id : undefined,
    customerId: typeof row.stripe_customer_id === "string" ? row.stripe_customer_id : undefined };
}
function consume(row: Row, field: "activation_outcome" | "restore_outcome") {
  const outcome = row[field];
  if (typeof outcome !== "string" || !["consumed", "idempotent", "used", "released", "revoked", "review", "missing"].includes(outcome)) {
    throw new Error("Invalid car access consumption outcome.");
  }
  if (outcome === "consumed" || outcome === "idempotent") return { outcome, entitlement: entitlement(row) };
  if (row.id !== null) throw new Error("Denied car access result included an entitlement.");
  return { outcome };
}

export function createCarPurchaseAccessStore(query: CarPurchaseAccessQuery, now = Date.now): CarPurchaseAccessStore {
  const expiry = (value: Date) => value instanceof Date && Number.isFinite(value.getTime()) && value.getTime() > now();
  const sessionValid = (value: Parameters<CarPurchaseAccessStore["consumeCheckoutActivation"]>[0]["accessSession"]) =>
    hash(value.accessSessionHash) && /^[A-Za-z0-9_-]{8}$/.test(value.accessSessionRefLast8) && expiry(value.expiresAt);
  return {
    async consumeCheckoutActivation(input) {
      if (input.productCode !== productCode || !/^cs_(test|live)_[A-Za-z0-9]{1,240}$/.test(input.checkoutSessionId)
        || !/^cus_[A-Za-z0-9]{1,240}$/.test(input.customerId) || !hash(input.nonceHash) || !sessionValid(input.accessSession)) return { outcome: "missing" };
      const result = await query(
        "select * from public.consume_checkout_activation($1::text,$2::text,$3::text,$4::text,$5::text,$6::text,$7::timestamptz)",
        [input.checkoutSessionId, productCode, input.customerId, input.nonceHash, input.accessSession.accessSessionHash,
          input.accessSession.accessSessionRefLast8, input.accessSession.expiresAt.toISOString()]);
      const output = consume(one(result)!, "activation_outcome");
      if (output.entitlement && (output.entitlement.checkoutSessionId !== input.checkoutSessionId || output.entitlement.customerId !== input.customerId)) {
        throw new Error("Car access activation identity mismatch.");
      }
      return output;
    },
    async consumeRestoreTokenHash(input) {
      if (input.productCode !== productCode || !hash(input.tokenHash) || !hash(input.nonceHash) || !sessionValid(input.accessSession)) return { outcome: "missing" };
      const result = await query(
        "select * from public.consume_entitlement_restore_token($1::text,$2::text,$3::text,$4::text,$5::text,$6::timestamptz)",
        [input.tokenHash, productCode, input.nonceHash, input.accessSession.accessSessionHash,
          input.accessSession.accessSessionRefLast8, input.accessSession.expiresAt.toISOString()]);
      return consume(one(result)!, "restore_outcome");
    },
    async findActiveByAccessSession(input) {
      if (input.productCode !== productCode || !id(input.entitlementId) || !hash(input.accessSessionHash)) return null;
      const result = await query(
        "select * from public.find_active_purchase_entitlement_by_access_session($1::bigint,$2::text,$3::text)",
        [input.entitlementId, productCode, input.accessSessionHash]);
      const row = one(result, true);
      if (!row) return null;
      const found = entitlement(row);
      if (found.id !== input.entitlementId) throw new Error("Car access entitlement identity mismatch.");
      return found;
    },
    async releaseAccessSession(input) {
      if (input.productCode !== productCode || !id(input.entitlementId) || !hash(input.accessSessionHash)) return false;
      const result = await query(
        "select public.release_purchase_access_session($1::bigint,$2::text,$3::text) as released",
        [input.entitlementId, productCode, input.accessSessionHash]);
      const row = one(result)!;
      if (typeof row.released !== "boolean") throw new Error("Invalid car access release result.");
      return row.released;
    },
    async createRestoreTokenHash(input) {
      if (input.productCode !== productCode || !id(input.entitlementId) || !hash(input.tokenHash) || !expiry(input.expiresAt)) {
        throw new Error("Invalid car restore token input.");
      }
      const result = await query(
        "select public.create_entitlement_restore_token($1::bigint,$2::text,$3::text,$4::timestamptz) as created",
        [input.entitlementId, productCode, input.tokenHash, input.expiresAt.toISOString()]);
      if (one(result)!.created !== true) throw new Error("Car restore token was not created.");
    },
  };
}
