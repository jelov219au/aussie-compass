import { NextRequest, NextResponse } from "next/server";

import { getConfiguredEntitlementStore } from "@/lib/neonEntitlementStore";
import { clearResumeProAccessCookie, getResumeProAccessPayload } from "@/lib/resumeProAccess";
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

  const payload = await getResumeProAccessPayload();
  if (payload) {
    const store = getConfiguredEntitlementStore();
    if (!store || !await store.releaseCheckoutActivation({
      entitlementId: payload.entitlementId,
      productCode: "resume_pro",
    })) {
      return NextResponse.json({ error: "Unable to release this device." }, {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      });
    }
  }
  await clearResumeProAccessCookie();
  if (request.headers.get("x-hoju-compass-mutation") === "device-purge") {
    return NextResponse.json({ released: true }, {
      headers: { "Cache-Control": "no-store" },
    });
  }
  return NextResponse.redirect(new URL("/resume-pro?access=released", request.url), 303);
}
