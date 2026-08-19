import { NextRequest, NextResponse } from "next/server";

import { clearResumeProAccessCookie } from "@/lib/resumeProAccess";
import { validateSameOriginMutation } from "@/lib/requestSecurity";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const requestCheck = validateSameOriginMutation(request, { maxBodyBytes: 1024 });
  if (!requestCheck.ok) {
    return NextResponse.json({ error: requestCheck.error }, {
      status: requestCheck.status,
      headers: { "Cache-Control": "no-store" },
    });
  }

  await clearResumeProAccessCookie();
  return NextResponse.redirect(new URL("/resume-pro?access=released", request.url), 303);
}
