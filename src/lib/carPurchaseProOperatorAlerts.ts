import "server-only";
import type { CarPurchaseExceptionEvent, CarPurchaseReversalEvent } from "./carPurchaseProWebhookFulfillment";

type Input = CarPurchaseExceptionEvent | CarPurchaseReversalEvent;
type Kind = "fulfillment_attention" | "refund_event" | "dispute_event";
type Intent = {
  alertKind: Kind;
  eventType: string;
  eventRefLast8: string;
  productCode: "car_purchase_pro";
  checkoutRefLast8: string;
  paymentIntentRefLast8: string;
  chargeRefLast8?: string;
  attempts: number;
  claimToken: string;
};
export interface CarPurchaseAlertOutbox {
  claim(eventId: string, alertKind: Kind): Promise<unknown>;
  markSent(eventId: string, alertKind: Kind, claimToken: string): Promise<boolean>;
  release(eventId: string, alertKind: Kind, claimToken: string): Promise<boolean>;
}
export type CarPurchaseOperatorMessage = { subject: string; text: string; messageId: string };
export type CarPurchaseAlertSender = (message: Readonly<CarPurchaseOperatorMessage>) => Promise<unknown>;

const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const id = (value: unknown, prefix: string): value is string => typeof value === "string"
  && new RegExp("^" + prefix + "_[A-Za-z0-9]{1,240}$").test(value);
const suffix = (value: string) => value.slice(-8);
const checkoutEvents = ["checkout.session.completed", "checkout.session.async_payment_failed"];
const refundEvents = ["charge.refunded", "refund.created", "refund.updated", "refund.failed"];
const disputeEvents = ["charge.dispute.created", "charge.dispute.updated", "charge.dispute.closed",
  "charge.dispute.funds_reinstated", "charge.dispute.funds_withdrawn"];

function classify(input: Input): Kind | null {
  const { receipt: r, command: c } = input;
  if (!id(r.eventId, "evt") || typeof r.eventType !== "string" || typeof r.livemode !== "boolean"
    || !(r.createdAt instanceof Date) || !Number.isFinite(r.createdAt.getTime())
    || c.productCode !== "car_purchase_pro" || !id(c.checkoutSessionId, r.livemode ? "cs_live" : "cs_test")
    || !id(c.paymentIntentId, "pi") || !id(c.customerId, "cus")) return null;
  if ("referenceId" in c) {
    if (checkoutEvents.includes(r.eventType)) {
      if (c.chargeId !== null || c.referenceId !== c.checkoutSessionId
        || !["checkout_payment_pending", "async_payment_failed", "async_failure_requires_review"].includes(c.reason)
        || (c.reason === "checkout_payment_pending" && c.action !== "pending")
        || (c.reason === "async_payment_failed" && c.action !== "revoke")
        || (c.reason === "async_failure_requires_review" && c.action !== "review")
        || (r.eventType === "checkout.session.completed" && c.reason !== "checkout_payment_pending")
        || (r.eventType === "checkout.session.async_payment_failed" && c.reason === "checkout_payment_pending")) return null;
      return "fulfillment_attention";
    }
    if (disputeEvents.includes(r.eventType) && id(c.chargeId, "ch") && id(c.referenceId, "dp")
      && ((["dispute_opened", "dispute_lost", "charge_fully_refunded"].includes(c.reason) && c.action === "revoke")
        || (c.reason === "dispute_requires_review" && c.action === "review"))) {
      return "dispute_event";
    }
    return null;
  }
  return refundEvents.includes(r.eventType) && id(c.chargeId, "ch")
    && ((c.reason === "charge_fully_refunded" && c.action === "revoke")
      || (["charge_partially_refunded", "refund_status_requires_review"].includes(c.reason) && c.action === "review"))
    ? "refund_event" : null;
}

function intent(value: unknown, input: Input, kind: Kind): Intent | null {
  if (!record(value) || Object.keys(value).length !== 2 || !("outcome" in value) || !("intent" in value)
    || value.outcome !== "claimed" || !record(value.intent)) return null;
  const i = value.intent, c = input.command, chargeId = c.chargeId;
  const allowed = ["alertKind", "eventType", "eventRefLast8", "productCode", "checkoutRefLast8",
    "paymentIntentRefLast8", "attempts", "claimToken", ...(chargeId ? ["chargeRefLast8"] : [])];
  if (Object.keys(i).length !== allowed.length || Object.keys(i).some(key => !allowed.includes(key))
    || i.alertKind !== kind || i.eventType !== input.receipt.eventType || i.eventRefLast8 !== suffix(input.receipt.eventId)
    || i.productCode !== "car_purchase_pro" || i.checkoutRefLast8 !== suffix(c.checkoutSessionId)
    || i.paymentIntentRefLast8 !== suffix(c.paymentIntentId)
    || (chargeId ? i.chargeRefLast8 !== suffix(chargeId) : "chargeRefLast8" in i)
    || typeof i.attempts !== "number" || !Number.isSafeInteger(i.attempts) || i.attempts < 1 || i.attempts > 1000
    || typeof i.claimToken !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(i.claimToken)) return null;
  return i as Intent;
}

