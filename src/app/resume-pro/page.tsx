import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { Container } from "@/components/ui/Container";
import { canCreateTestCheckout, getPaymentReadiness } from "@/lib/commerce";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Resume Pro 미리보기 | Hoju Compass",
  description: "호주 구직 지원서를 한 번에 정리하는 Resume Pro의 프리미엄 이력서, 커버레터, 공고 키워드 점검 기능을 미리 확인하세요.",
  path: "/resume-pro",
});

const features = [
  {
    number: "01",
    eyebrow: "Premium layouts",
    title: "직무에 맞게 고르는 프리미엄 디자인",
    description: "Hospitality, Office, Trade 등 지원 환경에 맞춘 ATS 친화형 레이아웃과 색상·간격 설정을 제공합니다.",
  },
  {
    number: "02",
    eyebrow: "Cover letter",
    title: "이력서와 연결되는 커버레터",
    description: "이력서에 이미 적은 경력과 강점을 다시 입력하지 않고, 지원 회사와 직무에 맞게 정리합니다.",
  },
  {
    number: "03",
    eyebrow: "Job match",
    title: "채용 공고 핵심 표현 점검",
    description: "공고에서 자주 쓰인 표현과 자격 요건을 확인하고 이력서에서 빠뜨린 내용을 직접 점검할 수 있게 돕습니다.",
  },
  {
    number: "04",
    eyebrow: "Application kit",
    title: "지원서 한 묶음으로 내보내기",
    description: "이력서, 커버레터, 일반 텍스트, 제출 전 체크리스트를 회사별 지원 패키지로 정리합니다.",
  },
];

const comparison = [
  ["기본 이력서 작성·미리보기", true, true],
  ["기본 색상·레이아웃", true, true],
  ["프리미엄 직무별 레이아웃", false, true],
  ["커버레터 작성 도구", false, true],
  ["채용 공고 키워드 점검", false, true],
  ["회사별 지원서 묶음", false, true],
] as const;

function TemplatePreview({ variant, label }: { variant: "editorial" | "split" | "minimal"; label: string }) {
  return (
    <article>
      <div className="aspect-[4/5] overflow-hidden border border-navy/15 bg-white p-5 shadow-[0_18px_45px_rgba(26,39,68,0.08)]">
        {variant === "editorial" && (
          <>
            <div className="border-b-2 border-[#325b4e] pb-3"><div className="h-3 w-24 bg-[#325b4e]" /><div className="mt-2 h-1.5 w-16 bg-[#bf9b40]" /></div>
            <div className="mt-5 h-1.5 w-14 bg-[#325b4e]" /><div className="mt-2 space-y-1.5"><div className="h-1 bg-slate-200" /><div className="h-1 bg-slate-200" /><div className="h-1 w-5/6 bg-slate-200" /></div>
            <div className="mt-5 h-1.5 w-12 bg-[#325b4e]" /><div className="mt-3 h-1.5 w-28 bg-slate-500" /><div className="mt-2 space-y-1.5"><div className="h-1 bg-slate-200" /><div className="h-1 w-4/5 bg-slate-200" /></div>
          </>
        )}
        {variant === "split" && (
          <div className="grid h-full grid-cols-[36%_1fr] gap-4">
            <div className="-m-5 mr-0 bg-[#1f3658] p-5"><div className="mt-2 h-3 w-full bg-white/90" /><div className="mt-3 h-1 w-3/4 bg-[#d6b85f]" /><div className="mt-8 h-1.5 w-10 bg-white/80" /><div className="mt-3 space-y-2"><div className="h-1 bg-white/30" /><div className="h-1 bg-white/30" /><div className="h-1 w-2/3 bg-white/30" /></div></div>
            <div className="py-2"><div className="h-1.5 w-14 bg-[#1f3658]" /><div className="mt-3 space-y-1.5"><div className="h-1 bg-slate-200" /><div className="h-1 bg-slate-200" /><div className="h-1 w-5/6 bg-slate-200" /></div><div className="mt-6 h-1.5 w-12 bg-[#1f3658]" /><div className="mt-3 h-1.5 w-24 bg-slate-500" /><div className="mt-2 space-y-1.5"><div className="h-1 bg-slate-200" /><div className="h-1 w-4/5 bg-slate-200" /></div></div>
          </div>
        )}
        {variant === "minimal" && (
          <>
            <div className="h-4 w-32 bg-[#262a30]" /><div className="mt-2 h-1.5 w-20 bg-slate-400" /><div className="mt-6 grid grid-cols-[1fr_2fr] gap-5 border-t border-slate-300 pt-5"><div><div className="h-1.5 w-10 bg-[#262a30]" /><div className="mt-3 space-y-2"><div className="h-1 bg-slate-200" /><div className="h-1 bg-slate-200" /><div className="h-1 w-3/4 bg-slate-200" /></div></div><div><div className="h-1.5 w-14 bg-[#262a30]" /><div className="mt-3 h-1.5 w-24 bg-slate-500" /><div className="mt-2 space-y-1.5"><div className="h-1 bg-slate-200" /><div className="h-1 bg-slate-200" /><div className="h-1 w-4/5 bg-slate-200" /></div><div className="mt-5 h-1.5 w-20 bg-slate-500" /><div className="mt-2 space-y-1.5"><div className="h-1 bg-slate-200" /><div className="h-1 w-5/6 bg-slate-200" /></div></div></div>
          </>
        )}
      </div>
      <p className="mt-3 text-sm font-semibold text-navy">{label}</p>
    </article>
  );
}

