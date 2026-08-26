import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

import { canCreateTestCheckout, getPaymentReadiness, resumeProPurchaseTermsVersion } from "@/lib/commerce";
import {
  canSafelyReleaseAfterStripeError,
  createFirstSaleReservation,
  FIRST_SALE_PRODUCT_CODE,
  isVerifiedAbandonedCheckout,
  type FirstSaleClaim,
  type FirstSaleGateStore,
} from "@/lib/firstSaleGate";
import { getConfiguredFirstSaleGate, isPaymentRuntimeSchemaReady } from "@/lib/neonFirstSaleGate";
import { validateSameOriginMutation } from "@/lib/requestSecurity";
import { getActiveResumeProEntitlement } from "@/lib/resumeProAccess";
import { normalizeResumeProEntry } from "@/lib/resumeProAttribution";
import {
  classifyResumeProCheckoutFailure,
  getResumeProCheckoutFailure,
  getResumeProCheckoutConfigurationFailure,
  type ResumeProCheckoutFailureCode,
  type ResumeProCheckoutFailure,
} from "@/lib/resumeProCheckoutFailure";
import { assertResumeProStripeProduct, getResumeProStripeProductConfig } from "@/lib/resumeProStripeProduct";
import { siteUrl } from "@/lib/site";
import { assertSafeStripeEnvironment, getStripe } from "@/lib/stripe";
import type Stripe from "stripe";

export const runtime = "nodejs";

const checkoutRequestContentTypes = ["application/x-www-form-urlencoded", "multipart/form-data"];

function getCheckoutOrigin(request: NextRequest) {
  return process.env.VERCEL_ENV === "production" ? siteUrl : request.nextUrl.origin;
}

function createIntegrationIdentifier() {
  const suffix = Array.from(randomBytes(8), (byte) => String.fromCharCode(97 + (byte % 26))).join("");
  return `hoju_compass_resume_pro_${suffix}`;
}

function acceptsJson(request: NextRequest) {
  return request.headers.get("accept")?.includes("application/json") ?? false;
}

class FirstSaleGateClosedError extends Error {
  override name = "FirstSaleGateClosedError";

  constructor(readonly publicFailureCode?: Extract<
    ResumeProCheckoutFailureCode,
    "checkout_retry_later" | "checkout_sales_closed" | "checkout_support_required"
  >) {
    super("Resume Pro Checkout is not publicly available.");
  }
}

async function claimFirstSale(
  gate: FirstSaleGateStore,
  stripe: Stripe,
  environment: "live" | "test",
) {
  const reserve = () => {
    const reservation = createFirstSaleReservation();
    return gate.claimReservation({
      productCode: FIRST_SALE_PRODUCT_CODE,
      ...reservation,
      environment,
      currency: "aud",
      amountCents: 1990,
    });
  };

  let result = await reserve();

  if (result.outcome === "verify_expiry") {
    // A clock timeout alone is insufficient. Only a Stripe-confirmed expired,
    // unpaid Session with no PaymentIntent is safe to release.
    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.retrieve(result.checkoutSessionId);
    } catch {
      throw new FirstSaleGateClosedError("checkout_support_required");
    }

    const paymentIntentId = typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

    if (!isVerifiedAbandonedCheckout({
      status: session.status,
      paymentStatus: session.payment_status,
      paymentIntentId,
    })) {
      throw new FirstSaleGateClosedError("checkout_support_required");
    }

    const released = await gate.releaseVerifiedAbandoned({
      productCode: FIRST_SALE_PRODUCT_CODE,
      generation: result.generation,
      checkoutSessionId: result.checkoutSessionId,
    });

    if (!released) throw new FirstSaleGateClosedError("checkout_support_required");
    result = await reserve();
  }

  if (result.outcome === "reserved") {
    throw new FirstSaleGateClosedError("checkout_retry_later");
  }
  if (result.outcome === "locked") {
    throw new FirstSaleGateClosedError("checkout_sales_closed");
  }
  if (result.outcome === "manual_review" || result.outcome === "verify_expiry") {
    throw new FirstSaleGateClosedError("checkout_support_required");
  }
  if (result.outcome !== "claimed") {
    throw new FirstSaleGateClosedError("checkout_support_required");
  }
  return result;
}

