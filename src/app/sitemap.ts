import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

const routes = [
  "",
  "/tools",
  "/salary-calculator",
  "/resume-builder",
  "/cost-of-living-calculator",
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

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route === "/salary-calculator" ? 0.9 : 0.7,
  }));
}
