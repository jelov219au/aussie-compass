import {
  eofyProProduct,
  getEofyPaymentReadiness,
  getLeavingAustraliaPaymentReadiness,
  getPayEvidencePaymentReadiness,
  leavingAustraliaProProduct,
  payEvidenceProProduct,
  rentalApplicationProProduct,
  resumeProProduct,
} from "@/lib/commerce";

const formatPrice = (priceCents: number) => `A$${(priceCents / 100).toFixed(2)}`;

// Server-rendered discovery copy, not authority to open checkout or a workspace.
export function getProCatalogProducts(resumeProLive: boolean, rentalProLive: boolean) {
  const payProLive = getPayEvidencePaymentReadiness().ready;
  const eofyProLive = getEofyPaymentReadiness().ready;
  const leavingProLive = getLeavingAustraliaPaymentReadiness().ready;
  return [
    { id: "resume-pro", index: "01", icon: "work" as const, href: "/resume-pro?from=pro-catalog-card", label: "구직 준비", name: "Resume Pro", price: formatPrice(resumeProProduct.priceCents), live: resumeProLive, review: false, outcome: "지원 공고별 이력서·커버레터·STAR 면접 메모", free: "무료 이력서·공고 근거 점검", freeHref: "/resume-job-ad-checker" },
    { id: "rental-application-pro", index: "02", icon: "home" as const, href: "/rental-application-pro?from=pro-hub", label: "집 구하기", name: "Rental Pack Pro", price: formatPrice(rentalApplicationProProduct.priceCents), live: rentalProLive, review: false, outcome: "신청 서류·개인정보·영문 소개문 준비", free: "무료 집 방문·계약 체크", freeHref: "/property-inspection-checklist" },
    { id: "pay-evidence-pro", index: "03", icon: "document" as const, href: "/pay-evidence-pro", label: "급여 확인", name: "Pay Evidence Pro", price: formatPrice(payEvidenceProProduct.priceCents), live: payProLive, review: !payProLive, outcome: "근무시간·Payslip 차이·증빙표·영문 문의문", free: "무료 급여 문제 대응 순서", freeHref: "/underpayment-guide" },
    { id: "eofy-pro", index: "04", icon: "money" as const, href: "/eofy-pro", label: "세금 준비", name: "EOFY Pack Pro", price: formatPrice(eofyProProduct.priceCents), live: eofyProLive, review: !eofyProLive, outcome: "흩어진 소득·공제 자료와 세무사 질문 요약", free: "무료 택스 리턴 정보", freeHref: "/tax-return-guide" },
    { id: "leaving-australia-pro", index: "05", icon: "arrival" as const, href: "/leaving-australia-pro", label: "귀국 준비", name: "Leaving Pack Pro", price: formatPrice(leavingAustraliaProProduct.priceCents), live: leavingProLive, review: !leavingProLive, outcome: "Bond·마지막 급여·세금·DASP 후속 확인", free: "무료 귀국·DASP 가이드", freeHref: "/leaving-australia-guide" },
    { id: "car-purchase-pro", index: "06", icon: "search" as const, href: "/car-purchase-pro", label: "중고차 구매", name: "Car Purchase Pack Pro", price: "가격 미정", live: false, review: false, unpriced: true, outcome: "검사 뒤 질문·판매자 수리 약속과 증빙·독립 재확인·최종 결정 기록", free: "무료 중고차 후보·비용 비교", freeHref: "/used-car-comparison" },
  ].map((product) => ({
    ...product,
    status: "unpriced" in product && product.unpriced ? "가격·구매 조건 준비 중" : product.live ? "현재 이용 가능" : product.review ? "기능 검증 중" : "결제 설정 확인 중",
    priceNote: "unpriced" in product && product.unpriced
      ? "결제 미오픈"
      : product.review
      ? "검토 중인 1회 예정 가격 · 결제 미오픈"
      : product.live ? "1회 결제 · 구독 없음" : "1회 가격 · 현재 결제 미오픈",
  }));
}
