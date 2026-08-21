import { NextRequest, NextResponse } from "next/server";
import { hashEofyProRestore, setEofyProAccessCookie } from "@/lib/eofyProAccess";
import { getConfiguredEntitlementStore } from "@/lib/neonEntitlementStore";
import { validateSameOriginMutation } from "@/lib/requestSecurity";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const check = validateSameOriginMutation(request, { maxBodyBytes: 2 * 1024, allowedContentTypes: ["application/x-www-form-urlencoded", "multipart/form-data"] });
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status, headers: { "Cache-Control": "no-store" } });
  const formData = await request.formData();
  const code = String(formData.get("restore_code") ?? "").trim();
  const store = getConfiguredEntitlementStore();
  if (!store || code.length < 32 || code.length > 128) return NextResponse.redirect(new URL("/eofy-pro/restore?status=invalid", request.url), 303);
  const entitlement = await store.consumeRestoreTokenHash(hashEofyProRestore(code), "eofy_pro");
  if (!entitlement || entitlement.productCode !== "eofy_pro" || entitlement.status !== "active") return NextResponse.redirect(new URL("/eofy-pro/restore?status=invalid", request.url), 303);
  await setEofyProAccessCookie(entitlement);
  return NextResponse.redirect(new URL("/eofy-pro/workspace", request.url), 303);
}
