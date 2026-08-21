import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/ui/Container";
import { requireLocalOperatorAccess } from "@/lib/operatorOnly";
import { getResumeProPerformance, type ResumeProPerformanceRow } from "@/lib/resumeProPerformance";
import { createPageMetadata } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata = {
  ...createPageMetadata({
    title: "Resume Pro 성과 확인 | Hoju Compass",
    description: "유입 출처별 Resume Pro 방문, 결제 시작과 구매 전환을 비교하는 운영자용 화면입니다.",
    path: "/resume-pro-performance",
  }),
  robots: { index: false, follow: false },
};

function rate(part: number, total: number) {
  return total > 0 ? `${((part / total) * 100).toFixed(1)}%` : "—";
}

function money(cents: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(cents / 100);
}

function nextAction(row: ResumeProPerformanceRow, connected: { vercel: boolean; stripe: boolean }) {
  if (!connected.vercel || !connected.stripe) return "두 데이터 연결을 마친 뒤 판단하세요.";
  if (row.visits < 10) return "아직 표본이 적어요. 문구를 바꾸기 전에 더 지켜보세요.";
  if (row.checkoutStarts === 0) return "CTA보다 Resume Pro 소개 페이지에서 가치가 충분히 전달되는지 확인하세요.";
  if (row.purchases === 0) return "가격, 결제 조건과 구매 전 신뢰 설명을 먼저 점검하세요.";
  return "구매가 나온 경로예요. 같은 상황의 글과 CTA에 넓혀볼 수 있어요.";
}

type Props = { searchParams: Promise<{ days?: string | string[] }> };

