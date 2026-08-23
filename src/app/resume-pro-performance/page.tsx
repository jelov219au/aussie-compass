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
    description: "Builder 시작부터 live 결제, 전액 환불과 환불 반영 순액까지 익명 합계로 비교하는 운영자용 화면입니다.",
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
  if (row.paidCheckouts > 0 && row.retainedPayments === 0) return "전액 환불된 live 거래만 있어요. 통제 결제인지 실제 고객 환불인지 운영 사건과 대조하고 구매 성과로 세지 마세요.";
  if (row.retainedPayments > 0) return "전액 환불되지 않은 live 결제가 있어요. 실제 고객 여부를 운영 사건과 대조한 뒤에만 같은 유입 경로를 넓히세요.";
  if (row.visits < 10) return "아직 표본이 적어요. 문구를 바꾸기 전에 더 지켜보세요.";
  if (row.proofStarts === 0) return "방문 뒤 무료 확인이 시작되지 않았어요. 샘플과 무료 점검 연결을 먼저 점검하세요.";
  if (row.launchInterests > 0 && row.checkoutStarts === 0) return "메일 앱 열기·요청문 복사 행동이 나온 경로예요. 실제 메일 수신함 요청과 대조한 뒤 준비 게이트가 끝나면 제한적으로 알리세요.";
  if (row.checkoutStarts === 0) return "CTA보다 Resume Pro 소개 페이지에서 가치가 충분히 전달되는지 확인하세요.";
  return "가격, 결제 조건과 구매 전 신뢰 설명을 먼저 점검하세요.";
}

type Props = { searchParams: Promise<{ days?: string | string[]; connection?: string | string[] }> };

