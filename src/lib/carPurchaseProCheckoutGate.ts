import "server-only";
import type { CarPurchaseCheckoutGate } from "./carPurchaseProCheckoutCreation";
import type { CarPurchaseAccessQuery } from "./carPurchaseProAccessStore";
import { isCarPurchaseApprovedOffer } from "./carPurchaseProCheckoutContract";

// No DB client is constructed. Inject a query port only after the car-specific
// migration, exact offer and runtime prerequisites are reviewed and verified.
const productCode = "car_purchase_pro";
const hash = (value: string) => /^[a-f0-9]{64}$/.test(value);
function generation(value: unknown): number | null {
  if (!["number", "string", "bigint"].includes(typeof value)) return null;
  const text = String(value);
  if (!/^(0|[1-9]\d{0,15})$/.test(text)) return null;
  const result = Number(text);
  return Number.isSafeInteger(result) ? result : null;
}
function one(result: unknown): Record<string, unknown> {
  if (!Array.isArray(result) || result.length !== 1 || !result[0]
    || typeof result[0] !== "object" || Array.isArray(result[0])) throw new Error("Invalid car checkout database result.");
  return result[0] as Record<string, unknown>;
}
function boolean(result: unknown, field: "attached" | "released") {
  const value = one(result)[field];
  if (typeof value !== "boolean") throw new Error("Invalid car checkout database confirmation.");
  return value;
}

export function createCarPurchaseCheckoutGate(deps: {
  query: CarPurchaseAccessQuery;
  approvedOffer: unknown;
  expectedMode: "test" | "live" | null;
  now?: () => number;
}): CarPurchaseCheckoutGate {
  // PostgreSQL's existing expected_amount_cents argument is an integer, not bigint.
  const offer = isCarPurchaseApprovedOffer(deps.approvedOffer) && deps.approvedOffer.priceCents <= 2147483647
    ? Object.freeze({ ...deps.approvedOffer }) : null;
  const mode = deps.expectedMode;
  const query = deps.query;
  const now = deps.now ?? Date.now;
  const configured = () => !!offer && (mode === "test" || mode === "live") && typeof query === "function";
  const checkoutId = (value: unknown): value is string => typeof value === "string"
    && new RegExp("^cs_" + mode + "_[A-Za-z0-9]{1,240}$").test(value);
  const expiry = (value: Date, minimumSeconds = 0) => {
    const at = now();
    return Number.isFinite(at) && at >= 0 && value instanceof Date && Number.isFinite(value.getTime())
      && value.getTime() > at && value.getTime() >= at + minimumSeconds * 1000
      && value.getTime() <= at + 35 * 60 * 1000;
  };
  const identity = (input: Parameters<CarPurchaseCheckoutGate["releaseFailedReservation"]>[0]
    | Parameters<CarPurchaseCheckoutGate["attachCheckoutSession"]>[0]) => configured()
    && input.productCode === productCode && typeof input.generation === "number"
    && Number.isSafeInteger(input.generation) && input.generation > 0 && hash(input.claimTokenHash);

  return {
    async claimReservation(input) {
      if (!configured() || input.productCode !== productCode || input.environment !== mode
        || input.currency !== offer!.currency || input.amountCents !== offer!.priceCents
        || !hash(input.claimTokenHash) || !expiry(input.expiresAt, 30 * 60)) throw new Error("Invalid car checkout reservation.");
      const row = one(await query(
        "select * from public.claim_first_sale_reservation($1::text,$2::text,$3::timestamptz,$4::text,$5::text,$6::integer)",
        [productCode, input.claimTokenHash, input.expiresAt.toISOString(), mode!, input.currency, String(input.amountCents)]));
      const nextGeneration = generation(row.generation);
      if (nextGeneration === null) throw new Error("Invalid car checkout generation.");
      if (row.outcome === "verify_expiry") {
        if (nextGeneration < 1 || !checkoutId(row.stripe_checkout_session_id)) throw new Error("Invalid car checkout expiry reference.");
        return { outcome: "verify_expiry", generation: nextGeneration, checkoutSessionId: row.stripe_checkout_session_id };
      }
      if (row.stripe_checkout_session_id !== null) throw new Error("Unexpected car checkout session reference.");
      if (row.outcome === "claimed" && nextGeneration > 0) return { outcome: "claimed", generation: nextGeneration };
      if (row.outcome === "reserved" || row.outcome === "locked" || row.outcome === "manual_review") return { outcome: row.outcome };
      throw new Error("Invalid car checkout reservation outcome.");
    },
    async attachCheckoutSession(input) {
      if (!identity(input) || !checkoutId(input.checkoutSessionId) || !expiry(input.expiresAt)) throw new Error("Invalid car checkout attachment.");
      return boolean(await query(
        "select public.attach_first_sale_checkout($1::text,$2::bigint,$3::text,$4::text,$5::timestamptz) as attached",
        [productCode, String(input.generation), input.claimTokenHash, input.checkoutSessionId, input.expiresAt.toISOString()]), "attached");
    },
    async releaseFailedReservation(input) {
      if (!identity(input) || input.reason !== "stripe_rejected_before_session") throw new Error("Invalid car checkout release.");
      return boolean(await query(
        "select public.release_failed_first_sale_reservation($1::text,$2::bigint,$3::text,$4::text) as released",
        [productCode, String(input.generation), input.claimTokenHash, input.reason]), "released");
    },
  };
}
