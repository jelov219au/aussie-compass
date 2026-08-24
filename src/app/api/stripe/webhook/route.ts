import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

import { getEntitlementCommand } from "@/lib/entitlements";
import { matchesCheckoutProductEntitlementContract } from "@/lib/productEntitlementContract";
import { getConfiguredEntitlementStore } from "@/lib/neonEntitlementStore";
import { FIRST_SALE_PRODUCT_CODE } from "@/lib/firstSaleGate";
import { FirstSalePaymentIntentContractError, verifyFirstSalePaymentIntent } from "@/lib/firstSalePaymentIntent";
import { getConfiguredFirstSaleGate } from "@/lib/neonFirstSaleGate";
import { getConfiguredPaymentAlertOutbox } from "@/lib/neonPaymentAlertOutbox";
import {
  deliverDurablePaymentOperatorAlert,
  getPaymentOperatorAlertKind,
} from "@/lib/paymentAlertOutbox";
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

  if (!matchesCheckoutProductEntitlementContract(entitlementCommand)) {
    console.warn("Rejected Stripe checkout entitlement with a product contract mismatch", {
      eventRef: stripeReferenceSuffix(event.id),
      type: event.type,
    });
    return webhookResponse({ error: "Checkout product entitlement mismatch." }, 503);
  }

  const entitlementStore = getConfiguredEntitlementStore();
  const alertOutbox = getConfiguredPaymentAlertOutbox();

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

  let entitlementPersisted = false;

  try {
    const receipt = {
      eventId: event.id,
      eventType: event.type,
      livemode: event.livemode,
      createdAt: new Date(event.created * 1000),
    };
    let result: { outcome: "processed" | "duplicate" | "ignored_stale" | "tombstoned" };

    if (entitlementCommand.action === "grant" && entitlementCommand.productCode === FIRST_SALE_PRODUCT_CODE) {
      const firstSaleGate = getConfiguredFirstSaleGate();

      if (!firstSaleGate) {
        return webhookResponse({ error: "First-sale fulfillment is not configured." }, 503);
      }

      if (
        !entitlementCommand.checkoutSessionId
        || !entitlementCommand.paymentIntentId
        || !entitlementCommand.customerId
        || entitlementCommand.currency !== "aud"
        || entitlementCommand.amountTotal !== 1990
      ) {
        throw new FirstSalePaymentIntentContractError();
      }

      // Resolve latest_charge before the database call. The charge and
      // PaymentIntent are then stored in the same atomic gate+grant transaction,
      // allowing charge-only refunds/disputes to serialize with the first grant.
      const paymentIntent = await getStripe().paymentIntents.retrieve(entitlementCommand.paymentIntentId);
      const chargeId = verifyFirstSalePaymentIntent(paymentIntent, {
        paymentIntentId: entitlementCommand.paymentIntentId,
        customerId: entitlementCommand.customerId,
        livemode: event.livemode,
        currency: "aud",
        amountCents: 1990,
      });

      // The paid event locks sales and grants access in one DB transaction.
      // Refunds, disputes and stale webhooks never call the owner-only reopen path.
      result = await firstSaleGate.applyPaidEventAndEntitlement({
        receipt,
        command: {
          ...entitlementCommand,
          action: "grant",
          productCode: FIRST_SALE_PRODUCT_CODE,
          checkoutSessionId: entitlementCommand.checkoutSessionId,
          paymentIntentId: entitlementCommand.paymentIntentId,
          chargeId,
          customerId: entitlementCommand.customerId,
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
    entitlementPersisted = true;

    const alertKind = getPaymentOperatorAlertKind(event);
    if (alertKind) {
      if (!alertOutbox || !paymentAlertsConfigured()) {
        if (event.livemode) throw new Error("Payment operator alert delivery is unavailable.");
      } else {
        const notification = await deliverDurablePaymentOperatorAlert(
          event,
          alertKind,
          alertOutbox,
          sendStripeOperatorAlert,
        );
        if (notification.outcome === "busy") {
          throw new Error("The payment operator alert is leased by another worker.");
        }
        console.info("Handled durable Stripe operator alert", {
          eventRef: stripeReferenceSuffix(event.id),
          type: event.type,
          outcome: notification.outcome,
        });
      }
    }

    return webhookResponse({ received: true, testOnly: !event.livemode, persisted: true, outcome: result.outcome });
  } catch {
    console.error(entitlementPersisted
      ? "Unable to deliver durable Stripe operator alert"
      : "Unable to persist Stripe entitlement event", {
      eventRef: stripeReferenceSuffix(event.id),
      type: event.type,
      category: entitlementPersisted ? "payment_alert_delivery" : "payment_persistence",
    });

    if (
      !entitlementPersisted
      && entitlementCommand.action === "grant"
      && entitlementCommand.productCode === FIRST_SALE_PRODUCT_CODE
      && alertOutbox
    ) {
      try {
        if (entitlementCommand.checkoutSessionId && entitlementCommand.paymentIntentId) {
          await alertOutbox.enqueueFulfillmentAttention({
            eventId: event.id,
            eventType: event.type,
            livemode: event.livemode,
            productCode: FIRST_SALE_PRODUCT_CODE,
            checkoutSessionId: entitlementCommand.checkoutSessionId,
            paymentIntentId: entitlementCommand.paymentIntentId,
          });
          if (paymentAlertsConfigured()) {
            const notification = await deliverDurablePaymentOperatorAlert(
              event,
              "fulfillment_attention",
              alertOutbox,
              sendStripeOperatorAlert,
            );
            if (notification.outcome === "busy") {
              throw new Error("The fulfillment alert is leased by another worker.");
            }
          }
        }
      } catch {
        // The response remains 503. Stripe retries the signed event; a durable
        // pending intent, when present, is claimed again without reapplying the
        // entitlement mutation.
        console.error("Unable to persist or deliver fulfillment alert", {
          eventRef: stripeReferenceSuffix(event.id),
          type: event.type,
        });
      }
    }

    return webhookResponse({ error: "Entitlement persistence failed." }, 503);
  }
}
