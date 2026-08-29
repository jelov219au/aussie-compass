import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { TaxPrepTracker } from "@/components/tools/TaxPrepTracker";
import { TaxTimeReminder } from "@/components/tools/TaxTimeReminder";
import { BreadcrumbJsonLd, WebApplicationJsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "호주 택스 리턴 준비 장부 | 연중 소득·지출 기록",
  description: "7월에 몰아서 준비하지 않도록 소득, 업무 관련 지출 후보와 증빙 상태를 현재 브라우저에 매달 기록하고 CSV로 백업하세요.",
  path: "/tax-prep-tracker",
});

export default function TaxPrepTrackerPage() {
  return <>
    <WebApplicationJsonLd name="호주 택스 리턴 준비 장부" description="소득, 업무 관련 지출 후보와 증빙 상태를 현재 브라우저에 연중 기록하고 CSV로 저장하는 무료 도구" path="/tax-prep-tracker" applicationCategory="BusinessApplication" featureList={["회계연도별 로컬 기록", "증빙 상태 점검", "CSV 백업", "서버 전송 없음"]} />
    <BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "택스 리턴 준비 장부", path: "/tax-prep-tracker" }]} />
    <Header />
    <main className="py-12 sm:py-16"><Container>
      <Link href="/tax-return-guide" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 택스 리턴 가이드로 돌아가기</Link>
      <div className="mt-5 max-w-4xl"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">10분씩 쌓는 EOFY 준비</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-5xl">7월의 숙제를, 매달 작은 기록으로 바꾸세요</h1><p className="mt-4 text-base leading-7 text-muted sm:text-lg">일이 생긴 달에 금액과 증빙 위치만 적어두면 EOFY에 기억을 되짚는 시간을 줄일 수 있습니다. 간단한 신고는 스스로 검토할 자료가 생기고, 복잡해져 세무사를 찾더라도 정리된 기록을 전달할 수 있어요.</p></div>

      <section className="my-8 grid gap-4 md:grid-cols-3" aria-label="연중 택스 준비 습관"><article className="rounded-2xl border border-gold/40 bg-gold/5 p-5"><p className="text-xs font-semibold text-gold-ink">매달</p><h2 className="mt-2 font-semibold text-navy">금액과 증빙 위치 기록</h2><p className="mt-2 text-sm leading-6 text-muted">파일을 올리지 않고 어디에 보관했는지만 적어도 누락을 찾기 쉬워요.</p></article><article className="rounded-2xl border border-border bg-white p-5"><p className="text-xs font-semibold text-gold-ink">회계연도 중</p><h2 className="mt-2 font-semibold text-navy">복잡성 조기 확인</h2><p className="mt-2 text-sm leading-6 text-muted">부업·투자·해외 소득처럼 전문가 확인이 필요한 항목을 7월 전에 발견해요.</p></article><article className="rounded-2xl border border-border bg-white p-5"><p className="text-xs font-semibold text-gold-ink">EOFY</p><h2 className="mt-2 font-semibold text-navy">Pre-fill과 내 기록 대조</h2><p className="mt-2 text-sm leading-6 text-muted">ATO 자료와 CSV·원본 증빙을 비교한 뒤 직접 신고 또는 등록 세무사를 결정해요.</p></article></section>

      <TaxPrepTracker />
      <div className="mt-8"><TaxTimeReminder /></div>

      <section className="mt-10 grid gap-4 lg:grid-cols-2"><div className="rounded-2xl border border-border bg-surface p-6"><h2 className="text-xl font-semibold text-navy">이 도구가 줄이는 비용은 ‘정리 시간’입니다</h2><p className="mt-3 text-sm leading-7 text-muted">많이 돌려받는다고 보장하거나 세무사를 불필요하다고 단정하지 않습니다. 단순한 급여 소득 중심이라면 myTax 직접 신고를 검토할 자료를 미리 갖추고, 복잡한 상황이라면 등록 세무사에게 더 정리된 질문과 기록을 전달하는 것이 목적입니다.</p></div><div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm leading-7 text-amber-950"><h2 className="font-semibold">세무·개인정보 안내</h2><p className="mt-2">표시된 지출 합계는 공제액이나 예상 환급액이 아닙니다. 공제 가능성, 업무 사용 비율, 보관 기간과 신고 의무는 ATO 원문 또는 등록 세무사에게 확인하세요. TFN·계좌번호·로그인 정보나 영수증 이미지는 입력하지 마세요.</p></div></section>
    </Container></main>
    <Footer />
  </>;
}
