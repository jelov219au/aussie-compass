import { NextRequest, NextResponse } from "next/server";

import { getConfiguredEntitlementStore } from "@/lib/neonEntitlementStore";
import { setRentalApplicationProAccessCookie } from "@/lib/rentalApplicationProAccess";
import { getVerifiedRentalApplicationProCheckout } from "@/lib/rentalApplicationProPurchase";
import { validateSameOriginMutation } from "@/lib/requestSecurity";

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

  if (process.env.VERCEL_ENV === "production") {
    return NextResponse.redirect(new URL("/rental-application-pro/success?status=unavailable", request.url), 303);
  }

  const formData = await request.formData();
  const sessionId = String(formData.get("session_id") ?? "").trim();
  const session = await getVerifiedRentalApplicationProCheckout(sessionId);
  const store = getConfiguredEntitlementStore();

  if (!session || !store) {
    return NextResponse.redirect(new URL("/rental-application-pro/success?status=unavailable", request.url), 303);
  }

  const entitlement = await store.findActiveByCheckoutSession(session.id, "rental_application_pro");
  if (!entitlement) {
    return NextResponse.redirect(new URL(`/rental-application-pro/success?session_id=${encodeURIComponent(session.id)}&status=pending`, request.url), 303);
  }

  await setRentalApplicationProAccessCookie(entitlement);
  return NextResponse.redirect(new URL("/rental-application-pro/workspace", request.url), 303);
}
