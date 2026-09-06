import Link from "next/link";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PrivacyDataBoundaryCard } from "@/components/privacy/PrivacyDataBoundaryCard";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { Container } from "@/components/ui/Container";
import { getPublicSellerDetails } from "@/lib/publicSeller";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "데이터와 개인정보 안내 | Hoju Compass",
  description: "활동별 데이터 위치, 수집 범위, 보관·삭제 경로와 제3자 처리 범위를 선택해 확인하세요.",
  path: "/privacy",
});

export const dynamic = "force-dynamic";

const policy = {
  id: "privacy-v2026-09-07",
  version: "2026.09.07",
  effective: "2026년 9월 7일",
  reviewed: "2026년 9월 7일",
};

const sections = [
  {
    id: "local-storage",
    title: "브라우저 로컬 도구와 저장",
    body: (
      <>
        <p>Resume·Rental·Pay Evidence·EOFY·Leaving 작업 내용과 준비 중인 Car Purchase 재사용 초안은 별도 안내가 없는 한 현재 브라우저의 localStorage에 저장됩니다. 도구는 여권·TFN·비자 번호·카드·은행 로그인 같은 민감 식별정보나 원본 신분증·Payslip·은행 서류 업로드를 요구하지 않습니다. 서버 이용권 데이터베이스에는 이 작업 공간 원문을 저장하지 않습니다.</p>
        <p>일반 브라우저와 설치형 PWA는 서로 다른 사본을 가질 수 있습니다. 나의 진행 화면은 이 기기의 저장 내용을 요약할 뿐 서버 전송이나 자동 동기화를 하지 않습니다. 도구별 초기화 또는 브라우저 site data 삭제로 지울 수 있습니다.</p>
      </>
    ),
  },
  {
    id: "backup-files",
    title: "백업 파일과 기기 이전",
    body: (
      <>
        <p>데이터 백업·이전 도구는 선택한 34개 도구의 허용된 workspace 원문과 manifest metadata를 브라우저에서 평문 JSON 파일로 만듭니다. 여기에는 이름·연락처, 급여·세금·렌트·출국·중고차 메모가 포함될 수 있습니다. 파일 생성과 불러오기에는 서버 업로드나 자동 동기화가 없습니다.</p>
        <p>구매 이용권, 접근 쿠키, 복구 코드·해시·nonce와 결제 증빙은 이 백업에 포함되지 않고 파일로 이동하거나 복구되지 않습니다. 내려받은 파일과 각 브라우저/PWA 사본은 따로 지워야 합니다. 파일을 cloud·메일·메신저로 옮기면 그 제공자의 현재 정책이 적용됩니다.</p>
        <div className="mt-4 flex flex-col items-start gap-2 sm:flex-row sm:gap-6">
          <Link href="/data-transfer" className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">선택한 작성 내용 백업하기 →</Link>
          <Link href="/payment-help" className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">제품별 이용권 복구 확인 →</Link>
        </div>
      </>
    ),
  },
  {
    id: "survey-email",
    title: "구직 준비 경험 설문과 이메일 문의",
    body: (
      <>
        <h3 className="font-semibold text-navy">구직 준비 경험 설문</h3>
        <p>Job Move Pro 공개 설문은 서버에 <code>{"{answers, website, startedAt}"}</code>를 보냅니다. answers는 고정 선택 답변이고, website는 정상 사용 시 비어 있는 bot 방지 입력값입니다. startedAt은 제출까지 4초 이상 24시간 이하인지 확인하는 데 쓰입니다. 이 조건을 통과한 응답의 Zoho Mail 운영 메일에는 선택 답변, 무작위 응답 ID와 서버 수신 시각만 들어가며 startedAt과 빈 honeypot은 넣지 않습니다. 이름·이메일·전화·회사·비자 정보·자유 입력은 요구하지 않습니다.</p>
        <p>설문 메일은 제품 방향 검토를 맡은 지원 메일 운영자만 봅니다. 90일마다 필요성을 검토하고, 미해결 사안이나 법적 보존 사유가 없으면 수신 뒤 12개월 안에 삭제합니다. 반복 제출 제한용 HttpOnly 쿠키는 30일간 현재 브라우저에 남습니다.</p>
        <h3 className="mt-5 font-semibold text-navy">이메일 문의</h3>
        <p>공식 지원 이메일로 직접 문의하거나 Resume Pro 판매 시작 1회 안내를 요청하면 보낸 이메일 주소·표시 이름·제목·본문이 사용자가 고른 메일 제공자와 Zoho Mail에서 처리됩니다. 일반 문의는 마지막 연락 뒤 24개월 안에 검토·삭제하고, 1회 안내 주소는 발송 또는 철회 뒤 30일 안에 삭제합니다. 미해결 분쟁과 법적 보존은 예외입니다. 이 이메일을 자동 마케팅 구독 명단에 추가하거나 반복 홍보에 사용하지 않습니다.</p>
      </>
    ),
  },
  {
    id: "payments-access",
    title: "Stripe 결제, 운영 알림과 이용권",
    body: (
      <>
        <p>결제가 열린 Pro 제품에서 구매를 시작하면 Stripe Managed Payments 화면으로 이동합니다. Stripe/Link가 연락처, 결제, 세금과 인보이스 정보를 처리하며 Hoju Compass는 전체 카드번호나 CVC를 직접 받지 않습니다. 서버에는 거래 식별자, 제품 코드, 확인한 구매 조건 버전, 이용권 상태와 처리 시각을 저장할 수 있습니다.</p>
        <p>결제·환불·분쟁 webhook 운영 알림은 Zoho Mail로 전송됩니다. 알림에는 제품, 금액, 상태 또는 실패 사유와 Stripe 이벤트·세션·PaymentIntent·Charge·Refund·Dispute 참조의 마지막 8자만 들어갑니다. 고객 이메일, 전체 카드번호·CVC, 영수증 전체와 작업 원문은 넣지 않습니다. 접근 운영과 대사·장애 대응 권한이 있는 운영자만 사용하며, 조정이 끝난 비필수 알림 메일은 12개월 안에 삭제합니다. 영수증·인보이스·환불·세금·대사 같은 최소 거래 기록은 상황에 따라 5년 이상 남을 수 있습니다.</p>
        <p>Resume Pro, Rental Application Pack Pro, Pay Evidence Pack Pro, EOFY Pack Pro와 Leaving Australia Pack Pro는 제품별 이용권·접근 쿠키·복구 코드를 분리합니다. 한 제품의 이용권·쿠키가 다른 제품을 열지 않습니다. 접근 쿠키는 30일이며 서버 상태를 매번 재확인합니다. 가격·구매 조건 준비 중이고 결제 미오픈인 Car Purchase Pack Pro에는 현재 구매 이용권이나 접근 쿠키를 발급하지 않습니다.</p>
      </>
    ),
  },
  {
    id: "analytics",
    title: "호스팅과 익명 방문 통계",
    body: (
      <>
        <p>Vercel은 사이트 제공·보안을 위해 IP, 브라우저·기기 정보, 요청 시각과 오류 같은 기술 로그를 처리할 수 있습니다. Vercel Web Analytics는 집계 대시보드를 만들기 전에 개별 data point로 event timestamp, URL, referrer, 국가·도시 수준의 대략적 위치, 운영체제·브라우저·기기 종류를 받을 수 있습니다. Vercel은 방문 세션 구분용 hash를 24시간 뒤 버린다고 안내합니다. 제공자 보존 기간과 이 방문의 실제 처리 국가는 현 공개 설정만으로 확정할 수 없어 UNKNOWN이며 최신 계약·설정을 검토합니다.</p>
        <p>페이지 주소는 전송 전에 모든 검색어와 기타 URL 쿼리 값을 제거합니다. URL 분석이 실패하거나 현재 origin이 아니면 그 analytics data point를 보내지 않습니다. 현재 custom events는 홈페이지 주제 분류와 내부 이동, 공유·저장·설치·무료 확인·1회 안내 링크·결제 시작 같은 고정 행동과 넓은 분류만 사용합니다. 검색어 원문, 저장된 작업 내용, 결제 금액, 이메일 주소, 페이지 제목과 거래·이용권 식별자는 분석하지 않습니다. 데이터 경계 카드에서 선택한 활동과 결정도 추적하지 않습니다.</p>
      </>
    ),
  },
  {
    id: "external-services",
    title: "YouTube 영상, 외부 사이트와 Google Maps",
    body: (
      <>
        <p>YouTube 영상은 사용자가 ‘영상 불러오기’를 누른 뒤에만 개인정보 보호 강화 모드 플레이어에 연결됩니다. 이때 IP·브라우저·사이트 출처 같은 기술 정보가 전달될 수 있습니다. YouTube에서 보기나 채널 방문을 선택하면 Google의 현재 개인정보 정책이 적용됩니다.</p>
        <p>정부기관, Google Maps와 기타 외부 링크를 누르면 검색어·출발지·목적지처럼 URL에 포함된 정보가 외부 서비스에 전달될 수 있습니다. 정확한 집 주소나 민감정보 대신 동네·역 이름을 사용하세요. Hoju site data 삭제는 외부 제공자의 사본을 자동으로 지우지 않으므로 각 제공자의 개인정보·삭제 경로를 이용해야 합니다.</p>
      </>
    ),
  },
  {
    id: "retention-delete",
    title: "삭제 요청과 기록 보존",
    body: (
      <>
        <p>삭제 위치는 사본마다 다릅니다. 로컬 도구는 해당 브라우저 또는 설치형 PWA에서, 내려받은 백업은 파일을 둔 기기·cloud에서, 이메일은 Hoju와 사용자의 메일 제공자에서, 결제·세무 기록은 Hoju와 Stripe 경로에서 각각 처리합니다. 하나를 지워도 다른 사본은 자동으로 지워지지 않습니다.</p>
        <p>Hoju가 보유한 정보의 접근·정정·삭제·처리 제한·불만·incident 신고는 아래 공식 문의 경로로 요청할 수 있습니다. 요청 확인에는 관련 제품·활동과 참조 마지막 8자 등 최소 정보만 사용합니다. 카드번호·CVC·영수증 전체·복구 코드·신분증 원문은 보내지 마세요. 스크린샷을 첨부한다면 이름, 주소, 이메일, 전체 결제 참조와 문서 내용을 가린 뒤 보냅니다. 원본 파일은 필요하지 않습니다. 해결되지 않은 개인정보 불만은 OAIC 경로를 확인할 수 있습니다.</p>
      </>
    ),
  },
  {
    id: "sensitive-information",
    title: "민감정보와 선택권",
    body: (
      <>
        <p>여권번호, TFN, visa grant number, HAP ID, 은행·카드 정보, 건강정보, 비밀번호, 생년월일 또는 신분증 사본을 사이트 도구나 문의에 입력하지 마세요. 계산기와 체크리스트는 정확한 식별정보 없이 범주·별칭·대략적인 값으로 사용할 수 있습니다.</p>
        <p>별도의 Web Analytics opt-out 설정은 현재 제공하지 않습니다. 전송을 줄이려면 외부 영상·링크·설문·메일·Checkout을 열지 않고 로컬 도구만 사용하세요. 도움이 필요한 아동이나 의사결정 지원이 필요한 사용자는 신뢰하는 성인과 함께 최소 정보만 입력할 수 있습니다.</p>
      </>
    ),
  },
] as const;