function checkoutFailureResponse(
  request: NextRequest,
  source: string,
  failure: ResumeProCheckoutFailure,
) {
  if (acceptsJson(request)) {
    return NextResponse.json({
      error: {
        code: failure.code,
        message: failure.message,
        retryable: failure.retryable,
      },
    }, {
      status: failure.status,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const query = new URLSearchParams({ checkout: failure.code, from: source });
  return NextResponse.redirect(new URL(`/resume-pro?${query}`, getCheckoutOrigin(request)), 303);
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
  let acquisitionSource = normalizeResumeProEntry(null);
  try {
    const formData = await request.formData();
    termsAccepted = formData.get("terms_accepted") === "yes";
    acquisitionSource = normalizeResumeProEntry(formData.get("source"));
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

  const readiness = getPaymentReadiness();
  const allowed = process.env.VERCEL_ENV === "production" ? readiness.ready : canCreateTestCheckout();

  if (!allowed) {
    return checkoutFailureResponse(request, acquisitionSource, getResumeProCheckoutConfigurationFailure());
  }

  if (!await isPaymentRuntimeSchemaReady()) {
    return checkoutFailureResponse(request, acquisitionSource, getResumeProCheckoutConfigurationFailure());
  }

  try {
    assertSafeStripeEnvironment();

    const activeEntitlement = await getActiveResumeProEntitlement();
    if (activeEntitlement) {
      const alreadyPurchased = getResumeProCheckoutFailure("checkout_already_purchased");
      if (!alreadyPurchased) throw new Error("Resume Pro repurchase guard is unavailable.");
      return checkoutFailureResponse(request, acquisitionSource, alreadyPurchased);
    }

    const stripe = getStripe();
    const firstSaleGate = getConfiguredFirstSaleGate();
    if (!firstSaleGate) throw new FirstSaleGateClosedError();
    const productConfig = getResumeProStripeProductConfig();
    const price = await stripe.prices.retrieve(productConfig.priceId, { expand: ["product"] });
    assertResumeProStripeProduct(price, productConfig, process.env.VERCEL_ENV === "production");

    const origin = getCheckoutOrigin(request);
    const environment = process.env.VERCEL_ENV === "production" ? "live" : "test";
    let claim: FirstSaleClaim | undefined;
    let sessionCreated = false;

    try {
      claim = await claimFirstSale(firstSaleGate, stripe, environment);
      const session = await stripe.checkout.sessions.create({
      mode: "payment",
      integration_identifier: createIntegrationIdentifier(),
      line_items: [{ price: productConfig.priceId, quantity: 1 }],
      customer_creation: "always",
      managed_payments: { enabled: true },
      metadata: {
        product_code: "resume_pro",
        billing_model: "one_time",
        entitlement_version: "1",
        purchase_terms_version: resumeProPurchaseTermsVersion,
        acquisition_source: acquisitionSource,
      },
      expires_at: Math.floor(claim.expiresAt.getTime() / 1000),
      success_url: `${origin}/resume-pro/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/resume-pro?checkout=cancelled&from=${encodeURIComponent(acquisitionSource)}`,
      }, { idempotencyKey: claim.idempotencyKey });
      sessionCreated = true;

      if (!session.url) {
        throw new Error("Stripe did not return a Checkout URL.");
      }

      const attached = await firstSaleGate.attachCheckoutSession({
        productCode: FIRST_SALE_PRODUCT_CODE,
        generation: claim.generation,
        claimTokenHash: claim.claimTokenHash,
        checkoutSessionId: session.id,
        expiresAt: new Date(session.expires_at * 1000),
      });

      if (!attached) throw new FirstSaleGateClosedError("checkout_support_required");

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
            productCode: FIRST_SALE_PRODUCT_CODE,
            generation: claim.generation,
            claimTokenHash: claim.claimTokenHash,
            reason: "stripe_rejected_before_session",
          });
        } catch {
          // Fail closed: an inability to prove release leaves the reservation in place.
        }
      }
      throw error;
    }
  } catch (error) {
    const failure = classifyResumeProCheckoutFailure(error);
    console.error("Unable to create Resume Pro Checkout Session", { category: failure.logCategory });
    return checkoutFailureResponse(request, acquisitionSource, failure);
  }
}