export default async function ResumeProPerformancePage({ searchParams }: Props) {
  requireLocalOperatorAccess();
  const query = await searchParams;
  const rawDays = query.days;
  const connection = Array.isArray(query.connection) ? query.connection[0] : query.connection;
  const dayText = Array.isArray(rawDays) ? rawDays[0] : rawDays;
  const days = dayText === "7" || dayText === "90" ? Number(dayText) as 7 | 90 : 30;
  const report = await getResumeProPerformance(days);
  const totals = report.rows.reduce((sum, row) => ({
    visits: sum.visits + row.visits,
    proofStarts: sum.proofStarts + row.proofStarts,
    launchInterests: sum.launchInterests + row.launchInterests,
    checkoutStarts: sum.checkoutStarts + row.checkoutStarts,
    paidCheckouts: sum.paidCheckouts + row.paidCheckouts,
    fullRefunds: sum.fullRefunds + row.fullRefunds,
    retainedPayments: sum.retainedPayments + row.retainedPayments,
    grossRevenueCents: sum.grossRevenueCents + row.grossRevenueCents,
    refundedCents: sum.refundedCents + row.refundedCents,
    netRevenueCents: sum.netRevenueCents + row.netRevenueCents,
  }), { visits: 0, proofStarts: 0, launchInterests: 0, checkoutStarts: 0, paidCheckouts: 0, fullRefunds: 0, retainedPayments: 0, grossRevenueCents: 0, refundedCents: 0, netRevenueCents: 0 });
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
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">어느 글이 방문을 넘어<br /><span className="font-normal text-navy-light">어떤 결제 상태로 이어지는지 봅니다.</span></h1>
              <p className="mt-5 max-w-3xl leading-7 text-muted">Builder 시작, 공고 예시 확인, 실제 공고 맞춤 점검, Pro CTA 클릭, 방문, 무료 확인, 판매 시작 메일 준비 행동, 결제 시작과 live 결제·전액 환불을 같은 기간의 익명 합계로 비교합니다. 전액 환불된 통제 결제는 유지 결제에서 제외하지만, 남은 live 결제도 실제 신규 고객인지 자동 판정하지 않아요. 이메일 주소, 이름, 이력서·공고 내용, 회사명, 검색어나 URL 쿼리는 가져오지 않습니다.</p>
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
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">익명 퍼널 합계</p>
              <h2 className="mt-2 text-lg font-semibold text-navy">Vercel Analytics {report.vercel.connected ? "연결됨" : "연결 필요"}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{report.vercel.message}</p>
            </div>
            <div className={`border-l-2 p-5 ${report.stripe.connected ? "border-emerald-600 bg-emerald-50" : "border-gold bg-white"}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">live 결제·환불 반영</p>
              <h2 className="mt-2 text-lg font-semibold text-navy">Stripe {report.stripe.connected ? `${report.stripe.mode === "test" ? "테스트 " : ""}연결됨` : "연결 필요"}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{report.stripe.message}</p>
            </div>
          </section>

          {(!connected.vercel || !connected.stripe) && (
            <section className="mt-8 border border-navy/15 bg-white p-5 sm:p-6" aria-labelledby="connection-heading">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">이 컴퓨터에서만</p>
              <h2 id="connection-heading" className="mt-2 text-xl font-semibold text-navy">성과 데이터 연결</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">Vercel 토큰과 Stripe 읽기 전용 제한 키를 이 컴퓨터의 Git 제외 설정에 저장합니다. 키 값은 화면에 다시 표시하지 않습니다.</p>
              {connection === "invalid" && <p className="mt-4 border-l-2 border-red-500 bg-red-50 p-3 text-sm text-red-900" role="alert">키 형식을 확인해 주세요. Stripe 키는 읽기 전용 제한 키여야 합니다.</p>}
              {connection === "saved" && <p className="mt-4 border-l-2 border-gold bg-surface p-3 text-sm text-navy" role="status">연결 정보를 저장했습니다. 위 상태가 계속 ‘연결 필요’라면 키 권한을 확인해 주세요.</p>}
              <form action="/api/resume-pro-performance/connection" method="post" className="mt-5 grid gap-4 lg:grid-cols-2">
                <label className="text-sm font-semibold text-navy">Vercel 접근 토큰
                  <input type="password" name="vercel_token" minLength={20} maxLength={512} autoComplete="off" spellCheck={false} className="mt-2 min-h-11 w-full border border-border bg-surface px-3 text-sm font-normal outline-none focus:border-gold" />
                </label>
                <label className="text-sm font-semibold text-navy">Vercel 팀 ID
                  <input type="password" name="vercel_team_id" maxLength={128} pattern="team_[A-Za-z0-9]+" autoComplete="off" spellCheck={false} className="mt-2 min-h-11 w-full border border-border bg-surface px-3 text-sm font-normal outline-none focus:border-gold" />
                </label>
                <label className="text-sm font-semibold text-navy">Stripe 읽기 전용 제한 키
                  <input type="password" name="stripe_accounting_key" minLength={20} maxLength={512} pattern="rk_(test|live)_[A-Za-z0-9]+" autoComplete="off" spellCheck={false} className="mt-2 min-h-11 w-full border border-border bg-surface px-3 text-sm font-normal outline-none focus:border-gold" />
                </label>
                <button type="submit" className="min-h-11 bg-navy px-5 py-2 text-sm font-semibold text-white lg:col-span-2 lg:w-fit">이 컴퓨터에 연결하기</button>
              </form>
            </section>
          )}

          <section className="mt-8" aria-labelledby="funnel-summary-heading">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-navy/20 pb-5">
              <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">{report.since} – {report.until}</p><h2 id="funnel-summary-heading" className="mt-2 text-2xl font-semibold text-navy">전체 흐름</h2></div>
              <p className="text-xs leading-5 text-muted">수치는 선택한 기간 안에 발생한 합계입니다.</p>
            </div>
            <dl className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-6">
              <div className="bg-white p-5"><dt className="text-xs text-muted">Builder 시작</dt><dd className="mt-2 text-3xl font-semibold text-navy">{connected.vercel ? report.builderStarts.toLocaleString() : "—"}</dd></div>
              <div className="bg-white p-5"><dt className="text-xs text-muted">공고 예시 확인</dt><dd className="mt-2 text-3xl font-semibold text-navy">{connected.vercel ? report.jobAdSampleViews.toLocaleString() : "—"}</dd></div>
              <div className="bg-white p-5"><dt className="text-xs text-muted">공고 맞춤 점검</dt><dd className="mt-2 text-3xl font-semibold text-navy">{connected.vercel ? report.jobAdChecks.toLocaleString() : "—"}</dd></div>
              <div className="bg-white p-5"><dt className="text-xs text-muted">Pro CTA 클릭</dt><dd className="mt-2 text-3xl font-semibold text-navy">{connected.vercel ? report.proCtaClicks.toLocaleString() : "—"}</dd></div>
              <div className="bg-white p-5"><dt className="text-xs text-muted">Resume Pro 방문</dt><dd className="mt-2 text-3xl font-semibold text-navy">{connected.vercel ? totals.visits.toLocaleString() : "—"}</dd></div>
              <div className="bg-white p-5"><dt className="text-xs text-muted">무료 확인 시작</dt><dd className="mt-2 text-3xl font-semibold text-navy">{connected.vercel ? totals.proofStarts.toLocaleString() : "—"}</dd><p className="mt-1 text-xs text-muted">방문 대비 {connected.vercel ? rate(totals.proofStarts, totals.visits) : "—"}</p></div>
              <div className="bg-white p-5"><dt className="text-xs text-muted">안내 메일 준비 행동</dt><dd className="mt-2 text-3xl font-semibold text-navy">{connected.vercel ? totals.launchInterests.toLocaleString() : "—"}</dd><p className="mt-1 text-xs text-muted">방문 대비 {connected.vercel ? rate(totals.launchInterests, totals.visits) : "—"} · 실제 발송 아님</p></div>
              <div className="bg-white p-5"><dt className="text-xs text-muted">결제 시작</dt><dd className="mt-2 text-3xl font-semibold text-navy">{connected.vercel ? totals.checkoutStarts.toLocaleString() : "—"}</dd><p className="mt-1 text-xs text-muted">방문 대비 {connected.vercel ? rate(totals.checkoutStarts, totals.visits) : "—"}</p></div>
              <div className="bg-white p-5"><dt className="text-xs text-muted">live 결제 완료</dt><dd className="mt-2 text-3xl font-semibold text-navy">{connected.stripe ? totals.paidCheckouts.toLocaleString() : "—"}</dd><p className="mt-1 text-xs text-muted">통제 거래 포함</p></div>
              <div className="bg-white p-5"><dt className="text-xs text-muted">전액 환불</dt><dd className="mt-2 text-3xl font-semibold text-navy">{connected.stripe ? totals.fullRefunds.toLocaleString() : "—"}</dd><p className="mt-1 text-xs text-muted">유지 결제에서 제외</p></div>
              <div className="bg-white p-5"><dt className="text-xs text-muted">유지 결제 후보</dt><dd className="mt-2 text-3xl font-semibold text-navy">{connected.stripe ? totals.retainedPayments.toLocaleString() : "—"}</dd><p className="mt-1 text-xs text-muted">시작 대비 {connected.vercel && connected.stripe ? rate(totals.retainedPayments, totals.checkoutStarts) : "—"} · 고객 여부 수동 확인</p></div>
              <div className="bg-white p-5"><dt className="text-xs text-muted">환불 반영 순액</dt><dd className="mt-2 text-3xl font-semibold text-navy">{connected.stripe ? money(totals.netRevenueCents) : "—"}</dd><p className="mt-1 text-xs text-muted">총 {connected.stripe ? money(totals.grossRevenueCents) : "—"} · 환불 {connected.stripe ? money(totals.refundedCents) : "—"}</p></div>
            </dl>
          </section>

          <section className="mt-10" aria-labelledby="source-performance-heading">
            <div className="border-b border-navy/20 pb-5"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Source comparison</p><h2 id="source-performance-heading" className="mt-2 text-2xl font-semibold text-navy">출처별 성과</h2></div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[82rem] border-collapse text-left text-sm">
                <thead><tr className="border-b border-navy/20"><th className="px-3 py-4 font-semibold text-navy">유입 경로</th><th className="px-3 py-4 text-right font-semibold text-navy">방문</th><th className="px-3 py-4 text-right font-semibold text-navy">무료 확인</th><th className="px-3 py-4 text-right font-semibold text-navy">메일 준비 행동</th><th className="px-3 py-4 text-right font-semibold text-navy">결제 시작</th><th className="px-3 py-4 text-right font-semibold text-navy">live 결제</th><th className="px-3 py-4 text-right font-semibold text-navy">전액 환불</th><th className="px-3 py-4 text-right font-semibold text-navy">유지 후보</th><th className="px-3 py-4 text-right font-semibold text-navy">방문→확인</th><th className="px-3 py-4 text-right font-semibold text-navy">방문→메일 준비</th><th className="px-3 py-4 text-right font-semibold text-navy">시작→유지</th><th className="px-3 py-4 text-right font-semibold text-navy">환불 반영 순액</th></tr></thead>
                <tbody>{report.rows.map((row) => <tr key={row.entry} className="border-b border-border"><th className="px-3 py-4 font-medium text-navy">{row.label}</th><td className="px-3 py-4 text-right text-muted">{connected.vercel ? row.visits.toLocaleString() : "—"}</td><td className="px-3 py-4 text-right text-muted">{connected.vercel ? row.proofStarts.toLocaleString() : "—"}</td><td className="px-3 py-4 text-right text-muted">{connected.vercel ? row.launchInterests.toLocaleString() : "—"}</td><td className="px-3 py-4 text-right text-muted">{connected.vercel ? row.checkoutStarts.toLocaleString() : "—"}</td><td className="px-3 py-4 text-right text-muted">{connected.stripe ? row.paidCheckouts.toLocaleString() : "—"}</td><td className="px-3 py-4 text-right text-muted">{connected.stripe ? row.fullRefunds.toLocaleString() : "—"}</td><td className="px-3 py-4 text-right text-muted">{connected.stripe ? row.retainedPayments.toLocaleString() : "—"}</td><td className="px-3 py-4 text-right text-muted">{connected.vercel ? rate(row.proofStarts, row.visits) : "—"}</td><td className="px-3 py-4 text-right text-muted">{connected.vercel ? rate(row.launchInterests, row.visits) : "—"}</td><td className="px-3 py-4 text-right text-muted">{connected.vercel && connected.stripe ? rate(row.retainedPayments, row.checkoutStarts) : "—"}</td><td className="px-3 py-4 text-right font-medium text-navy">{connected.stripe ? money(row.netRevenueCents) : "—"}</td></tr>)}</tbody>
              </table>
            </div>
          </section>

          <section className="mt-10 border-t border-navy/20 pt-7" aria-labelledby="next-decision-heading">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">다음 판단</p>
            <h2 id="next-decision-heading" className="mt-2 text-2xl font-semibold text-navy">숫자가 말해 주는 다음 일</h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">{report.rows.map((row) => <li key={row.entry} className="border border-border bg-white p-5"><h3 className="font-semibold text-navy">{row.label}</h3><p className="mt-2 text-sm leading-6 text-muted">{nextAction(row, connected)}</p></li>)}</ul>
          </section>
          <section className="mt-10 border-l-2 border-gold bg-surface p-5 sm:flex sm:items-center sm:justify-between sm:gap-6" aria-labelledby="first-customer-invitation-heading">
            <div>
              <h2 id="first-customer-invitation-heading" className="font-semibold text-navy">첫 고객 1회 안내 준비</h2>
              <p className="mt-1 text-sm leading-6 text-muted">고객이 먼저 요청했고 모든 결제 게이트가 통과된 경우에만 고정 안내문을 준비합니다.</p>
            </div>
            <Link href="/first-customer-invitation" className="mt-4 inline-flex min-h-11 shrink-0 items-center bg-navy px-4 text-sm font-semibold text-white sm:mt-0">운영 점검 열기</Link>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}
