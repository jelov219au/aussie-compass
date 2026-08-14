export const resumeProProduct = {
  id: "resume-pro",
  name: "Resume Pro",
  currency: "aud",
  priceCents: 1990,
  billing: "one_time",
} as const;

export type PaymentReadiness = {
  enabled: boolean;
  stripeConfigured: boolean;
  webhookConfigured: boolean;
  entitlementStoreConfigured: boolean;
  sellerDetailsConfigured: boolean;
  supportConfigured: boolean;
  ready: boolean;
};

export function getPaymentReadiness(): PaymentReadiness {
  const enabled = process.env.PAYMENTS_ENABLED === "true";
  const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_RESUME_PRO_PRICE_ID);
  const webhookConfigured = Boolean(process.env.STRIPE_WEBHOOK_SECRET);
  const entitlementStoreConfigured = Boolean(process.env.PAYMENTS_ENTITLEMENT_STORE);
  const sellerDetailsConfigured = Boolean(process.env.BUSINESS_LEGAL_NAME && process.env.BUSINESS_ABN);
  const supportConfigured = Boolean(process.env.NEXT_PUBLIC_SUPPORT_EMAIL);
  const ready = enabled && stripeConfigured && webhookConfigured && entitlementStoreConfigured && sellerDetailsConfigured && supportConfigured;

  return { enabled, stripeConfigured, webhookConfigured, entitlementStoreConfigured, sellerDetailsConfigured, supportConfigured, ready };
}
