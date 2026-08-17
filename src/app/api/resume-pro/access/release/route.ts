import { NextRequest, NextResponse } from "next/server";

import { clearResumeProAccessCookie } from "@/lib/resumeProAccess";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  await clearResumeProAccessCookie();
  return NextResponse.redirect(new URL("/resume-pro?access=released", request.url), 303);
}
