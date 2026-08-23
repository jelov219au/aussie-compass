import Link from "next/link";
import { ResumeProProofLink } from "@/components/analytics/ResumeProProofLink";
import { ResumeProVisitTracker } from "@/components/analytics/ResumeProVisitTracker";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { BreadcrumbJsonLd, ProductJsonLd } from "@/components/seo/JsonLd";
import { ResumeProCheckoutForm } from "@/components/tools/ResumeProCheckoutForm";
import { ResumeProCheckoutFailureNotice } from "@/components/tools/ResumeProCheckoutFailureNotice";
import { ResumeProCheckoutJumpLink } from "@/components/tools/ResumeProCheckoutJumpLink";
import { ResumeProLaunchInterestCopyButton, ResumeProLaunchInterestLink } from "@/components/tools/ResumeProLaunchInterestLink";
import { Container } from "@/components/ui/Container";
import { canCreateTestCheckout, getPaymentReadiness, resumeProProduct } from "@/lib/commerce";
import { getPublicSellerDetails } from "@/lib/publicSeller";
import { normalizeResumeProEntry } from "@/lib/resumeProAttribution";
import { getResumeProCheckoutFailure } from "@/lib/resumeProCheckoutFailure";
import { createPageMetadata } from "@/lib/site";

const resumeProDescription = "실제 경력과 호주 채용 공고를 맞춰 회사별 이력서·커버레터를 만들고, STAR 면접 메모로 다시 쓰거나 지원서 묶음으로 내보내세요.";

export const metadata = createPageMetadata({
  title: "호주 취업 공고별 이력서·커버레터 준비 | Resume Pro",
  description: resumeProDescription,
  path: "/resume-pro",
});

const features = [
  {
    number: "01",
    eyebrow: "Premium layouts",
    title: "채용 담당자가 필요한 내용을 빨리 찾게",
    description: "Hospitality, Office, Trade 등 지원 환경에 맞춰 경력과 강점이 먼저 읽히는 레이아웃을 골라요.",
  },
  {
    number: "02",
    eyebrow: "Cover letter",
    title: "내 경력을 다시 쓰지 않아도 되는 커버레터",
    description: "이력서에 적어둔 실제 경력과 강점을 불러와 지원 회사와 직무에 맞게 정리해요.",
  },
  {
    number: "03",
    eyebrow: "Job match",
    title: "공고에서 놓친 요구사항 확인",
    description: "공고에 반복되는 표현과 자격 요건을 찾아보고, 내 이력서에서 빠뜨린 내용이 없는지 직접 확인해요.",
  },
  {
    number: "04",
    eyebrow: "Application kit",
    title: "제출할 파일을 회사별로 한 묶음에",
    description: "이력서, 커버레터, 일반 텍스트와 제출 전 체크리스트를 이번 지원에 맞춰 함께 정리해요.",
  },
];

