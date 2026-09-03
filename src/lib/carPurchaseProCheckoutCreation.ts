import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type Stripe from "stripe";
import { isCarPurchaseApprovedOffer, type CarPurchaseApprovedOffer } from "./carPurchaseProCheckoutContract";
import { canSafelyReleaseAfterStripeError, FIRST_SALE_RESERVATION_TTL_SECONDS,
  STRIPE_CHECKOUT_MINIMUM_TTL_SECONDS } from "./firstSaleGate";

// Preparation only: no client, environment configuration or public route is wired here.
// Existing FirstSaleProductCode deliberately remains unchanged until DB/webhook support is verified.
const productCode = "car_purchase_pro" as const;
type Mode = "test" | "live";
type ClaimIdentity = { productCode: typeof productCode; generation: number; claimTokenHash: string };
export interface CarPurchaseCheckoutGate {
  claimReservation(input: {
    productCode: typeof productCode; claimTokenHash: string; expiresAt: Date;
    environment: Mode; currency: "aud"; amountCents: number;
  }): Promise<unknown>;
  attachCheckoutSession(input: ClaimIdentity & { checkoutSessionId: string; expiresAt: Date }): Promise<boolean>;
  releaseFailedReservation(input: ClaimIdentity & { reason: "stripe_rejected_before_session" }): Promise<boolean>;
}
export interface CarPurchaseCheckoutProvider {
  retrievePrice(id: string, options: { expand: ["product"] }): Promise<unknown>;
  createSession(params: Stripe.Checkout.SessionCreateParams, options: { idempotencyKey: string }): Promise<unknown>;
}
type FailureReason = "unavailable" | "invalid_terms" | "already_purchased" | "retry_later"
  | "sales_closed" | "support_required" | "provider_rejected";
type Result = { ok: true; checkoutUrl: string } | { ok: false; reason: FailureReason };
const failed = (reason: FailureReason): Result => ({ ok: false, reason });
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

function validPrice(raw: unknown, offer: CarPurchaseApprovedOffer, mode: Mode) {
  if (!record(raw) || !record(raw.product) || !record(raw.product.metadata)) return false;
  const product = raw.product;
  return raw.id === offer.stripePriceId && raw.active === true && raw.type === "one_time"
    && raw.currency === offer.currency && raw.unit_amount === offer.priceCents && raw.tax_behavior === "inclusive"
    && raw.livemode === (mode === "live") && product.id === offer.stripeProductId
    && product.deleted !== true && product.active === true && product.livemode === (mode === "live")
    && raw.product.metadata.product_code === productCode && raw.product.metadata.billing_model === offer.billing;
}
function checkoutSession(raw: unknown, offer: CarPurchaseApprovedOffer, mode: Mode, expiresAt: number) {
  if (!record(raw) || typeof raw.id !== "string" || !new RegExp("^cs_" + mode + "_[A-Za-z0-9]{1,240}$").test(raw.id)
    || raw.mode !== "payment" || raw.status !== "open" || raw.payment_status !== "unpaid" || raw.livemode !== (mode === "live")
    || raw.expires_at !== expiresAt || raw.currency !== offer.currency
    || raw.amount_total !== offer.priceCents || raw.amount_subtotal !== offer.priceCents
    || !record(raw.metadata) || raw.metadata.product_code !== productCode
    || raw.metadata.billing_model !== offer.billing || raw.metadata.purchase_terms_version !== offer.termsVersion
    || typeof raw.url !== "string" || raw.url.length > 8192) return null;
  try {
    const url = new URL(raw.url);
    // Custom Stripe domains require an explicit reviewed policy before they are supported.
    if (url.origin !== "https://checkout.stripe.com" || url.username || url.password
      || url.pathname !== "/c/pay/" + raw.id) return null;
    return { id: raw.id, url: raw.url };
  } catch { return null; }
}

