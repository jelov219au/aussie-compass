import { NextRequest, NextResponse } from "next/server";

import { getConfiguredEntitlementStore } from "@/lib/neonEntitlementStore";
import {
  createLeavingAustraliaRestoreCode,
  getActiveLeavingAustraliaProEntitlement,
} from "@/lib/leavingAustraliaProAccess";
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

  const entitlement = await getActiveLeavingAustraliaProEntitlement();
  const store = getConfiguredEntitlementStore();
  if (!entitlement || !store) {
    return NextResponse.json({ error: "Active Leaving Australia Pack Pro access is required." }, {
      status: 401,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const restore = createLeavingAustraliaRestoreCode();
  await store.createRestoreTokenHash({
    entitlementId: entitlement.id,
    productCode: "leaving_australia_pro",
    tokenHash: restore.tokenHash,
    expiresAt: restore.expiresAt,
  });

  return NextResponse.json({ code: restore.token, expiresAt: restore.expiresAt.toISOString() }, {
    headers: { "Cache-Control": "no-store" },
  });
}