function message(input: Input, kind: Kind): CarPurchaseOperatorMessage {
  const { receipt: r, command: c } = input;
  const mode = r.livemode ? "live" : "test";
  const references = [`Event ref: ${suffix(r.eventId)}`, `Checkout ref: ${suffix(c.checkoutSessionId)}`,
    `Payment intent ref: ${suffix(c.paymentIntentId)}`, ...(c.chargeId ? [`Charge ref: ${suffix(c.chargeId)}`] : []), `Mode: ${mode}`];
  if (kind === "fulfillment_attention") {
    const pending = "referenceId" in c && c.reason === "checkout_payment_pending";
    return { subject: `[Hoju Compass] 중고차 결제 ${pending ? "대기" : "실패"} 확인 필요`,
      text: [pending ? "중고차 결제가 아직 완료되지 않았습니다." : "중고차 비동기 결제 실패 또는 불확실 상태입니다.", "",
        ...references, "", "Stripe Dashboard의 현재 결제 상태를 확인하세요.",
        "새 접근을 수동 부여하거나 판매 보류를 해제하지 마세요."].join("\n"),
      messageId: `<car-alert-${kind}-${suffix(r.eventId)}@hojucompass.com>` };
  }
  if (kind === "refund_event") return { subject: "[Hoju Compass] 중고차 환불 확인 필요",
    text: ["중고차 환불 이벤트가 제한 상태와 함께 저장되었습니다.", "", ...references, "",
      "Stripe Dashboard에서 환불 금액과 상태를 확인하세요.", "접근 또는 판매 보류를 자동 복원하지 마세요."].join("\n"),
    messageId: `<car-alert-${kind}-${suffix(r.eventId)}@hojucompass.com>` };
  return { subject: "[Hoju Compass] 중고차 결제 분쟁 확인 필요",
    text: ["중고차 결제 분쟁 이벤트가 제한 상태와 함께 저장되었습니다.", "", ...references, "",
      "Stripe Dashboard에서 상태, 답변 기한과 필요한 증빙을 확인하세요.",
      "승소 또는 자금 반환 이벤트만으로 접근이나 판매를 자동 복원하지 마세요."].join("\n"),
    messageId: `<car-alert-${kind}-${suffix(r.eventId)}@hojucompass.com>` };
}

// The sender receives only a bounded operator message, never the raw Stripe event,
// customer ID, metadata, secret or claim token. No transport is created here.
export async function deliverCarPurchaseOperatorAlert(input: Input, outbox: CarPurchaseAlertOutbox, sender: CarPurchaseAlertSender) {
  const kind = classify(input);
  if (!kind || !outbox || typeof outbox.claim !== "function" || typeof outbox.markSent !== "function"
    || typeof outbox.release !== "function" || typeof sender !== "function") throw new Error("Invalid car operator alert request.");
  const rawClaim = await outbox.claim(input.receipt.eventId, kind);
  if (record(rawClaim) && Object.keys(rawClaim).length === 1 && rawClaim.outcome === "sent") return { outcome: "already_sent" as const };
  if (record(rawClaim) && Object.keys(rawClaim).length === 1 && rawClaim.outcome === "busy") return { outcome: "busy" as const };
  if (record(rawClaim) && Object.keys(rawClaim).length === 1 && rawClaim.outcome === "missing") throw new Error("Car operator alert intent is missing.");
  const claimed = intent(rawClaim, input, kind);
  if (!claimed) throw new Error("Car operator alert intent does not match the verified purchase.");
  try {
    const output = await sender(Object.freeze(message(input, kind)));
    if (!record(output) || Object.keys(output).length !== 1 || output.outcome !== "sent") throw new Error("Car operator alert sender did not confirm delivery.");
    if (await outbox.markSent(input.receipt.eventId, kind, claimed.claimToken) !== true) {
      throw new Error("Car operator alert could not be marked sent.");
    }
    return { outcome: "sent" as const };
  } catch (error) {
    await outbox.release(input.receipt.eventId, kind, claimed.claimToken).catch(() => false);
    throw error;
  }
}
