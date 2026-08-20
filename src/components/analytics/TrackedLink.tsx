"use client";

import Link from "next/link";
import { track } from "@vercel/analytics";
import type { ReactNode } from "react";

type AnalyticsValue = string | number | boolean | null;

export function TrackedLink({
  href,
  eventName,
  properties,
  className,
  children,
}: {
  href: string;
  eventName: string;
  properties?: Record<string, AnalyticsValue>;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={className} onClick={() => track(eventName, properties)}>
      {children}
    </Link>
  );
}
