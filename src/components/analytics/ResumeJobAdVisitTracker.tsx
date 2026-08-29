"use client";

import { useEffect } from "react";
import { trackResumeJobAdViewed } from "@/components/analytics/ResumeFunnelAnalytics";

export function ResumeJobAdVisitTracker() {
  useEffect(() => {
    trackResumeJobAdViewed();
  }, []);

  return null;
}
