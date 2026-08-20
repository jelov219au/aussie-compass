import { NextRequest, NextResponse } from "next/server";
import { getConfiguredEntitlementStore } from "@/lib/neonEntitlementStore";
import { setPayEvidenceAccessCookie } from "@/lib/payEvidenceAccess";
import { getVerifiedPayEvidenceCheckout } from "@/lib/payEvidencePurchase";
import { validateSameOriginMutation } from "@/lib/requestSecurity";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const check = validateSameOriginMutation(request, { maxBodyBytes: 2 * 1024, allowedContentTypes: ["application/x-www-form-urlencoded", "multipart/form-data"] });
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status, headers: { "Cache-Control": "no-store" } });
  const formData = await request.formData();
  const sessionId = String(formData.get("session_id") ?? "").trim();
  const session = await getVerifiedPayEvidenceCheckout(sessionId);
  const store = getConfiguredEntitlementStore();
  if (!session || !store) return NextResponse.redirect(new URL("/pay-evidence-pro/success?status=unavailable", request.url), 303);
  const entitlement = await store.findActiveByCheckoutSession(session.id, "pay_evidence_pro");
  if (!entitlement) return NextResponse.redirect(new URL(`/pay-evidence-pro/success?session_id=${encodeURIComponent(session.id)}&status=pending`, request.url), 303);
  await setPayEvidenceAccessCookie(entitlement);
  return NextResponse.redirect(new URL("/pay-evidence-pro/workspace", request.url), 303);
}
