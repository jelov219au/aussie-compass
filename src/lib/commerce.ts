import "server-only";

import { getEntitlementDatabaseUrl } from "@/lib/entitlementConfig";
import { isEntitlementSessionConfigured } from "@/lib/resumeProAccess";
import { siteName } from "@/lib/site";
import { getStripeSecretMode } from "@/lib/stripe";

export const resumeProProduct = {
  id: "resume-pro",
  name: "Resume Pro",
  currency: "aud",
  priceCents: 1990,
  billing: "one_time",
} as const;

export const payEvidenceProduct = {
  id: "pay-evidence-pro",
  name: "Pay Evidence Pro",
  currency: "aud",
  priceCents: 990,
  billing: "one_time",
} as const;

export const carBuyProProduct = {
  id: "car-buy-pro",
  name: "Car Buy Pack Pro",
  currency: "aud",
  priceCents: 1490,
  billing: "one_time",
} as const;

export const eofyProProduct = {
  id: "eofy-pro",
  name: "EOFY Pack Pro",
  currency: "aud",
  priceCents: 990,
  billing: "one_time",
} as const;

export const resumeProPurchaseTermsVersion = "2026-08-19";
export const payEvidencePurchaseTermsVersion = "2026-08-21";
export const carBuyProPurchaseTermsVersion = "2026-08-21";
export const eofyProPurchaseTermsVersion = "2026-08-21";

export const rentalProProduct = {
  id: "rental-application-pro",
  name: "Rental Application Pack Pro",
  currency: "aud",
  priceCents: 1490,
  billing: "one_time",
} as const;

export const rentalProPurchaseTermsVersion = "2026-08-21";

export type PaymentReadiness = {
  enabled: boolean;
  stripeConfigured: boolean;
  managedPaymentsConfigured: boolean;
  webhookConfigured: boolean;
  entitlementStoreConfigured: boolean;
  accessDeliveryImplemented: boolean;
  sellerDetailsConfigured: boolean;
  supportConfigured: boolean;
  ready: boolean;
};

let hasLoggedIncompleteProductionReadiness = false;

function getPaymentReadinessForPrice(priceId: string | undefined, logIncompleteProductionReadiness: boolean): PaymentReadiness {
  const enabled = process.env.PAYMENTS_ENABLED === "true";
  const stripeMode = getStripeSecretMode();
  const expectedStripeMode = process.env.VERCEL_ENV === "production" ? "live" : "test";
  const stripePriceConfigured = Boolean(priceId?.trim().startsWith("price_"));
  const stripeConfigured = stripeMode === expectedStripeMode && stripePriceConfigured;
  const managedPaymentsConfigured = process.env.STRIPE_MANAGED_PAYMENTS_ENABLED === "true";
  const webhookConfigured = Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim().startsWith("whsec_"));
  const entitlementStoreConfigured = process.env.PAYMENTS_ENTITLEMENT_STORE === "neon"
    && Boolean(getEntitlementDatabaseUrl()?.match(/^postgres(?:ql)?:\/\//));
  const accessDeliveryImplemented = entitlementStoreConfigured && isEntitlementSessionConfigured();
  const tradingName = process.env.BUSINESS_TRADING_NAME?.trim() || siteName;
  const legalName = process.env.BUSINESS_LEGAL_NAME?.trim();
  const abnDigits = process.env.BUSINESS_ABN?.replace(/\D/g, "") ?? "";
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();
  const sellerDetailsConfigured = Boolean(
    tradingName
    && tradingName.length <= 120
    && legalName
    && legalName.length <= 120
    && /^\d{11}$/.test(abnDigits),
  );
  const supportConfigured = Boolean(supportEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail));
  const ready = enabled && stripeConfigured && managedPaymentsConfigured && webhookConfigured && entitlementStoreConfigured && accessDeliveryImplemented && sellerDetailsConfigured && supportConfigured;

  if (
    enabled
    && process.env.VERCEL_ENV === "production"
    && !ready
    && logIncompleteProductionReadiness
    && !hasLoggedIncompleteProductionReadiness
  ) {
    hasLoggedIncompleteProductionReadiness = true;
    console.warn("[payments] Production readiness is incomplete.", {
      stripeMode,
      expectedStripeMode,
      stripePriceConfigured,
      stripeConfigured,
      managedPaymentsConfigured,
      webhookConfigured,
      entitlementStoreConfigured,
      accessDeliveryImplemented,
      sellerDetailsConfigured,
      supportConfigured,
    });
  }

  return { enabled, stripeConfigured, managedPaymentsConfigured, webhookConfigured, entitlementStoreConfigured, accessDeliveryImplemented, sellerDetailsConfigured, supportConfigured, ready };
}

export function getPaymentReadiness(): PaymentReadiness {
  return getPaymentReadinessForPrice(process.env.STRIPE_RESUME_PRO_PRICE_ID, true);
}

export function getRentalPaymentReadiness(): PaymentReadiness {
  return getPaymentReadinessForPrice(process.env.STRIPE_RENTAL_PRO_PRICE_ID, false);
}

export function canCreateTestCheckout() {
  const readiness = getPaymentReadiness();
  return process.env.VERCEL_ENV !== "production"
    && readiness.enabled
    && readiness.stripeConfigured
    && readiness.managedPaymentsConfigured;
}

export function canCreateRentalTestCheckout() {
  const readiness = getRentalPaymentReadiness();
  return process.env.VERCEL_ENV !== "production"
    && readiness.enabled
    && readiness.stripeConfigured
    && readiness.managedPaymentsConfigured;
}

export function isResumeProLive() {
  return process.env.VERCEL_ENV === "production" && getPaymentReadiness().ready;
}

export function getPayEvidencePaymentReadiness(): PaymentReadiness {
  return getPaymentReadinessForPrice(process.env.STRIPE_PAY_EVIDENCE_PRO_PRICE_ID, false);
}

export function canCreatePayEvidenceTestCheckout() {
  const readiness = getPayEvidencePaymentReadiness();
  return process.env.VERCEL_ENV !== "production"
    && readiness.enabled
    && readiness.stripeConfigured
    && readiness.managedPaymentsConfigured;
}

export function getCarBuyProPaymentReadiness(): PaymentReadiness {
  return getPaymentReadinessForPrice(process.env.STRIPE_CAR_BUY_PRO_PRICE_ID, false);
}

export function canCreateCarBuyProTestCheckout() {
  const readiness = getCarBuyProPaymentReadiness();
  return process.env.VERCEL_ENV !== "production"
    && readiness.enabled
    && readiness.stripeConfigured
    && readiness.managedPaymentsConfigured;
}

export function getEofyProPaymentReadiness(): PaymentReadiness {
  return getPaymentReadinessForPrice(process.env.STRIPE_EOFY_PRO_PRICE_ID, false);
}

export function canCreateEofyProTestCheckout() {
  const readiness = getEofyProPaymentReadiness();
  return process.env.VERCEL_ENV !== "production"
    && readiness.enabled
    && readiness.stripeConfigured
    && readiness.managedPaymentsConfigured;
}

export function isRentalProLive() {
  return process.env.VERCEL_ENV === "production" && getRentalPaymentReadiness().ready;
}