function privacyEmailHref(email: string) {
  const body = [
    "요청 유형(접근 / 정정 / 삭제 / 제한 / 불만 / incident):",
    "관련 활동 또는 제품:",
    "확인에 필요한 최소 정보:",
    "",
    "카드번호·CVC·전체 영수증·복구 코드·신분증 원문은 보내지 마세요.",
  ].join("\n");
  return `mailto:${email}?subject=${encodeURIComponent("[Hoju Compass] 개인정보 요청")}&body=${encodeURIComponent(body)}`;
}

export default function PrivacyPage() {
  const seller = getPublicSellerDetails();

  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "데이터와 개인정보", path: "/privacy" }]} />
      <Header />
      <main className="py-10 sm:py-14">
        <Container className="max-w-6xl">
          <Link href="/" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 홈으로 돌아가기</Link>

          <div className="mt-6 border-l-2 border-gold pl-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-ink">Privacy / Data · {policy.id}</p>
            <p className="mt-2 text-sm leading-6 text-muted">버전 {policy.version} · 시행 {policy.effective} · 최근 검토 {policy.reviewed}</p>
          </div>
          <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-navy sm:text-5xl">내 활동의 데이터 위치를 바로 확인하세요.</h1>
          <PrivacyDataBoundaryCard supportEmail={seller.email} />

          <section id="privacy-details" className="mt-12" aria-labelledby="privacy-details-heading">
            <div className="border-b border-navy/20 pb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-ink">Detailed policy</p>
              <h2 id="privacy-details-heading" className="mt-2 text-3xl font-semibold text-navy">활동별 실제 처리 방식</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">카드의 요약을 실제 시스템별로 설명합니다. 데이터 위치·접근자·목적·보존과 삭제 경로가 바뀌면 이 버전과 검토일을 갱신합니다.</p>
            </div>
            <div className="divide-y divide-border">
              {sections.map((section, index) => (
                <section key={section.id} id={section.id} className="scroll-mt-24 grid gap-4 py-8 sm:grid-cols-[5rem_1fr]">
                  <span className="font-mono text-sm font-semibold text-gold-ink">{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h2 className="text-xl font-semibold text-navy">{section.title}</h2>
                    <div className="mt-3 max-w-4xl space-y-3 text-sm leading-7 text-muted sm:text-base">{section.body}</div>
                  </div>
                </section>
              ))}
            </div>
          </section>

          <section id="third-parties" className="scroll-mt-24 border-2 border-navy bg-surface p-6 sm:p-8" aria-labelledby="third-parties-heading">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-ink">Current provider routes</p>
            <h2 id="third-parties-heading" className="mt-2 text-2xl font-semibold text-navy">제3자 정책과 국제 처리 확인</h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-muted">Zoho는 호주 service data location을 안내하지만 하위 처리자와 지원 접근까지 호주에만 있다고 보장하지 않습니다. Stripe는 global·cross-border 처리를 안내합니다. Vercel은 미국을 주요 처리 위치로 두고 다른 국가와 하위 처리자 경로를 둘 수 있습니다. 개별 요청의 정확한 처리 국가는 UNKNOWN입니다.</p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <a href="https://vercel.com/docs/analytics/privacy-policy" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">Vercel Web Analytics 개인정보 안내 ↗</a>
              <a href="https://vercel.com/legal/dpa" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">Vercel DPA·하위 처리자 안내 ↗</a>
              <a href="https://www.zoho.com/mail/gdpr.html" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">Zoho Mail 데이터 위치 안내 ↗</a>
              <a href="https://stripe.com/au/privacy" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">Stripe 호주 개인정보 안내 ↗</a>
              <a href="https://stripe.com/au/legal/dta" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">Stripe 국제 데이터 이전 안내 ↗</a>
              <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">Google·YouTube·Maps 개인정보 안내 ↗</a>
            </div>
          </section>

          <section className="mt-8 grid gap-6 bg-navy p-6 text-white sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center" aria-labelledby="privacy-contact-heading">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Privacy contact</p>
              <h2 id="privacy-contact-heading" className="mt-2 text-2xl font-semibold">접근·정정·삭제·불만을 요청하세요.</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/75">최소 확인 정보만 보내주세요. 개인정보 침해가 의심되면 incident라고 표시해 주세요. 현재 처리에 만족하지 못했다면 OAIC의 개인정보 불만 절차도 이용할 수 있습니다.</p>
            </div>
            <div className="flex flex-col items-stretch gap-2 sm:flex-row lg:flex-col">
              {seller.email ? <a href={privacyEmailHref(seller.email)} className="inline-flex min-h-12 items-center justify-center rounded-lg bg-gold px-5 text-sm font-semibold text-navy">개인정보 요청 이메일 쓰기 →</a> : <Link href="/contact" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-gold px-5 text-sm font-semibold text-navy">문의 경로 확인 →</Link>}
              <a href="https://www.oaic.gov.au/privacy/privacy-complaints" target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/40 px-5 text-sm font-semibold text-white">OAIC 개인정보 불만 절차 ↗</a>
            </div>
          </section>

          <section className="mt-8 border-l-2 border-gold bg-surface p-6 text-sm leading-7 text-muted">
            <h2 className="font-semibold text-navy">법적 적용 범위</h2>
            <p className="mt-1">호주의 Privacy Act 적용 여부는 사업 규모와 활동에 따라 달라질 수 있습니다. 이 페이지는 현재 실제 데이터 처리 방식을 투명하게 설명하기 위한 것이며 법률 자문이 아닙니다.</p>
            <div className="mt-3 flex flex-col items-start gap-2 sm:flex-row sm:gap-6">
              <Link href="/purchase-information" className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">구매·환불 안내 보기 →</Link>
              <a href="https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-11-app-11-security-of-personal-information" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">OAIC 삭제·비식별화 안내 ↗</a>
              <a href="https://www.ato.gov.au/businesses-and-organisations/preparing-lodging-and-paying/record-keeping-for-business/overview-of-record-keeping-rules-for-business" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">ATO 기록 보존 안내 ↗</a>
            </div>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}
