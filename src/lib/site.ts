import type { Metadata } from "next";

const fallbackSiteUrl = "https://hojucompass.com";

function normaliseSiteUrl(value: string) {
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return withProtocol.replace(/\/$/, "");
}

export const siteName = "Hoju Compass";
export const siteUrl = normaliseSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || fallbackSiteUrl,
);

type PageMetadata = {
  title: string;
  description: string;
  path: `/${string}`;
  kind?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
};

export function createPageMetadata({ title, description, path, kind = "website", publishedTime, modifiedTime }: PageMetadata): Metadata {
  const sharedOpenGraph = {
    title,
    description,
    url: path,
    siteName,
    locale: "ko_KR",
  };

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: kind === "article"
      ? { ...sharedOpenGraph, type: "article", publishedTime, modifiedTime }
      : { ...sharedOpenGraph, type: "website" },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
