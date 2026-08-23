import { NextRequest, NextResponse } from "next/server";

import { clearRentalApplicationProAccessCookie } from "@/lib/rentalApplicationProAccess";
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

  await clearRentalApplicationProAccessCookie();
  return NextResponse.redirect(new URL("/rental-application-pro?access=released", request.url), 303);
}
