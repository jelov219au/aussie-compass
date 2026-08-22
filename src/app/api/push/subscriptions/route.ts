import { randomBytes, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import {
  deletePushSubscription,
  deletePushSubscriptionByPublicId,
  upsertPushSubscription,
} from "@/lib/pushReminderStore";
import { validateSameOriginMutation } from "@/lib/requestSecurity";
import { isPushReminderConfigured, sendWebPush } from "@/lib/webPush";

type SubscriptionBody = {
  subscription?: {
    endpoint?: unknown;
    keys?: { p256dh?: unknown; auth?: unknown };
  };
  timezone?: unknown;
};

type DeleteBody = {
  subscriptionId?: unknown;
  managementToken?: unknown;
};

function isUuid(value: unknown): value is string {
  return typeof value === "string"
    && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isManagementToken(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{40,80}$/.test(value);
}

function validTimezone(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en-AU", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

function validSubscription(body: SubscriptionBody) {
  const endpoint = body.subscription?.endpoint;
  const p256dh = body.subscription?.keys?.p256dh;
  const auth = body.subscription?.keys?.auth;
  if (typeof endpoint !== "string" || endpoint.length > 2048) return null;
  if (typeof p256dh !== "string" || p256dh.length < 40 || p256dh.length > 256) return null;
  if (typeof auth !== "string" || auth.length < 8 || auth.length > 128) return null;
  try {
    const url = new URL(endpoint);
    const allowedHost = [
      "fcm.googleapis.com",
      "android.googleapis.com",
      "updates.push.services.mozilla.com",
      "push.services.mozilla.com",
      "web.push.apple.com",
    ].includes(url.hostname) || url.hostname.endsWith(".notify.windows.com");
    if (url.protocol !== "https:" || !allowedHost) return null;
  } catch {
    return null;
  }
  return { endpoint, p256dh, auth };
}

function requestCheck(request: NextRequest, maxBodyBytes: number) {
  return validateSameOriginMutation(request, {
    maxBodyBytes,
    allowedContentTypes: ["application/json"],
  });
}

export async function POST(request: NextRequest) {
  if (!isPushReminderConfigured()) {
    return NextResponse.json({ error: "푸시 리마인더를 준비하고 있습니다." }, { status: 503 });
  }
  const checked = requestCheck(request, 8_192);
  if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: checked.status });

  let body: SubscriptionBody;
  try {
    body = await request.json() as SubscriptionBody;
  } catch {
    return NextResponse.json({ error: "알림 연결 정보를 읽지 못했습니다." }, { status: 400 });
  }

  const subscription = validSubscription(body);
  if (!subscription || !validTimezone(body.timezone)) {
    return NextResponse.json({ error: "알림 연결 정보가 올바르지 않습니다." }, { status: 400 });
  }

  const publicId = randomUUID();
  const managementToken = randomBytes(32).toString("base64url");

  try {
    await upsertPushSubscription({
      publicId,
      managementToken,
      timezone: body.timezone,
      ...subscription,
    });
    await sendWebPush(
      { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
      {
        title: "Hoju Compass 알림이 연결됐어요",
        body: "저장한 일정이 다가오면 이 기기로 알려드릴게요.",
        url: "/life-admin-reminder",
        tag: "hoju-compass-push-welcome",
      },
    );
  } catch {
    await deletePushSubscriptionByPublicId(publicId).catch(() => undefined);
    return NextResponse.json(
      { error: "시험 알림을 보내지 못했습니다. 기기의 알림 설정을 확인해 주세요." },
      { status: 400 },
    );
  }

  return NextResponse.json(
    { subscriptionId: publicId, managementToken },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}

export async function DELETE(request: NextRequest) {
  const checked = requestCheck(request, 2_048);
  if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: checked.status });

  let body: DeleteBody;
  try {
    body = await request.json() as DeleteBody;
  } catch {
    return NextResponse.json({ error: "알림 해제 정보를 읽지 못했습니다." }, { status: 400 });
  }

  if (!isUuid(body.subscriptionId) || !isManagementToken(body.managementToken)) {
    return NextResponse.json({ error: "알림 해제 정보가 올바르지 않습니다." }, { status: 400 });
  }

  try {
    const deleted = await deletePushSubscription(body.subscriptionId, body.managementToken);
    if (!deleted) return NextResponse.json({ error: "알림 연결을 찾지 못했습니다." }, { status: 404 });
    return NextResponse.json({ deleted: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "알림 연결을 삭제하지 못했습니다." }, { status: 500 });
  }
}
