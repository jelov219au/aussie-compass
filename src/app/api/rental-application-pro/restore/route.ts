import { NextRequest, NextResponse } from "next/server";
import { getConfiguredEntitlementStore } from "@/lib/neonEntitlementStore";
import { hashRentalRestoreCode, setRentalProAccessCookie } from "@/lib/rentalProAccess";
import { validateSameOriginMutation } from "@/lib/requestSecurity";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const check = validateSameOriginMutation(request, { maxBodyBytes: 2 * 1024, allowedContentTypes: ["application/x-www-form-urlencoded", "multipart/form-data"] });
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status, headers: { "Cache-Control": "no-store" } });
  const code = String((await request.formData()).get("restore_code") ?? "").trim();
  const store = getConfiguredEntitlementStore();
  if (!store || code.length < 32 || code.length > 128) return NextResponse.redirect(new URL("/rental-application-pro/restore?status=invalid", request.url), 303);
  const entitlement = await store.consumeRestoreTokenHash(hashRentalRestoreCode(code), "rental_application_pro");
  if (!entitlement || entitlement.productCode !== "rental_application_pro" || entitlement.status !== "active") return NextResponse.redirect(new URL("/rental-application-pro/restore?status=invalid", request.url), 303);
  await setRentalProAccessCookie(entitlement);
  return NextResponse.redirect(new URL("/rental-application-pro/workspace", request.url), 303);
}
