import type Stripe from "stripe";

export const supportedProductCodes = [
  "resume_pro",
  "rental_application_pro",
] as const;

export type ProductCode = (typeof supportedProductCodes)[number];

export function isProductCode(value: string | null | undefined): value is ProductCode {
  return supportedProductCodes.includes(value as ProductCode);
}

export type EntitlementAction = "grant" | "revoke" | "review";

export type EntitlementCommand = {
  action: EntitlementAction;
  eventId: string;
  eventType: Stripe.Event.Type;
  productCode?: ProductCode;
  checkoutSessionId?: string;
  paymentIntentId?: string;
  chargeId?: string;
  customerId?: string;
  referenceId: string;
  reason: string;
};

export type StripeEventReceipt = {
  eventId: string;
  eventType: Stripe.Event.Type;
  livemode: boolean;
  createdAt: Date;
};

export type EntitlementRecord = {
  id: string;
  productCode: ProductCode;
  status: "active" | "revoked" | "review";
  checkoutSessionId?: string;
  paymentIntentId?: string;
  chargeId?: string;
  customerId?: string;
  grantedAt?: Date;
  revokedAt?: Date;
};

export interface EntitlementStore {
  applyStripeEvent(input: {
    receipt: StripeEventReceipt;
    command: EntitlementCommand;
  }): Promise<{
    outcome: "processed" | "duplicate" | "ignored_stale" | "ignored_unmatched";
    entitlement?: EntitlementRecord;
  }>;

  consumeRestoreTokenHash(tokenHash: string, productCode: ProductCode): Promise<EntitlementRecord | null>;

  findByCheckoutSession(checkoutSessionId: string, productCode: ProductCode): Promise<EntitlementRecord | null>;

  findActiveByCheckoutSession(checkoutSessionId: string, productCode: ProductCode): Promise<EntitlementRecord | null>;

  findActiveById(entitlementId: string, productCode: ProductCode): Promise<EntitlementRecord | null>;

  createRestoreTokenHash(input: {
    entitlementId: string;
    productCode: ProductCode;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void>;
}

function expandableId(value: string | { id: string } | null | undefined) {
  if (!value) return undefined;
  return typeof value === "string" ? value : value.id;
}

function checkoutCommand(event: Stripe.Event, session: Stripe.Checkout.Session): EntitlementCommand | null {
  const productCode = session.metadata?.product_code;
  if (!isProductCode(productCode)) return null;

  const paymentIntentId = expandableId(session.payment_intent);
  const customerId = expandableId(session.customer);
  const paid = session.payment_status === "paid";
  let action: EntitlementAction = "review";
  let reason = "checkout_requires_review";

  if (event.type === "checkout.session.async_payment_failed") {
    action = "revoke";
    reason = "async_payment_failed";
  } else if (paid) {
    action = "grant";
    reason = event.type === "checkout.session.async_payment_succeeded"
      ? "async_payment_succeeded"
      : "checkout_paid";
  }

  return {
    action,
    eventId: event.id,
    eventType: event.type,
    productCode,
    checkoutSessionId: session.id,
    paymentIntentId,
    customerId,
    referenceId: session.id,
    reason,
  };
}

function refundCommand(event: Stripe.Event, refund: Stripe.Refund): EntitlementCommand {
  return {
    action: "review",
    eventId: event.id,
    eventType: event.type,
    paymentIntentId: expandableId(refund.payment_intent),
    chargeId: expandableId(refund.charge),
    referenceId: refund.id,
    reason: refund.status === "succeeded" ? "refund_succeeded_requires_amount_check" : `refund_${refund.status ?? "unknown"}`,
  };
}

function chargeCommand(event: Stripe.Event, charge: Stripe.Charge): EntitlementCommand {
  const fullyRefunded = charge.refunded || charge.amount_refunded >= charge.amount;

  return {
    action: fullyRefunded ? "revoke" : "review",
    eventId: event.id,
    eventType: event.type,
    paymentIntentId: expandableId(charge.payment_intent),
    chargeId: charge.id,
    customerId: expandableId(charge.customer),
    referenceId: charge.id,
    reason: fullyRefunded ? "charge_fully_refunded" : "charge_partially_refunded",
  };
}

function disputeCommand(event: Stripe.Event, dispute: Stripe.Dispute): EntitlementCommand {
  let action: EntitlementAction = "review";
  let reason = `dispute_${dispute.status}`;

  if (event.type === "charge.dispute.created") {
    action = "revoke";
    reason = "dispute_opened";
  } else if (event.type === "charge.dispute.funds_reinstated" || dispute.status === "won") {
    // Funds can be reinstated while the underlying charge has separately been
    // refunded. The dispute payload alone cannot prove that paid access should
    // reopen, so keep access blocked until an operator verifies the charge.
    action = "review";
    reason = "dispute_won_or_funds_reinstated_requires_charge_check";
  } else if (event.type === "charge.dispute.closed" && dispute.status === "lost") {
    action = "revoke";
    reason = "dispute_lost";
  }

  return {
    action,
    eventId: event.id,
    eventType: event.type,
    paymentIntentId: expandableId(dispute.payment_intent),
    chargeId: expandableId(dispute.charge),
    referenceId: dispute.id,
    reason,
  };
}

export function getEntitlementCommand(event: Stripe.Event): EntitlementCommand | null {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
    case "checkout.session.async_payment_failed":
      return checkoutCommand(event, event.data.object as Stripe.Checkout.Session);
    case "refund.created":
    case "refund.updated":
    case "refund.failed":
      return refundCommand(event, event.data.object as Stripe.Refund);
    case "charge.refunded":
      return chargeCommand(event, event.data.object as Stripe.Charge);
    case "charge.dispute.created":
    case "charge.dispute.updated":
    case "charge.dispute.closed":
    case "charge.dispute.funds_reinstated":
      return disputeCommand(event, event.data.object as Stripe.Dispute);
    default:
      return null;
  }
}
