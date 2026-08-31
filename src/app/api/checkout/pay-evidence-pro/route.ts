import { randomBytes } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

import {
  canCreatePayEvidenceTestCheckout,
  getPayEvidencePaymentReadiness,
  payEvidenceProProduct,
  payEvidenceProPurchaseTermsVersion,
} from "@/lib/commerce";
import {
  canSafelyReleaseAfterStripeError,
  createFirstSaleReservation,
  isVerifiedAbandonedCheckout,
  PAY_EVIDENCE_FIRST_SALE_PRODUCT_CODE,
  type FirstSaleClaim,
  type FirstSaleGateStore,
} from "@/lib/firstSaleGate";
import { getConfiguredFirstSaleGate, isPaymentRuntimeSchemaReady } from "@/lib/neonFirstSaleGate";
import { getActivePayEvidenceProEntitlement } from "@/lib/payEvidenceProAccess";
import { normalizePayEvidenceProEntry } from "@/lib/payEvidenceProAttribution";
import { validateSameOriginMutation } from "@/lib/requestSecurity";
import { siteUrl } from "@/lib/site";
import { assertSafeStripeEnvironment, getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

const checkoutRequestContentTypes = ["application/x-www-form-urlencoded", "multipart/form-data"];

type PayEvidenceCheckoutFailureCode =
  | "checkout_already_purchased"
  | "checkout_unavailable"
  | "checkout_retry_later"
  | "checkout_sales_closed"
  | "checkout_support_required"
  | "checkout_failed";

function getCheckoutOrigin(request: NextRequest) {
  return process.env.VERCEL_ENV === "production" ? siteUrl : request.nextUrl.origin;
}

function createIntegrationIdentifier() {
  const suffix = Array.from(randomBytes(8), (byte) => String.fromCharCode(97 + (byte % 26))).join("");
  return `hoju_compass_pay_evidence_pro_${suffix}`;
}

function acceptsJson(request: NextRequest) {
  return request.headers.get("accept")?.includes("application/json") ?? false;
}

function checkoutFailureResponse(
  request: NextRequest,
  source: string,
  code: PayEvidenceCheckoutFailureCode,
  status: number,
) {
  if (acceptsJson(request)) {
    return NextResponse.json({ error: { code } }, {
      status,
      headers: { "Cache-Control": "no-store" },
    });
  }
  const query = new URLSearchParams({ checkout: code, from: source });
  return NextResponse.redirect(new URL(`/pay-evidence-pro?${query}`, getCheckoutOrigin(request)), 303);
}

class PayEvidenceFirstSaleGateClosedError extends Error {
  override name = "PayEvidenceFirstSaleGateClosedError";

  constructor(readonly code: Extract<
    PayEvidenceCheckoutFailureCode,
    "checkout_retry_later" | "checkout_sales_closed" | "checkout_support_required"
  > = "checkout_support_required") {
    super("Pay Evidence Pack Pro Checkout is not publicly available.");
  }
}

async function claimFirstPayEvidenceSale(
  gate: FirstSaleGateStore,
  stripe: Stripe,
  environment: "live" | "test",
) {
  const reserve = () => {
    const reservation = createFirstSaleReservation(PAY_EVIDENCE_FIRST_SALE_PRODUCT_CODE);
    return gate.claimReservation({
      productCode: PAY_EVIDENCE_FIRST_SALE_PRODUCT_CODE,
      ...reservation,
      environment,
      currency: payEvidenceProProduct.currency,
      amountCents: payEvidenceProProduct.priceCents,
    });
  };

  let result = await reserve();
  if (result.outcome === "verify_expiry") {
    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.retrieve(result.checkoutSessionId);
    } catch {
      throw new PayEvidenceFirstSaleGateClosedError();
    }
    const paymentIntentId = typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;
    if (!isVerifiedAbandonedCheckout({
      status: session.status,
      paymentStatus: session.payment_status,
      paymentIntentId,
    })) throw new PayEvidenceFirstSaleGateClosedError();
    const released = await gate.releaseVerifiedAbandoned({
      productCode: PAY_EVIDENCE_FIRST_SALE_PRODUCT_CODE,
      generation: result.generation,
      checkoutSessionId: result.checkoutSessionId,
    });
    if (!released) throw new PayEvidenceFirstSaleGateClosedError();
    result = await reserve();
  }
  if (result.outcome === "reserved") throw new PayEvidenceFirstSaleGateClosedError("checkout_retry_later");
  if (result.outcome === "locked") throw new PayEvidenceFirstSaleGateClosedError("checkout_sales_closed");
  if (result.outcome !== "claimed") throw new PayEvidenceFirstSaleGateClosedError();
  return result;
}

