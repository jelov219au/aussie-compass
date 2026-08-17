import { NextRequest, NextResponse } from "next/server";

import { getConfiguredEntitlementStore } from "@/lib/neonEntitlementStore";
import { createRestoreCode, getActiveResumeProEntitlement } from "@/lib/resumeProAccess";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const entitlement = await getActiveResumeProEntitlement();
  const store = getConfiguredEntitlementStore();
  if (!entitlement || !store) {
    return NextResponse.json({ error: "Active Resume Pro access is required." }, { status: 401 });
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
