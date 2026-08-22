import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import {
  deactivatePushSubscription,
  findDuePushReminders,
  markPushReminderSent,
  markPushSubscriptionSuccessful,
} from "@/lib/pushReminderStore";
import { isPushReminderConfigured, sendWebPush } from "@/lib/webPush";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorised(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!secret || supplied.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(supplied), Buffer.from(secret));
}

function displayDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

function deliveryStatus(error: unknown) {
  if (!error || typeof error !== "object" || !("statusCode" in error)) return null;
  const status = Number((error as { statusCode?: unknown }).statusCode);
  return Number.isFinite(status) ? status : null;
}

export async function GET(request: NextRequest) {
  if (!authorised(request)) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }
  if (!isPushReminderConfigured()) {
    return NextResponse.json({ error: "Push reminders are not configured." }, { status: 503 });
  }

  const reminders = await findDuePushReminders(200);
  let sent = 0;
  let deactivated = 0;
  let failed = 0;

  for (const reminder of reminders) {
    try {
      await sendWebPush(
        {
          endpoint: reminder.endpoint,
          keys: { p256dh: reminder.p256dh, auth: reminder.auth },
        },
        {
          title: reminder.title,
          body: `${displayDate(reminder.dueDate)} 일정입니다. 지금 준비할 내용을 확인해 보세요.`,
          url: "/life-admin-reminder",
          tag: `hoju-compass-reminder-${reminder.reminderId}-${reminder.triggerDate}`,
        },
      );
      await Promise.all([
        markPushReminderSent(reminder.reminderId, reminder.triggerDate),
        markPushSubscriptionSuccessful(reminder.subscriptionId),
      ]);
      sent += 1;
    } catch (error) {
      const status = deliveryStatus(error);
      if (status === 404 || status === 410) {
        await deactivatePushSubscription(reminder.subscriptionId);
        deactivated += 1;
      } else {
        failed += 1;
      }
    }
  }

  return NextResponse.json(
    { checked: reminders.length, sent, deactivated, failed },
    { headers: { "Cache-Control": "no-store" } },
  );
}
