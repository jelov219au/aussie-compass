import "server-only";
import type { CarPurchaseAccessQuery } from "./carPurchaseProAccessStore";
import { isCarPurchaseApprovedOffer } from "./carPurchaseProCheckoutContract";
import type { CarPurchasePaidEvent, CarPurchaseReversalEvent, CarPurchaseWebhookStore } from "./carPurchaseProWebhookFulfillment";

const id = (value: unknown, prefix: string): value is string => typeof value === "string"
  && new RegExp("^" + prefix + "_[A-Za-z0-9]{1,240}$").test(value);
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
function one(result: unknown) {
  if (!Array.isArray(result) || result.length !== 1 || !record(result[0])) throw new Error("Invalid car webhook database result.");
  return result[0];
}
function validId(value: unknown) {
  if (typeof value !== "string" && typeof value !== "bigint" && typeof value !== "number") return false;
  if (typeof value === "number" && !Number.isSafeInteger(value)) return false;
  return /^[1-9]\d{0,18}$/.test(String(value)) && BigInt(value) <= BigInt("9223372036854775807");
}

// Fixed paid signature and proposed car-only atomic reversal signature.
// The new reversal function is NOT deployed. No client/connection is created.
// Wire only after the car schema, function bodies and runtime ACLs are verified.
export function createCarPurchaseWebhookStore(deps: {
  query: CarPurchaseAccessQuery;
  approvedOffer: unknown;
  expectedMode: "test" | "live" | null;
  now?: () => number;
}): CarPurchaseWebhookStore {
  const offer = isCarPurchaseApprovedOffer(deps.approvedOffer) && deps.approvedOffer.priceCents <= 2147483647
    ? Object.freeze({ ...deps.approvedOffer }) : null;
  const mode = deps.expectedMode, query = deps.query, now = deps.now ?? Date.now;
  function validate(input: CarPurchasePaidEvent | CarPurchaseReversalEvent) {
    const { receipt: r, command: c } = input;
    const at = now();
    if (!offer || (mode !== "test" && mode !== "live") || typeof query !== "function"
      || !Number.isFinite(at) || !id(r.eventId, "evt") || r.livemode !== (mode === "live")
      || !(r.createdAt instanceof Date) || !Number.isFinite(r.createdAt.getTime())
      || r.createdAt.getTime() <= 0 || r.createdAt.getTime() > at + 300000
      || c.productCode !== "car_purchase_pro" || !id(c.checkoutSessionId, "cs_" + mode)
      || !id(c.paymentIntentId, "pi") || !id(c.chargeId, "ch") || !id(c.customerId, "cus")) {
      throw new Error("Invalid car webhook persistence input.");
    }
  }
  return {
    async applyPaidEventAndEntitlement(input) {
      validate(input);
      const { receipt: r, command: c } = input;
      if (c.action !== "grant" || c.currency !== offer!.currency || c.amountTotal !== offer!.priceCents
        || !((r.eventType === "checkout.session.completed" && c.reason === "checkout_paid")
          || (r.eventType === "checkout.session.async_payment_succeeded" && c.reason === "async_payment_succeeded"))) {
        throw new Error("Invalid car paid-event contract.");
      }
      const row = one(await query(
        "select public.apply_first_sale_paid_event($1::text,$2::text,$3::boolean,$4::timestamptz,$5::text,$6::text,$7::integer,$8::text,$9::text,$10::text,$11::text,$12::text) as outcome",
        [r.eventId, r.eventType, String(r.livemode), r.createdAt.toISOString(), c.productCode, c.currency,
          String(c.amountTotal), c.checkoutSessionId, c.paymentIntentId, c.chargeId, c.customerId, c.reason]));
      if (typeof row.outcome !== "string" || !["processed", "duplicate", "ignored_stale"].includes(row.outcome)) throw new Error("Invalid car paid-event outcome.");
      return { outcome: row.outcome };
    },
    async applyReversal(input) {
      validate(input);
      const { receipt: r, command: c } = input;
      if (!["charge.refunded", "refund.created", "refund.updated", "refund.failed"].includes(r.eventType)
        || !((c.action === "revoke" && c.reason === "charge_fully_refunded")
          || (c.action === "review" && (c.reason === "charge_partially_refunded" || c.reason === "refund_status_requires_review")))
        || (r.eventType === "charge.refunded" && c.reason === "refund_status_requires_review")) {
        throw new Error("Invalid car reversal contract.");
      }
      const row = one(await query(
        "select * from public.apply_car_purchase_reversal_event_v1($1::text,$2::text,$3::boolean,$4::timestamptz,$5::text,$6::text,$7::text,$8::text,$9::text,$10::text,$11::text)",
        [r.eventId, r.eventType, String(r.livemode), r.createdAt.toISOString(), c.action, c.productCode,
          c.checkoutSessionId, c.paymentIntentId, c.chargeId, c.customerId, c.reason]));
      if (typeof row.outcome !== "string" || !["processed", "duplicate", "tombstoned"].includes(row.outcome)
        || row.event_id !== r.eventId || row.event_type !== r.eventType || row.livemode !== r.livemode
        || row.product_code !== c.productCode || row.stripe_checkout_session_id !== c.checkoutSessionId
        || row.stripe_payment_intent_id !== c.paymentIntentId || row.stripe_charge_id !== c.chargeId
        || row.stripe_customer_id !== c.customerId || row.alert_kind !== "refund_event"
        || row.alert_durable !== true || row.sale_hold_durable !== true || row.restriction_durable !== true
        || typeof row.gate_state !== "string" || !["OPEN", "RESERVED", "LOCKED"].includes(row.gate_state)) {
        throw new Error("Invalid car reversal persistence evidence.");
      }
      if (row.id === null) {
        if (!["tombstoned", "duplicate"].includes(row.outcome) || row.status !== null) throw new Error("Invalid car reversal empty result.");
      } else if (!validId(row.id) || row.outcome === "tombstoned"
        || typeof row.status !== "string" || !["revoked", "review"].includes(row.status)
        || (c.action === "revoke" && row.status !== "revoked")) {
        throw new Error("Invalid car reversal entitlement result.");
      }
      return { outcome: row.outcome, alertDurable: true, saleHoldDurable: true, restrictionDurable: true };
    },
  };
}
