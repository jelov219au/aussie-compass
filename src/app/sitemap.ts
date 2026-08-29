import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { articles } from "@/data/articles";

const routes = [
  "",
  "/tools",
  "/pro",
  "/privacy",
  "/contact",
  "/terms",
  "/purchase-information",
  "/payment-help",
  "/disclaimer",
  "/editorial-policy",
  "/help-directory",
  "/english-phrase-cards",
  "/glossary",
  "/install",
  "/data-transfer",
  "/life-admin-reminder",
  "/salary-calculator",
  "/resume-builder",
  "/resume-job-ad-checker",
  "/resume-pro",
  "/eofy-pro",
  "/rental-application-pro",
  "/cost-of-living-calculator",
  "/savings-goal-calculator",
  "/job-application-tracker",
  "/resources",
  "/career-pathways",
  "/tax-return-guide",
  "/service-quote-comparator",
  "/property-inspection-checklist",
  "/public-transport-guide",
  "/rail-work-alerts",
  "/overseas-driver-licence-guide",
  "/used-car-comparison",
  "/moving-checklist",
  "/service-price-log",
  "/visa-preparation-guide",
  "/arrival-checklist",
  "/leaving-australia-guide",
  "/leaving-australia-pro",
  "/pay-evidence-pro",
  "/guides",
  "/minimum-wage-guide",
  "/casual-loading-guide",
  "/award-guide",
  "/payslip-guide",
  "/underpayment-guide",
  "/super-guide",
  "/leave-guide",
];

// Keep these dates manual and evidence-based. Google only uses lastmod when it
// reflects a significant page update, so do not replace them with new Date().
const acquisitionRouteUpdates: Record<string, string> = {
  "": "2026-08-29",
  "/resume-builder": "2026-08-24",
  "/resume-job-ad-checker": "2026-08-24",
  "/resume-pro": "2026-08-24",
};

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: acquisitionRouteUpdates[route],
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route === "/tools" || route === "/resources" ? 0.9 : 0.7,
  }));

  const articleEntries: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${siteUrl}/resources/${article.slug}`,
    lastModified: new Date(article.updatedAt ?? article.publishedAt),
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  return [...staticEntries, ...articleEntries];
}
