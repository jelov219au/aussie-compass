"use client";

import { track } from "@vercel/analytics";
import type { ReactNode } from "react";

const resumeTemplateHref = "/downloads/australian-resume-template-hoju-compass.docx";

export type ResumeTemplateDownloadEntry = "article_resume_template" | "resume_builder";

export function ResumeTemplateDownloadLink({
  entry,
  className,
  children,
}: {
  entry: ResumeTemplateDownloadEntry;
  className?: string;
  children: ReactNode;
}) {
  function trackDownload() {
    try {
      track("Resume Template Downloaded", { entry, format: "docx" });
    } catch {
      // Analytics must never interrupt the file download.
    }
  }

  return (
    <a href={resumeTemplateHref} download className={className} onClick={trackDownload}>
      {children}
    </a>
  );
}
