"use client";

import { useState } from "react";
import Link from "next/link";
import { ResumeProCtaLink } from "@/components/analytics/ResumeFunnelAnalytics";
import { resumeFunnelContexts, resumeFunnelSurfaces } from "@/lib/resumeFunnelAnalyticsContract";

type Situation = "job" | "home" | "pay" | "tax" | "leave";

const options: { id: Situation; label: string; detail: string }[] = [
  { id: "job", label: "일자리에 지원 중", detail: "이력서·커버레터·공고 키워드" },
  { id: "home", label: "렌트에 지원 중", detail: "서류 상태·개인정보·영문 소개문" },
  { id: "pay", label: "급여를 확인 중", detail: "근무기록·Payslip 차이·증빙" },
  { id: "tax", label: "EOFY를 준비 중", detail: "소득 자료·공제 후보·회계사 질문" },
  { id: "leave", label: "호주를 떠날 예정", detail: "출국 업무·마지막 정산·DASP" },
];

const recommendations = {
  job: { href: "/resume-pro", name: "Resume Pro", price: "A$19.90", description: "지원하고 싶은 공고가 생겼을 때, 내 실제 경력을 회사별 이력서와 커버레터로 정리해요.", cta: "이 공고에 맞춰 지원 준비하기", freeHref: "/resume-builder", freeLabel: "이력서가 없다면 무료로 먼저 만들기" },
  home: { href: "/rental-application-pro?from=pro-hub", name: "Rental Pack Pro", price: "A$14.90", description: "마음에 드는 집을 찾았을 때 서류와 연락이 늦어지지 않도록 집별 신청 준비를 관리해요.", cta: "렌트 신청 준비 방식 보기", freeHref: "/property-inspection-checklist", freeLabel: "집을 보기 전 무료로 점검하기" },
  pay: { href: "/pay-evidence-pro", name: "Pay Evidence Pro", price: "A$9.90", description: "급여가 이상하다는 느낌을 근무시간, Payslip, 입금액과 영문 문의문으로 정리해요.", cta: "급여 차이를 기록하는 방법 보기", freeHref: "/underpayment-guide", freeLabel: "무료 대응 순서부터 확인하기" },
  tax: { href: "/eofy-pro", name: "EOFY Pack Pro", price: "A$9.90", description: "흩어진 소득 자료와 공제 증빙, 세무사에게 물어볼 내용을 신고 전 요약으로 모아요.", cta: "택스 리턴 준비 방식 보기", freeHref: "/tax-return-guide", freeLabel: "무료 체크리스트부터 사용하기" },
  leave: { href: "/leaving-australia-pro", name: "Leaving Pack Pro", price: "A$12.90", description: "출국 뒤에도 남는 Bond, 마지막 급여, 세금과 DASP를 받을 때까지 놓치지 않게 기록해요.", cta: "귀국 정산 준비 방식 보기", freeHref: "/leaving-australia-guide", freeLabel: "무료 귀국 가이드부터 보기" },
} as const;

export function ProProductFinder({ resumeProLive }: { resumeProLive: boolean }) {
  const [situation, setSituation] = useState<Situation>("job");
  const product = recommendations[situation];
  const selectedProductLive = situation === "job" && resumeProLive;

  return <section className="grid gap-px bg-border lg:grid-cols-[1fr_0.82fr]" aria-labelledby="pro-finder-heading">
    <div className="bg-white p-5 sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">내 상황에 맞는 Pro 찾기</p><h2 id="pro-finder-heading" className="mt-2 text-2xl font-semibold text-navy">요즘 가장 손이 많이 가는 일은 무엇인가요?</h2><div className="mt-6 grid gap-2">{options.map((option) => <button key={option.id} type="button" onClick={() => setSituation(option.id)} aria-pressed={situation === option.id} className={`grid min-h-16 grid-cols-[1fr_auto] items-center border px-4 py-3 text-left transition ${situation === option.id ? "border-navy bg-navy text-white" : "border-border bg-surface text-navy hover:border-gold"}`}><span><strong className="block text-sm">{option.label}</strong><span className={`mt-1 block text-xs ${situation === option.id ? "text-white/60" : "text-muted"}`}>{option.detail}</span></span><span className="font-mono text-xs" aria-hidden="true">{situation === option.id ? "선택됨" : "→"}</span></button>)}</div></div>
    <div className="flex flex-col bg-navy p-6 text-white sm:p-8" aria-live="polite"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">지금 필요한 결과물</p><h3 className="mt-3 text-3xl font-semibold">{product.name}</h3><p className="mt-3 text-2xl font-semibold text-gold">{product.price}</p><p className="mt-6 text-sm leading-7 text-white/70">{product.description}</p><div className="mt-auto space-y-3 pt-10">{situation === "job" ? <ResumeProCtaLink href="/resume-pro?from=pro-finder" surface={resumeFunnelSurfaces.proFinder} context={resumeFunnelContexts.proCatalog} className="flex min-h-12 items-center justify-between bg-gold px-5 text-sm font-semibold text-navy"><span>{product.cta}</span><span aria-hidden="true">→</span></ResumeProCtaLink> : <Link href={product.href} className="flex min-h-12 items-center justify-between bg-gold px-5 text-sm font-semibold text-white"><span>{product.cta}</span><span aria-hidden="true">→</span></Link>}<Link href={product.freeHref} className="flex min-h-12 items-center justify-between border border-white/25 px-5 text-sm font-semibold text-white"><span>{product.freeLabel}</span><span aria-hidden="true">→</span></Link></div><p className="mt-5 text-xs leading-5 text-white/50">{selectedProductLive ? "Resume Pro는 A$19.90 한 번만 결제하면 돼요. 구독은 없어요." : "표시 가격은 검토 중이며 이 제품은 현재 결제되지 않아요."}</p></div>
  </section>;
}
