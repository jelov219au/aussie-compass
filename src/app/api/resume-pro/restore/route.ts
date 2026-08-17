import { NextRequest, NextResponse } from "next/server";

import { getConfiguredEntitlementStore } from "@/lib/neonEntitlementStore";
import { hashRestoreCode, setResumeProAccessCookie } from "@/lib/resumeProAccess";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const formData = await request.formData();
  const code = String(formData.get("restore_code") ?? "").trim();
  const store = getConfiguredEntitlementStore();
  if (!store || code.length < 32 || code.length > 128) {
    return NextResponse.redirect(new URL("/resume-pro/restore?status=invalid", request.url), 303);
  }

  const entitlement = await store.consumeRestoreTokenHash(hashRestoreCode(code));
  if (!entitlement || entitlement.productCode !== "resume_pro" || entitlement.status !== "active") {
    return NextResponse.redirect(new URL("/resume-pro/restore?status=invalid", request.url), 303);
  }

  await setResumeProAccessCookie(entitlement);
  return NextResponse.redirect(new URL("/resume-pro/workspace", request.url), 303);
}
