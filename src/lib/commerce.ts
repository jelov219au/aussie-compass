import "server-only";

import { getEntitlementDatabaseUrl } from "@/lib/entitlementConfig";
import { isFirstSaleMonitoredModeConfigured } from "@/lib/firstSaleMonitoredMode";
import { isEntitlementSessionConfigured } from "@/lib/resumeProAccess";
import { paymentAlertsConfigured } from "@/lib/paymentAlerts";
import { hasResumeProStripeProductConfig, resumeProStripeProductDefinition } from "@/lib/resumeProStripeProduct";
import { siteName } from "@/lib/site";
import { getStripeSecretMode } from "@/lib/stripe";

export const resumeProProduct = {
  id: "resume-pro",
  name: "Resume Pro",
  currency: resumeProStripeProductDefinition.currency,
  priceCents: resumeProStripeProductDefinition.priceCents,
  billing: "one_time",
} as const;

export const rentalApplicationProProduct = {
  id: "rental-application-pro",
  name: "Rental Application Pack Pro",
  currency: "aud",
  priceCents: 1490,
  billing: "one_time",
} as const;

export const payEvidenceProProduct = {
  id: "pay-evidence-pro",
  name: "Pay Evidence Pack Pro",
  currency: "aud",
  priceCents: 990,
  billing: "one_time",
} as const;

export const eofyProProduct = {
  id: "eofy-pro",
  name: "EOFY Pack Pro",
  currency: "aud",
  priceCents: 990,
  billing: "one_time",
} as const;

export const leavingAustraliaProProduct = {
  id: "leaving-australia-pro",
  name: "Leaving Australia Pack Pro",
  currency: "aud",
  priceCents: 1290,
  billing: "one_time",
} as const;

export const resumeProPurchaseTermsVersion = "2026-08-19";
export const rentalApplicationProPurchaseTermsVersion = "2026-08-22";
export const payEvidenceProPurchaseTermsVersion = "2026-08-30";
export const eofyProPurchaseTermsVersion = "2026-08-30";
export const leavingAustraliaProPurchaseTermsVersion = "2026-08-30";

export type PaymentReadiness = {
  enabled: boolean;
  stripeConfigured: boolean;
  stripeProductContractConfigured: boolean;
  managedPaymentsConfigured: boolean;
  webhookConfigured: boolean;
  entitlementStoreConfigured: boolean;
  firstSaleGateConfigured: boolean;
  accessDeliveryImplemented: boolean;
  sellerDetailsConfigured: boolean;
  supportConfigured: boolean;
  operatorAlertsConfigured: boolean;
  firstSaleMonitoredModeConfigured: boolean;
  operatorMonitoringConfigured: boolean;
  ready: boolean;
};

export type ProductPaymentReadiness = PaymentReadiness & {
  productEnabled: boolean;
  productPriceConfigured: boolean;
};

let hasLoggedIncompleteProductionReadiness = false;

