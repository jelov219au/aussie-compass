import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { getConfiguredEntitlementStore } from "@/lib/neonEntitlementStore";
import {
  createEofyAccessSession,
  isEofyEntitlementSessionConfigured,
  setEofyProAccessCookie,
} from "@/lib/eofyProAccess";
import { getVerifiedEofyProCheckout } from "@/lib/eofyProPurchase";
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
    return activationResponse(request, "activation_unavailable", "/eofy-pro/success?status=unavailable", 400);
  }
  const session = await getVerifiedEofyProCheckout(sessionId);
  const store = getConfiguredEntitlementStore();
  const customerId = typeof session?.customer === "string" ? session.customer : session?.customer?.id;

  if (!session || !store || !customerId || !isEofyEntitlementSessionConfigured()) {
    return activationResponse(request, "activation_unavailable", "/eofy-pro/success?status=unavailable", 503);
  }

  try {
    const nonceHash = createHash("sha256").update(activationNonce).digest("hex");
    const accessSession = createEofyAccessSession("activation", nonceHash);
    const result = await store.consumeCheckoutActivation({
      checkoutSessionId: session.id,
      productCode: "eofy_pro",
      customerId,
      nonceHash,
      accessSession,
    });
    if ((result.outcome === "consumed" || result.outcome === "idempotent") && result.entitlement) {
      await setEofyProAccessCookie(result.entitlement, accessSession.accessSessionId);
      return activationResponse(request, "activation_ready", "/eofy-pro/workspace", 200);
    }

    const destination = result.outcome === "revoked"
      ? "/eofy-pro/success?status=refunded"
      : result.outcome === "review"
        ? "/eofy-pro/success?status=review"
        : result.outcome === "released"
          ? "/eofy-pro/restore?status=activation-released"
          : result.outcome === "used"
            ? "/eofy-pro/restore?status=activation-used"
            : "/eofy-pro/success?status=pending";
    return activationResponse(request, `activation_${result.outcome}`, destination);
  } catch {
    return activationResponse(request, "activation_unavailable", "/eofy-pro/success?status=unavailable", 503);
  }
}
