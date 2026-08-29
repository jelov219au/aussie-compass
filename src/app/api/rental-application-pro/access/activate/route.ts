import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { getConfiguredEntitlementStore } from "@/lib/neonEntitlementStore";
import {
  createRentalApplicationAccessSession,
  isRentalApplicationEntitlementSessionConfigured,
  setRentalApplicationProAccessCookie,
} from "@/lib/rentalApplicationProAccess";
import { getVerifiedRentalApplicationProCheckout } from "@/lib/rentalApplicationProPurchase";
import { validateSameOriginMutation } from "@/lib/requestSecurity";

export const runtime = "nodejs";

const activationNoncePattern = /^[A-Za-z0-9_-]{40,128}$/;

function activationResponse(request: NextRequest, code: string, destination: string, status = 409) {
  if (request.headers.get("accept")?.includes("application/json")) {
    return NextResponse.json({ code, destination }, {
      status,
      headers: { "Cache-Control": "no-store" },
    });
  }
  return NextResponse.redirect(new URL(destination, request.url), 303);
}

export async function POST(request: NextRequest) {
  const requestCheck = await validateSameOriginMutation(request, {
    maxBodyBytes: 2 * 1024,
    allowedContentTypes: ["application/x-www-form-urlencoded", "multipart/form-data"],
  });
  if (!requestCheck.ok) {
    return NextResponse.json({ error: requestCheck.error }, {
      status: requestCheck.status,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const formData = await request.formData();
  const sessionId = String(formData.get("session_id") ?? "").trim();
  const activationNonce = String(formData.get("activation_nonce") ?? "").trim();
  if (!activationNoncePattern.test(activationNonce)) {
    return activationResponse(request, "activation_unavailable", "/rental-application-pro/success?status=unavailable", 400);
  }
  const session = await getVerifiedRentalApplicationProCheckout(sessionId);
  const store = getConfiguredEntitlementStore();
  const customerId = typeof session?.customer === "string" ? session.customer : session?.customer?.id;

  if (!session || !store || !customerId || !isRentalApplicationEntitlementSessionConfigured()) {
    return activationResponse(request, "activation_unavailable", "/rental-application-pro/success?status=unavailable", 503);
  }

  try {
    const nonceHash = createHash("sha256").update(activationNonce).digest("hex");
    const accessSession = createRentalApplicationAccessSession("activation", nonceHash);
    const result = await store.consumeCheckoutActivation({
      checkoutSessionId: session.id,
      productCode: "rental_application_pro",
      customerId,
      nonceHash,
      accessSession,
    });
    if ((result.outcome === "consumed" || result.outcome === "idempotent") && result.entitlement) {
      await setRentalApplicationProAccessCookie(result.entitlement, accessSession.accessSessionId);
      return activationResponse(request, "activation_ready", "/rental-application-pro/workspace", 200);
    }

    const destination = result.outcome === "revoked"
      ? "/rental-application-pro/success?status=refunded"
      : result.outcome === "review"
        ? "/rental-application-pro/success?status=review"
        : result.outcome === "released"
          ? "/rental-application-pro/restore?status=activation-released"
          : result.outcome === "used"
            ? "/rental-application-pro/restore?status=activation-used"
            : "/rental-application-pro/success?status=pending";
    return activationResponse(request, `activation_${result.outcome}`, destination);
  } catch {
    return activationResponse(request, "activation_unavailable", "/rental-application-pro/success?status=unavailable", 503);
  }
}
