import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hoju Compass",
    short_name: "Hoju Compass",
    description: "호주 생활에 필요한 급여·세금 계산기, 체크리스트와 한국어 실용 가이드",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f8f7f4",
    theme_color: "#1a2744",
    lang: "ko",
    categories: ["education", "finance", "utilities"],
    shortcuts: [
      {
        name: "급여 계산기",
        short_name: "급여 계산",
        description: "시급과 근무시간으로 예상 급여 확인",
        url: "/pay-calculator?source=app-shortcut",
      },
      {
        name: "도착 체크리스트",
        short_name: "도착 준비",
        description: "호주 도착 후 해야 할 일 확인",
        url: "/arrival-checklist?source=app-shortcut",
      },
      {
        name: "나의 진행",
        short_name: "나의 진행",
        description: "이 기기에 저장한 진행 상황 확인",
        url: "/my-compass?source=app-shortcut",
      },
    ],
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