const comparison = [
  ["기본 이력서 작성·미리보기", true, true],
  ["기본 색상·레이아웃", true, true],
  ["프리미엄 직무별 레이아웃", false, true],
  ["커버레터 작성 도구", false, true],
  ["채용 공고 키워드 점검", false, true],
  ["회사별 지원서 묶음", false, true],
  ["재사용하는 STAR 경험 보관함", false, true],
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

type Props = { searchParams: Promise<{ access?: string; checkout?: string; deviceData?: string; from?: string | string[] }> };

export default async function ResumeProPage({ searchParams }: Props) {
  const { access, checkout, deviceData, from } = await searchParams;
  const paymentReadiness = getPaymentReadiness();
  const testCheckoutAvailable = canCreateTestCheckout();
  const checkoutAvailable = paymentReadiness.ready || testCheckoutAvailable;
  const existingBuyerIssue = access === "required" || access === "released" || checkout === "checkout_support_required";
  const canOfferCheckout = checkoutAvailable && !existingBuyerIssue;
  const entry = normalizeResumeProEntry(from);
  const checkoutFailure = getResumeProCheckoutFailure(checkout);
  const seller = getPublicSellerDetails();

  return (
    <>
      {!existingBuyerIssue && <ResumeProVisitTracker entry={entry} checkoutAvailable={checkoutAvailable} />}
      <ProductJsonLd
        name={resumeProProduct.name}
        description={resumeProDescription}
        path="/resume-pro"
        currency={resumeProProduct.currency}
        priceCents={resumeProProduct.priceCents}
        available={process.env.VERCEL_ENV === "production" && paymentReadiness.ready}
      />
      <BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "영문 이력서 빌더", path: "/resume-builder" }, { name: "Resume Pro", path: "/resume-pro" }]} />
      <Header />
      <main>
        <section className="border-b border-navy/15 py-12 sm:py-20">
          <Container>
            <Link href="/resume-builder" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 무료 이력서 빌더로 돌아가기</Link>
            {access === "required" && (
              <div className="mt-5 border-l-2 border-gold bg-white p-4 text-sm leading-6 text-navy" role="alert">
                이 기기의 Resume Pro 이용권을 다시 확인해야 합니다. 다시 결제하지 마세요. 기존 기기의 1회용 복구 코드를 사용하거나 고객지원 확인 순서를 이용해 주세요.
              </div>
            )}
            {access === "released" && (
              <div className="mt-5 border-l-2 border-emerald-600 bg-white p-4 text-sm leading-6 text-navy" role="status">
                {deviceData === "deleted"
                  ? "이 기기의 Resume Pro 이용 연결과 저장 데이터를 삭제했습니다. 다시 결제하지 마세요. 구매 이용권과 다른 기기의 이용은 유지됩니다."
                  : "이 기기의 Resume Pro 이용 연결을 해제했습니다. 다시 결제하지 마세요. 저장 데이터와 구매 이용권은 유지됩니다."}
              </div>
            )}
            {checkout === "cancelled" && (
              <div className="mt-5 border-l-2 border-navy/40 bg-white p-4 text-sm leading-6 text-navy" role="status">
                결제가 취소됐습니다. 청구되지 않았으며 준비가 되면 다시 시작할 수 있습니다.
              </div>
            )}
            {checkoutFailure && (
              <ResumeProCheckoutFailureNotice
                failure={checkoutFailure}
                id="resume-pro-checkout-page-failure"
                className="mt-5"
              />
            )}
            <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem] lg:items-end">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#806515]">Resume Pro</p>
                <h1 className="mt-4 text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.035em] text-navy sm:text-6xl">한 공고에 맞춘 이력서부터,<br /><span className="font-normal text-navy-light">다음 면접에 다시 쓸 STAR까지.</span></h1>
                <p className="mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg">문장 하나를 복사해 끝내지 않고, 무료 빌더에 저장한 실제 경력과 채용 공고를 맞춰 회사별 이력서와 커버레터를 만들어요. 같은 경험은 STAR 면접 메모로 보관하고, 지원서 묶음으로 내보내 다음 지원에 다시 쓸 수 있어요.</p>
                <ol className="mt-7 grid gap-px border-y border-navy/15 bg-border text-sm sm:grid-cols-3">
                  <li className="bg-white px-4 py-4"><span className="block text-xs font-semibold text-[#806515]">01</span><strong className="mt-1 block text-navy">실제 경력을 브라우저에 저장</strong></li>
                  <li className="bg-white px-4 py-4"><span className="block text-xs font-semibold text-[#806515]">02</span><strong className="mt-1 block text-navy">공고별 지원 자료 정리</strong></li>
                  <li className="bg-white px-4 py-4"><span className="block text-xs font-semibold text-[#806515]">03</span><strong className="mt-1 block text-navy">STAR·면접 메모 재사용</strong></li>
                </ol>
              </div>
              <aside className="border-l-2 border-gold pl-6">
                <p className="text-sm font-semibold text-muted">Resume Pro 1회 이용권</p>
                <p className="mt-2 text-4xl font-semibold tracking-tight text-navy">A$19.90</p>
                <p className="mt-2 text-sm leading-6 text-muted">매달 빠져나가는 구독료 없이 한 번만 결제해요.</p>
              </aside>
            </div>
            <div className="mt-10 flex flex-wrap items-start gap-3">
              {existingBuyerIssue ? (
                <Link href="/resume-pro/restore" className="inline-flex min-h-12 items-center justify-center bg-gold px-5 py-3 text-sm font-semibold text-navy hover:bg-white">구매 이용권 복구하기</Link>
              ) : canOfferCheckout ? (
                <ResumeProCheckoutJumpLink className="inline-flex min-h-12 items-center justify-center bg-gold px-5 py-3 text-sm font-semibold text-navy hover:bg-white">이번 공고 지원서 묶음 만들기 ↓</ResumeProCheckoutJumpLink>
              ) : (
                <span className="inline-flex min-h-12 items-center border border-border bg-white px-5 py-3 text-sm font-semibold text-muted" aria-label="결제 기능 준비 중">Pro 작업 공간 출시 준비 중</span>
              )}
              {!existingBuyerIssue && !canOfferCheckout && seller.email && (
                <ResumeProLaunchInterestLink email={seller.email} entry={entry} className="inline-flex min-h-12 items-center justify-center bg-gold px-5 py-3 text-sm font-semibold text-navy hover:bg-white">
                  판매 시작 시 1회 안내 요청
                </ResumeProLaunchInterestLink>
              )}
              {!existingBuyerIssue && !canOfferCheckout && seller.email && (
                <ResumeProLaunchInterestCopyButton email={seller.email} entry={entry} className="inline-flex min-h-12 items-center justify-center border border-navy/30 bg-white px-5 py-3 text-sm font-semibold text-navy hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold" />
              )}
              <Link href="/resume-builder" className="inline-flex min-h-12 items-center justify-center border border-navy bg-white px-5 py-3 text-sm font-semibold text-navy hover:bg-surface">경력 초안이 없다면 무료로 시작</Link>
            </div>
            <section className="mt-8 border-y border-navy/20 bg-white" aria-labelledby="persistent-value-heading">
              <div className="px-4 py-5 sm:px-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#806515]">한 번 답하고 끝나는 도구가 아니에요</p>
                <h2 id="persistent-value-heading" className="mt-2 text-2xl font-semibold text-navy">지원할수록 내 준비 자료가 쌓입니다.</h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">일반적인 문장 하나를 받는 대신, 다음 공고에서도 다시 꺼내 쓸 수 있는 지원 자산을 남겨요.</p>
              </div>
              <ol className="grid gap-px bg-border sm:grid-cols-3">
                <li className="bg-surface p-4 sm:p-5"><span className="font-mono text-xs text-[#806515]">01</span><strong className="mt-2 block text-sm text-navy">회사별 지원서 저장</strong><p className="mt-2 text-xs leading-5 text-muted">공고, 커버레터와 디자인을 회사별로 최대 30개 보관해요.</p></li>
                <li className="bg-surface p-4 sm:p-5"><span className="font-mono text-xs text-[#806515]">02</span><strong className="mt-2 block text-sm text-navy">STAR 경험 재사용</strong><p className="mt-2 text-xs leading-5 text-muted">한 번 정리한 실제 경험을 다른 면접과 Selection Criteria에 다시 연결해요.</p></li>
                <li className="bg-surface p-4 sm:p-5"><span className="font-mono text-xs text-[#806515]">03</span><strong className="mt-2 block text-sm text-navy">지원서 묶음 내보내기</strong><p className="mt-2 text-xs leading-5 text-muted">이력서 요약, 공고 점검, 커버레터와 STAR 경험을 한 파일로 저장해요.</p></li>
              </ol>
              <p className="px-4 py-4 text-xs leading-5 text-muted sm:px-6">지원 자료는 현재 브라우저에 저장됩니다. 기기를 바꾸기 전에는 지원서 묶음을 내려받아 보관해 주세요.</p>
            </section>
            <section className="mt-5 border border-navy/20 bg-surface p-5 sm:p-6" aria-labelledby="ai-role-heading">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#806515]">AI와 함께 써도 남는 것</p>
              <h2 id="ai-role-heading" className="mt-2 max-w-3xl text-2xl font-semibold text-navy">답변보다, 내가 제출할 근거와 파일이 남아야 해요.</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">Resume Pro는 AI를 대신한다고 약속하지 않아요. 어떤 글쓰기 도구를 쓰더라도 실제 경험을 확인하고, 채용 공고에 맞춰 제출할 자료를 정리하는 일은 남습니다.</p>
              <ol className="mt-6 grid gap-px bg-border md:grid-cols-3">
                <li className="bg-white p-4 sm:p-5">
                  <span className="font-mono text-xs text-[#806515]">01</span>
                  <strong className="mt-2 block text-sm text-navy">AI로 물어보기 좋은 일</strong>
                  <p className="mt-2 text-xs leading-5 text-muted">표현을 떠올리거나 초안을 비교해 보세요. 결과는 내 실제 경험과 맞는지 직접 확인하고 고쳐야 해요.</p>
                </li>
                <li className="bg-white p-4 sm:p-5">
                  <span className="font-mono text-xs text-[#806515]">02</span>
                  <strong className="mt-2 block text-sm text-navy">무료로 확인하는 일</strong>
                  <p className="mt-2 text-xs leading-5 text-muted">내 이력서와 공고를 브라우저 안에서만 비교해, 이미 있는 표현과 확인할 근거를 나눠 보세요.</p>
                </li>
                <li className="bg-white p-4 sm:p-5">
                  <span className="font-mono text-xs text-[#806515]">03</span>
                  <strong className="mt-2 block text-sm text-navy">Resume Pro에 남기는 일</strong>
                  <p className="mt-2 text-xs leading-5 text-muted">확인한 사실을 회사별 이력서·커버레터·STAR 메모와 지원서 묶음에 연결해 다음 지원에도 다시 쓰세요.</p>
                </li>
              </ol>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
                <ResumeProProofLink entry={entry} className="inline-flex min-h-12 items-center justify-center bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-navy-light">
                  결제 전에 내 공고로 차이 확인하기 →
                </ResumeProProofLink>
                <p className="max-w-2xl text-xs leading-5 text-muted">어떤 AI나 글쓰기 도구를 쓰더라도 없는 경력·성과·자격을 만들지 않습니다.</p>
              </div>
            </section>
            {canOfferCheckout && <div id="resume-pro-checkout" className="scroll-mt-24 mt-5"><ResumeProCheckoutForm testMode={testCheckoutAvailable} entry={entry} /></div>}
            <p className="mt-4 text-xs leading-5 text-muted">
              {existingBuyerIssue
                ? "이미 구매했다면 다시 결제하지 말고, 1회용 복구 코드나 고객지원 확인 순서를 이용해 주세요."
                : testCheckoutAvailable
                ? "현재 버튼은 Stripe 테스트 환경 전용이며 실제 카드 청구는 없습니다. 테스트 이용권과 결제 처리 기술 기록만 생성됩니다."
                  : canOfferCheckout
                  ? "결제는 Stripe의 보안 결제 페이지에서 진행되며, 결제가 완료되면 Resume Pro 작업 공간을 바로 열 수 있어요."
                  : "현재는 제품 미리보기 단계이며 결제·계정 생성·개인정보 수집이 진행되지 않습니다."}
            </p>
            {!existingBuyerIssue && !canOfferCheckout && seller.email && (
              <p className="mt-2 max-w-3xl text-xs leading-5 text-muted">안내 요청을 누르면 이메일 앱이 열립니다. 직접 보낸 주소로 판매 시작 시 한 번만 답하며 자동 마케팅 구독 명단에 추가하지 않습니다. 지원 직무, 마감일, 공개 채용 공고 링크와 무료 경력 초안 여부만 적고 이력서 원문이나 민감정보는 보내지 마세요.</p>
            )}
            {!canOfferCheckout && (
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-navy">
                <Link href="/purchase-information" className="underline decoration-gold underline-offset-4">구매·환불 안내</Link>
                <Link href="/privacy" className="underline decoration-gold underline-offset-4">결제 데이터 처리 안내</Link>
              </div>
            )}
          </Container>
        </section>

        <section className="border-b border-navy/15 bg-surface py-12 sm:py-16" aria-labelledby="buyer-fit-heading">
          <Container>
            <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#806515]">지금 결제할 단계인지 확인</p>
                <h2 id="buyer-fit-heading" className="mt-3 text-3xl font-semibold tracking-tight text-navy">아래 세 가지가 맞다면 Pro가 시간을 아껴줘요.</h2>
                <ol className="mt-7 grid gap-3 sm:grid-cols-3">
                  <li className="border border-border bg-white p-5"><span className="text-xs font-semibold text-[#806515]">01</span><strong className="mt-3 block text-navy">지원할 공고가 있어요</strong><p className="mt-2 text-sm leading-6 text-muted">회사와 직무가 정해져 있어 공고에 맞춘 점검이 필요해요.</p></li>
                  <li className="border border-border bg-white p-5"><span className="text-xs font-semibold text-[#806515]">02</span><strong className="mt-3 block text-navy">경력 초안이 있어요</strong><p className="mt-2 text-sm leading-6 text-muted">무료 빌더에 실제 경험을 적었거나 기존 이력서가 있어요.</p></li>
                  <li className="border border-border bg-white p-5"><span className="text-xs font-semibold text-[#806515]">03</span><strong className="mt-3 block text-navy">7일 안에 지원해요</strong><p className="mt-2 text-sm leading-6 text-muted">이력서와 커버레터를 이번 지원에 맞춰 끝내야 해요.</p></li>
                </ol>
              </div>
              <aside className="border-l-2 border-gold pl-6">
                <p className="text-sm font-semibold text-navy">세 가지가 모두 맞나요?</p>
                <p className="mt-2 text-sm leading-6 text-muted">A$19.90 1회 결제로 이번 지원서 묶음을 준비할 수 있어요.</p>
                {existingBuyerIssue ? (
                  <Link href="/resume-pro/restore" className="mt-5 inline-flex min-h-12 items-center justify-center bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-navy-light">구매 이용권 복구하기</Link>
                ) : canOfferCheckout ? (
                  <ResumeProCheckoutJumpLink className="mt-5 inline-flex min-h-12 items-center justify-center bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-navy-light">Resume Pro 시작하기 ↓</ResumeProCheckoutJumpLink>
                ) : seller.email ? (
                  <div className="mt-5 grid gap-2">
                    <ResumeProLaunchInterestLink email={seller.email} entry={entry} className="inline-flex min-h-12 items-center justify-center bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-navy-light">
                      판매 시작 시 1회 안내 요청
                    </ResumeProLaunchInterestLink>
                    <ResumeProLaunchInterestCopyButton email={seller.email} entry={entry} className="inline-flex min-h-12 items-center justify-center border border-navy/30 bg-white px-5 py-3 text-sm font-semibold text-navy hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold" />
                  </div>
                ) : (
                  <span className="mt-5 inline-flex min-h-12 items-center border border-border bg-white px-5 py-3 text-sm font-semibold text-muted">결제 기능 준비 중</span>
                )}
                <p className="mt-5 text-xs leading-5 text-muted">아직 지원할 공고가 없다면 결제하지 말고 무료 이력서부터 완성하세요.</p>
                <Link href="/resume-builder" className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-navy underline decoration-gold underline-offset-4">무료 이력서 빌더로 가기</Link>
              </aside>
            </div>
          </Container>
        </section>

        <section className="border-b border-navy/15 bg-white py-14 sm:py-20" aria-labelledby="result-preview-heading">
          <Container>
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#806515]">결제 전에 보는 예시</p>
              <h2 id="result-preview-heading" className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">같은 경력을 세 번 다시 쓰지 않아요.</h2>
              <p className="mt-4 text-sm leading-7 text-muted sm:text-base">무료 빌더에 적어둔 실제 경험 하나가 공고 점검, 커버레터 초안과 회사별 지원서 정리로 어떻게 이어지는지 예시로 보여드릴게요.</p>
            </div>

            <div className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,0.78fr)_3rem_minmax(0,1.22fr)] lg:items-center">
              <article className="border border-navy/20 bg-surface p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#806515]">무료 빌더에서 확인할 사실</p>
                <h3 className="mt-3 text-xl font-semibold text-navy">[실제 근무처] · Barista</h3>
                <ul className="mt-5 space-y-3 text-sm leading-6 text-muted">
                  <li className="border-l-2 border-navy/20 pl-3">[바쁜 시간대에 직접 맡은 주문·고객 응대]</li>
                  <li className="border-l-2 border-navy/20 pl-3">[실제로 안내한 절차와 사용한 도구]</li>
                  <li className="border-l-2 border-navy/20 pl-3">[확인할 수 있는 완료 결과나 받은 피드백]</li>
                </ul>
                <div className="mt-6 border-t border-navy/15 pt-4">
                  <p className="text-xs font-semibold text-navy">지원 공고에서 강조한 내용</p>
                  <p className="mt-2 text-xs leading-5 text-muted">빠른 서비스 · 고객 응대 · 팀 교육 · 주말 근무</p>
                </div>
              </article>

              <div className="hidden text-center text-3xl text-[#806515] lg:block" aria-hidden="true">→</div>

              <div className="grid gap-px bg-border sm:grid-cols-2">
                <article className="bg-white p-5 sm:p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#806515]">01 · 공고 점검</p>
                  <h3 className="mt-3 text-lg font-semibold text-navy">이미 있는 경험과 확인할 내용을 나눠요.</h3>
                  <dl className="mt-4 space-y-3 text-sm leading-6">
                    <div><dt className="font-semibold text-[#315f4e]">이력서에서 확인</dt><dd className="text-muted">customer service · training · fast-paced</dd></div>
                    <div><dt className="font-semibold text-[#755b20]">직접 확인</dt><dd className="text-muted">food safety · weekend availability</dd></div>
                  </dl>
                </article>

                <article className="bg-white p-5 sm:p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#806515]">02 · 커버레터 초안</p>
                  <h3 className="mt-3 text-lg font-semibold text-navy">입력한 사실을 회사와 직무에 맞춰 연결해요.</h3>
                  <blockquote className="mt-4 border-l-2 border-gold pl-4 text-sm italic leading-6 text-muted">“[Action verb] [specific action] during [verified work context], helping [customer or team] achieve [verified result].”</blockquote>
                </article>

                <article className="bg-white p-5 sm:col-span-2 sm:p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#806515]">03 · 이번 지원서 묶음</p>
                  <h3 className="mt-3 text-lg font-semibold text-navy">제출 전에 볼 내용을 회사별로 모아요.</h3>
                  <ul className="mt-4 grid gap-2 text-sm leading-6 text-muted sm:grid-cols-3">
                    <li className="border-t border-border pt-3">선택한 디자인의 이력서 PDF</li>
                    <li className="border-t border-border pt-3">직접 수정하는 커버레터 초안</li>
                    <li className="border-t border-border pt-3">공고 표현 점검과 제출 전 확인</li>
                  </ul>
                </article>
              </div>
            </div>

            <p className="mt-7 border-l-2 border-gold pl-4 text-sm leading-6 text-muted">이 예시는 기능을 설명하기 위한 샘플이에요. Resume Pro는 없는 경력이나 자격을 만들지 않으며, 공고에 나온 표현도 실제로 해본 일일 때만 추가해야 해요.</p>
            <div className="mt-8 grid gap-5 border-y border-navy/20 bg-surface p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#806515]">결제 전에 직접 확인</p>
                <h3 className="mt-2 text-xl font-semibold text-navy">내 이력서와 실제 공고로 빠진 근거를 무료로 찾아보세요.</h3>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">이력서와 공고 문구는 지금 사용하는 브라우저 안에서만 비교합니다. 로그인·결제 없이 일치한 표현, 확인할 근거와 다음 질문 최대 3개를 먼저 볼 수 있어요.</p>
              </div>
              <ResumeProProofLink entry={entry} className="inline-flex min-h-12 items-center justify-center bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-navy-light">
                내 공고로 무료 점검하기 →
              </ResumeProProofLink>
            </div>
          </Container>
        </section>

        <section className="py-14 sm:py-20" aria-labelledby="templates-heading">
          <Container>
            <div className="grid gap-10 lg:grid-cols-[18rem_1fr]">
              <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#806515]">이력서 디자인</p><h2 id="templates-heading" className="mt-3 text-3xl font-semibold tracking-tight text-navy">내용은 같아도,<br />읽히는 방식은 달라요.</h2><p className="mt-4 text-sm leading-6 text-muted">화려한 장식보다 채용 담당자가 필요한 내용을 빠르게 찾을 수 있도록 구성했어요.</p></div>
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
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#806515]">지원 준비 순서</p>
            <h2 id="pro-features-heading" className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">지원할 때 실제로 반복하는 일을 줄입니다.</h2>
            <ol className="mt-10 grid border-t border-navy/20 md:grid-cols-2">
              {features.map((feature, index) => (
                <li key={feature.number} className={`min-h-64 border-b border-navy/20 p-6 sm:p-8 ${index % 2 === 0 ? "md:border-r" : ""}`}>
                  <div className="flex items-center justify-between"><span className="font-mono text-sm text-[#806515]">{feature.number} / 04</span><span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{feature.eyebrow}</span></div>
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
              <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#806515]">무료 기능은 그대로</p><h2 id="comparison-heading" className="mt-3 text-3xl font-semibold tracking-tight text-navy">무료 이력서만으로도<br />충분히 시작할 수 있어요.</h2><p className="mt-4 text-sm leading-6 text-muted">기본 이력서 작성과 PDF 저장은 계속 무료예요. 반복되는 추가 준비를 덜어주는 기능만 Pro로 나눴어요.</p></div>
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
