import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { canCreateCarBuyProTestCheckout, carBuyProProduct, carBuyProPurchaseTermsVersion, getCarBuyProPaymentReadiness } from "@/lib/commerce";
import { validateSameOriginMutation } from "@/lib/requestSecurity";
import { siteUrl } from "@/lib/site";
import { assertSafeStripeEnvironment, getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
const checkoutRequestContentTypes = ["application/x-www-form-urlencoded", "multipart/form-data"];

function createIntegrationIdentifier() {
  const suffix = Array.from(randomBytes(8), (byte) => String.fromCharCode(97 + (byte % 26))).join("");
  return `hoju_compass_car_buy_${suffix}`;
}

export async function POST(request: NextRequest) {
  const check = validateSameOriginMutation(request, { maxBodyBytes: 4 * 1024, allowedContentTypes: checkoutRequestContentTypes });
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status, headers: { "Cache-Control": "no-store" } });

  let termsAccepted = false;
  try {
    const formData = await request.formData();
    termsAccepted = formData.get("terms_accepted") === "yes";
  } catch {
    return NextResponse.json({ error: "Invalid checkout request." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  if (!termsAccepted) return NextResponse.json({ error: "Purchase terms must be acknowledged before checkout." }, { status: 400, headers: { "Cache-Control": "no-store" } });

  const readiness = getCarBuyProPaymentReadiness();
  const allowed = process.env.VERCEL_ENV === "production" ? readiness.ready : canCreateCarBuyProTestCheckout();
  if (!allowed) return NextResponse.json({ error: "Payments are not ready in this environment." }, { status: 503, headers: { "Cache-Control": "no-store" } });

  try {
    assertSafeStripeEnvironment();
    const stripe = getStripe();
    const priceId = process.env.STRIPE_CAR_BUY_PRO_PRICE_ID?.trim();
    if (!priceId) throw new Error("Car Buy Pack Pro price is not configured.");
    const price = await stripe.prices.retrieve(priceId);
    const validPrice = price.active && price.type === "one_time" && price.currency === carBuyProProduct.currency && price.unit_amount === carBuyProProduct.priceCents;
    if (!validPrice) throw new Error("Car Buy Pack Pro price does not match the server product definition.");

    const origin = process.env.VERCEL_ENV === "production" ? siteUrl : request.nextUrl.origin;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      integration_identifier: createIntegrationIdentifier(),
      line_items: [{ price: priceId, quantity: 1 }],
      customer_creation: "always",
      managed_payments: { enabled: true },
      metadata: {
        product_code: "car_buy_pro",
        billing_model: "one_time",
        entitlement_version: "1",
        purchase_terms_version: carBuyProPurchaseTermsVersion,
      },
      success_url: `${origin}/car-buy-pro/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/car-buy-pro?checkout=cancelled`,
    });
    if (!session.url) throw new Error("Stripe did not return a Checkout URL.");
    return NextResponse.redirect(session.url, 303);
  } catch (error) {
    console.error("Unable to create Car Buy Pack Pro Checkout Session", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Checkout could not be started." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