export default function ResumeProPage() {
  const paymentReadiness = getPaymentReadiness();
  const testCheckoutAvailable = canCreateTestCheckout();
  const checkoutAvailable = paymentReadiness.ready || testCheckoutAvailable;

  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "영문 이력서 빌더", path: "/resume-builder" }, { name: "Resume Pro", path: "/resume-pro" }]} />
      <Header />
      <main>
        <section className="border-b border-navy/15 py-12 sm:py-20">
          <Container>
            <Link href="/resume-builder" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 무료 이력서 빌더로 돌아가기</Link>
            <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem] lg:items-end">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Resume Pro / Preview</p>
                <h1 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-[-0.035em] text-navy sm:text-6xl">이력서 한 장에서,<br /><span className="font-normal text-navy-light">지원 준비 전체로.</span></h1>
                <p className="mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg">무료 빌더의 작성 경험은 그대로 두고, 회사별 커버레터와 공고 점검, 프리미엄 디자인, 지원서 묶음 내보내기를 더할 예정입니다.</p>
              </div>
              <aside className="border-l-2 border-gold pl-6">
                <p className="text-sm font-semibold text-muted">출시 예정가</p>
                <p className="mt-2 text-4xl font-semibold tracking-tight text-navy">A$19.90</p>
                <p className="mt-2 text-sm leading-6 text-muted">구독이 아닌 1회 결제를 우선 검토합니다.</p>
              </aside>
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/resume-builder" className="inline-flex min-h-12 items-center justify-center bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-navy-light">무료 이력서 먼저 만들기</Link>
              <span className="inline-flex min-h-12 items-center justify-center border border-border bg-white px-5 py-3 text-sm font-semibold text-muted">Pro 작업 공간 출시 준비 중</span>
              {checkoutAvailable ? (
                <form action="/api/checkout/resume-pro" method="post">
                  <button type="submit" className="inline-flex min-h-12 items-center justify-center bg-gold px-5 py-3 text-sm font-semibold text-navy hover:bg-white">
                    {testCheckoutAvailable ? "테스트 결제 시작" : "Resume Pro 구매"}
                  </button>
                </form>
              ) : (
                <span className="inline-flex min-h-12 items-center border border-border bg-white px-5 py-3 text-sm font-semibold text-muted" aria-label="결제 기능 준비 중">결제 기능 준비 중</span>
              )}
            </div>
            <p className="mt-4 text-xs leading-5 text-muted">
              {testCheckoutAvailable
                ? "현재 버튼은 Stripe 테스트 환경 전용이며 실제 카드 청구나 Pro 이용권 부여가 발생하지 않습니다."
                : "현재는 제품 미리보기 단계이며 결제·계정 생성·개인정보 수집이 진행되지 않습니다."}
            </p>
          </Container>
        </section>

        <section className="py-14 sm:py-20" aria-labelledby="templates-heading">
          <Container>
            <div className="grid gap-10 lg:grid-cols-[18rem_1fr]">
              <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Template direction</p><h2 id="templates-heading" className="mt-3 text-3xl font-semibold tracking-tight text-navy">같은 내용도<br />다르게 보이도록.</h2><p className="mt-4 text-sm leading-6 text-muted">화려한 장식보다 채용 담당자가 빠르게 읽을 수 있는 정보 구조에 집중합니다.</p></div>
              <div className="grid gap-5 sm:grid-cols-3">
                <TemplatePreview variant="editorial" label="Hospitality / Service" />
                <TemplatePreview variant="split" label="Office / Professional" />
                <TemplatePreview variant="minimal" label="Trade / Technical" />
              </div>
            </div>
          </Container>
        </section>

        <section className="border-y border-navy/15 bg-white py-14 sm:py-20" aria-labelledby="pro-features-heading">
          <Container>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Application workflow</p>
            <h2 id="pro-features-heading" className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">지원할 때 실제로 반복하는 일을 줄입니다.</h2>
            <ol className="mt-10 grid border-t border-navy/20 md:grid-cols-2">
              {features.map((feature, index) => (
                <li key={feature.number} className={`min-h-64 border-b border-navy/20 p-6 sm:p-8 ${index % 2 === 0 ? "md:border-r" : ""}`}>
                  <div className="flex items-center justify-between"><span className="font-mono text-sm text-gold">{feature.number} / 04</span><span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{feature.eyebrow}</span></div>
                  <h3 className="mt-10 text-xl font-semibold text-navy">{feature.title}</h3>
                  <p className="mt-3 max-w-lg text-sm leading-6 text-muted">{feature.description}</p>
                </li>
              ))}
            </ol>
            <p className="mt-8 border-l-2 border-gold pl-4 text-sm leading-6 text-muted">실제 작업 공간은 결제 권한 확인과 다른 기기에서의 구매 복구까지 검증한 뒤 공개합니다.</p>
            <Link href="/resume-pro/restore" className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-navy">이미 구매했다면 이용권 복구하기 <span className="ml-2" aria-hidden="true">→</span></Link>
          </Container>
        </section>

        <section className="py-14 sm:py-20" aria-labelledby="comparison-heading">
          <Container>
            <div className="grid gap-10 lg:grid-cols-[18rem_1fr]">
              <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Free stays free</p><h2 id="comparison-heading" className="mt-3 text-3xl font-semibold tracking-tight text-navy">무료 기능은<br />없애지 않습니다.</h2><p className="mt-4 text-sm leading-6 text-muted">기본 이력서 작성과 PDF 저장은 계속 무료로 제공하고, 추가 작업을 줄이는 기능만 Pro로 구분합니다.</p></div>
              <div className="min-w-0 overflow-x-auto border-t border-navy/20">
                <table className="w-full border-collapse text-left text-sm">
                  <thead><tr className="border-b border-navy/20"><th className="px-3 py-4 font-semibold text-navy sm:px-4">기능</th><th className="w-16 px-2 py-4 text-center font-semibold text-navy sm:w-28 sm:px-4">무료</th><th className="w-16 bg-gold/10 px-2 py-4 text-center font-semibold text-navy sm:w-28 sm:px-4">Pro</th></tr></thead>
                  <tbody>{comparison.map(([label, free, pro]) => <tr key={label} className="border-b border-border"><th className="px-3 py-4 font-medium text-navy sm:px-4">{label}</th><td className="px-2 py-4 text-center text-muted sm:px-4"><span className="sr-only">{free ? "포함" : "미포함"}</span><span aria-hidden="true">{free ? "✓" : "—"}</span></td><td className="bg-gold/10 px-2 py-4 text-center font-semibold text-navy sm:px-4"><span className="sr-only">{pro ? "포함" : "미포함"}</span><span aria-hidden="true">{pro ? "✓" : "—"}</span></td></tr>)}</tbody>
                </table>
              </div>
            </div>
          </Container>
        </section>

        <section className="bg-navy py-12 text-white sm:py-16">
          <Container className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Start with the free builder</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">지금은 이력서 내용을 먼저 준비하세요.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-white/65">작성 내용은 현재 기기의 브라우저에만 저장되며 Resume Pro 미리보기 페이지에서는 별도 정보를 수집하지 않습니다.</p></div>
            <Link href="/resume-builder" className="inline-flex min-h-12 shrink-0 items-center justify-center bg-gold px-5 py-3 text-sm font-semibold text-navy hover:bg-white">무료 빌더 열기 <span className="ml-3" aria-hidden="true">→</span></Link>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
