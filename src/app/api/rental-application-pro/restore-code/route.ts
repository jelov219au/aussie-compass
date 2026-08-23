import { NextRequest, NextResponse } from "next/server";

import { getConfiguredEntitlementStore } from "@/lib/neonEntitlementStore";
import {
  createRentalApplicationRestoreCode,
  getActiveRentalApplicationProEntitlement,
} from "@/lib/rentalApplicationProAccess";
import { validateSameOriginMutation } from "@/lib/requestSecurity";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const requestCheck = await validateSameOriginMutation(request, { maxBodyBytes: 1024 });
  if (!requestCheck.ok) {
    return NextResponse.json({ error: requestCheck.error }, {
      status: requestCheck.status,
      headers: { "Cache-Control": "no-store" },
    });
  }

  if (process.env.VERCEL_ENV === "production") {
    return NextResponse.json({ error: "Rental Application Pack Pro access is not available." }, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const entitlement = await getActiveRentalApplicationProEntitlement();
  const store = getConfiguredEntitlementStore();
  if (!entitlement || !store) {
    return NextResponse.json({ error: "Active Rental Application Pack Pro access is required." }, {
      status: 401,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const restore = createRentalApplicationRestoreCode();
  await store.createRestoreTokenHash({
    entitlementId: entitlement.id,
    productCode: "rental_application_pro",
    tokenHash: restore.tokenHash,
    expiresAt: restore.expiresAt,
  });

  return NextResponse.json({ code: restore.token, expiresAt: restore.expiresAt.toISOString() }, {
    headers: { "Cache-Control": "no-store" },
  });
}
