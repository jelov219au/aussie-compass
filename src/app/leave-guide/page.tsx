import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "호주 휴가·병가·공휴일 가이드 | Hoju Compass",
  description: "호주의 Annual Leave, Sick and Carer's Leave, Public Holiday 기본 권리를 고용 형태별로 확인하세요.",
  path: "/leave-guide",
});

const leaveTypes = [
  {
    title: "연차 (Annual Leave)",
    permanent: "Full-time과 Part-time은 일반적으로 ordinary hours 기준 연 4주를 적립합니다. Part-time은 근무시간에 비례합니다.",
    casual: "Casual은 NES상 유급 Annual Leave가 없습니다.",
  },
  {
    title: "병가·간병휴가 (Sick and Carer's Leave)",
    permanent: "Full-time은 연 10일, Part-time은 근무시간에 비례해 유급 휴가를 적립하며 남은 잔액은 다음 해로 넘어갑니다.",
    casual: "유급 휴가는 없지만, 필요한 경우마다 2일의 unpaid carer's leave를 사용할 수 있습니다.",
  },
  {
    title: "공휴일 (Public Holiday)",
    permanent: "평소 근무일에 해당하는 공휴일에 쉬면 일반적으로 ordinary hours의 base rate를 받습니다.",
    casual: "근무하지 않은 공휴일에 대한 유급 권리는 일반적으로 없으며, 근무 시 Award·Agreement의 penalty rate를 확인해야 합니다.",
  },
];

export default function LeaveGuidePage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "급여 가이드", path: "/guides" }, { name: "휴가·병가·공휴일", path: "/leave-guide" }]} />
      <Header />
      <main className="py-12 sm:py-16">
        <Container>
          <Link href="/guides" className="inline-flex text-sm font-medium text-muted transition-colors hover:text-navy">&larr; 전체 가이드로 돌아가기</Link>
          <div className="mb-10 mt-6 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">Leave Guide</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">호주 휴가·병가·공휴일 기본 가이드</h1>
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">고용 형태에 따라 유급 휴가 권리가 달라집니다. Full-time·Part-time과 Casual의 기본 차이부터 확인하세요.</p>
          </div>

          <section className="rounded-2xl bg-navy p-6 text-white shadow-sm sm:p-8" aria-labelledby="leave-summary-heading">
            <p className="text-sm font-semibold text-gold">빠른 요약</p>
            <h2 id="leave-summary-heading" className="mt-2 text-2xl font-semibold">Permanent는 유급 휴가를 적립하고, Casual은 대부분 적립하지 않습니다</h2>
            <p className="mt-4 max-w-4xl leading-7 text-white/70">Casual loading은 Annual Leave와 paid sick leave 같은 일부 유급 권리가 없는 점을 반영합니다. 다만 Casual에게도 적용되는 무급·유급 휴가 권리가 별도로 있을 수 있습니다.</p>
          </section>

          <section className="mt-8 space-y-5" aria-labelledby="leave-types-heading">
            <h2 id="leave-types-heading" className="text-2xl font-semibold tracking-tight text-navy">고용 형태별 기본 차이</h2>
            {leaveTypes.map((leave) => (
              <article key={leave.title} className="overflow-hidden rounded-2xl border border-border bg-white">
                <h3 className="border-b border-border bg-surface px-6 py-4 text-lg font-semibold text-navy">{leave.title}</h3>
                <div className="grid md:grid-cols-2">
                  <div className="p-6 md:border-r md:border-border"><p className="text-sm font-semibold text-navy">Full-time / Part-time</p><p className="mt-2 text-sm leading-6 text-muted">{leave.permanent}</p></div>
                  <div className="border-t border-border p-6 md:border-t-0"><p className="text-sm font-semibold text-navy">Casual</p><p className="mt-2 text-sm leading-6 text-muted">{leave.casual}</p></div>
                </div>
              </article>
            ))}
          </section>

          <section className="mt-8 grid gap-5 md:grid-cols-2">
            <article className="rounded-2xl border border-border bg-white p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-navy">휴가 신청과 증빙</h2>
              <p className="mt-3 leading-7 text-muted">휴가가 필요한 사실과 예상 기간을 가능한 한 빨리 알리세요. 병가나 간병휴가에는 고용주가 medical certificate 또는 statutory declaration 같은 합리적인 증빙을 요청할 수 있습니다.</p>
            </article>
            <article className="rounded-2xl border border-border bg-white p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-navy">연차 중 공휴일이 있다면</h2>
              <p className="mt-3 leading-7 text-muted">Annual Leave 기간 중 평소 근무일에 Public Holiday가 포함되면 그날은 일반적으로 Annual Leave 잔액에서 차감되지 않습니다.</p>
            </article>
          </section>

          <section className="mt-8 rounded-2xl border border-gold/40 bg-gold/10 p-6 sm:p-8" aria-labelledby="holiday-heading">
            <h2 id="holiday-heading" className="text-xl font-semibold text-navy">공휴일 근무 요청은 합리적이어야 합니다</h2>
            <p className="mt-3 max-w-4xl leading-7 text-muted">직원에게는 Public Holiday에 쉬는 기본 권리가 있습니다. 고용주는 합리적인 근무 요청을 할 수 있고, 직원은 합리적인 사유가 있거나 요청 자체가 불합리하면 거절할 수 있습니다. 업무 성격, 개인 사정, 고용 형태, 추가 수당과 사전 통지 등이 함께 고려됩니다.</p>
          </section>

          <section className="mt-8 rounded-2xl border border-border bg-white p-6 sm:p-8" aria-labelledby="official-leave-heading">
            <h2 id="official-leave-heading" className="text-2xl font-semibold tracking-tight text-navy">Fair Work에서 최종 확인하기</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <a href="https://www.fairwork.gov.au/leave/annual-leave" target="_blank" rel="noreferrer" className="rounded-xl border border-border bg-surface p-5 transition hover:border-gold/60"><h3 className="font-semibold text-navy">Annual Leave</h3><p className="mt-2 text-sm leading-6 text-muted">연차 적립과 사용 기준을 확인합니다.</p></a>
              <a href="https://www.fairwork.gov.au/leave/sick-and-carers-leave" target="_blank" rel="noreferrer" className="rounded-xl border border-border bg-surface p-5 transition hover:border-gold/60"><h3 className="font-semibold text-navy">Sick and Carer&apos;s Leave</h3><p className="mt-2 text-sm leading-6 text-muted">병가·간병휴가와 증빙 기준을 확인합니다.</p></a>
              <a href="https://www.fairwork.gov.au/employment-conditions/public-holidays" target="_blank" rel="noreferrer" className="rounded-xl border border-border bg-surface p-5 transition hover:border-gold/60"><h3 className="font-semibold text-navy">Public Holidays</h3><p className="mt-2 text-sm leading-6 text-muted">공휴일 근무와 지급 기준을 확인합니다.</p></a>
            </div>
          </section>

          <aside className="mt-8 rounded-xl border border-border bg-white p-5 text-sm leading-6 text-muted">이 페이지는 National Employment Standards의 일반적인 최소 기준을 설명합니다. Award, Enterprise Agreement, 주·준주 법률 또는 근로계약에서 더 나은 권리를 제공할 수 있으므로 본인에게 적용되는 조건을 함께 확인하세요.</aside>
        </Container>
      </main>
      <Footer />
    </>
  );
}
