import { NextRequest, NextResponse } from "next/server";
import { getConfiguredEntitlementStore } from "@/lib/neonEntitlementStore";
import { setRentalProAccessCookie } from "@/lib/rentalProAccess";
import { getVerifiedRentalProCheckout } from "@/lib/rentalProPurchase";
import { validateSameOriginMutation } from "@/lib/requestSecurity";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const check = validateSameOriginMutation(request, { maxBodyBytes: 2 * 1024, allowedContentTypes: ["application/x-www-form-urlencoded", "multipart/form-data"] });
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status, headers: { "Cache-Control": "no-store" } });
  const sessionId = String((await request.formData()).get("session_id") ?? "").trim();
  const session = await getVerifiedRentalProCheckout(sessionId);
  const store = getConfiguredEntitlementStore();
  if (!session || !store) return NextResponse.redirect(new URL("/rental-application-pro/success?status=unavailable", request.url), 303);
  const entitlement = await store.findActiveByCheckoutSession(session.id, "rental_application_pro");
  if (!entitlement) return NextResponse.redirect(new URL(`/rental-application-pro/success?session_id=${encodeURIComponent(session.id)}&status=pending`, request.url), 303);
  await setRentalProAccessCookie(entitlement);
  return NextResponse.redirect(new URL("/rental-application-pro/workspace", request.url), 303);
}
