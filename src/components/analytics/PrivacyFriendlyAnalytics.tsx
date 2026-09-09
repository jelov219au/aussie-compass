"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";
import { sanitizeAnalyticsEvent } from "@/lib/privacyAnalytics";

export function removeQueryAndFragment(event: BeforeSendEvent): BeforeSendEvent | null {
  try {
    if (sessionStorage.getItem("hoju-compass-internal-review") === "1") return null;
  } catch { /* Optional QA exclusion; privacy sanitization still runs. */ }
  return sanitizeAnalyticsEvent(event, window.location.origin);
}

export function PrivacyFriendlyAnalytics() {
  return <Analytics beforeSend={removeQueryAndFragment} />;
}
