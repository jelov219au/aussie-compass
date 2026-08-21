import { NextRequest, NextResponse } from "next/server";
import { setEofyProAccessCookie } from "@/lib/eofyProAccess";
import { getVerifiedEofyProCheckout } from "@/lib/eofyProPurchase";
import { getConfiguredEntitlementStore } from "@/lib/neonEntitlementStore";
import { validateSameOriginMutation } from "@/lib/requestSecurity";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const check = validateSameOriginMutation(request, { maxBodyBytes: 2 * 1024, allowedContentTypes: ["application/x-www-form-urlencoded", "multipart/form-data"] });
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status, headers: { "Cache-Control": "no-store" } });
  const formData = await request.formData();
  const sessionId = String(formData.get("session_id") ?? "").trim();
  const session = await getVerifiedEofyProCheckout(sessionId);
  const store = getConfiguredEntitlementStore();
  if (!session || !store) return NextResponse.redirect(new URL("/eofy-pro/success?status=unavailable", request.url), 303);
  const entitlement = await store.findActiveByCheckoutSession(session.id, "eofy_pro");
  if (!entitlement) return NextResponse.redirect(new URL(`/eofy-pro/success?session_id=${encodeURIComponent(session.id)}&status=pending`, request.url), 303);
  await setEofyProAccessCookie(entitlement);
  return NextResponse.redirect(new URL("/eofy-pro/workspace", request.url), 303);
}
