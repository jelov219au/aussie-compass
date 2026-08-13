import type { Metadata } from "next";
import { SiteJsonLd } from "@/components/seo/JsonLd";
import { siteName, siteUrl } from "@/lib/site";
import "./globals.css";

const title = "Aussie Compass | 호주 생활을 위한 실용 도구";
const description =
  "호주 급여, 세금, Super 계산기와 한국어 생활 가이드를 한곳에서 확인하세요.";

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
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen antialiased">
        <SiteJsonLd />
        {children}
      </body>
    </html>
  );
}
