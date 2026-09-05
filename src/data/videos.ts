import "server-only";

export type VideoPlacement =
  | { kind: "article"; slug: string; slot: "after-summary"; order: number }
  | { kind: "page"; path: string; slot: "buying-order" | "after-comparison"; order: number };

export type VideoContext =
  | { kind: "article"; slug: string; slot: "after-summary" }
  | { kind: "page"; path: string; slot: "buying-order" | "after-comparison" };

export type VideoRecord = {
  id: string;
  title: string;
  description: string;
  topics: readonly string[];
  status: "draft" | "scheduled" | "public" | "private" | "unavailable";
  verifiedAt: string;
  publishedAt?: string;
  scheduledFor?: string;
  placements: readonly VideoPlacement[];
};

export type PublicVideo = Pick<VideoRecord, "id" | "title" | "description">;

export const videoChannel = {
  name: "Hoju Compass | 호주 컴패스",
  href: "https://www.youtube.com/channel/UChn-PJcHHVz2XPVhHUkbFkQ",
} as const;

// Verify the public watch page or channel listing before changing status. Scheduled time alone
// never enables a video. This server-only registry is not sent to the browser.
export const videos: readonly VideoRecord[] = [
  {
    id: "1y7CM94zoUk",
    title: "호주 중고차, 전 주인의 할부가 남아 있다면?｜PPSR 확인부터 구매까지",
    description: "NSW 개인 간 거래 사례로 VIN·PPSR 확인부터 송금 전 판단과 차량 인수까지 살펴봅니다.",
    topics: ["used-car", "ppsr"],
    status: "public",
    verifiedAt: "2026-09-04T18:02:00+10:00",
    scheduledFor: "2026-09-04T18:00:00+10:00",
    placements: [
      { kind: "article", slug: "used-car-ppsr-purchase-day-checklist", slot: "after-summary", order: 1 },
      { kind: "page", path: "/used-car-comparison", slot: "buying-order", order: 1 },
    ],
  },
  {
    id: "Hjcn45t0wZo",
    title: "호주 자동차보험, 가입하고도 수리비를 내야 하는 이유｜CTP부터 Comprehensive까지",
    description: "NSW 사례로 CTP와 차량 손해 보장의 차이, 보험을 고를 때 확인할 내용을 살펴봅니다.",
    topics: ["used-car", "car-insurance"],
    status: "public",
    verifiedAt: "2026-09-04T14:52:00+10:00",
    placements: [
      { kind: "page", path: "/used-car-comparison", slot: "after-comparison", order: 1 },
    ],
  },
];

function matchesPlacement(placement: VideoPlacement, context: VideoContext) {
  if (placement.slot !== context.slot) return false;
  if (placement.kind === "article" && context.kind === "article") return placement.slug === context.slug;
  if (placement.kind === "page" && context.kind === "page") return placement.path === context.path;
  return false;
}

export function getPublicVideosForPlacement(
  context: VideoContext,
  records: readonly VideoRecord[] = videos,
): PublicVideo[] {
  const candidates = records.flatMap((video) => {
    if (video.status !== "public" || !/^[A-Za-z0-9_-]{11}$/.test(video.id)) return [];
    const matches = video.placements.filter((placement) => matchesPlacement(placement, context));
    if (!matches.length) return [];
    return [{ video, order: Math.min(...matches.map((placement) => placement.order)) }];
  });
  candidates.sort((a, b) => a.order - b.order || a.video.id.localeCompare(b.video.id, "en"));
  const seen = new Set<string>();
  return candidates.filter(({ video }) => {
    if (seen.has(video.id)) return false;
    seen.add(video.id);
    return true;
  }).map(({ video: { id, title, description } }) => ({ id, title, description }));
}
