import { randomBytes } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import {
  canCreateRentalApplicationTestCheckout,
  rentalApplicationProProduct,
  rentalApplicationProPurchaseTermsVersion,
} from "@/lib/commerce";
import { normalizeRentalApplicationProEntry } from "@/lib/rentalApplicationProAttribution";
import { validateSameOriginMutation } from "@/lib/requestSecurity";
import { siteUrl } from "@/lib/site";
import { assertSafeStripeEnvironment, getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

const checkoutRequestContentTypes = ["application/x-www-form-urlencoded", "multipart/form-data"];

function getCheckoutOrigin(request: NextRequest) {
  return process.env.VERCEL_ENV === "production" ? siteUrl : request.nextUrl.origin;
}

function createIntegrationIdentifier() {
  const suffix = Array.from(randomBytes(8), (byte) => String.fromCharCode(97 + (byte % 26))).join("");
  return `hoju_compass_rental_application_pro_${suffix}`;
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

  // Rental Pack is a Preview-only validation product. Keep this endpoint
  // independently fail-closed even when the shared Resume Pro switch opens.
  if (process.env.VERCEL_ENV === "production") {
    return NextResponse.json({ error: "Rental Application Pack Pro payments are not available in Production." }, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }

  let termsAccepted = false;
  let acquisitionSource = normalizeRentalApplicationProEntry(null);
  try {
    const formData = await request.formData();
    termsAccepted = formData.get("terms_accepted") === "yes";
    acquisitionSource = normalizeRentalApplicationProEntry(formData.get("source"));
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

  const allowed = canCreateRentalApplicationTestCheckout();

  if (!allowed) {
    return NextResponse.json({ error: "Rental Application Pack Pro payments are not ready in this environment." }, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }

  try {
    assertSafeStripeEnvironment();

    const stripe = getStripe();
    const priceId = process.env.STRIPE_RENTAL_APPLICATION_PRO_PRICE_ID?.trim();

    if (!priceId) throw new Error("Rental Application Pack Pro price is not configured.");

    const price = await stripe.prices.retrieve(priceId);
    const validPrice = price.active
      && price.type === "one_time"
      && price.currency === rentalApplicationProProduct.currency
      && price.unit_amount === rentalApplicationProProduct.priceCents;

    if (!validPrice) throw new Error("Rental Application Pack Pro price does not match the server product definition.");

    const origin = getCheckoutOrigin(request);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      integration_identifier: createIntegrationIdentifier(),
      line_items: [{ price: priceId, quantity: 1 }],
      customer_creation: "always",
      managed_payments: { enabled: true },
      metadata: {
        product_code: "rental_application_pro",
        billing_model: "one_time",
        entitlement_version: "1",
        purchase_terms_version: rentalApplicationProPurchaseTermsVersion,
        acquisition_source: acquisitionSource,
      },
      success_url: `${origin}/rental-application-pro/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/rental-application-pro?checkout=cancelled&from=${encodeURIComponent(acquisitionSource)}`,
    });

    if (!session.url) throw new Error("Stripe did not return a Checkout URL.");

    return NextResponse.redirect(session.url, 303);
  } catch (error) {
    console.error("Unable to create Rental Application Pack Pro Checkout Session", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Checkout could not be started." }, {
      status: 500,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
