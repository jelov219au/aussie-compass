import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "중고차 거래노트 Pro · 준비 중 | Hoju Compass",
  description: "검사 보고서의 결함부터 판매자 수리 약속, 재확인과 구매 결정 기록까지 이어서 정리하는 도구를 준비하고 있습니다.",
  path: "/car-purchase-pro",
});

export default function CarPurchaseProPage() {
  return <><Header /><main className="py-12 sm:py-16"><Container>
    <Link href="/used-car-comparison" className="inline-flex min-h-11 items-center text-sm font-semibold text-navy">← 무료 중고차 구매 가이드</Link>
    <div className="mt-6 max-w-3xl">
      <p className="text-sm font-semibold text-gold-ink">Car Purchase Pack Pro · 준비 중</p>
      <h1 className="mt-4 text-3xl font-semibold leading-tight text-navy sm:text-5xl">고쳐주겠다는 약속,<br />확인한 기록으로 남기세요.</h1>
      <p className="mt-6 text-lg leading-8 text-muted">검사 결과를 받은 뒤 남은 질문, 수리 약속과 증빙, 최종 결정을 한 거래노트로 이어갑니다.</p>
      <p className="mt-4 rounded-xl border border-gold/50 bg-[#f6f3e9] p-4 text-sm leading-7 text-navy">기능 개발·검수 중입니다. 가격은 미정이며 아직 구매할 수 없습니다.</p>
    </div>
    <section className="mt-10 grid gap-5 md:grid-cols-3" aria-label="거래노트에서 준비하는 결과">
      {[
        ["01 · 검사 후 질문", "미검사 항목과 견적 미확정을 남기고, 다음에 물을 질문과 확인 날짜를 정리합니다."],
        ["02 · 수리 약속 확인", "답변을 받았다고 완료 처리하지 않습니다. 증빙 메모와 재확인 날짜·내용을 이어서 남깁니다."],
        ["03 · 결정 당시 기록", "구매 검토·추가 확인·제외 이유를 당시 입력값과 함께 보관하고 거래노트로 내보냅니다."],
      ].map(([title, description]) => <article key={title} className="rounded-2xl border border-border bg-white p-6"><h2 className="text-lg font-semibold text-navy">{title}</h2><p className="mt-3 text-sm leading-7 text-muted">{description}</p></article>)}
    </section>
    <section className="mt-8 rounded-2xl bg-navy p-6 text-white sm:p-8">
      <h2 className="text-xl font-semibold text-white">예시: 타이어 교체 약속을 받았다면</h2>
      <p className="mt-4 leading-7">판매자 답변 → 수리 예정일 → 교체 영수증 등 증빙 → 독립 재확인 내용 → 내 결정 순서로 기록합니다. 증빙·재확인 정보가 비어 있으면 미해결 항목으로 남습니다.</p>
      <p className="mt-3 text-sm leading-7 text-white/80">입력된 메모를 정리하는 기능입니다. 차량 상태·수리 이행·소유권을 자동 인증하지 않습니다.</p>
    </section>
    <div className="mt-8 flex flex-wrap gap-4">
      <Link href="/resources/used-car-inspection-report-next-steps" className="inline-flex min-h-12 items-center rounded-lg bg-navy px-5 py-3 text-sm font-semibold text-white">검사 보고서를 받은 뒤 할 일 읽기 →</Link>
      <Link href="/used-car-comparison#vehicle-comparison-heading" className="inline-flex min-h-12 items-center rounded-lg border border-navy px-5 py-3 text-sm font-semibold text-navy">무료 후보·비용 비교표 →</Link>
      {process.env.NODE_ENV === "development" && <Link href="/car-purchase-pro/workspace" className="inline-flex min-h-12 items-center rounded-lg border border-navy px-5 py-3 text-sm font-semibold text-navy">거래노트 개발 검수 화면 →</Link>}
    </div>
  </Container></main><Footer /></>;
}
