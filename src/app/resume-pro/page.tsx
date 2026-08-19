import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { ResumeProCheckoutForm } from "@/components/tools/ResumeProCheckoutForm";
import { Container } from "@/components/ui/Container";
import { canCreateTestCheckout, getPaymentReadiness } from "@/lib/commerce";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Resume Pro | Hoju Compass",
  description: "프리미엄 이력서 디자인, 커버레터, 채용 공고 키워드 점검을 한곳에서 준비하세요.",
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

type Props = { searchParams: Promise<{ access?: string; checkout?: string }> };

export default async function ResumeProPage({ searchParams }: Props) {
  const { access, checkout } = await searchParams;
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
            {access === "required" && (
              <div className="mt-5 border-l-2 border-gold bg-white p-4 text-sm leading-6 text-navy" role="alert">
                이 기기의 Resume Pro 접근이 만료됐거나 확인되지 않았습니다. 결제 완료 화면에서 다시 열거나 아래 이용권 복구를 사용해 주세요.
              </div>
            )}
            {access === "released" && (
              <div className="mt-5 border-l-2 border-emerald-600 bg-white p-4 text-sm leading-6 text-navy" role="status">
                이 기기의 Resume Pro 접근을 안전하게 해제했습니다. 구매 이용권은 유지됩니다.
              </div>
            )}
            {checkout === "cancelled" && (
              <div className="mt-5 border-l-2 border-navy/40 bg-white p-4 text-sm leading-6 text-navy" role="status">
                결제가 취소됐습니다. 청구되지 않았으며 준비가 되면 다시 시작할 수 있습니다.
              </div>
            )}
            <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem] lg:items-end">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Resume Pro</p>
                <h1 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-[-0.035em] text-navy sm:text-6xl">이력서 한 장에서,<br /><span className="font-normal text-navy-light">지원 준비 전체로.</span></h1>
                <p className="mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg">무료 빌더에서 작성한 내용을 바탕으로 회사별 커버레터, 공고 점검, 프리미엄 디자인과 지원서 묶음을 한곳에서 준비할 수 있어요.</p>
              </div>
              <aside className="border-l-2 border-gold pl-6">
                <p className="text-sm font-semibold text-muted">Resume Pro 1회 이용권</p>
                <p className="mt-2 text-4xl font-semibold tracking-tight text-navy">A$19.90</p>
                <p className="mt-2 text-sm leading-6 text-muted">매달 빠져나가는 구독료 없이 한 번만 결제해요.</p>
              </aside>
            </div>
            <div className="mt-10 flex flex-wrap items-start gap-3">
              <Link href="/resume-builder" className="inline-flex min-h-12 items-center justify-center bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-navy-light">무료 이력서 먼저 만들기</Link>
              <span className="inline-flex min-h-12 items-center justify-center border border-border bg-white px-5 py-3 text-sm font-semibold text-muted">{checkoutAvailable ? "Pro 작업 공간 이용 가능" : "Pro 작업 공간 출시 준비 중"}</span>
              {!checkoutAvailable && (
                <span className="inline-flex min-h-12 items-center border border-border bg-white px-5 py-3 text-sm font-semibold text-muted" aria-label="결제 기능 준비 중">결제 기능 준비 중</span>
              )}
            </div>
            {checkoutAvailable && <div className="mt-5"><ResumeProCheckoutForm testMode={testCheckoutAvailable} /></div>}
            <p className="mt-4 text-xs leading-5 text-muted">
              {testCheckoutAvailable
                ? "현재 버튼은 Stripe 테스트 환경 전용이며 실제 카드 청구는 없습니다. 테스트 이용권과 결제 처리 기술 기록만 생성됩니다."
                : checkoutAvailable
                  ? "결제는 Stripe의 보안 결제 페이지에서 진행되며, 결제가 완료되면 Resume Pro 작업 공간을 바로 열 수 있어요."
                  : "현재는 제품 미리보기 단계이며 결제·계정 생성·개인정보 수집이 진행되지 않습니다."}
            </p>
            {!checkoutAvailable && (
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-navy">
                <Link href="/purchase-information" className="underline decoration-gold underline-offset-4">구매·환불 안내</Link>
                <Link href="/privacy" className="underline decoration-gold underline-offset-4">결제 데이터 처리 안내</Link>
              </div>
            )}
          </Container>
        </section>

        <section className="py-14 sm:py-20" aria-labelledby="templates-heading">
          <Container>
            <div className="grid gap-10 lg:grid-cols-[18rem_1fr]">
              <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">이력서 디자인</p><h2 id="templates-heading" className="mt-3 text-3xl font-semibold tracking-tight text-navy">내용은 같아도,<br />읽히는 방식은 달라요.</h2><p className="mt-4 text-sm leading-6 text-muted">화려한 장식보다 채용 담당자가 필요한 내용을 빠르게 찾을 수 있도록 구성했어요.</p></div>
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
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">지원 준비 순서</p>
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
            <p className="mt-8 border-l-2 border-gold pl-4 text-sm leading-6 text-muted">결제가 확인되면 작업 공간이 바로 열립니다. 기기를 바꿔도 1회용 복구 코드로 다시 이용할 수 있어요.</p>
            <Link href="/resume-pro/restore" className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-navy">이미 구매했다면 이용권 복구하기 <span className="ml-2" aria-hidden="true">→</span></Link>
          </Container>
        </section>

        <section className="py-14 sm:py-20" aria-labelledby="comparison-heading">
          <Container>
            <div className="grid gap-10 lg:grid-cols-[18rem_1fr]">
              <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">무료 기능은 그대로</p><h2 id="comparison-heading" className="mt-3 text-3xl font-semibold tracking-tight text-navy">무료 이력서만으로도<br />충분히 시작할 수 있어요.</h2><p className="mt-4 text-sm leading-6 text-muted">기본 이력서 작성과 PDF 저장은 계속 무료예요. 반복되는 추가 준비를 덜어주는 기능만 Pro로 나눴어요.</p></div>
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
            <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">무료 이력서부터 시작해요</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">먼저 무료로 작성한 뒤, 필요할 때 Pro를 이용하세요.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-white/65">작성한 내용은 지금 사용하는 기기의 브라우저에 저장돼요. 결제 전에는 이름이나 연락처를 서버로 보내지 않습니다.</p></div>
            <Link href="/resume-builder" className="inline-flex min-h-12 shrink-0 items-center justify-center bg-gold px-5 py-3 text-sm font-semibold text-navy hover:bg-white">무료 빌더 열기 <span className="ml-3" aria-hidden="true">→</span></Link>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
