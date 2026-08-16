import { NextRequest, NextResponse } from "next/server";

import { canCreateTestCheckout, getPaymentReadiness, resumeProProduct } from "@/lib/commerce";
import { siteUrl } from "@/lib/site";
import { assertSafeStripeEnvironment, getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

function getCheckoutOrigin(request: NextRequest) {
  return process.env.VERCEL_ENV === "production" ? siteUrl : request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  const requestOrigin = request.headers.get("origin");

  if (requestOrigin && requestOrigin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Invalid checkout origin." }, { status: 403 });
  }

  const readiness = getPaymentReadiness();
  const allowed = process.env.VERCEL_ENV === "production" ? readiness.ready : canCreateTestCheckout();

  if (!allowed) {
    return NextResponse.json({ error: "Payments are not ready in this environment." }, { status: 503 });
  }

  try {
    assertSafeStripeEnvironment();

    const stripe = getStripe();
    const priceId = process.env.STRIPE_RESUME_PRO_PRICE_ID?.trim();

    if (!priceId) {
      throw new Error("Resume Pro price is not configured.");
    }

    const price = await stripe.prices.retrieve(priceId);
    const validPrice = price.active
      && price.type === "one_time"
      && price.currency === resumeProProduct.currency
      && price.unit_amount === resumeProProduct.priceCents;

    if (!validPrice) {
      throw new Error("Resume Pro price does not match the server product definition.");
    }

    const origin = getCheckoutOrigin(request);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_creation: "always",
      managed_payments: { enabled: true },
      metadata: {
        product_code: "resume_pro",
        billing_model: "one_time",
        entitlement_version: "1",
      },
      success_url: `${origin}/resume-pro/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/resume-pro?checkout=cancelled`,
    });

    if (!session.url) {
      throw new Error("Stripe did not return a Checkout URL.");
    }

    return NextResponse.redirect(session.url, 303);
  } catch (error) {
    console.error("Unable to create Resume Pro Checkout Session", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Checkout could not be started." }, { status: 500 });
  }
}
