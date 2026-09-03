import "server-only";
import { isCarPurchaseApprovedOffer } from "./carPurchaseProCheckoutContract";
import type { CarPurchaseExceptionEvent, CarPurchaseExceptionStore } from "./carPurchaseProWebhookFulfillment";

export type CarPurchaseExceptionQuery = (statement: string, values: readonly (string | null)[]) => Promise<unknown>;
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const id = (value: unknown, prefix: string): value is string => typeof value === "string"
  && new RegExp("^" + prefix + "_[A-Za-z0-9]{1,240}$").test(value);
const checkoutStatuses = ["processing", "requires_payment_method", "requires_confirmation", "requires_action", "requires_capture", "canceled", "succeeded"];
const disputeStatuses = ["needs_response", "under_review", "lost", "won", "warning_needs_response", "warning_under_review", "warning_closed", "prevented"];
const disputeTypes = ["charge.dispute.created", "charge.dispute.updated", "charge.dispute.closed", "charge.dispute.funds_reinstated", "charge.dispute.funds_withdrawn"];

function validCommand(input: CarPurchaseExceptionEvent) {
  const { receipt: r, command: c } = input;
  if (r.eventType === "checkout.session.completed" || r.eventType === "checkout.session.async_payment_failed") {
    if (c.chargeId !== null || c.referenceId !== c.checkoutSessionId || !checkoutStatuses.includes(c.currentStatus)) return false;
    if (r.eventType === "checkout.session.completed") return c.action === "pending" && c.reason === "checkout_payment_pending";
    return (c.action === "revoke" && c.reason === "async_payment_failed" && ["requires_payment_method", "canceled"].includes(c.currentStatus))
      || (c.action === "review" && c.reason === "async_failure_requires_review");
  }
  if (!disputeTypes.includes(r.eventType) || !id(c.chargeId, "ch") || !id(c.referenceId, "dp") || !disputeStatuses.includes(c.currentStatus)) return false;
  if (c.reason === "charge_fully_refunded") return c.action === "revoke";
  if (c.currentStatus === "lost") return c.action === "revoke" && c.reason === "dispute_lost";
  if (["charge.dispute.created", "charge.dispute.funds_withdrawn"].includes(r.eventType)) return c.action === "revoke" && c.reason === "dispute_opened";
  return c.action === "review" && c.reason === "dispute_requires_review";
}

// Proposed v1 function contract, NOT an existing deployed SQL function.
// See docs/car-purchase-exception-database-contract.md. No connection/runtime is
// created here. Bind only after migration, hash/ACL and concurrency evidence pass.
export function createCarPurchaseExceptionStore(deps: {
  query: CarPurchaseExceptionQuery;
  approvedOffer: unknown;
  expectedMode: "test" | "live" | null;
  now?: () => number;
}): CarPurchaseExceptionStore {
  const configured = isCarPurchaseApprovedOffer(deps.approvedOffer) && deps.approvedOffer.priceCents <= 2147483647;
  const mode = deps.expectedMode, query = deps.query, now = deps.now ?? Date.now;
  return {
    async applyExceptionAndEnqueueAlert(input) {
      const { receipt: r, command: c } = input;
      const at = now();
      if (!configured || (mode !== "test" && mode !== "live") || typeof query !== "function" || !Number.isFinite(at)
        || !id(r.eventId, "evt") || r.livemode !== (mode === "live") || !(r.createdAt instanceof Date)
        || !Number.isFinite(r.createdAt.getTime()) || r.createdAt.getTime() <= 0 || r.createdAt.getTime() > at + 300000
        || c.productCode !== "car_purchase_pro" || !id(c.checkoutSessionId, "cs_" + mode) || !id(c.paymentIntentId, "pi")
        || !id(c.customerId, "cus") || !validCommand(input)) throw new Error("Invalid car exception persistence input.");
      const result = await query(
        "select * from public.apply_car_purchase_exception_event_v1($1::text,$2::text,$3::boolean,$4::timestamptz,$5::text,$6::text,$7::text,$8::text,$9::text,$10::text,$11::text,$12::text,$13::text)",
        [r.eventId, r.eventType, String(r.livemode), r.createdAt.toISOString(), c.productCode, c.checkoutSessionId,
          c.paymentIntentId, c.chargeId, c.customerId, c.action, c.reason, c.referenceId, c.currentStatus]);
      if (!Array.isArray(result) || result.length !== 1 || !record(result[0])) throw new Error("Invalid car exception database result.");
      const row = result[0], pending = c.action === "pending";
      const outcomes = pending ? ["processed", "duplicate"] : ["processed", "duplicate", "tombstoned"];
      if (typeof row.outcome !== "string" || !outcomes.includes(row.outcome)
        || row.event_id !== r.eventId || row.event_type !== r.eventType || row.livemode !== r.livemode
        || row.product_code !== c.productCode || row.checkout_session_id !== c.checkoutSessionId
        || row.payment_intent_id !== c.paymentIntentId || row.charge_id !== c.chargeId || row.customer_id !== c.customerId
        || row.reference_id !== c.referenceId
        || row.alert_kind !== (disputeTypes.includes(r.eventType) ? "dispute_event" : "fulfillment_attention")
        || row.alert_durable !== true || row.sale_hold_durable !== true
        || !["OPEN", "RESERVED", "LOCKED"].includes(String(row.gate_state))
        || typeof row.restriction_durable !== "boolean"
        || (row.entitlement_status !== null && !["active", "revoked", "review"].includes(String(row.entitlement_status)))
        || (typeof row.entitlement_status !== "string" && row.entitlement_status !== null)
        || (row.restriction_durable === true && row.entitlement_status === "active")
        || (["revoked", "review"].includes(String(row.entitlement_status)) && row.restriction_durable !== true)
        || (!pending && (row.restriction_durable !== true || row.entitlement_status === "active"))
        || (!pending && c.action === "revoke" && row.entitlement_status === "review")
        || (row.outcome === "tombstoned" && row.entitlement_status !== null)
        || (!pending && row.outcome === "processed" && row.entitlement_status === null)) {
        throw new Error("Invalid car exception persistence evidence.");
      }
      return { outcome: row.outcome, alertDurable: true };
    },
  };
}
