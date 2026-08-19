import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

import { getEntitlementCommand } from "@/lib/entitlements";
import { getConfiguredEntitlementStore } from "@/lib/neonEntitlementStore";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

const maxWebhookPayloadBytes = 1024 * 1024;

function webhookResponse(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const contentLength = Number(request.headers.get("content-length") ?? 0);

  if (!signature || !webhookSecret) {
    return webhookResponse({ error: "Webhook is not configured." }, 503);
  }

  if (request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase() !== "application/json") {
    return webhookResponse({ error: "Unsupported webhook content type." }, 415);
  }

  if (Number.isFinite(contentLength) && contentLength > maxWebhookPayloadBytes) {
    return webhookResponse({ error: "Webhook payload is too large." }, 413);
  }

  let event: Stripe.Event;

  try {
    const payload = await request.text();

    if (Buffer.byteLength(payload, "utf8") > maxWebhookPayloadBytes) {
      return webhookResponse({ error: "Webhook payload is too large." }, 413);
    }

    event = getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.warn("Rejected Stripe webhook", error instanceof Error ? error.message : "Invalid signature");
    return webhookResponse({ error: "Invalid webhook signature." }, 400);
  }

  const entitlementCommand = getEntitlementCommand(event);

  if (!entitlementCommand) {
    return webhookResponse({ received: true });
  }

  const expectsLiveEvent = process.env.VERCEL_ENV === "production";

  if (event.livemode !== expectsLiveEvent) {
    console.warn("Rejected Stripe webhook from the wrong environment", { eventId: event.id, type: event.type });
    return webhookResponse({ error: "Webhook environment mismatch." }, 400);
  }

  const entitlementStore = getConfiguredEntitlementStore();

  if (!entitlementStore) {
    // Returning a failure keeps Stripe retrying instead of silently losing a paid order.
    if (event.livemode) {
      return webhookResponse({ error: "Live entitlement fulfillment is not configured." }, 503);
    }

    console.info("Verified Stripe test webhook without persistence", {
      eventId: event.id,
      type: event.type,
      entitlementAction: entitlementCommand.action,
      reason: entitlementCommand.reason,
    });
    return webhookResponse({ received: true, testOnly: true, persisted: false });
  }

  try {
    const result = await entitlementStore.applyStripeEvent({
      receipt: {
        eventId: event.id,
        eventType: event.type,
        livemode: event.livemode,
        createdAt: new Date(event.created * 1000),
      },
      command: entitlementCommand,
    });

    console.info("Persisted Stripe entitlement event", {
      eventId: event.id,
      type: event.type,
      outcome: result.outcome,
      entitlementAction: entitlementCommand.action,
    });
    return webhookResponse({ received: true, testOnly: !event.livemode, persisted: true, outcome: result.outcome });
  } catch (error) {
    console.error("Unable to persist Stripe entitlement event", {
      eventId: event.id,
      type: event.type,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return webhookResponse({ error: "Entitlement persistence failed." }, 503);
  }
}
