import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

import { canCreateTestCheckout, getPaymentReadiness, resumeProPurchaseTermsVersion } from "@/lib/commerce";
import { validateSameOriginMutation } from "@/lib/requestSecurity";
import { normalizeResumeProEntry } from "@/lib/resumeProAttribution";
import { assertResumeProStripeProduct, getResumeProStripeProductConfig } from "@/lib/resumeProStripeProduct";
import { siteUrl } from "@/lib/site";
import { assertSafeStripeEnvironment, getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

const checkoutRequestContentTypes = ["application/x-www-form-urlencoded", "multipart/form-data"];

function getCheckoutOrigin(request: NextRequest) {
  return process.env.VERCEL_ENV === "production" ? siteUrl : request.nextUrl.origin;
}

function createIntegrationIdentifier() {
  const suffix = Array.from(randomBytes(8), (byte) => String.fromCharCode(97 + (byte % 26))).join("");
  return `hoju_compass_resume_pro_${suffix}`;
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
    return NextResponse.json({ error: "Payments are not ready in this environment." }, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }

  try {
    assertSafeStripeEnvironment();

    const stripe = getStripe();
    const productConfig = getResumeProStripeProductConfig();
    const price = await stripe.prices.retrieve(productConfig.priceId, { expand: ["product"] });
    assertResumeProStripeProduct(price, productConfig, process.env.VERCEL_ENV === "production");

    const origin = getCheckoutOrigin(request);
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
      success_url: `${origin}/resume-pro/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/resume-pro?checkout=cancelled&from=${encodeURIComponent(acquisitionSource)}`,
    });

    if (!session.url) {
      throw new Error("Stripe did not return a Checkout URL.");
    }

    return NextResponse.redirect(session.url, 303);
  } catch (error) {
    console.error("Unable to create Resume Pro Checkout Session", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Checkout could not be started." }, {
      status: 500,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
