export type HomePremiumProduct = {
  id: string;
  icon: "work" | "home" | "document" | "money" | "arrival" | "search";
  href: string;
  name: string;
  price: string;
  live: boolean;
  outcome: string;
  free: string;
  freeHref: string;
  status: string;
  priceNote: string;
};

export const homePremiumFreeActions = [
  { href: "/underpayment-guide", title: "급여 차이 확인", outcome: "미지급 급여 확인·대응 순서" },
  { href: "/property-inspection-checklist", title: "집 방문 점검", outcome: "상태·비용·계약 확인표" },
  { href: "/resume-job-ad-checker", title: "이력서·공고 비교", outcome: "같은 표현과 실제 경력 근거 점검" },
] as const;

export function selectHomePremiumProduct<T extends HomePremiumProduct>(products: readonly T[]): T | null {
  return products.find((product) => product.live && product.id !== "car-purchase-pro") ?? null;
}
