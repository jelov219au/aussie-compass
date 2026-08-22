"use client";

import { useEffect } from "react";
import { track } from "@vercel/analytics";

import type { RentalApplicationProEntry } from "@/lib/rentalApplicationProAttribution";

export function RentalApplicationProVisitTracker({
  entry,
  checkoutAvailable,
}: {
  entry: RentalApplicationProEntry;
  checkoutAvailable: boolean;
}) {
  useEffect(() => {
    track("Rental Application Pro Viewed", { entry, checkoutAvailable });
  }, [checkoutAvailable, entry]);

  return null;
}
