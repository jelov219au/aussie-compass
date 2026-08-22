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

self.addEventListener("push", (event) => {
  let message = {};
  try {
    message = event.data?.json() || {};
  } catch {
    message = {};
  }

  const title = typeof message.title === "string" && message.title.trim()
    ? message.title.slice(0, 80)
    : "Hoju Compass 일정 알림";
  const body = typeof message.body === "string"
    ? message.body.slice(0, 180)
    : "저장한 일정을 확인해 보세요.";
  const url = typeof message.url === "string" && message.url.startsWith("/") && !message.url.startsWith("//")
    ? message.url
    : "/life-admin-reminder";
  const tag = typeof message.tag === "string"
    ? message.tag.slice(0, 160)
    : "hoju-compass-reminder";

  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: "/app-icon-192",
    badge: "/app-icon-192",
    tag,
    data: { url },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const requestedPath = event.notification.data?.url;
  const target = typeof requestedPath === "string" && requestedPath.startsWith("/") && !requestedPath.startsWith("//")
    ? new URL(requestedPath, self.location.origin).href
    : new URL("/life-admin-reminder", self.location.origin).href;

  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
    const existing = windows.find((client) => new URL(client.url).origin === self.location.origin);
    if (existing) {
      existing.navigate(target);
      return existing.focus();
    }
    return self.clients.openWindow(target);
  }));
});
