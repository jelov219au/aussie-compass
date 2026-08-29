import type { Metadata, Viewport } from "next";
import { OrganizationJsonLd, SiteJsonLd } from "@/components/seo/JsonLd";
import { siteDescription, siteName, siteUrl } from "@/lib/site";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import { DomainMigrationNotice } from "@/components/layout/DomainMigrationNotice";
import { PrivacyFriendlyAnalytics } from "@/components/analytics/PrivacyFriendlyAnalytics";
import "./globals.css";

const title = "호주 워홀 준비·정착·집·취업 가이드 | Hoju Compass";
const description = siteDescription;

const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim();
const bingSiteVerification = process.env.BING_SITE_VERIFICATION?.trim();
const naverSiteVerification = process.env.NAVER_SITE_VERIFICATION?.trim();

export const metadata: Metadata = {
  title,
  description,
  metadataBase: new URL(siteUrl),
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName,
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": `${siteUrl}/feed.xml`,
    },
  },
  verification: googleSiteVerification || bingSiteVerification || naverSiteVerification
    ? {
        ...(googleSiteVerification ? { google: googleSiteVerification } : {}),
        other: {
          ...(bingSiteVerification ? { "msvalidate.01": bingSiteVerification } : {}),
          ...(naverSiteVerification ? { "naver-site-verification": naverSiteVerification } : {}),
        },
      }
    : undefined,
};

export const viewport: Viewport = {
  themeColor: "#1a2744",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" data-scroll-behavior="smooth">
      <body className="min-h-screen antialiased">
        <ServiceWorkerRegistration />
        <a
          href="#main-content"
          className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-lg bg-navy px-4 py-3 text-sm font-semibold text-white shadow-lg transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
        >
          본문으로 바로가기
        </a>
        <DomainMigrationNotice />
        <OrganizationJsonLd />
        <SiteJsonLd />
        <PrivacyFriendlyAnalytics />
        <div id="main-content" tabIndex={-1} className="focus:outline-none">
          {children}
        </div>
      </body>
    </html>
  );
}
