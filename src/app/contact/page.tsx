import Link from "next/link";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { Container } from "@/components/ui/Container";
import { getPublicSellerDetails } from "@/lib/publicSeller";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "문의하기 | Hoju Compass",
  description: "Hoju Compass 콘텐츠 정정, 도구 이용과 결제 문제를 안전하게 문의하는 방법을 확인하세요.",
  path: "/contact",
});

export const dynamic = "force-dynamic";

const contactTypes = [
  {
    eyebrow: "콘텐츠 정정",
    title: "달라진 정보나 잘못된 내용을 발견했어요",
    description: "페이지 주소와 확인한 문장을 알려주세요. 가능하다면 최신 공식 출처도 함께 보내주시면 더 빠르게 확인할 수 있어요.",
    subject: "콘텐츠 정정 요청",
  },
  {
    eyebrow: "도구 이용",
    title: "계산이나 저장 기능이 제대로 작동하지 않아요",
    description: "사용한 도구 이름, 기기와 브라우저, 문제가 생기기 직전에 한 행동을 적어주세요. 민감한 입력값은 보내지 않아도 됩니다.",
    subject: "도구 이용 문의",
  },
  {
    eyebrow: "결제·이용권",
    title: "결제 확인이나 Pro 접근에 도움이 필요해요",
    description: "Stripe 영수증의 결제일과 이메일, 화면에 표시된 오류만 알려주세요. 카드번호 전체나 이력서 원문은 보내지 마세요.",
    subject: "결제 및 이용권 문의",
  },
];

const sensitiveItems = [
  "카드번호 전체, CVC, 계좌 비밀번호와 인증번호",
  "여권·운전면허증·비자 또는 신분증 전체 사본",
  "TFN, HAP ID, 비자 grant number와 Medicare 번호",
  "이력서 원문, 급여명세서 전체와 건강정보",
];

function emailHref(email: string, subject: string) {
  const body = [
    "문의한 페이지 또는 도구:",
    "",
    "확인이 필요한 내용:",
    "",
    "사용한 기기와 브라우저(도구 오류인 경우):",
    "",
    "민감정보는 지우고 보내주세요.",
  ].join("\n");

  return `mailto:${email}?subject=${encodeURIComponent(`[Hoju Compass] ${subject}`)}&body=${encodeURIComponent(body)}`;
}

export default function ContactPage() {
  const seller = getPublicSellerDetails();

  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "문의하기", path: "/contact" }]} />
      <Header />
      <main className="py-12 sm:py-16">
        <Container className="max-w-6xl">
          <Link href="/" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 홈으로 돌아가기</Link>

          <div className="mt-8 grid gap-8 border-b border-navy/20 pb-10 lg:grid-cols-[1fr_19rem] lg:items-end">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Contact Hoju Compass</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">어떤 도움이 필요한지 편하게 알려주세요.</h1>
              <p className="mt-5 leading-7 text-muted">콘텐츠에서 달라진 정보를 발견했거나 도구 이용 중 막힌 부분이 있다면 확인할 내용을 정리해 보내주세요. 개인정보는 꼭 필요한 만큼만 받습니다.</p>
            </div>
            <aside className="border-l-2 border-gold pl-5 text-sm leading-6 text-muted">
              <strong className="block text-navy">공식 문의 이메일</strong>
              {seller.email ? <a href={`mailto:${seller.email}`} className="mt-1 inline-flex min-h-10 items-center break-all font-semibold text-navy underline decoration-gold underline-offset-4">{seller.email}</a> : <span className="mt-2 block">이메일 주소를 준비하고 있어요.</span>}
            </aside>
          </div>

          <section className="mt-10" aria-labelledby="contact-type-heading">
            <div className="flex items-end justify-between border-b border-navy/20 pb-4">
              <div><p className="text-xs font-semibold text-gold">문의 내용별로</p><h2 id="contact-type-heading" className="mt-1 text-2xl font-semibold text-navy">가까운 항목을 골라 보내세요.</h2></div>
              <span className="font-mono text-xs text-muted">03</span>
            </div>
            <ul className="grid gap-px bg-border lg:grid-cols-3">
              {contactTypes.map((item, index) => (
                <li key={item.subject} className="flex flex-col bg-white p-6 sm:p-7">
                  <span className="font-mono text-xs text-gold">{String(index + 1).padStart(2, "0")} · {item.eyebrow}</span>
                  <h3 className="mt-3 text-xl font-semibold leading-7 text-navy">{item.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-7 text-muted">{item.description}</p>
                  {seller.email ? <a href={emailHref(seller.email, item.subject)} className="mt-6 inline-flex min-h-11 items-center border-b-2 border-gold text-sm font-semibold text-navy">이 내용으로 이메일 쓰기 →</a> : <span className="mt-6 text-sm font-medium text-muted">공식 이메일 준비 중</span>}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <div className="bg-navy p-6 text-white sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">보내지 않아도 되는 정보</p>
              <h2 className="mt-2 text-2xl font-semibold">문의에 민감정보를 넣지 마세요.</h2>
              <ul className="mt-5 space-y-3 text-sm leading-6 text-white/75">{sensitiveItems.map((item) => <li key={item}>• {item}</li>)}</ul>
              <p className="mt-6 border-t border-white/15 pt-5 text-sm leading-6 text-white/65">화면을 첨부한다면 이름, 주소, 이메일, 결제 식별번호와 문서 내용을 가린 뒤 보내주세요.</p>
            </div>
            <div className="border border-border bg-surface p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">알아두세요</p>
              <h2 className="mt-2 text-2xl font-semibold text-navy">긴급 상담이나 전문 자문 창구는 아니에요.</h2>
              <p className="mt-4 text-sm leading-7 text-muted">이 이메일은 Hoju Compass 사이트와 콘텐츠 문의를 위한 주소입니다. 긴급 상황, 비자·법률·세무 판단이나 개인 사건 상담을 대신하지 않습니다.</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Link href="/help-directory" className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">긴급·공식 도움 연락처 보기 →</Link>
                <Link href="/payment-help" className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">결제 문제 먼저 확인하기 →</Link>
                <Link href="/privacy" className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">이메일 개인정보 처리 보기 →</Link>
              </div>
            </div>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}
