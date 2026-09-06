export type AnalyticsEventWithUrl = {
  url: string;
};

export function sanitizeAnalyticsEvent<T extends AnalyticsEventWithUrl>(event: T, baseOrigin: string): T | null {
  try {
    if (typeof event.url !== "string" || event.url.length === 0 || event.url.length > 2_048) return null;

    const base = new URL(baseOrigin);
    const url = new URL(event.url, base);
    if ((url.protocol !== "https:" && url.protocol !== "http:") || url.origin !== base.origin) return null;

    return { ...event, url: `${url.origin}${url.pathname}` };
  } catch {
    return null;
  }
}
