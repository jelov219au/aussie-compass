// Preparation only: callers must retrieve the session server-side with Stripe.
// This module neither creates a Checkout Session nor grants an entitlement.
export const carPurchaseProProductCode = "car_purchase_pro" as const;
export const carPurchaseProRelease = {
  productCode: carPurchaseProProductCode,
  currency: "aud",
  billing: "one_time",
  priceCents: null,
  termsVersion: null,
  salesEnabled: false,
} as const;

export type CarPurchaseApprovedOffer = {
  productCode: typeof carPurchaseProProductCode;
  currency: "aud";
  billing: "one_time";
  priceCents: number;
  stripePriceId: string;
  stripeProductId: string;
  termsVersion: string;
};
type RecordValue = Record<string, unknown>;
const record = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value);
const identifier = (value: unknown, prefix: string) =>
  typeof value === "string" && value.length <= 255 && new RegExp("^" + prefix + "_[A-Za-z0-9]+$").test(value);

export function isCarPurchaseApprovedOffer(value: unknown): value is CarPurchaseApprovedOffer {
  if (!record(value)) return false;
  const terms = value.termsVersion;
  return value.productCode === carPurchaseProProductCode && value.currency === "aud" && value.billing === "one_time"
    && typeof value.priceCents === "number" && Number.isSafeInteger(value.priceCents) && value.priceCents > 0
    && identifier(value.stripePriceId, "price") && identifier(value.stripeProductId, "prod")
    && typeof terms === "string" && /^\d{4}-\d{2}-\d{2}$/.test(terms)
    && Number.isFinite(Date.parse(terms)) && new Date(terms).toISOString().slice(0, 10) === terms;
}

export type CarPurchaseCheckoutFailure =
  | "offer_unconfigured" | "environment_unverified" | "session_incomplete"
  | "product_mismatch" | "amount_mismatch" | "line_item_mismatch";
export function verifyCarPurchaseCheckout(
  session: unknown,
  approvedOffer: unknown,
  expectedMode: "test" | "live" | null,
): { ok: true; checkoutSessionId: string } | { ok: false; reason: CarPurchaseCheckoutFailure } {
  return verifyCheckout(session, approvedOffer, expectedMode, true);
}

// Identity/offer inspection for exception handling only. This does NOT prove payment.
// Keep the paid-only public verifier above as the sole grant/activation contract.
export function inspectCarPurchaseCheckoutForException(
  session: unknown,
  approvedOffer: unknown,
  expectedMode: "test" | "live" | null,
): { ok: true; checkoutSessionId: string } | { ok: false; reason: CarPurchaseCheckoutFailure } {
  return verifyCheckout(session, approvedOffer, expectedMode, false);
}

function verifyCheckout(
  session: unknown, approvedOffer: unknown, expectedMode: "test" | "live" | null, requirePaid: boolean,
): { ok: true; checkoutSessionId: string } | { ok: false; reason: CarPurchaseCheckoutFailure } {
  if (!isCarPurchaseApprovedOffer(approvedOffer)) return { ok: false, reason: "offer_unconfigured" };
  if (expectedMode !== "test" && expectedMode !== "live") return { ok: false, reason: "environment_unverified" };
  if (!record(session) || !(requirePaid ? session.payment_status === "paid"
    : session.payment_status === "paid" || session.payment_status === "unpaid") || session.status !== "complete" ||
    session.mode !== "payment" || typeof session.id !== "string" ||
    !new RegExp("^cs_" + expectedMode + "_[A-Za-z0-9]+$").test(session.id) ||
    session.livemode !== (expectedMode === "live")) return { ok: false, reason: "session_incomplete" };
  const metadata = session.metadata;
  if (!record(metadata) || metadata.product_code !== carPurchaseProProductCode ||
    metadata.billing_model !== "one_time" || metadata.purchase_terms_version !== approvedOffer.termsVersion) {
    return { ok: false, reason: "product_mismatch" };
  }
  const totals = session.total_details;
  if (session.currency !== approvedOffer.currency || session.amount_total !== approvedOffer.priceCents ||
    session.amount_subtotal !== approvedOffer.priceCents || !record(totals) ||
    totals.amount_discount !== 0 || totals.amount_tax !== 0 || totals.amount_shipping !== 0) {
    return { ok: false, reason: "amount_mismatch" };
  }
  const items = session.line_items;
  if (!record(items) || items.has_more !== false || !Array.isArray(items.data) || items.data.length !== 1) {
    return { ok: false, reason: "line_item_mismatch" };
  }
  const item: unknown = items.data[0];
  if (!record(item)) return { ok: false, reason: "line_item_mismatch" };
  const price = item.price;
  if (!record(price) || price.id !== approvedOffer.stripePriceId ||
    price.product !== approvedOffer.stripeProductId || price.type !== "one_time" ||
    price.currency !== approvedOffer.currency || price.unit_amount !== approvedOffer.priceCents ||
    item.quantity !== 1 || item.currency !== approvedOffer.currency ||
    item.amount_subtotal !== approvedOffer.priceCents || item.amount_total !== approvedOffer.priceCents) {
    return { ok: false, reason: "line_item_mismatch" };
  }
  return { ok: true, checkoutSessionId: session.id };
}
