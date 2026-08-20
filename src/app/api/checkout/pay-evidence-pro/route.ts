import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { canCreatePayEvidenceTestCheckout, getPayEvidencePaymentReadiness, payEvidenceProduct, payEvidencePurchaseTermsVersion } from "@/lib/commerce";
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
  return `hoju_compass_pay_evidence_${suffix}`;
}

export async function POST(request: NextRequest) {
  const requestCheck = validateSameOriginMutation(request, { maxBodyBytes: 4 * 1024, allowedContentTypes: checkoutRequestContentTypes });
  if (!requestCheck.ok) return NextResponse.json({ error: requestCheck.error }, { status: requestCheck.status, headers: { "Cache-Control": "no-store" } });

  let termsAccepted = false;
  try {
    const formData = await request.formData();
    termsAccepted = formData.get("terms_accepted") === "yes";
  } catch {
    return NextResponse.json({ error: "Invalid checkout request." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  if (!termsAccepted) return NextResponse.json({ error: "Purchase terms must be acknowledged before checkout." }, { status: 400, headers: { "Cache-Control": "no-store" } });

  const readiness = getPayEvidencePaymentReadiness();
  const allowed = process.env.VERCEL_ENV === "production" ? readiness.ready : canCreatePayEvidenceTestCheckout();
  if (!allowed) return NextResponse.json({ error: "Payments are not ready in this environment." }, { status: 503, headers: { "Cache-Control": "no-store" } });

  try {
    assertSafeStripeEnvironment();
    const stripe = getStripe();
    const priceId = process.env.STRIPE_PAY_EVIDENCE_PRO_PRICE_ID?.trim();
    if (!priceId) throw new Error("Pay Evidence Pro price is not configured.");
    const price = await stripe.prices.retrieve(priceId);
    const validPrice = price.active && price.type === "one_time" && price.currency === payEvidenceProduct.currency && price.unit_amount === payEvidenceProduct.priceCents;
    if (!validPrice) throw new Error("Pay Evidence Pro price does not match the server product definition.");

    const origin = getCheckoutOrigin(request);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      integration_identifier: createIntegrationIdentifier(),
      line_items: [{ price: priceId, quantity: 1 }],
      customer_creation: "always",
      managed_payments: { enabled: true },
      metadata: {
        product_code: "pay_evidence_pro",
        billing_model: "one_time",
        entitlement_version: "1",
        purchase_terms_version: payEvidencePurchaseTermsVersion,
      },
      success_url: `${origin}/pay-evidence-pro/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pay-evidence-pro?checkout=cancelled`,
    });
    if (!session.url) throw new Error("Stripe did not return a Checkout URL.");
    return NextResponse.redirect(session.url, 303);
  } catch (error) {
    console.error("Unable to create Pay Evidence Pro Checkout Session", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Checkout could not be started." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
