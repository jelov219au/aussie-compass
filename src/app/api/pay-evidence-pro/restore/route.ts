import { NextRequest, NextResponse } from "next/server";
import { getConfiguredEntitlementStore } from "@/lib/neonEntitlementStore";
import { hashPayEvidenceRestore, setPayEvidenceAccessCookie } from "@/lib/payEvidenceAccess";
import { validateSameOriginMutation } from "@/lib/requestSecurity";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const check = validateSameOriginMutation(request, { maxBodyBytes: 2 * 1024, allowedContentTypes: ["application/x-www-form-urlencoded", "multipart/form-data"] });
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status, headers: { "Cache-Control": "no-store" } });
  const formData = await request.formData();
  const code = String(formData.get("restore_code") ?? "").trim();
  const store = getConfiguredEntitlementStore();
  if (!store || code.length < 32 || code.length > 128) return NextResponse.redirect(new URL("/pay-evidence-pro/restore?status=invalid", request.url), 303);
  const entitlement = await store.consumeRestoreTokenHash(hashPayEvidenceRestore(code), "pay_evidence_pro");
  if (!entitlement || entitlement.productCode !== "pay_evidence_pro" || entitlement.status !== "active") return NextResponse.redirect(new URL("/pay-evidence-pro/restore?status=invalid", request.url), 303);
  await setPayEvidenceAccessCookie(entitlement);
  return NextResponse.redirect(new URL("/pay-evidence-pro/workspace", request.url), 303);
}
