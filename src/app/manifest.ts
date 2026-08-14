import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hoju Compass",
    short_name: "Hoju Compass",
    description: "호주 급여 계산기와 한국어 직장 생활 가이드",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f8f7f4",
    theme_color: "#1a2744",
    lang: "ko",
    categories: ["education", "finance", "utilities"],
    icons: [
      {
        src: "/app-icon-192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/app-icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/app-icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
