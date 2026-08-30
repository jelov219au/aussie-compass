import { NextRequest, NextResponse } from "next/server";

import { getConfiguredEntitlementStore } from "@/lib/neonEntitlementStore";
import {
  createPayEvidenceRestoreAccessSession,
  hashPayEvidenceRestoreCode,
  setPayEvidenceProAccessCookie,
} from "@/lib/payEvidenceProAccess";
import { validateSameOriginMutation } from "@/lib/requestSecurity";

export const runtime = "nodejs";

function restoreResponse(request: NextRequest, code: string, status: number, destination?: string) {
  if (request.headers.get("accept")?.includes("application/json")) {
    return NextResponse.json({ code, ...(destination ? { destination } : {}) }, {
      status,
      headers: { "Cache-Control": "no-store" },
    });
  }
  const location = destination ?? `/pay-evidence-pro/restore?status=${encodeURIComponent(code.replace("restore_", ""))}`;
  return NextResponse.redirect(new URL(location, request.url), 303);
}
export async function POST(request: NextRequest) {
  const requestCheck = await validateSameOriginMutation(request, {
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
  const code = String(formData.get("restore_code") ?? "").trim();
  const nonce = String(formData.get("restore_nonce") ?? "").trim();
  const store = getConfiguredEntitlementStore();
  if (!store) return restoreResponse(request, "restore_unavailable", 503);
  if (code.length < 32 || code.length > 128 || !/^[A-Za-z0-9_-]{40,128}$/.test(nonce)) {
    return restoreResponse(request, "restore_invalid", 400);
  }

  try {
    const restoreHash = hashPayEvidenceRestoreCode(code);
    const { nonceHash, accessSession } = createPayEvidenceRestoreAccessSession(restoreHash, nonce);
    const result = await store.consumeRestoreTokenHash({
      tokenHash: restoreHash,
      productCode: "pay_evidence_pro",
      nonceHash,
      accessSession,
    });

    if ((result.outcome === "consumed" || result.outcome === "idempotent") && result.entitlement) {
      await setPayEvidenceProAccessCookie(result.entitlement, accessSession.accessSessionId);
      return restoreResponse(request, "restore_ready", 200, "/pay-evidence-pro/workspace");
    }

    const status = result.outcome === "released" || result.outcome === "used"
      || result.outcome === "revoked" || result.outcome === "review" ? 409 : 404;
    return restoreResponse(request, `restore_${result.outcome}`, status);
  } catch {
    return restoreResponse(request, "restore_unavailable", 503);
  }
}
