import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({ title: "정보 이용과 면책 안내 | Hoju Compass", description: "Hoju Compass의 일반 정보, 계산 결과, 외부 링크와 전문 자문 범위를 확인하세요.", path: "/disclaimer" });

export default function DisclaimerPage() { return <><BreadcrumbJsonLd items={[{name:"홈",path:"/"},{name:"면책 안내",path:"/disclaimer"}]} /><Header/><main className="py-12 sm:py-16"><Container><Link href="/" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 홈으로 돌아가기</Link><div className="mt-8 max-w-4xl border-b border-navy/20 pb-10"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Information notice</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">정보 이용과 면책 안내</h1><p className="mt-5 leading-7 text-muted">Hoju Compass를 중요한 결정의 출발점으로 사용하되, 최종 판단은 공식기관과 자격 있는 전문가를 통해 확인하세요.</p></div><div className="mt-8 grid gap-x-12 gap-y-8 lg:grid-cols-2">{[
  ["일반 정보", "콘텐츠와 도구는 일반적인 교육·정보 제공 목적입니다. 개인 상황에 맞춘 이민, 법률, 세무, 재무, 의료 또는 고용 자문이 아닙니다."],
  ["계산 결과", "급여·세금·생활비 등 결과는 입력값과 단순화된 가정에 따른 추정치입니다. 실제 세금, 권리, 비용 또는 자격을 보장하지 않습니다."],
  ["공식 정보 우선", "법률, 요율, 비자 조건과 행정 절차는 변경될 수 있습니다. 페이지에 연결된 ATO, Home Affairs, Fair Work, Services Australia 및 주정부 공식 자료를 다시 확인하세요."],
  ["외부 링크", "외부 사이트의 내용, 가용성, 보안 또는 개인정보 처리에 대해 Hoju Compass가 통제하거나 보증하지 않습니다. 링크는 편의를 위한 것이며 업체 추천을 의미하지 않습니다."],
  ["서비스·지역 정보", "가격 기록, 견적 비교, 치안 통계와 지도 검색은 특정 업체나 지역의 품질·안전을 보증하지 않습니다. 계약·송금 전 신원, 면허, 조건과 현장을 직접 확인하세요."],
  ["긴급 상황", "건강·안전 또는 범죄 관련 긴급 상황에서는 이 사이트를 사용하지 말고 호주 긴급전화 000 또는 해당 공식 긴급 서비스를 이용하세요."],
].map(([title,body],index)=><section key={title} className="border-t border-border pt-5"><span className="font-mono text-xs text-gold">0{index+1}</span><h2 className="mt-2 text-xl font-semibold text-navy">{title}</h2><p className="mt-3 text-sm leading-7 text-muted sm:text-base">{body}</p></section>)}</div><p className="mt-10 text-sm text-muted">최종 업데이트: 2026년 8월 13일</p></Container></main><Footer/></>; }
