import { NextRequest, NextResponse } from "next/server";

import { validateSameOriginMutation } from "@/lib/requestSecurity";

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

  // Fail closed until Rental Pack adopts the server-tracked, nonce-bound
  // restore flow used by Resume Pro. The product is never live in Production.
  return NextResponse.redirect(new URL("/rental-application-pro/restore?status=unavailable", request.url), 303);
}