export function createCarPurchaseCheckoutCreation(deps: {
  enabled: boolean;
  approvedOffer: unknown;
  expectedMode: Mode | null;
  stripeMode: Mode | "missing" | "invalid";
  deployment: "production" | "nonproduction";
  expectedOrigin: string;
  gate: CarPurchaseCheckoutGate | null;
  provider: CarPurchaseCheckoutProvider | null;
  // Trusted server check: exact offer, car DB/gate/webhook/access prerequisites and Managed Payments readiness.
  checkPrerequisites: (offer: CarPurchaseApprovedOffer) => Promise<boolean>;
  // A failed access lookup must return null/throw, never masquerade as an unentitled customer.
  hasActiveAccess: () => Promise<boolean | null>;
  now?: () => number;
}) {
  return async function create(acceptedTermsVersion: string): Promise<Result> {
    if (deps.enabled !== true || !isCarPurchaseApprovedOffer(deps.approvedOffer) || !deps.gate || !deps.provider
      || (deps.expectedMode !== "test" && deps.expectedMode !== "live") || deps.stripeMode !== deps.expectedMode
      || (deps.deployment !== "production" && deps.deployment !== "nonproduction")
      || (deps.deployment === "production") !== (deps.expectedMode === "live")) return failed("unavailable");
    // Snapshot reviewed values before awaiting dependencies; caller mutations cannot change the request price.
    const offer = Object.freeze({ ...deps.approvedOffer });
    if (acceptedTermsVersion !== offer.termsVersion) return failed("invalid_terms");
    const gate = deps.gate, provider = deps.provider, mode = deps.expectedMode;
    const now = deps.now ?? Date.now;
    let origin: string;
    try {
      const url = new URL(deps.expectedOrigin);
      if (url.origin !== deps.expectedOrigin || url.protocol !== "https:") return failed("unavailable");
      origin = url.origin;
      if (await deps.checkPrerequisites(offer) !== true) return failed("unavailable");
      const active = await deps.hasActiveAccess();
      if (active === true) return failed("already_purchased");
      if (active !== false) return failed("unavailable");
      if (!validPrice(await provider.retrievePrice(offer.stripePriceId, { expand: ["product"] }), offer, mode)) return failed("unavailable");
    } catch { return failed("unavailable"); }

    try {
      const at = now();
      if (!Number.isFinite(at) || at < 0) return failed("unavailable");
      const expiresAt = Math.floor(at / 1000) + FIRST_SALE_RESERVATION_TTL_SECONDS;
      const claimTokenHash = createHash("sha256").update(randomBytes(32)).digest("hex");
      const suffix = Array.from(randomBytes(8), byte => String.fromCharCode(97 + byte % 26)).join("");
      const params: Stripe.Checkout.SessionCreateParams = {
        mode: "payment", integration_identifier: `hoju_compass_car_purchase_pro_${suffix}`,
        line_items: [{ price: offer.stripePriceId, quantity: 1 }],
        customer_creation: "always", managed_payments: { enabled: true },
        metadata: { product_code: productCode, billing_model: offer.billing,
          entitlement_version: "1", purchase_terms_version: offer.termsVersion },
        expires_at: expiresAt,
        success_url: `${origin}/car-purchase-pro/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/car-purchase-pro?checkout=cancelled`,
      };
      const claim = await gate.claimReservation({ productCode, claimTokenHash, expiresAt: new Date(expiresAt * 1000),
        environment: mode, currency: offer.currency, amountCents: offer.priceCents });
      if (!record(claim)) return failed("support_required");
      if (claim.outcome === "reserved") return failed("retry_later");
      if (claim.outcome === "locked") return failed("sales_closed");
      // verify_expiry/manual_review need a separate exact-session reconciliation path, never an automatic release.
      if (claim.outcome !== "claimed" || typeof claim.generation !== "number"
        || !Number.isSafeInteger(claim.generation) || claim.generation < 1) return failed("support_required");
      const identity = { productCode, generation: claim.generation, claimTokenHash };
      const beforeCreate = now();
      if (!Number.isFinite(beforeCreate) || beforeCreate < at
        || expiresAt - Math.floor(beforeCreate / 1000) < STRIPE_CHECKOUT_MINIMUM_TTL_SECONDS) return failed("support_required");
      let raw: unknown;
      try {
        raw = await provider.createSession(params, { idempotencyKey: `${productCode}_first_sale_${claimTokenHash}` });
      } catch (error) {
        // Only a definitive create rejection may release. Timeouts/API/unknown results retain the reservation.
        if (!canSafelyReleaseAfterStripeError(error)) return failed("support_required");
        try {
          const released = await gate.releaseFailedReservation({ ...identity, reason: "stripe_rejected_before_session" });
          return failed(released === true ? "provider_rejected" : "support_required");
        } catch { return failed("support_required"); }
      }
      // A resolved create may already exist remotely, even if its response or subsequent attach is invalid.
      const session = checkoutSession(raw, offer, mode, expiresAt);
      const afterCreate = now();
      if (!session || !Number.isFinite(afterCreate) || afterCreate < beforeCreate
        || expiresAt * 1000 <= afterCreate) return failed("support_required");
      const attached = await gate.attachCheckoutSession({ ...identity, checkoutSessionId: session.id,
        expiresAt: new Date(expiresAt * 1000) });
      if (attached !== true) return failed("support_required");
      const afterAttach = now();
      if (!Number.isFinite(afterAttach) || afterAttach < afterCreate || expiresAt * 1000 <= afterAttach) return failed("support_required");
      return { ok: true, checkoutUrl: session.url };
    } catch { return failed("support_required"); }
  };
}
