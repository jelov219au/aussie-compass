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

export const resumeProPurchaseTermsVersion = "2026-08-19";

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

export function getPaymentReadiness(): PaymentReadiness {
  const enabled = process.env.PAYMENTS_ENABLED === "true";
  const stripeMode = getStripeSecretMode();
  const expectedStripeMode = process.env.VERCEL_ENV === "production" ? "live" : "test";
  const stripeConfigured = stripeMode === expectedStripeMode
    && Boolean(process.env.STRIPE_RESUME_PRO_PRICE_ID?.trim().startsWith("price_"));
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
    && !hasLoggedIncompleteProductionReadiness
  ) {
    hasLoggedIncompleteProductionReadiness = true;
    console.warn("[payments] Production readiness is incomplete.", {
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

export function canCreateTestCheckout() {
  const readiness = getPaymentReadiness();
  return process.env.VERCEL_ENV !== "production"
    && readiness.enabled
    && readiness.stripeConfigured
    && readiness.managedPaymentsConfigured;
}
