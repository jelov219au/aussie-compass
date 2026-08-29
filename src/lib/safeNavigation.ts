const internalNavigationOrigin = "https://hoju-compass.invalid";

export function safeInternalNavigationPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const candidate = value.trim();
  if (!candidate.startsWith("/") || candidate.startsWith("//")) return null;

  try {
    const url = new URL(candidate, internalNavigationOrigin);
    if (url.origin !== internalNavigationOrigin || url.pathname.startsWith("//")) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function safeExternalHttpUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const candidate = value.trim();
  if (!candidate) return null;

  try {
    const url = new URL(candidate);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}
