"use client";

import { useState } from "react";
import Link from "next/link";

type Situation = "job" | "home" | "pay" | "tax" | "leave";

const options: { id: Situation; label: string; detail: string }[] = [
  { id: "job", label: "일자리에 지원 중", detail: "이력서·커버레터·공고 키워드" },
  { id: "home", label: "렌트에 지원 중", detail: "서류 상태·개인정보·영문 소개문" },
  { id: "pay", label: "급여를 확인 중", detail: "근무기록·Payslip 차이·증빙" },
  { id: "tax", label: "EOFY를 준비 중", detail: "소득 자료·공제 후보·회계사 질문" },
  { id: "leave", label: "호주를 떠날 예정", detail: "출국 업무·마지막 정산·DASP" },
];

const recommendations = {
  job: { href: "/resume-pro", name: "Resume Pro", price: "A$19.90", description: "무료 빌더의 이력서를 바탕으로 회사별 커버레터와 공고 키워드를 점검합니다.", freeHref: "/resume-builder", freeLabel: "무료 이력서 빌더" },
  home: { href: "/rental-application-pro", name: "Rental Pack Pro", price: "A$14.90", description: "원본 서류 없이 준비 상태와 개인정보 위험, 영문 신청 소개문을 정리합니다.", freeHref: "/property-inspection-checklist", freeLabel: "무료 집 방문 체크리스트" },
  pay: { href: "/pay-evidence-pro", name: "Pay Evidence Pro", price: "A$12.90", description: "급여기간별 Gross 차이와 증빙을 정리하고 영문 확인 요청문을 만듭니다.", freeHref: "/underpayment-guide", freeLabel: "무료 미지급 급여 가이드" },
  tax: { href: "/eofy-pro", name: "EOFY Pack Pro", price: "A$9.90", description: "소득 자료, 공제 후보와 확인 질문을 신고 전 준비 요약으로 묶습니다.", freeHref: "/tax-return-guide", freeLabel: "무료 택스 리턴 가이드" },
  leave: { href: "/leaving-australia-pro", name: "Leaving Pack Pro", price: "A$12.90", description: "출국 전후 업무와 Bond·마지막 급여·DASP 후속 확인을 추적합니다.", freeHref: "/leaving-australia-guide", freeLabel: "무료 귀국 준비 가이드" },
} as const;

export function ProProductFinder({ resumeProLive }: { resumeProLive: boolean }) {
  const [situation, setSituation] = useState<Situation>("job");
  const product = recommendations[situation];
  const selectedProductLive = situation === "job" && resumeProLive;

  return <section className="grid gap-px bg-border lg:grid-cols-[1fr_0.82fr]" aria-labelledby="pro-finder-heading">
    <div className="bg-white p-5 sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">내 상황에 맞는 Pro 찾기</p><h2 id="pro-finder-heading" className="mt-2 text-2xl font-semibold text-navy">요즘 가장 손이 많이 가는 일은 무엇인가요?</h2><div className="mt-6 grid gap-2">{options.map((option) => <button key={option.id} type="button" onClick={() => setSituation(option.id)} aria-pressed={situation === option.id} className={`grid min-h-16 grid-cols-[1fr_auto] items-center border px-4 py-3 text-left transition ${situation === option.id ? "border-navy bg-navy text-white" : "border-border bg-surface text-navy hover:border-gold"}`}><span><strong className="block text-sm">{option.label}</strong><span className={`mt-1 block text-xs ${situation === option.id ? "text-white/60" : "text-muted"}`}>{option.detail}</span></span><span className="font-mono text-xs" aria-hidden="true">{situation === option.id ? "선택됨" : "→"}</span></button>)}</div></div>
    <div className="flex flex-col bg-navy p-6 text-white sm:p-8" aria-live="polite"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">이 도구가 잘 맞아요</p><h3 className="mt-3 text-3xl font-semibold">{product.name}</h3><p className="mt-3 text-2xl font-semibold text-gold">{product.price}</p><p className="mt-6 text-sm leading-7 text-white/70">{product.description}</p><div className="mt-auto space-y-3 pt-10"><Link href={product.href} className="flex min-h-12 items-center justify-between bg-gold px-5 text-sm font-semibold text-navy"><span>{selectedProductLive ? "Resume Pro 시작하기" : "어떤 기능인지 살펴보기"}</span><span aria-hidden="true">→</span></Link><Link href={product.freeHref} className="flex min-h-12 items-center justify-between border border-white/25 px-5 text-sm font-semibold text-white"><span>{product.freeLabel}</span><span aria-hidden="true">→</span></Link></div><p className="mt-5 text-xs leading-5 text-white/50">{selectedProductLive ? "Resume Pro는 현재 A$19.90 1회 결제로 이용할 수 있어요." : "표시 가격은 검토 중이며 이 제품은 현재 결제되지 않아요."}</p></div>
  </section>;
}
