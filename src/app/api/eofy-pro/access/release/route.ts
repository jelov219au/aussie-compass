import { NextRequest, NextResponse } from "next/server";
import { clearEofyProAccessCookie } from "@/lib/eofyProAccess";
import { validateSameOriginMutation } from "@/lib/requestSecurity";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const check = validateSameOriginMutation(request, { maxBodyBytes: 1024 });
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status, headers: { "Cache-Control": "no-store" } });
  await clearEofyProAccessCookie();
  return NextResponse.redirect(new URL("/eofy-pro?access=released", request.url), 303);
}
