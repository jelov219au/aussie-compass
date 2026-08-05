import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://aussiecompass.com.au";
const title = "Aussie Compass | Practical Tools for Life in Australia";
const description =
  "Simple calculators, practical guides and useful resources for living and working in Australia.";

export const metadata: Metadata = {
  title,
  description,
  metadataBase: new URL(siteUrl),
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "Aussie Compass",
    locale: "en_AU",
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
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
