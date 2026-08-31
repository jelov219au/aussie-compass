import { NextRequest, NextResponse } from "next/server";

import { getConfiguredEntitlementStore } from "@/lib/neonEntitlementStore";
import {
  clearLeavingAustraliaProAccessCookie,
  getLeavingAustraliaProAccessPayload,
  hashLeavingAustraliaAccessSessionId,
} from "@/lib/leavingAustraliaProAccess";
import { validateSameOriginMutation } from "@/lib/requestSecurity";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const requestCheck = await validateSameOriginMutation(request, { maxBodyBytes: 1024 });
  if (!requestCheck.ok) {
    return NextResponse.json({ code: "release_request_rejected" }, {
      status: requestCheck.status,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const payload = await getLeavingAustraliaProAccessPayload();
  if (payload) {
    const store = getConfiguredEntitlementStore();
    if (!store || !await store.releaseAccessSession({
      entitlementId: payload.entitlementId,
      productCode: "leaving_australia_pro",
      accessSessionHash: hashLeavingAustraliaAccessSessionId(payload.accessSessionId),
    })) {
      return NextResponse.json({ code: "release_unavailable" }, {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      });
    }
  }
  await clearLeavingAustraliaProAccessCookie();
  const wantsJson = request.headers.get("accept")?.includes("application/json")
    || request.headers.get("x-hoju-compass-mutation") === "device-purge";
  if (wantsJson) {
    return NextResponse.json({ released: true, destination: "/leaving-australia-pro?access=released" }, {
      headers: { "Cache-Control": "no-store" },
    });
  }
  return NextResponse.redirect(new URL("/leaving-australia-pro?access=released", request.url), 303);
}
