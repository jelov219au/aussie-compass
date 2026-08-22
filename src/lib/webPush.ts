import "server-only";

import webpush from "web-push";

export type PushMessage = {
  title: string;
  body: string;
  url: string;
  tag?: string;
};

export function getWebPushPublicKey() {
  return process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY?.trim() ?? "";
}

export function isPushReminderConfigured() {
  return process.env.PUSH_REMINDERS_ENABLED === "true"
    && Boolean(getWebPushPublicKey())
    && Boolean(process.env.WEB_PUSH_PRIVATE_KEY?.trim())
    && Boolean(process.env.WEB_PUSH_SUBJECT?.trim());
}

function configureWebPush() {
  if (!isPushReminderConfigured()) {
    throw new Error("Push reminders are not configured.");
  }

  webpush.setVapidDetails(
    process.env.WEB_PUSH_SUBJECT!.trim(),
    getWebPushPublicKey(),
    process.env.WEB_PUSH_PRIVATE_KEY!.trim(),
  );
}

export async function sendWebPush(
  subscription: webpush.PushSubscription,
  message: PushMessage,
) {
  configureWebPush();
  return webpush.sendNotification(subscription, JSON.stringify(message), {
    TTL: 60 * 60 * 24,
    urgency: "normal",
  });
}
