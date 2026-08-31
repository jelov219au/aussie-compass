import { randomBytes } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

import {
  canCreateLeavingAustraliaTestCheckout,
  getLeavingAustraliaPaymentReadiness,
  leavingAustraliaProProduct,
  leavingAustraliaProPurchaseTermsVersion,
} from "@/lib/commerce";
import {
  canSafelyReleaseAfterStripeError,
  createFirstSaleReservation,
  isVerifiedAbandonedCheckout,
  LEAVING_AUSTRALIA_FIRST_SALE_PRODUCT_CODE,
  type FirstSaleClaim,
  type FirstSaleGateStore,
} from "@/lib/firstSaleGate";
import { getConfiguredFirstSaleGate, isPaymentRuntimeSchemaReady } from "@/lib/neonFirstSaleGate";
import { getActiveLeavingAustraliaProEntitlement } from "@/lib/leavingAustraliaProAccess";
import { normalizeLeavingAustraliaProEntry } from "@/lib/leavingAustraliaProAttribution";
import { validateSameOriginMutation } from "@/lib/requestSecurity";
import { siteUrl } from "@/lib/site";
import { assertSafeStripeEnvironment, getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

const checkoutRequestContentTypes = ["application/x-www-form-urlencoded", "multipart/form-data"];

type LeavingAustraliaCheckoutFailureCode =
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
  return `hoju_compass_leaving_australia_pro_${suffix}`;
}
function acceptsJson(request: NextRequest) {
  return request.headers.get("accept")?.includes("application/json") ?? false;
}

function checkoutFailureResponse(
  request: NextRequest,
  source: string,
  code: LeavingAustraliaCheckoutFailureCode,
  status: number,
) {
  if (acceptsJson(request)) {
    return NextResponse.json({ error: { code } }, {
      status,
      headers: { "Cache-Control": "no-store" },
    });
  }
  const query = new URLSearchParams({ checkout: code, from: source });
  return NextResponse.redirect(new URL(`/leaving-australia-pro?${query}`, getCheckoutOrigin(request)), 303);
}

class LeavingAustraliaFirstSaleGateClosedError extends Error {
  override name = "LeavingAustraliaFirstSaleGateClosedError";

  constructor(readonly code: Extract<
    LeavingAustraliaCheckoutFailureCode,
    "checkout_retry_later" | "checkout_sales_closed" | "checkout_support_required"
  > = "checkout_support_required") {
    super("Leaving Australia Pack Pro Checkout is not publicly available.");
  }
}

