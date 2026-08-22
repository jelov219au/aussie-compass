import { after, NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

import { getEntitlementCommand } from "@/lib/entitlements";
import { getConfiguredEntitlementStore } from "@/lib/neonEntitlementStore";
import { FIRST_SALE_PRODUCT_CODE } from "@/lib/firstSaleGate";
import { getConfiguredFirstSaleGate } from "@/lib/neonFirstSaleGate";
import { paymentAlertsConfigured, sendStripeOperatorAlert } from "@/lib/paymentAlerts";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

const maxWebhookPayloadBytes = 1024 * 1024;

function webhookResponse(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function stripeReferenceSuffix(value: string) {
  return value.slice(-8);
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
    console.warn("Rejected Stripe webhook from the wrong environment", { eventRef: stripeReferenceSuffix(event.id), type: event.type });
    return webhookResponse({ error: "Webhook environment mismatch." }, 400);
  }

  const entitlementStore = getConfiguredEntitlementStore();

  if (!entitlementStore) {
    // Returning a failure keeps Stripe retrying instead of silently losing a paid order.
    if (event.livemode) {
      return webhookResponse({ error: "Live entitlement fulfillment is not configured." }, 503);
    }

    console.info("Verified Stripe test webhook without persistence", {
      eventRef: stripeReferenceSuffix(event.id),
      type: event.type,
      entitlementAction: entitlementCommand.action,
      reason: entitlementCommand.reason,
    });
    return webhookResponse({ received: true, testOnly: true, persisted: false });
  }

  try {
    const receipt = {
      eventId: event.id,
      eventType: event.type,
      livemode: event.livemode,
      createdAt: new Date(event.created * 1000),
    };
    let result: { outcome: "processed" | "duplicate" | "ignored_stale" | "tombstoned" };

    if (
      entitlementCommand.action === "grant"
      && entitlementCommand.productCode === FIRST_SALE_PRODUCT_CODE
      && entitlementCommand.checkoutSessionId
      && entitlementCommand.currency === "aud"
      && entitlementCommand.amountTotal === 1990
    ) {
      const firstSaleGate = getConfiguredFirstSaleGate();

      if (!firstSaleGate) {
        return webhookResponse({ error: "First-sale fulfillment is not configured." }, 503);
      }

      // The paid event locks sales and grants access in one DB transaction.
      // Refunds, disputes and stale webhooks never call the owner-only reopen path.
      result = await firstSaleGate.applyPaidEventAndEntitlement({
        receipt,
        command: {
          ...entitlementCommand,
          action: "grant",
          productCode: FIRST_SALE_PRODUCT_CODE,
          checkoutSessionId: entitlementCommand.checkoutSessionId,
          currency: "aud",
          amountTotal: 1990,
        },
      });
    } else {
      result = await entitlementStore.applyStripeEvent({
        receipt,
        command: entitlementCommand,
      });
    }

    console.info("Persisted Stripe entitlement event", {
      eventRef: stripeReferenceSuffix(event.id),
      type: event.type,
      outcome: result.outcome,
      entitlementAction: entitlementCommand.action,
    });

    if ((result.outcome === "processed" || result.outcome === "tombstoned") && paymentAlertsConfigured()) {
      after(async () => {
        try {
          const notification = await sendStripeOperatorAlert(event);
          console.info("Handled Stripe operator alert", {
            eventRef: stripeReferenceSuffix(event.id),
            type: event.type,
            outcome: notification.outcome,
          });
        } catch (error) {
          // Entitlement delivery must stay independent from an operator email outage.
          console.error("Unable to send Stripe operator alert", {
            eventRef: stripeReferenceSuffix(event.id),
            type: event.type,
            message: error instanceof Error ? error.message : "Unknown error",
          });
        }
      });
    }

    return webhookResponse({ received: true, testOnly: !event.livemode, persisted: true, outcome: result.outcome });
  } catch {
    console.error("Unable to persist Stripe entitlement event", {
      eventRef: stripeReferenceSuffix(event.id),
      type: event.type,
      category: "payment_persistence",
    });

    if (
      entitlementCommand.action === "grant"
      && entitlementCommand.productCode === FIRST_SALE_PRODUCT_CODE
      && paymentAlertsConfigured()
    ) {
      after(async () => {
        try {
          await sendStripeOperatorAlert(event);
        } catch {
          console.error("Unable to send failed-payment operator alert", {
            eventRef: stripeReferenceSuffix(event.id),
            type: event.type,
          });
        }
      });
    }

    return webhookResponse({ error: "Entitlement persistence failed." }, 503);
  }
}
