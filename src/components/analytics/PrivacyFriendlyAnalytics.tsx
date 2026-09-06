"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";
import { sanitizeAnalyticsEvent } from "@/lib/privacyAnalytics";

export function removeQueryAndFragment(event: BeforeSendEvent): BeforeSendEvent | null {
  return sanitizeAnalyticsEvent(event, window.location.origin);
}

export function PrivacyFriendlyAnalytics() {
  return <Analytics beforeSend={removeQueryAndFragment} />;
}
