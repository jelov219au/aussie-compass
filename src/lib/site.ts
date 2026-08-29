import type { Metadata } from "next";

const fallbackSiteUrl = "https://hojucompass.com";

function normaliseSiteUrl(value: string) {
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return withProtocol.replace(/\/$/, "");
}

export const siteName = "Hoju Compass";
export const siteAlternateNames = ["호주 컴퍼스", "호주컴퍼스"] as const;
export const siteDescription =
  "호주 워킹홀리데이 출국 준비부터 첫 30일 정착, 집 구하기, 영문 이력서와 생활 필수 정보를 한국어 체크리스트와 무료 도구로 확인하세요.";
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
