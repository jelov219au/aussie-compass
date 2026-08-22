const CACHE_NAME = "hoju-compass-offline-v3";
const OFFLINE_URL = "/offline";
const APP_SHELL_ROUTES = new Set(["/", "/install", "/tools", "/my-compass", OFFLINE_URL]);
const APP_SHELL_ASSETS = [OFFLINE_URL, "/app-icon-192", "/app-icon-512"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request);
        if (response.ok && APP_SHELL_ROUTES.has(requestUrl.pathname)) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(event.request, response.clone());
        }
        return response;
      } catch {
        return (await caches.match(event.request)) || (await caches.match(OFFLINE_URL)) || Response.error();
      }
    })());
    return;
  }

  const isAppAsset = requestUrl.pathname.startsWith("/_next/static/")
    || requestUrl.pathname.startsWith("/app-icon-")
    || requestUrl.pathname === "/apple-icon"
    || requestUrl.pathname === "/icon.svg";
  if (isAppAsset) {
    event.respondWith((async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      const response = await fetch(event.request);
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(event.request, response.clone());
      }
      return response;
    })());
  }
});
