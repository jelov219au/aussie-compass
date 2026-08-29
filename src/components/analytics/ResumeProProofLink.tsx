"use client";

import Link from "next/link";
import { track } from "@vercel/analytics";
import type { ReactNode } from "react";
import type { ResumeProEntry } from "@/lib/resumeProAttribution";

const trackedEntries = new Set<ResumeProEntry>();

export function ResumeProProofLink({
  entry,
  className,
  children,
}: {
  entry: ResumeProEntry;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href="/resume-job-ad-checker"
      className={className}
      onClick={() => {
        if (trackedEntries.has(entry)) return;
        trackedEntries.add(entry);

        try {
          track("Resume Pro Free Proof Opened", { entry });
        } catch {
          // Analytics must never interrupt the free, local-only proof step.
        }
      }}
    >
      {children}
    </Link>
  );
}
