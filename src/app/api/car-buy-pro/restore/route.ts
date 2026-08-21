import { NextRequest, NextResponse } from "next/server";
import { hashCarBuyProRestore, setCarBuyProAccessCookie } from "@/lib/carBuyProAccess";
import { getConfiguredEntitlementStore } from "@/lib/neonEntitlementStore";
import { validateSameOriginMutation } from "@/lib/requestSecurity";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const check = validateSameOriginMutation(request, { maxBodyBytes: 2 * 1024, allowedContentTypes: ["application/x-www-form-urlencoded", "multipart/form-data"] });
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status, headers: { "Cache-Control": "no-store" } });
  const formData = await request.formData();
  const code = String(formData.get("restore_code") ?? "").trim();
  const store = getConfiguredEntitlementStore();
  if (!store || code.length < 32 || code.length > 128) return NextResponse.redirect(new URL("/car-buy-pro/restore?status=invalid", request.url), 303);
  const entitlement = await store.consumeRestoreTokenHash(hashCarBuyProRestore(code), "car_buy_pro");
  if (!entitlement || entitlement.productCode !== "car_buy_pro" || entitlement.status !== "active") return NextResponse.redirect(new URL("/car-buy-pro/restore?status=invalid", request.url), 303);
  await setCarBuyProAccessCookie(entitlement);
  return NextResponse.redirect(new URL("/car-buy-pro/workspace", request.url), 303);
}
