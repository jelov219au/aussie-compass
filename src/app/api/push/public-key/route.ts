import { NextResponse } from "next/server";

import { getWebPushPublicKey, isPushReminderConfigured } from "@/lib/webPush";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isPushReminderConfigured()) {
    return NextResponse.json(
      { error: "푸시 리마인더를 준비하고 있습니다." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { publicKey: getWebPushPublicKey() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