async function claimFirstLeavingAustraliaSale(
  gate: FirstSaleGateStore,
  stripe: Stripe,
  environment: "live" | "test",
) {
  const reserve = () => {
    const reservation = createFirstSaleReservation(LEAVING_AUSTRALIA_FIRST_SALE_PRODUCT_CODE);
    return gate.claimReservation({
      productCode: LEAVING_AUSTRALIA_FIRST_SALE_PRODUCT_CODE,
      ...reservation,
      environment,
      currency: leavingAustraliaProProduct.currency,
      amountCents: leavingAustraliaProProduct.priceCents,
    });
  };

  let result = await reserve();
  if (result.outcome === "verify_expiry") {
    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.retrieve(result.checkoutSessionId);
    } catch {
      throw new LeavingAustraliaFirstSaleGateClosedError();
    }
    const paymentIntentId = typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;
    if (!isVerifiedAbandonedCheckout({
      status: session.status,
      paymentStatus: session.payment_status,
      paymentIntentId,
    })) throw new LeavingAustraliaFirstSaleGateClosedError();
    const released = await gate.releaseVerifiedAbandoned({
      productCode: LEAVING_AUSTRALIA_FIRST_SALE_PRODUCT_CODE,
      generation: result.generation,
      checkoutSessionId: result.checkoutSessionId,
    });
    if (!released) throw new LeavingAustraliaFirstSaleGateClosedError();
    result = await reserve();
  }
  if (result.outcome === "reserved") throw new LeavingAustraliaFirstSaleGateClosedError("checkout_retry_later");
  if (result.outcome === "locked") throw new LeavingAustraliaFirstSaleGateClosedError("checkout_sales_closed");
  if (result.outcome !== "claimed") throw new LeavingAustraliaFirstSaleGateClosedError();
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
  let acquisitionSource = normalizeLeavingAustraliaProEntry(null);
  try {
    const formData = await request.formData();
    termsAccepted = formData.get("terms_accepted") === "yes";
    acquisitionSource = normalizeLeavingAustraliaProEntry(formData.get("source"));
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

  const readiness = getLeavingAustraliaPaymentReadiness();
  const allowed = process.env.VERCEL_ENV === "production"
    ? readiness.ready
    : canCreateLeavingAustraliaTestCheckout();
  if (!allowed) return checkoutFailureResponse(request, acquisitionSource, "checkout_unavailable", 503);
  if (!await isPaymentRuntimeSchemaReady("leaving_australia_pro")) {
    return checkoutFailureResponse(request, acquisitionSource, "checkout_unavailable", 503);
  }

  try {
    assertSafeStripeEnvironment();
    if (await getActiveLeavingAustraliaProEntitlement()) {
      return checkoutFailureResponse(request, acquisitionSource, "checkout_already_purchased", 409);
    }
    const stripe = getStripe();
    const firstSaleGate = getConfiguredFirstSaleGate();
    if (!firstSaleGate) throw new LeavingAustraliaFirstSaleGateClosedError();
    const priceId = process.env.STRIPE_LEAVING_AUSTRALIA_PRO_PRICE_ID?.trim();
    if (!priceId) throw new Error("Leaving Australia Pack Pro price is not configured.");

    const price = await stripe.prices.retrieve(priceId, { expand: ["product"] });
    const product = typeof price.product === "object" && price.product && !price.product.deleted
      ? price.product
      : null;
    const validPrice = price.active
      && price.type === "one_time"
      && price.currency === leavingAustraliaProProduct.currency
      && price.unit_amount === leavingAustraliaProProduct.priceCents
      && price.tax_behavior === "inclusive"
      && price.livemode === (process.env.VERCEL_ENV === "production")
      && product?.active === true
      && product.metadata?.product_code === LEAVING_AUSTRALIA_FIRST_SALE_PRODUCT_CODE
      && product.metadata?.billing_model === "one_time";
    if (!validPrice) throw new Error("Leaving Australia Pack Pro price does not match the server product definition.");

    const origin = getCheckoutOrigin(request);
    const environment = process.env.VERCEL_ENV === "production" ? "live" : "test";
    let claim: FirstSaleClaim | undefined;
    let sessionCreated = false;
    try {
      claim = await claimFirstLeavingAustraliaSale(firstSaleGate, stripe, environment);
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        integration_identifier: createIntegrationIdentifier(),
        line_items: [{ price: priceId, quantity: 1 }],
        customer_creation: "always",
        managed_payments: { enabled: true },
        metadata: {
          product_code: LEAVING_AUSTRALIA_FIRST_SALE_PRODUCT_CODE,
          billing_model: "one_time",
          entitlement_version: "1",
          purchase_terms_version: leavingAustraliaProPurchaseTermsVersion,
          acquisition_source: acquisitionSource,
        },
        expires_at: Math.floor(claim.expiresAt.getTime() / 1000),
        success_url: `${origin}/leaving-australia-pro/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/leaving-australia-pro?checkout=cancelled&from=${encodeURIComponent(acquisitionSource)}`,
      }, { idempotencyKey: claim.idempotencyKey });
      sessionCreated = true;
      if (!session.url) throw new Error("Stripe did not return a Checkout URL.");
      const attached = await firstSaleGate.attachCheckoutSession({
        productCode: LEAVING_AUSTRALIA_FIRST_SALE_PRODUCT_CODE,
        generation: claim.generation,
        claimTokenHash: claim.claimTokenHash,
        checkoutSessionId: session.id,
        expiresAt: new Date(session.expires_at * 1000),
      });
      if (!attached) throw new LeavingAustraliaFirstSaleGateClosedError();
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
            productCode: LEAVING_AUSTRALIA_FIRST_SALE_PRODUCT_CODE,
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
    const code = error instanceof LeavingAustraliaFirstSaleGateClosedError ? error.code : "checkout_failed";
    console.error("Unable to create Leaving Australia Pack Pro Checkout Session", {
      category: error instanceof LeavingAustraliaFirstSaleGateClosedError ? "first_sale_gate" : "checkout",
    });
    return checkoutFailureResponse(request, acquisitionSource, code, code === "checkout_failed" ? 500 : 503);
  }
}
