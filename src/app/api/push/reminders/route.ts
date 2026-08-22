import { NextRequest, NextResponse } from "next/server";

import { replacePushReminders, type PushReminderInput } from "@/lib/pushReminderStore";
import { validateSameOriginMutation } from "@/lib/requestSecurity";
import { isPushReminderConfigured } from "@/lib/webPush";

type ReminderBody = {
  subscriptionId?: unknown;
  managementToken?: unknown;
  reminders?: unknown;
};

function validReminder(value: unknown): value is PushReminderInput {
  if (!value || typeof value !== "object") return false;
  const reminder = value as Record<string, unknown>;
  return typeof reminder.id === "string"
    && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(reminder.id)
    && typeof reminder.title === "string"
    && reminder.title.trim().length > 0
    && reminder.title.length <= 80
    && typeof reminder.category === "string"
    && reminder.category.trim().length > 0
    && reminder.category.length <= 30
    && typeof reminder.date === "string"
    && /^\d{4}-\d{2}-\d{2}$/.test(reminder.date)
    && !Number.isNaN(Date.parse(`${reminder.date}T00:00:00Z`))
    && Number.isInteger(reminder.leadDays)
    && Number(reminder.leadDays) >= 0
    && Number(reminder.leadDays) <= 365;
}

export async function PUT(request: NextRequest) {
  if (!isPushReminderConfigured()) {
    return NextResponse.json({ error: "푸시 리마인더를 준비하고 있습니다." }, { status: 503 });
  }
  const checked = validateSameOriginMutation(request, {
    maxBodyBytes: 65_536,
    allowedContentTypes: ["application/json"],
  });
  if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: checked.status });

  let body: ReminderBody;
  try {
    body = await request.json() as ReminderBody;
  } catch {
    return NextResponse.json({ error: "저장할 일정 정보를 읽지 못했습니다." }, { status: 400 });
  }

  if (typeof body.subscriptionId !== "string"
    || !/^[0-9a-f-]{36}$/i.test(body.subscriptionId)
    || typeof body.managementToken !== "string"
    || !/^[A-Za-z0-9_-]{40,80}$/.test(body.managementToken)
    || !Array.isArray(body.reminders)
    || body.reminders.length > 50
    || !body.reminders.every(validReminder)) {
    return NextResponse.json({ error: "저장할 일정 정보가 올바르지 않습니다." }, { status: 400 });
  }

  try {
    const result = await replacePushReminders({
      publicId: body.subscriptionId,
      managementToken: body.managementToken,
      reminders: body.reminders.map((reminder) => ({
        ...reminder,
        title: reminder.title.trim(),
        category: reminder.category.trim(),
      })),
    });
    if (!result.authorised) {
      return NextResponse.json({ error: "알림 연결을 다시 설정해 주세요." }, { status: 401 });
    }
    return NextResponse.json(
      { saved: result.reminder_count },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ error: "알림 일정을 저장하지 못했습니다." }, { status: 500 });
  }
}
