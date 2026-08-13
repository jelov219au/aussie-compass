import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Aussie Compass",
    short_name: "Aussie Compass",
    description: "호주 급여 계산기와 한국어 직장 생활 가이드",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f7f4",
    theme_color: "#1a2744",
    lang: "ko",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
