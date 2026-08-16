import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

const maxWebhookPayloadBytes = 1024 * 1024;

const entitlementEvents = new Set<Stripe.Event.Type>([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "refund.created",
  "refund.updated",
  "refund.failed",
  "charge.refunded",
  "charge.dispute.created",
  "charge.dispute.updated",
  "charge.dispute.closed",
  "charge.dispute.funds_reinstated",
]);

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const contentLength = Number(request.headers.get("content-length") ?? 0);

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  }

  if (Number.isFinite(contentLength) && contentLength > maxWebhookPayloadBytes) {
    return NextResponse.json({ error: "Webhook payload is too large." }, { status: 413 });
  }

  let event: Stripe.Event;

  try {
    const payload = await request.text();

    if (Buffer.byteLength(payload, "utf8") > maxWebhookPayloadBytes) {
      return NextResponse.json({ error: "Webhook payload is too large." }, { status: 413 });
    }

    event = getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.warn("Rejected Stripe webhook", error instanceof Error ? error.message : "Invalid signature");
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  if (!entitlementEvents.has(event.type)) {
    return NextResponse.json({ received: true });
  }

  const expectsLiveEvent = process.env.VERCEL_ENV === "production";

  if (event.livemode !== expectsLiveEvent) {
    console.warn("Rejected Stripe webhook from the wrong environment", { eventId: event.id, type: event.type });
    return NextResponse.json({ error: "Webhook environment mismatch." }, { status: 400 });
  }

  if (event.livemode) {
    // Returning a failure keeps Stripe retrying instead of silently losing a paid order.
    return NextResponse.json({ error: "Live entitlement fulfillment is not configured." }, { status: 503 });
  }

  console.info("Verified Stripe test webhook", { eventId: event.id, type: event.type });
  return NextResponse.json({ received: true, testOnly: true });
}
