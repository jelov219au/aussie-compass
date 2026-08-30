import type Stripe from "stripe";

export const paymentOperatorAlertKinds = [
  "payment_completed",
  "refund_event",
  "dispute_event",
  "fulfillment_attention",
] as const;

export type PaymentOperatorAlertKind = typeof paymentOperatorAlertKinds[number];

export type PaymentOperatorAlertIntent = {
  alertKind: PaymentOperatorAlertKind;
  eventType: string;
  eventRefLast8: string;
  productCode?: "resume_pro" | "rental_application_pro" | "pay_evidence_pro";
  checkoutRefLast8?: string;
  paymentIntentRefLast8?: string;
  chargeRefLast8?: string;
  attempts: number;
};

export type ClaimedPaymentOperatorAlert = PaymentOperatorAlertIntent & {
  claimToken: string;
};

export type PaymentOperatorAlertClaimResult =
  | { outcome: "claimed"; intent: ClaimedPaymentOperatorAlert }
  | { outcome: "sent" }
  | { outcome: "busy" }
  | { outcome: "missing" };

export interface PaymentOperatorAlertOutboxStore {
  enqueueFulfillmentAttention(input: {
    eventId: string;
    eventType: string;
    livemode: boolean;
    productCode: "resume_pro" | "rental_application_pro" | "pay_evidence_pro";
    checkoutSessionId: string;
    paymentIntentId: string;
  }): Promise<void>;
  claim(eventId: string, alertKind: PaymentOperatorAlertKind): Promise<PaymentOperatorAlertClaimResult>;
  markSent(eventId: string, alertKind: PaymentOperatorAlertKind, claimToken: string): Promise<boolean>;
  release(eventId: string, alertKind: PaymentOperatorAlertKind, claimToken: string): Promise<boolean>;
}

export type PaymentOperatorAlertSender = (
  event: Stripe.Event,
  alertKind: PaymentOperatorAlertKind,
) => Promise<{ outcome: "sent" }>;

function referenceSuffix(value: string) {
  return value.slice(-8);
}

export function getPaymentOperatorAlertKind(event: Stripe.Event): PaymentOperatorAlertKind | null {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      return "payment_completed";
    case "refund.created":
    case "refund.updated":
    case "refund.failed":
    case "charge.refunded":
      return "refund_event";
    case "charge.dispute.created":
    case "charge.dispute.updated":
    case "charge.dispute.closed":
    case "charge.dispute.funds_reinstated":
      return "dispute_event";
    default:
      return null;
  }
}

function intentMatchesEvent(
  intent: PaymentOperatorAlertIntent,
  event: Stripe.Event,
  alertKind: PaymentOperatorAlertKind,
) {
  return intent.alertKind === alertKind
    && intent.eventType === event.type
    && intent.eventRefLast8 === referenceSuffix(event.id)
    && intent.attempts > 0;
}

export async function deliverDurablePaymentOperatorAlert(
  event: Stripe.Event,
  alertKind: PaymentOperatorAlertKind,
  store: PaymentOperatorAlertOutboxStore,
  sender: PaymentOperatorAlertSender,
) {
  const claim = await store.claim(event.id, alertKind);
  if (claim.outcome === "sent") return { outcome: "already_sent" as const };
  if (claim.outcome === "busy") return { outcome: "busy" as const };
  if (claim.outcome === "missing") {
    throw new Error("The payment alert intent is missing.");
  }
  const { intent } = claim;

  try {
    if (!intentMatchesEvent(intent, event, alertKind)) {
      throw new Error("The payment alert intent does not match the signed Stripe event.");
    }

    await sender(event, alertKind);
    if (!await store.markSent(event.id, alertKind, intent.claimToken)) {
      throw new Error("The payment alert could not be marked sent.");
    }
    return { outcome: "sent" as const };
  } catch (error) {
    await store.release(event.id, alertKind, intent.claimToken).catch(() => false);
    throw error;
  }
}
