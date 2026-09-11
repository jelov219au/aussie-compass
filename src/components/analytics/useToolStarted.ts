"use client";

import { useRef } from "react";
import { track } from "@vercel/analytics";

type MeasuredTool = "tax_return_guide" | "used_car_comparison";

/** Call only from a meaningful user action, never from restoration or rendering. */
export function useToolStarted(tool: MeasuredTool) {
  const started = useRef(false);
  return () => {
    if (started.current) return;
    started.current = true;
    try {
      if (sessionStorage.getItem("hoju-compass-internal-review") === "1") return;
    } catch { /* Optional QA flag must not interrupt the tool. */ }
    try {
      track("Tool Started", { schema_version: "1", tool, entry: "unknown" });
    } catch { /* Measurement must never block a local edit. */ }
  };
}
