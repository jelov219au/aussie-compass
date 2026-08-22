import { NextRequest, NextResponse } from "next/server";

import { getConfiguredEntitlementStore } from "@/lib/neonEntitlementStore";
import {
  hashRentalApplicationRestoreCode,
  setRentalApplicationProAccessCookie,
} from "@/lib/rentalApplicationProAccess";
import { validateSameOriginMutation } from "@/lib/requestSecurity";
import { trackProAccessAttempt, trackProAccessFailure } from "@/lib/proAccessAnalytics";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const requestCheck = validateSameOriginMutation(request, {
    maxBodyBytes: 2 * 1024,
    allowedContentTypes: ["application/x-www-form-urlencoded", "multipart/form-data"],
  });
  if (!requestCheck.ok) {
    return NextResponse.json({ error: requestCheck.error }, {
      status: requestCheck.status,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const formData = await request.formData();
  await trackProAccessAttempt("rental_application_pro", "restore");
  const code = String(formData.get("restore_code") ?? "").trim();
  const store = getConfiguredEntitlementStore();
  if (!store || code.length < 32 || code.length > 128) {
    await trackProAccessFailure("rental_application_pro", "restore_invalid");
    return NextResponse.redirect(new URL("/rental-application-pro/restore?status=invalid", request.url), 303);
  }

  const entitlement = await store.consumeRestoreTokenHash(hashRentalApplicationRestoreCode(code), "rental_application_pro");
  if (!entitlement || entitlement.productCode !== "rental_application_pro" || entitlement.status !== "active") {
    await trackProAccessFailure("rental_application_pro", "restore_denied");
    return NextResponse.redirect(new URL("/rental-application-pro/restore?status=invalid", request.url), 303);
  }

  await setRentalApplicationProAccessCookie(entitlement);
  return NextResponse.redirect(new URL("/rental-application-pro/workspace", request.url), 303);
}
