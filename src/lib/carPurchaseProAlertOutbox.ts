import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type { CarPurchaseAlertOutbox } from "./carPurchaseProOperatorAlerts";

type Kind = Parameters<CarPurchaseAlertOutbox["claim"]>[1];
export type CarPurchaseAlertQuery = (statement: string, values: readonly string[]) => Promise<unknown>;
const kinds = ["fulfillment_attention", "refund_event", "dispute_event"];
const events: Record<Kind, readonly string[]> = {
  fulfillment_attention: ["checkout.session.completed", "checkout.session.async_payment_failed"],
  refund_event: ["charge.refunded", "refund.created", "refund.updated", "refund.failed"],
  dispute_event: ["charge.dispute.created", "charge.dispute.updated", "charge.dispute.closed",
    "charge.dispute.funds_reinstated", "charge.dispute.funds_withdrawn"],
};
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const tokenValid = (value: unknown): value is string => typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value);
const suffixValid = (value: unknown): value is string => typeof value === "string" && /^[A-Za-z0-9_]{1,8}$/.test(value);
const hash = (token: string) => createHash("sha256").update(token).digest("hex");
const keys = ["claim_outcome", "event_id", "livemode", "alert_kind", "event_type", "event_ref_last8",
  "product_code", "checkout_ref_last8", "payment_intent_ref_last8", "charge_ref_last8", "attempts"];

// Proposed car-only v1 functions; not deployed or connected. The generic outbox
// functions do not provide exact product/mode evidence for sent/busy outcomes.
// See docs/car-purchase-alert-outbox-contract.md before binding a real query.
export function createCarPurchaseAlertOutbox(deps: {
  query: CarPurchaseAlertQuery;
  expectedMode: "test" | "live" | null;
  newClaimToken?: () => string;
}): CarPurchaseAlertOutbox {
  const { query, expectedMode: mode } = deps;
  const newToken = deps.newClaimToken ?? (() => randomBytes(32).toString("base64url"));
  function validate(eventId: string, kind: Kind) {
    if (typeof query !== "function" || (mode !== "test" && mode !== "live")
      || typeof eventId !== "string" || !/^evt_[A-Za-z0-9]{1,240}$/.test(eventId)
      || !kinds.includes(kind)) throw new Error("Invalid car alert outbox request.");
  }
  function bindings(eventId: string, kind: Kind, token: string) {
    validate(eventId, kind);
    if (!tokenValid(token)) throw new Error("Invalid car alert claim token.");
    return [eventId, kind, "car_purchase_pro", String(mode === "live"), hash(token)];
  }
  async function finish(operation: "marked" | "released", eventId: string, kind: Kind, token: string) {
    const values = bindings(eventId, kind, token);
    const statement = operation === "marked"
      ? "select public.mark_car_purchase_operator_alert_sent_v1($1::text,$2::text,$3::text,$4::boolean,$5::text) as marked"
      : "select public.release_car_purchase_operator_alert_claim_v1($1::text,$2::text,$3::text,$4::boolean,$5::text) as released";
    const rows = await query(statement, values);
    if (!Array.isArray(rows) || rows.length !== 1 || !record(rows[0]) || Object.keys(rows[0]).length !== 1
      || typeof rows[0][operation] !== "boolean") throw new Error("Invalid car alert completion result.");
    return rows[0][operation] as boolean;
  }
  return {
    async claim(eventId, kind) {
      validate(eventId, kind);
      const token = newToken();
      const rows = await query(
        "select * from public.claim_car_purchase_operator_alert_v1($1::text,$2::text,$3::text,$4::boolean,$5::text)",
        bindings(eventId, kind, token));
      if (!Array.isArray(rows) || rows.length !== 1 || !record(rows[0])) throw new Error("Invalid car alert claim result.");
      const row = rows[0];
      if (Object.keys(row).length !== keys.length || Object.keys(row).some(key => !keys.includes(key))
        || row.event_id !== eventId || row.alert_kind !== kind || row.product_code !== "car_purchase_pro"
        || row.livemode !== (mode === "live") || row.event_ref_last8 !== eventId.slice(-8)) {
        throw new Error("Car alert claim identity mismatch.");
      }
      if (row.claim_outcome === "missing") {
        if (row.event_type !== null || row.checkout_ref_last8 !== null || row.payment_intent_ref_last8 !== null
          || row.charge_ref_last8 !== null || row.attempts !== 0) throw new Error("Invalid missing car alert result.");
        return { outcome: "missing" as const };
      }
      if (typeof row.claim_outcome !== "string" || !["claimed", "sent", "busy"].includes(row.claim_outcome)
        || typeof row.event_type !== "string" || !events[kind].includes(row.event_type)
        || !suffixValid(row.checkout_ref_last8) || !suffixValid(row.payment_intent_ref_last8)
        || (kind === "fulfillment_attention" ? row.charge_ref_last8 !== null : !suffixValid(row.charge_ref_last8))
        || typeof row.attempts !== "number" || !Number.isSafeInteger(row.attempts) || row.attempts < 1 || row.attempts > 1000) {
        throw new Error("Invalid car alert intent result.");
      }
      if (row.claim_outcome === "sent" || row.claim_outcome === "busy") return { outcome: row.claim_outcome };
      return { outcome: "claimed", intent: { alertKind: kind, eventType: row.event_type,
        eventRefLast8: row.event_ref_last8, productCode: "car_purchase_pro",
        checkoutRefLast8: row.checkout_ref_last8, paymentIntentRefLast8: row.payment_intent_ref_last8,
        ...(row.charge_ref_last8 === null ? {} : { chargeRefLast8: row.charge_ref_last8 }),
        attempts: row.attempts, claimToken: token } };
    },
    markSent: (eventId, kind, token) => finish("marked", eventId, kind, token),
    release: (eventId, kind, token) => finish("released", eventId, kind, token),
  };
}
