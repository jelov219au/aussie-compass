import { NextRequest, NextResponse } from "next/server";

import { getConfiguredEntitlementStore } from "@/lib/neonEntitlementStore";
import {
  clearPayEvidenceProAccessCookie,
  getPayEvidenceProAccessPayload,
  hashPayEvidenceAccessSessionId,
} from "@/lib/payEvidenceProAccess";
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

  const payload = await getPayEvidenceProAccessPayload();
  if (payload) {
    const store = getConfiguredEntitlementStore();
    if (!store || !await store.releaseAccessSession({
      entitlementId: payload.entitlementId,
      productCode: "pay_evidence_pro",
      accessSessionHash: hashPayEvidenceAccessSessionId(payload.accessSessionId),
    })) {
      return NextResponse.json({ code: "release_unavailable" }, {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      });
    }
  }
  await clearPayEvidenceProAccessCookie();
  const wantsJson = request.headers.get("accept")?.includes("application/json")
    || request.headers.get("x-hoju-compass-mutation") === "device-purge";
  if (wantsJson) {
    return NextResponse.json({ released: true, destination: "/pay-evidence-pro?access=released" }, {
      headers: { "Cache-Control": "no-store" },
    });
  }
  return NextResponse.redirect(new URL("/pay-evidence-pro?access=released", request.url), 303);
}
