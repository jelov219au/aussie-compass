import { NextRequest, NextResponse } from "next/server";

import { getConfiguredEntitlementStore } from "@/lib/neonEntitlementStore";
import { validateSameOriginMutation } from "@/lib/requestSecurity";
import { createRestoreCode, getActiveResumeProEntitlement } from "@/lib/resumeProAccess";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const requestCheck = validateSameOriginMutation(request, { maxBodyBytes: 1024 });
  if (!requestCheck.ok) {
    return NextResponse.json({ error: requestCheck.error }, {
      status: requestCheck.status,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const entitlement = await getActiveResumeProEntitlement();
  const store = getConfiguredEntitlementStore();
  if (!entitlement || !store) {
    return NextResponse.json({ error: "Active Resume Pro access is required." }, {
      status: 401,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const restore = createRestoreCode();
  await store.createRestoreTokenHash({
    entitlementId: entitlement.id,
    tokenHash: restore.tokenHash,
    expiresAt: restore.expiresAt,
  });

  return NextResponse.json({ code: restore.token, expiresAt: restore.expiresAt.toISOString() }, {
    headers: { "Cache-Control": "no-store" },
  });
}