export async function POST(request: NextRequest) {
  const requestCheck = await validateSameOriginMutation(request, {
    maxBodyBytes: 4 * 1024,
    allowedContentTypes: checkoutRequestContentTypes,
  });
  if (!requestCheck.ok) {
    return NextResponse.json({ error: requestCheck.error }, {
      status: requestCheck.status,
      headers: { "Cache-Control": "no-store" },
    });
  }

  let termsAccepted = false;
  let acquisitionSource = normalizePayEvidenceProEntry(null);
  try {
    const formData = await request.formData();
    termsAccepted = formData.get("terms_accepted") === "yes";
    acquisitionSource = normalizePayEvidenceProEntry(formData.get("source"));
  } catch {
    return NextResponse.json({ error: "Invalid checkout request." }, {
      status: 400,
      headers: { "Cache-Control": "no-store" },
    });
  }
  if (!termsAccepted) {
    return NextResponse.json({ error: "Purchase terms must be acknowledged before checkout." }, {
      status: 400,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const readiness = getPayEvidencePaymentReadiness();
  const allowed = process.env.VERCEL_ENV === "production"
    ? readiness.ready
    : canCreatePayEvidenceTestCheckout();
  if (!allowed) return checkoutFailureResponse(request, acquisitionSource, "checkout_unavailable", 503);
  if (!await isPaymentRuntimeSchemaReady("pay_evidence_pro")) {
    return checkoutFailureResponse(request, acquisitionSource, "checkout_unavailable", 503);
  }

  try {
    assertSafeStripeEnvironment();
    if (await getActivePayEvidenceProEntitlement()) {
      return checkoutFailureResponse(request, acquisitionSource, "checkout_already_purchased", 409);
    }
    const stripe = getStripe();
    const firstSaleGate = getConfiguredFirstSaleGate();
    if (!firstSaleGate) throw new PayEvidenceFirstSaleGateClosedError();
    const priceId = process.env.STRIPE_PAY_EVIDENCE_PRO_PRICE_ID?.trim();
    if (!priceId) throw new Error("Pay Evidence Pack Pro price is not configured.");

    const price = await stripe.prices.retrieve(priceId, { expand: ["product"] });
    const product = typeof price.product === "object" && price.product && !price.product.deleted
      ? price.product
      : null;
    const validPrice = price.active
      && price.type === "one_time"
      && price.currency === payEvidenceProProduct.currency
      && price.unit_amount === payEvidenceProProduct.priceCents
      && price.tax_behavior === "inclusive"
      && price.livemode === (process.env.VERCEL_ENV === "production")
      && product?.active === true
      && product.metadata?.product_code === PAY_EVIDENCE_FIRST_SALE_PRODUCT_CODE
      && product.metadata?.billing_model === "one_time";
    if (!validPrice) throw new Error("Pay Evidence Pack Pro price does not match the server product definition.");

    const origin = getCheckoutOrigin(request);
    const environment = process.env.VERCEL_ENV === "production" ? "live" : "test";
    let claim: FirstSaleClaim | undefined;
    let sessionCreated = false;
    try {
      claim = await claimFirstPayEvidenceSale(firstSaleGate, stripe, environment);
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        integration_identifier: createIntegrationIdentifier(),
        line_items: [{ price: priceId, quantity: 1 }],
        customer_creation: "always",
        managed_payments: { enabled: true },
        metadata: {
          product_code: PAY_EVIDENCE_FIRST_SALE_PRODUCT_CODE,
          billing_model: "one_time",
          entitlement_version: "1",
          purchase_terms_version: payEvidenceProPurchaseTermsVersion,
          acquisition_source: acquisitionSource,
        },
        expires_at: Math.floor(claim.expiresAt.getTime() / 1000),
        success_url: `${origin}/pay-evidence-pro/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/pay-evidence-pro?checkout=cancelled&from=${encodeURIComponent(acquisitionSource)}`,
      }, { idempotencyKey: claim.idempotencyKey });
      sessionCreated = true;
      if (!session.url) throw new Error("Stripe did not return a Checkout URL.");
      const attached = await firstSaleGate.attachCheckoutSession({
        productCode: PAY_EVIDENCE_FIRST_SALE_PRODUCT_CODE,
        generation: claim.generation,
        claimTokenHash: claim.claimTokenHash,
        checkoutSessionId: session.id,
        expiresAt: new Date(session.expires_at * 1000),
      });
      if (!attached) throw new PayEvidenceFirstSaleGateClosedError();
      if (acceptsJson(request)) {
        return NextResponse.json({ checkoutUrl: session.url }, {
          headers: { "Cache-Control": "no-store" },
        });
      }
      return NextResponse.redirect(session.url, 303);
    } catch (error) {
      if (claim && !sessionCreated && canSafelyReleaseAfterStripeError(error)) {
        try {
          await firstSaleGate.releaseFailedReservation({
            productCode: PAY_EVIDENCE_FIRST_SALE_PRODUCT_CODE,
            generation: claim.generation,
            claimTokenHash: claim.claimTokenHash,
            reason: "stripe_rejected_before_session",
          });
        } catch {
          // Fail closed when the reservation release cannot be proven.
        }
      }
      throw error;
    }
  } catch (error) {
    const code = error instanceof PayEvidenceFirstSaleGateClosedError ? error.code : "checkout_failed";
    console.error("Unable to create Pay Evidence Pack Pro Checkout Session", {
      category: error instanceof PayEvidenceFirstSaleGateClosedError ? "first_sale_gate" : "checkout",
    });
    return checkoutFailureResponse(request, acquisitionSource, code, code === "checkout_failed" ? 500 : 503);
  }
}
