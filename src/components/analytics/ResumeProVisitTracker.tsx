"use client";

import { useEffect } from "react";
import { track } from "@vercel/analytics";
import type { ResumeProEntry } from "@/lib/resumeProAttribution";

export function ResumeProVisitTracker({ entry, checkoutAvailable }: { entry: ResumeProEntry; checkoutAvailable: boolean }) {
  useEffect(() => {
    track("Resume Pro Viewed", {
      entry,
      checkout: checkoutAvailable ? "available" : "unavailable",
    });
  }, [checkoutAvailable, entry]);

  return null;
}
