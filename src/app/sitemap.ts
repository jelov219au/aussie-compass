import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { articles } from "@/data/articles";

const routes = [
  "",
  "/tools",
  "/salary-calculator",
  "/resume-builder",
  "/cost-of-living-calculator",
  "/savings-goal-calculator",
  "/job-application-tracker",
  "/resources",
  "/career-pathways",
  "/tax-return-guide",
  "/service-quote-comparator",
  "/property-inspection-checklist",
  "/guides",
  "/minimum-wage-guide",
  "/casual-loading-guide",
  "/award-guide",
  "/payslip-guide",
  "/underpayment-guide",
  "/super-guide",
  "/leave-guide",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [...routes, ...articles.map((article) => `/resources/${article.slug}`)].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route === "/salary-calculator" ? 0.9 : 0.7,
  }));
}
