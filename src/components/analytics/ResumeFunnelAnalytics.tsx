"use client";

import Link from "next/link";
import { track } from "@vercel/analytics";
import type { ReactNode } from "react";
import {
  resumeFunnelContexts,
  resumeFunnelEvents,
  resumeFunnelSurfaces,
  type ResumeFunnelContext,
  type ResumeFunnelEventName,
  type ResumeFunnelSurface,
  type ResumeProCtaHref,
  type ResumeProCtaSurface,
} from "@/lib/resumeFunnelAnalyticsContract";

const emittedEvents = new Set<string>();

function emitOnce(eventName: ResumeFunnelEventName, surface: ResumeFunnelSurface, context: ResumeFunnelContext) {
  const eventKey = `${eventName}:${surface}:${context}`;
  if (emittedEvents.has(eventKey)) return;
  emittedEvents.add(eventKey);

  try {
    track(eventName, { surface, context });
  } catch {
    // Analytics must never interrupt form editing or link navigation.
  }
}

export function trackResumeBuilderStarted() {
  emitOnce(
    resumeFunnelEvents.builderStarted,
    resumeFunnelSurfaces.builderForm,
    resumeFunnelContexts.resumeBuilder,
  );
}

export function trackResumeJobAdViewed() {
  emitOnce(
    resumeFunnelEvents.jobAdViewed,
    resumeFunnelSurfaces.jobAdCheckerForm,
    resumeFunnelContexts.jobAdChecker,
  );
}

export function trackResumeJobAdChecked() {
  emitOnce(
    resumeFunnelEvents.jobAdChecked,
    resumeFunnelSurfaces.jobAdCheckerForm,
    resumeFunnelContexts.jobAdChecker,
  );
}

export function trackResumeJobAdSampleViewed() {
  emitOnce(
    resumeFunnelEvents.jobAdSampleViewed,
    resumeFunnelSurfaces.jobAdCheckerForm,
    resumeFunnelContexts.jobAdChecker,
  );
}

export function ResumeProCtaLink({
  href,
  surface,
  context,
  className,
  children,
}: {
  href: ResumeProCtaHref;
  surface: ResumeProCtaSurface;
  context: ResumeFunnelContext;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => emitOnce(resumeFunnelEvents.proCtaClicked, surface, context)}
    >
      {children}
    </Link>
  );
}
