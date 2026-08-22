import { NextRequest, NextResponse } from "next/server";

import { getConfiguredEntitlementStore } from "@/lib/neonEntitlementStore";
import { validateSameOriginMutation } from "@/lib/requestSecurity";
import { isEntitlementSessionConfigured, setResumeProAccessCookie } from "@/lib/resumeProAccess";
import { getVerifiedResumeProCheckout } from "@/lib/resumeProPurchase";

export const runtime = "nodejs";

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
  const session = await getVerifiedResumeProCheckout(sessionId);
  const store = getConfiguredEntitlementStore();

  const customerId = typeof session?.customer === "string" ? session.customer : session?.customer?.id;

  if (!session || !store || !customerId || !isEntitlementSessionConfigured()) {
    return NextResponse.redirect(new URL("/resume-pro/success?status=unavailable", request.url), 303);
  }

  try {
    const entitlement = await store.consumeCheckoutActivation({
      checkoutSessionId: session.id,
      productCode: "resume_pro",
      customerId,
    });
    if (!entitlement) {
      const active = await store.findActiveByCheckoutSession(session.id, "resume_pro");
      const destination = active
        ? "/resume-pro/restore?status=activation-used"
        : `/resume-pro/success?session_id=${encodeURIComponent(session.id)}&status=pending`;
      return NextResponse.redirect(new URL(destination, request.url), 303);
    }

    await setResumeProAccessCookie(entitlement);
    return NextResponse.redirect(new URL("/resume-pro/workspace", request.url), 303);
  } catch {
    return NextResponse.redirect(new URL("/resume-pro/success?status=unavailable", request.url), 303);
  }
}