export function getPaymentReadiness(): PaymentReadiness {
  const enabled = process.env.PAYMENTS_ENABLED === "true";
  const stripeMode = getStripeSecretMode();
  const expectedStripeMode = process.env.VERCEL_ENV === "production" ? "live" : "test";
  const stripeProductContractConfigured = hasResumeProStripeProductConfig();
  const stripeConfigured = stripeMode === expectedStripeMode && stripeProductContractConfigured;
  const managedPaymentsConfigured = process.env.STRIPE_MANAGED_PAYMENTS_ENABLED === "true";
  const webhookConfigured = Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim().startsWith("whsec_"));
  const entitlementStoreConfigured = process.env.PAYMENTS_ENTITLEMENT_STORE === "neon"
    && Boolean(getEntitlementDatabaseUrl()?.match(/^postgres(?:ql)?:\/\//));
  const firstSaleGateConfigured = process.env.FIRST_SALE_GATE_ENABLED === "true"
    && entitlementStoreConfigured;
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
  const operatorAlertsConfigured = paymentAlertsConfigured();
  const firstSaleMonitoredModeConfigured = isFirstSaleMonitoredModeConfigured();
  const operatorMonitoringConfigured = operatorAlertsConfigured || firstSaleMonitoredModeConfigured;
  const ready = enabled && stripeConfigured && managedPaymentsConfigured && webhookConfigured && entitlementStoreConfigured && firstSaleGateConfigured && accessDeliveryImplemented && sellerDetailsConfigured && supportConfigured && operatorMonitoringConfigured;

  if (
    enabled
    && process.env.VERCEL_ENV === "production"
    && !ready
    && !hasLoggedIncompleteProductionReadiness
  ) {
    hasLoggedIncompleteProductionReadiness = true;
    console.warn("[payments] Production readiness is incomplete.", {
      stripeMode,
      expectedStripeMode,
      stripeProductContractConfigured,
      stripeConfigured,
      managedPaymentsConfigured,
      webhookConfigured,
      entitlementStoreConfigured,
      firstSaleGateConfigured,
      accessDeliveryImplemented,
      sellerDetailsConfigured,
      supportConfigured,
      operatorAlertsConfigured,
      firstSaleMonitoredModeConfigured,
      operatorMonitoringConfigured,
    });
  }

  return { enabled, stripeConfigured, stripeProductContractConfigured, managedPaymentsConfigured, webhookConfigured, entitlementStoreConfigured, firstSaleGateConfigured, accessDeliveryImplemented, sellerDetailsConfigured, supportConfigured, operatorAlertsConfigured, firstSaleMonitoredModeConfigured, operatorMonitoringConfigured, ready };
}

export function canCreateTestCheckout() {
  const readiness = getPaymentReadiness();
  return process.env.VERCEL_ENV !== "production"
    && readiness.enabled
    && readiness.stripeConfigured
    && readiness.managedPaymentsConfigured
    && readiness.firstSaleGateConfigured;
}

export function getRentalApplicationPaymentReadiness(): ProductPaymentReadiness {
  const base = getPaymentReadiness();
  const productEnabled = process.env.RENTAL_APPLICATION_PRO_PAYMENTS_ENABLED === "true";
  const productPriceConfigured = Boolean(process.env.STRIPE_RENTAL_APPLICATION_PRO_PRICE_ID?.trim().startsWith("price_"));
  const stripeConfigured = base.stripeConfigured && productPriceConfigured;
  // Production still requires every shared payment safeguard plus the
  // product-specific switch and Price. Preview keeps its separate relaxed
  // test-only helper below.
  const ready = base.ready
    && productEnabled
    && productPriceConfigured;

  return {
    ...base,
    enabled: base.enabled && productEnabled,
    stripeConfigured,
    productEnabled,
    productPriceConfigured,
    ready,
  };
}

export function canCreateRentalApplicationTestCheckout() {
  const readiness = getRentalApplicationPaymentReadiness();
  return process.env.VERCEL_ENV !== "production"
    && readiness.enabled
    && readiness.stripeConfigured
    && readiness.managedPaymentsConfigured;
}

export function getPayEvidencePaymentReadiness(): ProductPaymentReadiness {
  const base = getPaymentReadiness();
  const productEnabled = process.env.PAY_EVIDENCE_PRO_PAYMENTS_ENABLED === "true";
  const productPriceConfigured = Boolean(process.env.STRIPE_PAY_EVIDENCE_PRO_PRICE_ID?.trim().startsWith("price_"));
  const stripeConfigured = base.stripeConfigured && productPriceConfigured;
  const ready = base.ready
    && productEnabled
    && productPriceConfigured;

  return {
    ...base,
    enabled: base.enabled && productEnabled,
    stripeConfigured,
    productEnabled,
    productPriceConfigured,
    ready,
  };
}

export function canCreatePayEvidenceTestCheckout() {
  const readiness = getPayEvidencePaymentReadiness();
  return process.env.VERCEL_ENV !== "production"
    && readiness.enabled
    && readiness.stripeConfigured
    && readiness.managedPaymentsConfigured;
}

export function getEofyPaymentReadiness(): ProductPaymentReadiness {
  const base = getPaymentReadiness();
  const productEnabled = process.env.EOFY_PRO_PAYMENTS_ENABLED === "true";
  const productPriceConfigured = Boolean(process.env.STRIPE_EOFY_PRO_PRICE_ID?.trim().startsWith("price_"));
  const stripeConfigured = base.stripeConfigured && productPriceConfigured;
  const ready = base.ready
    && productEnabled
    && productPriceConfigured;

  return {
    ...base,
    enabled: base.enabled && productEnabled,
    stripeConfigured,
    productEnabled,
    productPriceConfigured,
    ready,
  };
}

export function canCreateEofyTestCheckout() {
  const readiness = getEofyPaymentReadiness();
  return process.env.VERCEL_ENV !== "production"
    && readiness.enabled
    && readiness.stripeConfigured
    && readiness.managedPaymentsConfigured;
}

export function getLeavingAustraliaPaymentReadiness(): ProductPaymentReadiness {
  const base = getPaymentReadiness();
  const productEnabled = process.env.LEAVING_AUSTRALIA_PRO_PAYMENTS_ENABLED === "true";
  const productPriceConfigured = Boolean(process.env.STRIPE_LEAVING_AUSTRALIA_PRO_PRICE_ID?.trim().startsWith("price_"));
  const stripeConfigured = base.stripeConfigured && productPriceConfigured;
  const ready = base.ready
    && productEnabled
    && productPriceConfigured;

  return {
    ...base,
    enabled: base.enabled && productEnabled,
    stripeConfigured,
    productEnabled,
    productPriceConfigured,
    ready,
  };
}

export function canCreateLeavingAustraliaTestCheckout() {
  const readiness = getLeavingAustraliaPaymentReadiness();
  return process.env.VERCEL_ENV !== "production"
    && readiness.enabled
    && readiness.stripeConfigured
    && readiness.managedPaymentsConfigured;
}

export function isResumeProLive() {
  return process.env.VERCEL_ENV === "production" && getPaymentReadiness().ready;
}
