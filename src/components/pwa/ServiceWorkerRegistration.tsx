"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).then((registration) => {
      const signalUpdate = () => window.dispatchEvent(new Event("hoju:pwa-update"));
      if (registration.waiting) signalUpdate();
      registration.addEventListener("updatefound", signalUpdate);
      navigator.serviceWorker.addEventListener("controllerchange", signalUpdate, { once: true });
    }).catch(() => { /* The website remains usable when service workers are unavailable. */ });
  }, []);

  return null;
}
