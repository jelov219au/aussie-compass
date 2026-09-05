import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({ title: "정보 이용과 면책 안내 | Hoju Compass", description: "Hoju Compass의 일반 정보, 계산 결과, 외부 링크와 전문 자문 범위를 확인하세요.", path: "/disclaimer" });

const verificationSteps = [
  "페이지의 적용 지역·기준연도·마지막 확인일을 확인합니다.",
  "본인이 입력한 날짜·금액·고용형태처럼 결과를 바꾸는 입력을 저장하거나 메모합니다.",
  "페이지의 공식 링크에서 같은 용어·기간·금액 기준을 찾아 대조합니다.",
  "내용이 다르거나 개인 조건이 빠졌다면 결제·제출·서명·송금 전에 멈추고 공식기관이나 자격 있는 전문가에게 확인합니다.",
];

const sections = [
  { title: "일반 정보", body: "콘텐츠와 도구는 비자 제출, 계약 서명, 세금 신고, 의료 판단이나 임금 분쟁의 최종 결정자가 아니며 개인 상황에 맞춘 이민·법률·세무·재무·의료·고용 자문이 아닙니다. 페이지별 체크리스트로 질문과 기록을 준비한 뒤 공식기관이나 자격 있는 전문가와 본인 상황을 확인하세요.", href: "/search", action: "내 상황의 준비 도구 찾기 →" },
  { title: "계산 결과", body: "급여·세금·생활비 결과를 쓰기 전에 입력값, 가정, 주·월·연 단위, 기준연도와 표시된 세율 범위를 확인하세요. 실제 Payslip·계약·견적·ATO 기록과 같은 기준끼리 비교합니다. 예를 들어 Gross는 Gross와, Net은 은행 입금액과 비교하세요. 차이가 크면 추정 숫자를 그대로 송금·협상·신고에 쓰지 말고 먼저 단위, 기간, 누락 항목의 원인을 찾으세요.", href: "/search", action: "같은 기준으로 비교할 도구 찾기 →" },
  { title: "공식 정보 우선", body: "법률, 요율, 비자 조건과 행정 절차는 변경될 수 있습니다. 페이지의 공식 링크를 열고 적용일·지역·개인 조건을 찾은 다음, 필요한 범위에서 스크린샷이나 참조번호를 안전하게 기록하고 판단을 갱신하세요. 공식 원문과 이 사이트가 다르면 결제·제출·서명 전에 공식기관의 현재 안내를 우선합니다.", href: "/editorial-policy", action: "출처 확인·정정 원칙 보기 →" },
  { title: "외부 링크", body: "외부 사이트의 내용, 가용성, 보안 또는 개인정보 처리는 Hoju Compass가 통제하거나 보증하지 않으며 링크는 업체 추천을 의미하지 않습니다. 이동 전에 링크 목적과 도메인, 입력할 정보를 확인하고 정확한 주소나 문서 원문을 불필요한 검색 URL에 넣지 마세요. 외부 페이지가 열린 것만으로 신청·예약·등록이 완료된 것은 아니므로 해당 화면의 접수 상태를 직접 확인하세요.", href: "/editorial-policy", action: "외부 링크 선정 기준 확인하기 →" },
  { title: "서비스·지역 정보", body: "가격 기록, 견적 비교, 치안 통계와 지도 검색만으로 특정 업체나 지역의 품질·안전을 확정하지 마세요. 업체의 ABN과 해당 작업에 필요한 면허, 포함·제외 항목, GST, 일정, 서면 조건과 현장 상태를 같은 표에 남기고 불명확한 항목을 질문합니다. 답을 확인하기 전에는 계약 서명이나 송금을 멈추세요.", href: "/search", action: "견적·지역 확인 도구 찾기 →" },
  { title: "긴급 상황", body: "즉각적인 건강·안전·범죄 위험이면 이 사이트 대신 호주 긴급전화 000을 이용하세요. 긴급하지 않은 건강, 통역, 직장 또는 사기 문제는 상황별 공식 번호와 통화 전에 준비할 내용을 확인한 뒤 연락하세요.", href: "/help-directory", action: "상황별 도움 연락처 확인하기 →" },
];

export default function DisclaimerPage() {
  return <><BreadcrumbJsonLd items={[{name:"홈",path:"/"},{name:"면책 안내",path:"/disclaimer"}]} /><Header/><main className="py-12 sm:py-16"><Container><Link href="/" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 홈으로 돌아가기</Link>
    <div className="mt-8 max-w-4xl border-b border-navy/20 pb-10"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Information notice</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">정보 이용과 면책 안내</h1><p className="mt-5 leading-7 text-muted">Hoju Compass를 중요한 결정의 출발점으로 사용하고, 아래 순서로 입력·가정·공식 원문을 확인한 뒤 행동하세요.</p></div>
    <section className="mt-8 bg-navy p-6 text-white sm:p-8" aria-labelledby="verification-steps-heading"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Before you act</p><h2 id="verification-steps-heading" className="mt-2 text-2xl font-semibold">이 사이트 결과를 실제 결정에 쓰기 전 4단계</h2><ol className="mt-6 grid gap-4 lg:grid-cols-2">{verificationSteps.map((step,index)=><li key={step} className="grid grid-cols-[2rem_1fr] gap-3 border-t border-white/20 pt-4"><span className="font-mono text-sm text-gold">0{index+1}</span><p className="text-sm leading-7 text-white/85">{step}</p></li>)}</ol><div className="mt-6 border-l-2 border-gold bg-white/5 p-4 text-sm leading-7 text-white/80"><p>확인 결과에는 페이지 주소, 확인 시각, 달랐던 문장과 공식 원문을 남기세요. 오류를 알릴 때는 개인정보·민감정보를 제거한 뒤 정정 템플릿을 이용할 수 있습니다.</p><Link href="/contact" className="mt-2 inline-flex min-h-11 items-center font-semibold text-white underline decoration-gold underline-offset-4">민감정보 없이 정정 요청 준비하기 →</Link></div></section>
    <div className="mt-8 grid gap-x-12 gap-y-8 lg:grid-cols-2">{sections.map(({title,body,href,action},index)=><section key={title} className="flex flex-col border-t border-border pt-5"><span className="font-mono text-xs text-gold">0{index+1}</span><h2 className="mt-2 text-xl font-semibold text-navy">{title}</h2><p className="mt-3 flex-1 text-sm leading-7 text-muted sm:text-base">{body}</p><Link href={href} className="mt-3 inline-flex min-h-11 items-center self-start font-semibold text-navy underline decoration-gold underline-offset-4">{action}</Link></section>)}</div>
    <p className="mt-10 text-sm leading-6 text-muted">페이지 개정일: 2026년 9월 5일 · 이 날짜는 연결된 자료 전체의 사실 확인일을 뜻하지 않습니다.</p>
  </Container></main><Footer/></>;
}
