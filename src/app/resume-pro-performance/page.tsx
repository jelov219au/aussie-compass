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

function ratio(part: number, total: number) {
  return total > 0 ? (part / total).toFixed(1) : "—";
}

function money(cents: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(cents / 100);
}

function collectionLabel(status: "collected" | "not_configured" | "error" | undefined) {
  if (status === "collected") return "수집됨";
  if (status === "error") return "오류";
  return "미수집";
}

function trafficChange(current: number, previous: number) {
  const change = current - previous;
  if (change === 0) return "변화 없음";
  return `${change > 0 ? "+" : ""}${change.toLocaleString()}`;
}

function resumeTemplatePulseDecision(status: "collected" | "not_configured" | "error", proViews: number) {
  if (status !== "collected") return `HOLD · ${collectionLabel(status)} 상태라 판단하지 않습니다.`;
  if (proViews < 10) return "HOLD · Resume Pro 조회가 10회 미만이라 전환 결론을 내리지 않습니다.";
  return "판단 가능 · Resume Pro 조회 표본이 10회 이상입니다.";
}

function utcMoment(value: string) {
  return `${value.slice(0, 16).replace("T", " ")} UTC`;
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
  const days = dayText === "7" || dayText === "30" || dayText === "90" ? Number(dayText) as 7 | 30 | 90 : 1;
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
              <p className="mt-5 max-w-3xl leading-7 text-muted">사이트 방문자와 페이지뷰부터 Pro 비교·상세 도달, Builder 시작, 공고 점검, Pro CTA, 무료 확인, 결제 시작과 live 결제·환불까지 같은 기간의 익명 합계로 비교합니다. 전액 환불된 통제 결제는 유지 결제에서 제외하지만, 남은 live 결제도 실제 신규 고객인지 자동 판정하지 않아요. 이메일 주소, 이름, 이력서·공고 내용, 회사명, 검색어나 URL 쿼리는 가져오지 않습니다.</p>
            </div>
            <form method="get" className="border-l-2 border-gold pl-5">
              <label className="text-sm font-semibold text-navy">확인 기간
                <select name="days" defaultValue={String(days)} className="mt-2 min-h-11 w-full border border-border bg-white px-3 text-sm font-medium" aria-label="성과 확인 기간">
                  <option value="1">오늘 (UTC 기준)</option>
                  <option value="7">최근 7일</option>
                  <option value="30">최근 30일</option>
                  <option value="90">최근 90일</option>
                </select>
              </label>
              <button type="submit" className="mt-3 min-h-11 w-full bg-navy px-4 text-sm font-semibold text-white">기간 바꿔 보기</button>
            </form>
          </header>

          <section className="mt-8 grid gap-4 lg:grid-cols-2" aria-label="데이터 연결 상태">
            <div className={`border-l-2 p-5 ${report.vercel.status === "collected" ? "border-emerald-600 bg-emerald-50" : report.vercel.status === "error" ? "border-red-600 bg-red-50" : "border-gold bg-white"}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">익명 퍼널 합계</p>
              <h2 className="mt-2 text-lg font-semibold text-navy">Vercel Analytics {collectionLabel(report.vercel.status)}</h2>
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
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">Vercel 토큰과 성과 집계 전용 Stripe 읽기 제한 키를 이 컴퓨터의 Git 제외 설정에 저장합니다. 회계 export 키와 권한을 합치지 않으며, 키 값은 화면에 다시 표시하지 않습니다.</p>
              {connection === "invalid" && <p className="mt-4 border-l-2 border-red-500 bg-red-50 p-3 text-sm text-red-900" role="alert">키 형식을 확인해 주세요. Stripe 키는 읽기 전용 제한 키여야 합니다.</p>}
              {connection === "saved" && <p className="mt-4 border-l-2 border-gold bg-surface p-3 text-sm text-navy" role="status">연결 정보를 저장했습니다. 위 상태가 계속 ‘연결 필요’라면 키 권한을 확인해 주세요.</p>}
              <form action="/api/resume-pro-performance/connection" method="post" className="mt-5 grid gap-4 lg:grid-cols-2">
                <label className="text-sm font-semibold text-navy">Vercel 접근 토큰
                  <input type="password" name="vercel_token" minLength={20} maxLength={512} autoComplete="off" spellCheck={false} className="mt-2 min-h-11 w-full border border-border bg-surface px-3 text-sm font-normal outline-none focus:border-gold" />
                </label>
                <label className="text-sm font-semibold text-navy">Vercel 팀 ID
                  <input type="password" name="vercel_team_id" maxLength={128} pattern="team_[A-Za-z0-9]+" autoComplete="off" spellCheck={false} className="mt-2 min-h-11 w-full border border-border bg-surface px-3 text-sm font-normal outline-none focus:border-gold" />
                </label>
                <label className="text-sm font-semibold text-navy">Stripe 성과 집계 전용 제한 키
                  <input type="password" name="stripe_performance_key" minLength={20} maxLength={512} pattern="rk_(test|live)_[A-Za-z0-9]+" autoComplete="off" spellCheck={false} className="mt-2 min-h-11 w-full border border-border bg-surface px-3 text-sm font-normal outline-none focus:border-gold" />
                </label>
                <button type="submit" className="min-h-11 bg-navy px-5 py-2 text-sm font-semibold text-white lg:col-span-2 lg:w-fit">이 컴퓨터에 연결하기</button>
              </form>
            </section>
          )}

          {days === 1 && report.trafficComparison && (
            <section className="mt-8" aria-labelledby="daily-traffic-comparison-heading">
              <div className="border-b border-navy/20 pb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Daily pulse · UTC</p>
                <h2 id="daily-traffic-comparison-heading" className="mt-2 text-2xl font-semibold text-navy">최근 24시간과 직전 24시간</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{report.trafficComparison.message}</p>
                <div className="mt-3 grid gap-2 text-xs leading-5 text-muted sm:grid-cols-2">
                  <p><strong className="text-navy">최근 구간</strong><br /><time dateTime={report.trafficComparison.current.since}>{utcMoment(report.trafficComparison.current.since)}</time> → <time dateTime={report.trafficComparison.current.until}>{utcMoment(report.trafficComparison.current.until)}</time></p>
                  <p><strong className="text-navy">직전 구간</strong><br /><time dateTime={report.trafficComparison.previous.since}>{utcMoment(report.trafficComparison.previous.since)}</time> → <time dateTime={report.trafficComparison.previous.until}>{utcMoment(report.trafficComparison.previous.until)}</time></p>
                </div>
                <div className="mt-4 flex flex-col gap-3 border-l-2 border-gold bg-white p-4 text-xs leading-5 text-muted sm:flex-row sm:items-center sm:justify-between">
                  <p>사이트 방문자·/pro 목록 도달·/resume-pro 상세 도달은 같은 사람을 이어 붙인 여정이 아니라 같은 시간대의 경로별 익명 합계입니다. 새로고침한 시각이 최근 구간의 새 UTC 종료점이 됩니다.</p>
                  <Link href="/resume-pro-performance?days=1" className="inline-flex min-h-11 shrink-0 items-center justify-center bg-navy px-4 font-semibold text-white">24시간 합계 새로고침</Link>
                </div>
              </div>
              <dl className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
                {([
                  ["사이트 방문자", "siteVisitors"],
                  ["페이지뷰", "sitePageviews"],
                  ["Pro 상품 목록 도달 (/pro)", "proCatalogVisitors"],
                  ["Resume Pro 상세 도달 (/resume-pro)", "resumeProVisitors"],
                ] as const).map(([label, key]) => {
                  const current = report.trafficComparison!.current[key];
                  const previous = report.trafficComparison!.previous[key];
                  const collected = report.trafficComparison!.status === "collected";
                  return (
                    <div key={key} className="bg-white p-5">
                      <dt className="text-xs text-muted">{label}</dt>
                      <dd className="mt-2 text-3xl font-semibold text-navy">{collected ? current.toLocaleString() : collectionLabel(report.trafficComparison!.status)}</dd>
                      <p className="mt-2 text-xs leading-5 text-muted">직전 24시간 {collected ? previous.toLocaleString() : "—"}</p>
                      <p className="text-xs leading-5 text-muted">{collected ? `${current === 0 ? "수집됨 · 활동 0 · " : ""}변화 ${trafficChange(current, previous)}` : "숫자로 판단하지 마세요"}</p>
                    </div>
                  );
                })}
              </dl>
              <div className="mt-8 border border-navy/15 bg-white p-5 sm:p-6" aria-labelledby="resume-template-pulse-heading">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Search template funnel</p>
                <h3 id="resume-template-pulse-heading" className="mt-2 text-xl font-semibold text-navy">무료 이력서 양식 글 · 24시간 퍼널</h3>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">고정 검색 글 방문, 그 글 출처의 Resume Pro 조회와 Checkout 시작을 같은 24시간 창에서 봅니다. 같은 사람을 연결한 여정이 아니라 고정 경로·출처의 익명 합계이며, 이름·이력서 내용·검색어나 URL 쿼리는 사용하지 않습니다.</p>
                <dl className="mt-5 grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
                  {([
                    ["검색 글 방문", "resumeTemplateVisitors"],
                    ["Resume Pro 조회", "resumeTemplateProViews"],
                    ["Checkout 시작", "resumeTemplateCheckoutStarts"],
                  ] as const).map(([label, key]) => {
                    const current = report.trafficComparison!.current[key];
                    const previous = report.trafficComparison!.previous[key];
                    const collected = report.trafficComparison!.status === "collected";
                    return (
                      <div key={key} className="bg-surface p-4">
                        <dt className="text-xs text-muted">{label}</dt>
                        <dd className="mt-2 text-2xl font-semibold text-navy">{collected ? current.toLocaleString() : collectionLabel(report.trafficComparison!.status)}</dd>
                        <p className="mt-2 text-xs leading-5 text-muted">직전 24시간 {collected ? previous.toLocaleString() : "—"}</p>
                      </div>
                    );
                  })}
                  <div className="bg-surface p-4">
                    <dt className="text-xs text-muted">조회 → Checkout 시작</dt>
                    <dd className="mt-2 text-2xl font-semibold text-navy">{report.trafficComparison.status === "collected" ? rate(report.trafficComparison.current.resumeTemplateCheckoutStarts, report.trafficComparison.current.resumeTemplateProViews) : "—"}</dd>
                    <p className="mt-2 text-xs leading-5 text-muted">직전 24시간 {report.trafficComparison.status === "collected" ? rate(report.trafficComparison.previous.resumeTemplateCheckoutStarts, report.trafficComparison.previous.resumeTemplateProViews) : "—"}</p>
                  </div>
                </dl>
                <p className="mt-4 border-l-2 border-gold bg-surface p-3 text-sm font-semibold leading-6 text-navy" role="status">{resumeTemplatePulseDecision(report.trafficComparison.status, report.trafficComparison.current.resumeTemplateProViews)}</p>
              </div>
            </section>
          )}

          <section className="mt-8" aria-labelledby="funnel-summary-heading">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-navy/20 pb-5">
              <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">{report.since} – {report.until}</p><h2 id="funnel-summary-heading" className="mt-2 text-2xl font-semibold text-navy">전체 흐름</h2></div>
              <p className="text-xs leading-5 text-muted">수치는 표시된 UTC 날짜 범위 안에 발생한 합계입니다.</p>
            </div>
            <dl className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-6">
              <div className="bg-white p-5"><dt className="text-xs text-muted">사이트 방문자</dt><dd className="mt-2 text-3xl font-semibold text-navy">{connected.vercel ? report.siteVisitors.toLocaleString() : "—"}</dd><p className="mt-1 text-xs text-muted">익명 기간 합계</p></div>
              <div className="bg-white p-5"><dt className="text-xs text-muted">페이지뷰</dt><dd className="mt-2 text-3xl font-semibold text-navy">{connected.vercel ? report.sitePageviews.toLocaleString() : "—"}</dd><p className="mt-1 text-xs text-muted">방문자당 {connected.vercel ? ratio(report.sitePageviews, report.siteVisitors) : "—"}회</p></div>
              <div className="bg-white p-5"><dt className="text-xs text-muted">Pro 상품 목록 도달 (/pro)</dt><dd className="mt-2 text-3xl font-semibold text-navy">{connected.vercel ? report.proCatalogVisitors.toLocaleString() : "—"}</dd><p className="mt-1 text-xs text-muted">전체 방문자 대비 {connected.vercel ? rate(report.proCatalogVisitors, report.siteVisitors) : "—"}</p></div>
              <div className="bg-white p-5"><dt className="text-xs text-muted">Resume Pro 상세 도달 (/resume-pro)</dt><dd className="mt-2 text-3xl font-semibold text-navy">{connected.vercel ? report.resumeProVisitors.toLocaleString() : "—"}</dd><p className="mt-1 text-xs text-muted">전체 방문자 대비 {connected.vercel ? rate(report.resumeProVisitors, report.siteVisitors) : "—"}</p></div>
              <div className="bg-white p-5"><dt className="text-xs text-muted">Builder 시작</dt><dd className="mt-2 text-3xl font-semibold text-navy">{connected.vercel ? report.builderStarts.toLocaleString() : "—"}</dd></div>
              <div className="bg-white p-5"><dt className="text-xs text-muted">공고 점검기 진입</dt><dd className="mt-2 text-3xl font-semibold text-navy">{connected.vercel ? report.jobAdViews.toLocaleString() : "—"}</dd></div>
              <div className="bg-white p-5"><dt className="text-xs text-muted">공고 예시 확인</dt><dd className="mt-2 text-3xl font-semibold text-navy">{connected.vercel ? report.jobAdSampleViews.toLocaleString() : "—"}</dd><p className="mt-1 text-xs text-muted">진입 대비 {connected.vercel ? rate(report.jobAdSampleViews, report.jobAdViews) : "—"}</p></div>
              <div className="bg-white p-5"><dt className="text-xs text-muted">공고 맞춤 점검</dt><dd className="mt-2 text-3xl font-semibold text-navy">{connected.vercel ? report.jobAdChecks.toLocaleString() : "—"}</dd><p className="mt-1 text-xs text-muted">진입 대비 {connected.vercel ? rate(report.jobAdChecks, report.jobAdViews) : "—"}</p></div>
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
