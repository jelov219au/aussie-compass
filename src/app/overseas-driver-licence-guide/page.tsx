import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { DriverLicenceGuide } from "@/components/tools/DriverLicenceGuide";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "한국 운전면허로 호주에서 운전·면허 전환하기 | Hoju Compass",
  description: "NSW, VIC, QLD 등 주별 해외면허 사용 기간, 영문 번역, 한국 운전면허 전환 준비와 공식 기관 링크를 확인하세요.",
  path: "/overseas-driver-licence-guide",
});

const steps = [
  ["01", "비자와 거주 상태부터 구분", "워홀·학생 같은 임시 비자와 영주권, 단기 방문은 같은 주에서도 적용되는 기한이 다를 수 있습니다."],
  ["02", "면허 유효기간과 발급일 확인", "만료된 면허, 경력 확인이 어려운 면허, 자동차 외 면허는 별도 절차나 시험이 필요할 수 있습니다."],
  ["03", "번역 서류를 원본과 함께 준비", "IDP가 면허 자체를 대신하는 것은 아닙니다. 한국 면허 원본과 해당 주가 인정하는 번역을 함께 준비하세요."],
  ["04", "렌터카·보험 조건을 따로 확인", "도로교통상 운전 자격과 렌터카 회사 또는 보험사의 운전자 조건은 별개입니다."],
];

export default function OverseasDriverLicenceGuidePage() {
  return <>
    <BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "무료 도구", path: "/tools" }, { name: "해외면허 전환 가이드", path: "/overseas-driver-licence-guide" }]} />
    <Header />
    <main className="py-12 sm:py-16">
      <Container>
        <Link href="/tools" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 도구 목록으로 돌아가기</Link>
        <div className="mt-6 grid gap-8 border-b border-navy/20 pb-10 lg:grid-cols-[1fr_18rem] lg:items-end">
          <div className="max-w-4xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Korean licence / Australia</p><h1 className="mt-4 text-3xl font-semibold leading-[1.08] tracking-[-0.035em] text-navy [word-break:keep-all] sm:text-6xl">한국 면허가 있어도,<br /><span className="font-normal text-navy-light">사는 주부터 확인하세요.</span></h1><p className="mt-6 max-w-3xl text-base leading-7 text-muted sm:text-lg">호주는 주·준주마다 해외면허 사용 기간과 전환 절차가 다릅니다. 거주 지역, 비자 상태, 체류 기간을 기준으로 공식 안내까지 빠르게 찾아가세요.</p></div>
          <aside className="border-l-2 border-gold pl-5 text-sm leading-6 text-muted"><strong className="block text-navy">마지막 확인: 2026년 8월</strong>인정국가와 시험 면제 기준은 바뀔 수 있어 신청 직전 공식 페이지를 다시 확인합니다.</aside>
        </div>

        <ol className="mt-8 grid border-y border-navy/20 sm:grid-cols-2 lg:grid-cols-4">{steps.map(([number, title, description], index) => <li key={number} className={`p-5 sm:p-6 ${index < 3 ? "lg:border-r" : ""} ${index < 2 ? "max-lg:border-b" : ""}`}><span className="font-mono text-sm text-gold">{number} / 04</span><h2 className="mt-5 font-semibold text-navy">{title}</h2><p className="mt-2 text-sm leading-6 text-muted">{description}</p></li>)}</ol>

        <DriverLicenceGuide />

        <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <article className="border border-border bg-white p-6 sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Before you drive</p><h2 className="mt-2 text-2xl font-semibold text-navy">운전대를 잡기 전 최종 체크</h2><ul className="mt-5 grid gap-3 text-sm leading-6 text-muted sm:grid-cols-2"><li className="border-l-2 border-gold pl-3">면허와 번역본을 실제 운전할 때 휴대</li><li className="border-l-2 border-gold pl-3">차량 등록과 의무보험 상태 확인</li><li className="border-l-2 border-gold pl-3">주별 속도·주차·휴대폰 도로규칙 확인</li><li className="border-l-2 border-gold pl-3">렌터카·자동차보험 운전자 조건 확인</li><li className="border-l-2 border-gold pl-3">면허 전환 마감일을 캘린더에 저장</li><li className="border-l-2 border-gold pl-3">실기시험 전 해외면허 효력 변화 확인</li></ul><div className="mt-6 flex flex-wrap gap-3"><Link href="/life-admin-reminder" className="inline-flex min-h-11 items-center bg-navy px-4 text-sm font-semibold text-white">전환일 리마인더 만들기</Link><Link href="/used-car-comparison" className="inline-flex min-h-11 items-center border border-navy px-4 text-sm font-semibold text-navy">중고차 비교로 이동</Link></div></article>
          <aside className="bg-navy p-6 text-white sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Common mistake</p><h2 className="mt-2 text-2xl font-semibold">IDP만 들고 운전하지 마세요.</h2><p className="mt-4 text-sm leading-7 text-white/70">국제운전면허증은 일반적으로 원래 면허의 번역·보조 문서입니다. 한국 운전면허 원본, 유효한 비자 상태와 각 주가 요구하는 영문 서류를 함께 확인하세요.</p><a href="https://austroads.com.au/drivers-and-vehicles/overseas-drivers" target="_blank" rel="noreferrer" className="mt-6 inline-flex min-h-11 items-center border-b-2 border-gold text-sm font-semibold">Austroads 해외운전자 안내 ↗</a></aside>
        </section>

        <section className="mt-8 border border-amber-300 bg-amber-50 p-6 text-sm leading-7 text-amber-950"><h2 className="font-semibold">중요 안내</h2><p className="mt-1">이 페이지는 일반적인 준비 정보이며 법률 자문이나 운전 자격 판정이 아닙니다. 방문자·거주자 판단, 비자 효력, 면허 종류와 개인 경력에 따라 결과가 달라질 수 있습니다. 운전 또는 신청 전에 거주 주의 면허기관에서 본인 조건을 확인하세요.</p></section>
      </Container>
    </main>
    <Footer />
  </>;
}
