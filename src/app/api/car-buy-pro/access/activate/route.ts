import { NextRequest, NextResponse } from "next/server";
import { setCarBuyProAccessCookie } from "@/lib/carBuyProAccess";
import { getVerifiedCarBuyProCheckout } from "@/lib/carBuyProPurchase";
import { getConfiguredEntitlementStore } from "@/lib/neonEntitlementStore";
import { validateSameOriginMutation } from "@/lib/requestSecurity";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const check = validateSameOriginMutation(request, { maxBodyBytes: 2 * 1024, allowedContentTypes: ["application/x-www-form-urlencoded", "multipart/form-data"] });
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status, headers: { "Cache-Control": "no-store" } });
  const formData = await request.formData();
  const sessionId = String(formData.get("session_id") ?? "").trim();
  const session = await getVerifiedCarBuyProCheckout(sessionId);
  const store = getConfiguredEntitlementStore();
  if (!session || !store) return NextResponse.redirect(new URL("/car-buy-pro/success?status=unavailable", request.url), 303);
  const entitlement = await store.findActiveByCheckoutSession(session.id, "car_buy_pro");
  if (!entitlement) return NextResponse.redirect(new URL(`/car-buy-pro/success?session_id=${encodeURIComponent(session.id)}&status=pending`, request.url), 303);
  await setCarBuyProAccessCookie(entitlement);
  return NextResponse.redirect(new URL("/car-buy-pro/workspace", request.url), 303);
}
