import "server-only";

import { createHash, randomBytes } from "node:crypto";

import type { EntitlementCommand, StripeEventReceipt } from "@/lib/entitlements";

export const FIRST_SALE_PRODUCT_CODE = "resume_pro" as const;
export const RENTAL_FIRST_SALE_PRODUCT_CODE = "rental_application_pro" as const;
export const PAY_EVIDENCE_FIRST_SALE_PRODUCT_CODE = "pay_evidence_pro" as const;
export const EOFY_FIRST_SALE_PRODUCT_CODE = "eofy_pro" as const;
export const LEAVING_AUSTRALIA_FIRST_SALE_PRODUCT_CODE = "leaving_australia_pro" as const;
export type FirstSaleProductCode =
  | typeof FIRST_SALE_PRODUCT_CODE
  | typeof RENTAL_FIRST_SALE_PRODUCT_CODE
  | typeof PAY_EVIDENCE_FIRST_SALE_PRODUCT_CODE
  | typeof EOFY_FIRST_SALE_PRODUCT_CODE
  | typeof LEAVING_AUSTRALIA_FIRST_SALE_PRODUCT_CODE;
export const STRIPE_CHECKOUT_MINIMUM_TTL_SECONDS = 30 * 60;
export const FIRST_SALE_CLOCK_SKEW_BUFFER_SECONDS = 60;
export const FIRST_SALE_RESERVATION_TTL_SECONDS =
  STRIPE_CHECKOUT_MINIMUM_TTL_SECONDS + FIRST_SALE_CLOCK_SKEW_BUFFER_SECONDS;

export type FirstSaleClaim = {
  outcome: "claimed";
  generation: number;
  claimTokenHash: string;
  idempotencyKey: string;
  expiresAt: Date;
};

export type FirstSaleBlocked = {
  outcome: "reserved" | "locked" | "manual_review";
};

export type FirstSaleNeedsExpiryVerification = {
  outcome: "verify_expiry";
  generation: number;
  checkoutSessionId: string;
};

export type FirstSaleClaimResult =
  | FirstSaleClaim
  | FirstSaleBlocked
  | FirstSaleNeedsExpiryVerification;

export interface FirstSaleGateStore {
  claimReservation(input: {
    productCode: FirstSaleProductCode;
    claimTokenHash: string;
    expiresAt: Date;
    environment: "live" | "test";
    currency: "aud";
    amountCents: number;
  }): Promise<FirstSaleClaimResult>;

  attachCheckoutSession(input: {
    productCode: FirstSaleProductCode;
    generation: number;
    claimTokenHash: string;
    checkoutSessionId: string;
    expiresAt: Date;
  }): Promise<boolean>;

  releaseFailedReservation(input: {
    productCode: FirstSaleProductCode;
    generation: number;
    claimTokenHash: string;
    reason: "stripe_rejected_before_session";
  }): Promise<boolean>;

  releaseVerifiedAbandoned(input: {
    productCode: FirstSaleProductCode;
    generation: number;
    checkoutSessionId: string;
  }): Promise<boolean>;

  applyPaidEventAndEntitlement(input: {
    receipt: StripeEventReceipt;
    command: EntitlementCommand & {
      action: "grant";
      productCode: FirstSaleProductCode;
      checkoutSessionId: string;
      paymentIntentId: string;
      chargeId: string;
      customerId: string;
      currency: "aud";
      amountTotal: 1990 | 1490 | 1290 | 990;
    };
  }): Promise<{ outcome: "processed" | "duplicate" | "ignored_stale" }>;
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function createFirstSaleReservation(
  productCode: FirstSaleProductCode = FIRST_SALE_PRODUCT_CODE,
  now = new Date(),
) {
  const claimTokenHash = sha256(randomBytes(32).toString("hex"));
  const expiresAt = new Date(now.getTime() + FIRST_SALE_RESERVATION_TTL_SECONDS * 1000);

  return {
    claimTokenHash,
    expiresAt,
    // Stripe retries the same logical create call with this key. Only the hash,
    // never the raw random material, leaves this process.
    idempotencyKey: `${productCode}_first_sale_${claimTokenHash}`,
  };
}

export function canSafelyReleaseAfterStripeError(error: unknown) {
  if (typeof error !== "object" || error === null) return false;
  const stripeType = "type" in error ? (error as { type?: unknown }).type : undefined;

  // These are definitive request rejection/configuration failures. Connection,
  // API, rate-limit and unknown errors can have an indeterminate remote result,
  // so their reservation must remain until an operator or verified expiry clears it.
  return stripeType === "StripeAuthenticationError"
    || stripeType === "StripeInvalidRequestError"
    || stripeType === "StripePermissionError";
}

export function isVerifiedAbandonedCheckout(input: {
  status: string | null;
  paymentStatus: string;
  paymentIntentId: string | null;
}) {
  return input.status === "expired"
    && input.paymentStatus === "unpaid"
    && input.paymentIntentId === null;
}
