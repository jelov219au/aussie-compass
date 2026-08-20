import { NextRequest, NextResponse } from "next/server";
import { clearRentalProAccessCookie } from "@/lib/rentalProAccess";
import { validateSameOriginMutation } from "@/lib/requestSecurity";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const check = validateSameOriginMutation(request, { maxBodyBytes: 1024 });
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status, headers: { "Cache-Control": "no-store" } });
  await clearRentalProAccessCookie();
  return NextResponse.redirect(new URL("/rental-application-pro?access=released", request.url), 303);
}