export default async function ResumeProPerformancePage({ searchParams }: Props) {
  requireLocalOperatorAccess();
  const rawDays = (await searchParams).days;
  const dayText = Array.isArray(rawDays) ? rawDays[0] : rawDays;
  const days = dayText === "7" || dayText === "90" ? Number(dayText) as 7 | 90 : 30;
  const report = await getResumeProPerformance(days);
  const totals = report.rows.reduce((sum, row) => ({
    visits: sum.visits + row.visits,
    checkoutStarts: sum.checkoutStarts + row.checkoutStarts,
    purchases: sum.purchases + row.purchases,
    revenueCents: sum.revenueCents + row.revenueCents,
  }), { visits: 0, checkoutStarts: 0, purchases: 0, revenueCents: 0 });
  const connected = { vercel: report.vercel.connected, stripe: report.stripe.connected };

  return (
    <>
      <Header />
      <main className="py-12 sm:py-16">
        <Container>
          <Link href="/content-performance" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 콘텐츠 성과 기록판</Link>
          <header className="mt-5 grid gap-7 border-b border-navy/20 pb-9 lg:grid-cols-[1fr_20rem] lg:items-end">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Resume Pro funnel</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">어느 글이 방문을 넘어<br /><span className="font-normal text-navy-light">실제 구매로 이어지는지 봅니다.</span></h1>
              <p className="mt-5 max-w-3xl leading-7 text-muted">출처별 방문, 결제 시작과 결제 완료를 같은 기간으로 비교합니다. 이름, 이메일, 카드 정보나 개인별 행동은 가져오지 않아요.</p>
            </div>
            <form method="get" className="border-l-2 border-gold pl-5">
              <label className="text-sm font-semibold text-navy">확인 기간
                <select name="days" defaultValue={String(days)} className="mt-2 min-h-11 w-full border border-border bg-white px-3 text-sm font-medium" aria-label="성과 확인 기간">
                  <option value="7">최근 7일</option>
                  <option value="30">최근 30일</option>
                  <option value="90">최근 90일</option>
                </select>
              </label>
              <button type="submit" className="mt-3 min-h-11 w-full bg-navy px-4 text-sm font-semibold text-white">기간 바꿔 보기</button>
            </form>
          </header>

          <section className="mt-8 grid gap-4 lg:grid-cols-2" aria-label="데이터 연결 상태">
            <div className={`border-l-2 p-5 ${report.vercel.connected ? "border-emerald-600 bg-emerald-50" : "border-gold bg-white"}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">방문·결제 시작</p>
              <h2 className="mt-2 text-lg font-semibold text-navy">Vercel Analytics {report.vercel.connected ? "연결됨" : "연결 필요"}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{report.vercel.message}</p>
            </div>
            <div className={`border-l-2 p-5 ${report.stripe.connected ? "border-emerald-600 bg-emerald-50" : "border-gold bg-white"}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">결제 완료·매출</p>
              <h2 className="mt-2 text-lg font-semibold text-navy">Stripe {report.stripe.connected ? `${report.stripe.mode === "test" ? "테스트 " : ""}연결됨` : "연결 필요"}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{report.stripe.message}</p>
            </div>
          </section>

          <section className="mt-8" aria-labelledby="funnel-summary-heading">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-navy/20 pb-5">
              <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">{report.since} – {report.until}</p><h2 id="funnel-summary-heading" className="mt-2 text-2xl font-semibold text-navy">전체 흐름</h2></div>
              <p className="text-xs leading-5 text-muted">수치는 선택한 기간 안에 발생한 합계입니다.</p>
            </div>
            <dl className="grid gap-px bg-border sm:grid-cols-4">
              <div className="bg-white p-5"><dt className="text-xs text-muted">Resume Pro 방문</dt><dd className="mt-2 text-3xl font-semibold text-navy">{connected.vercel ? totals.visits.toLocaleString() : "—"}</dd></div>
              <div className="bg-white p-5"><dt className="text-xs text-muted">결제 시작</dt><dd className="mt-2 text-3xl font-semibold text-navy">{connected.vercel ? totals.checkoutStarts.toLocaleString() : "—"}</dd><p className="mt-1 text-xs text-muted">방문 대비 {connected.vercel ? rate(totals.checkoutStarts, totals.visits) : "—"}</p></div>
              <div className="bg-white p-5"><dt className="text-xs text-muted">결제 완료</dt><dd className="mt-2 text-3xl font-semibold text-navy">{connected.stripe ? totals.purchases.toLocaleString() : "—"}</dd><p className="mt-1 text-xs text-muted">시작 대비 {connected.vercel && connected.stripe ? rate(totals.purchases, totals.checkoutStarts) : "—"}</p></div>
              <div className="bg-white p-5"><dt className="text-xs text-muted">결제 금액</dt><dd className="mt-2 text-3xl font-semibold text-navy">{connected.stripe ? money(totals.revenueCents) : "—"}</dd><p className="mt-1 text-xs text-muted">환불 전 결제 완료 기준</p></div>
            </dl>
          </section>

          <section className="mt-10" aria-labelledby="source-performance-heading">
            <div className="border-b border-navy/20 pb-5"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Source comparison</p><h2 id="source-performance-heading" className="mt-2 text-2xl font-semibold text-navy">출처별 성과</h2></div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[54rem] border-collapse text-left text-sm">
                <thead><tr className="border-b border-navy/20"><th className="px-3 py-4 font-semibold text-navy">유입 경로</th><th className="px-3 py-4 text-right font-semibold text-navy">방문</th><th className="px-3 py-4 text-right font-semibold text-navy">결제 시작</th><th className="px-3 py-4 text-right font-semibold text-navy">결제 완료</th><th className="px-3 py-4 text-right font-semibold text-navy">방문→시작</th><th className="px-3 py-4 text-right font-semibold text-navy">시작→구매</th><th className="px-3 py-4 text-right font-semibold text-navy">결제 금액</th></tr></thead>
                <tbody>{report.rows.map((row) => <tr key={row.entry} className="border-b border-border"><th className="px-3 py-4 font-medium text-navy">{row.label}</th><td className="px-3 py-4 text-right text-muted">{connected.vercel ? row.visits.toLocaleString() : "—"}</td><td className="px-3 py-4 text-right text-muted">{connected.vercel ? row.checkoutStarts.toLocaleString() : "—"}</td><td className="px-3 py-4 text-right text-muted">{connected.stripe ? row.purchases.toLocaleString() : "—"}</td><td className="px-3 py-4 text-right text-muted">{connected.vercel ? rate(row.checkoutStarts, row.visits) : "—"}</td><td className="px-3 py-4 text-right text-muted">{connected.vercel && connected.stripe ? rate(row.purchases, row.checkoutStarts) : "—"}</td><td className="px-3 py-4 text-right font-medium text-navy">{connected.stripe ? money(row.revenueCents) : "—"}</td></tr>)}</tbody>
              </table>
            </div>
          </section>

          <section className="mt-10 border-t border-navy/20 pt-7" aria-labelledby="next-decision-heading">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">다음 판단</p>
            <h2 id="next-decision-heading" className="mt-2 text-2xl font-semibold text-navy">숫자가 말해 주는 다음 일</h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">{report.rows.map((row) => <li key={row.entry} className="border border-border bg-white p-5"><h3 className="font-semibold text-navy">{row.label}</h3><p className="mt-2 text-sm leading-6 text-muted">{nextAction(row, connected)}</p></li>)}</ul>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}
