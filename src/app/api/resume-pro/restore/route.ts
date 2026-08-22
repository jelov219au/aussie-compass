import { NextRequest, NextResponse } from "next/server";

import { getConfiguredEntitlementStore } from "@/lib/neonEntitlementStore";
import { validateSameOriginMutation } from "@/lib/requestSecurity";
import { createAccessSession, hashRestoreCode, setResumeProAccessCookie } from "@/lib/resumeProAccess";

export const runtime = "nodejs";

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
  const store = getConfiguredEntitlementStore();
  if (!store || code.length < 32 || code.length > 128) {
    return NextResponse.redirect(new URL("/resume-pro/restore?status=invalid", request.url), 303);
  }

  const restoreHash = hashRestoreCode(code);
  const accessSession = createAccessSession("restore", restoreHash);
  const entitlement = await store.consumeRestoreTokenHash(restoreHash, "resume_pro", accessSession);
  if (!entitlement || entitlement.productCode !== "resume_pro" || entitlement.status !== "active") {
    return NextResponse.redirect(new URL("/resume-pro/restore?status=invalid", request.url), 303);
  }

  await setResumeProAccessCookie(entitlement, accessSession.accessSessionId);
  return NextResponse.redirect(new URL("/resume-pro/workspace", request.url), 303);
}
