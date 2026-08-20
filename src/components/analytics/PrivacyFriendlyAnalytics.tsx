"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

function removeQueryAndFragment(event: BeforeSendEvent): BeforeSendEvent {
  try {
    const url = new URL(event.url, window.location.origin);
    url.search = "";
    url.hash = "";

    return { ...event, url: url.toString() };
  } catch {
    return event;
  }
}

export function PrivacyFriendlyAnalytics() {
  return <Analytics beforeSend={removeQueryAndFragment} />;
}
