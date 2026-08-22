import { NextRequest, NextResponse } from "next/server";

import { getConfiguredEntitlementStore } from "@/lib/neonEntitlementStore";
import { validateSameOriginMutation } from "@/lib/requestSecurity";
import { setResumeProAccessCookie } from "@/lib/resumeProAccess";
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

  if (!session || !store) {
    return NextResponse.redirect(new URL("/resume-pro/success?status=unavailable", request.url), 303);
  }

  const entitlement = await store.findActiveByCheckoutSession(session.id, "resume_pro");
  if (!entitlement) {
    return NextResponse.redirect(new URL(`/resume-pro/success?session_id=${encodeURIComponent(session.id)}&status=pending`, request.url), 303);
  }

  await setResumeProAccessCookie(entitlement);
  return NextResponse.redirect(new URL("/resume-pro/workspace", request.url), 303);
}
