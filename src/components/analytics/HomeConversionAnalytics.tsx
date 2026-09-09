"use client";

import { useEffect, useRef } from "react";
import { track } from "@vercel/analytics";

const version = "home-conversion-20260909";
const products = new Set(["resume-pro", "rental-application-pro", "pay-evidence-pro", "eofy-pro", "leaving-australia-pro", "car-purchase-pro"]);
const destinations = new Set([
  "/tools", "/pro", "/search", "/resources", "/my-compass", "/install",
  "/arrival-checklist", "/visa-preparation-guide", "/property-inspection-checklist",
  "/resume-builder", "/resume-job-ad-checker", "/tax-return-guide", "/underpayment-guide",
  "/used-car-comparison", "/leaving-australia-guide", "/english-phrase-cards",
  "/resources/australia-job-ending-final-pay-dismissal-guide",
  "/downloads/resume-pro-example-editorial.pdf",
  ...[...products].map((product) => `/${product}`),
]);
const sections = new Map([
  ["home-tasks", "tasks"], ["tools", "tools"], ["route-finder", "route_finder"], ["pro", "pro"],
]);

/** A page mount is the counting unit; never send input text, URL queries or visitor IDs. */
export function HomeConversionAnalytics() {
  const seen = useRef(new Set<string>());

  useEffect(() => {
    try {
      if (sessionStorage.getItem("hoju-compass-internal-review") === "1") return;
    } catch { /* Optional QA exclusion must not affect the page. */ }
    const root = document.querySelector("main.home-screen");
    if (!root) return;
    const recorded = seen.current;
    const emit = (event: string, key: string, properties: Record<string, string>) => {
      if (recorded.has(key)) return;
      recorded.add(key);
      try { track(event, { ...properties, version }); } catch { /* Navigation is independent. */ }
    };
    emit("Home Visit", "visit", {});

    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const product = event.target.closest("button[data-home-product]")?.getAttribute("data-home-product");
      if (product && products.has(product)) {
        emit("Home Product Selected", `product:${product}`, { section: "pro", product });
        return;
      }
      const link = event.target.closest("a[href]");
      if (!link || !root.contains(link)) return;
      let url: URL;
      try { url = new URL(link.getAttribute("href") ?? "", window.location.origin); } catch { return; }
      if (url.origin !== window.location.origin || !destinations.has(url.pathname)) return;
      const section = sections.get(link.closest("section[id]")?.id ?? "") ?? "other";
      const destination = url.pathname.slice(1);
      const action = url.pathname.startsWith("/downloads/") ? "sample" : url.hash === "#result-preview-heading" ? "sample" : "navigate";
      emit("Home Action", `${section}:${destination}:${action}`, { section, destination, action });
      if (!["/install", "/my-compass", "/search", "/resources", "/tools", "/pro"].includes(url.pathname)) {
        emit("Home First Action", "first_action", { section, destination, action });
      }
    };
    root.addEventListener("click", onClick as EventListener, { capture: true });

    const timers = new Map<Element, ReturnType<typeof setTimeout>>();
    const visible = new Set<Element>();
    const startTimer = (element: Element) => {
      const section = element.getAttribute("data-home-observe");
      if (!section || !["tasks", "tools", "pro", "pro_details"].includes(section) || document.hidden || timers.has(element) || recorded.has(`view:${section}`)) return;
      timers.set(element, setTimeout(() => {
        timers.delete(element);
        if (!document.hidden && visible.has(element)) emit("Home Section Viewed", `view:${section}`, { section });
      }, 1000));
    };
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          visible.add(entry.target); startTimer(entry.target);
        } else {
          visible.delete(entry.target);
          clearTimeout(timers.get(entry.target)); timers.delete(entry.target);
        }
      }
    }, { threshold: [0, 0.5] });
    root.querySelectorAll("[data-home-observe]").forEach((element) => observer?.observe(element));
    const onVisibility = () => {
      timers.forEach(clearTimeout); timers.clear();
      if (!document.hidden) visible.forEach(startTimer);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      root.removeEventListener("click", onClick as EventListener, { capture: true });
      observer?.disconnect(); timers.forEach(clearTimeout);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return null;
}
