import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { canCreateRentalTestCheckout, getRentalPaymentReadiness, rentalProProduct, rentalProPurchaseTermsVersion } from "@/lib/commerce";
import { validateSameOriginMutation } from "@/lib/requestSecurity";
import { siteUrl } from "@/lib/site";
import { assertSafeStripeEnvironment, getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
const checkoutRequestContentTypes = ["application/x-www-form-urlencoded", "multipart/form-data"];

function createIntegrationIdentifier() {
  const suffix = Array.from(randomBytes(8), (byte) => String.fromCharCode(97 + (byte % 26))).join("");
  return `hoju_compass_rental_pro_${suffix}`;
}

export async function POST(request: NextRequest) {
  const requestCheck = validateSameOriginMutation(request, { maxBodyBytes: 4 * 1024, allowedContentTypes: checkoutRequestContentTypes });
  if (!requestCheck.ok) return NextResponse.json({ error: requestCheck.error }, { status: requestCheck.status, headers: { "Cache-Control": "no-store" } });

  let termsAccepted = false;
  try {
    termsAccepted = (await request.formData()).get("terms_accepted") === "yes";
  } catch {
    return NextResponse.json({ error: "Invalid checkout request." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  if (!termsAccepted) return NextResponse.json({ error: "Purchase terms must be acknowledged before checkout." }, { status: 400, headers: { "Cache-Control": "no-store" } });

  const readiness = getRentalPaymentReadiness();
  const allowed = process.env.VERCEL_ENV === "production" ? readiness.ready : canCreateRentalTestCheckout();
  if (!allowed) return NextResponse.json({ error: "Rental Pro payments are not ready in this environment." }, { status: 503, headers: { "Cache-Control": "no-store" } });

  try {
    assertSafeStripeEnvironment();
    const stripe = getStripe();
    const priceId = process.env.STRIPE_RENTAL_PRO_PRICE_ID?.trim();
    if (!priceId) throw new Error("Rental Pro price is not configured.");
    const price = await stripe.prices.retrieve(priceId);
    const validPrice = price.active && price.type === "one_time" && price.currency === rentalProProduct.currency && price.unit_amount === rentalProProduct.priceCents;
    if (!validPrice) throw new Error("Rental Pro price does not match the server product definition.");

    const origin = process.env.VERCEL_ENV === "production" ? siteUrl : request.nextUrl.origin;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      integration_identifier: createIntegrationIdentifier(),
      line_items: [{ price: priceId, quantity: 1 }],
      customer_creation: "always",
      managed_payments: { enabled: true },
      metadata: { product_code: "rental_application_pro", billing_model: "one_time", entitlement_version: "1", purchase_terms_version: rentalProPurchaseTermsVersion },
      success_url: `${origin}/rental-application-pro/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/rental-application-pro?checkout=cancelled`,
    });
    if (!session.url) throw new Error("Stripe did not return a Checkout URL.");
    return NextResponse.redirect(session.url, 303);
  } catch (error) {
    console.error("Unable to create Rental Pro Checkout Session", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Checkout could not be started." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
