const fallbackSiteUrl = "https://aussie-compass.vercel.app";

function normaliseSiteUrl(value: string) {
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return withProtocol.replace(/\/$/, "");
}

export const siteName = "Aussie Compass";
export const siteUrl = normaliseSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || fallbackSiteUrl,
);
