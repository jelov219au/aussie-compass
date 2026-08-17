import { NextRequest, NextResponse } from "next/server";

import { getConfiguredEntitlementStore } from "@/lib/neonEntitlementStore";
import { setResumeProAccessCookie } from "@/lib/resumeProAccess";
import { getVerifiedResumeProCheckout } from "@/lib/resumeProPurchase";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const formData = await request.formData();
  const sessionId = String(formData.get("session_id") ?? "").trim();
  const session = await getVerifiedResumeProCheckout(sessionId);
  const store = getConfiguredEntitlementStore();

  if (!session || !store) {
    return NextResponse.redirect(new URL("/resume-pro/success?status=unavailable", request.url), 303);
  }

  const entitlement = await store.findActiveByCheckoutSession(session.id);
  if (!entitlement) {
    return NextResponse.redirect(new URL(`/resume-pro/success?session_id=${encodeURIComponent(session.id)}&status=pending`, request.url), 303);
  }

  await setResumeProAccessCookie(entitlement);
  return NextResponse.redirect(new URL("/resume-pro/workspace", request.url), 303);
}
