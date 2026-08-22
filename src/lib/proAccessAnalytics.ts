import "server-only";

import { track } from "@vercel/analytics/server";

type ProductCode = "resume_pro" | "rental_application_pro";
type AccessFlow = "activate" | "restore";
type FailureReason =
  | "activate_checkout_unavailable"
  | "activate_entitlement_pending"
  | "restore_invalid"
  | "restore_denied";

async function safelyTrack(name: "Pro Access Attempted" | "Pro Access Failed", properties: Record<string, string>) {
  try {
    await track(name, properties);
  } catch {
    // Access must never depend on analytics availability.
  }
}

export async function trackProAccessAttempt(product: ProductCode, flow: AccessFlow) {
  await safelyTrack("Pro Access Attempted", { product, flow });
}

export async function trackProAccessFailure(product: ProductCode, reason: FailureReason) {
  await safelyTrack("Pro Access Failed", { product, reason });
}
