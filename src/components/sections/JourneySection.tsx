"use client";

import { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";

const stages = [
  { id: "prepare", number: "01", tab: "출국·도착 준비", title: "비자부터 생활 예산까지 먼저 준비하기", description: "공식 비자 절차와 신체검사를 확인하고 예상 급여와 생활비 기준을 잡으면 도착 후 선택이 쉬워집니다.", links: [{ href: "/visa-preparation-guide", label: "비자·신체검사 준비" }, { href: "/salary-calculator", label: "예상 급여 계산" }, { href: "/cost-of-living-calculator", label: "생활비 예산" }] },
  { id: "home", number: "02", tab: "첫 집 구하기", title: "광고를 찾았다면 현장에서 확인하기", description: "쉐어하우스 상태와 실제 비용, 계약 상대방과 보증금 절차를 차근차근 확인하세요.", links: [{ href: "/property-inspection-checklist", label: "집 방문 체크리스트" }, { href: "/moving-checklist", label: "이사 준비" }, { href: "/cost-of-living-calculator", label: "주거비 반영" }] },
  { id: "work", number: "03", tab: "일자리 구하기", title: "이력서부터 지원 기록까지 이어가기", description: "호주식 영문 이력서를 만들고 공고, 면접과 다음 행동을 하나의 구직 프로젝트로 관리하세요.", links: [{ href: "/resume-builder", label: "영문 이력서 만들기" }, { href: "/job-application-tracker", label: "지원 현황 관리" }, { href: "/minimum-wage-guide", label: "최저임금 확인" }] },
  { id: "settle", number: "04", tab: "생활 정착", title: "돈과 이동, 생활 서비스를 계획하기", description: "비상금과 차량 비용을 준비하고 생활 서비스 견적을 같은 기준으로 비교하세요.", links: [{ href: "/savings-goal-calculator", label: "저축 프로젝트" }, { href: "/used-car-comparison", label: "중고차 비교" }, { href: "/service-quote-comparator", label: "서비스 견적 비교" }] },
  { id: "yearly", number: "05", tab: "매년 챙기기", title: "반복되는 행정과 비용을 놓치지 않기", description: "EOFY 준비와 실제 서비스 비용을 기록해 다음 해에는 더 빠르게 판단하세요.", links: [{ href: "/tax-return-guide", label: "택스 리턴 준비" }, { href: "/service-price-log", label: "서비스 가격 기록" }, { href: "/tools", label: "전체 도구 보기" }] },
];

export function JourneySection() {
  const [activeId, setActiveId] = useState(stages[0].id);
  const active = stages.find((stage) => stage.id === activeId) ?? stages[0];
  return <section id="journey" className="scroll-mt-20 border-b border-border bg-white py-16 sm:py-20" aria-labelledby="journey-heading"><Container>
    <div className="max-w-3xl"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">내 상황에서 시작하기</p><h2 id="journey-heading" className="mt-2 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">워홀 시작부터 정착까지, 필요한 순서대로</h2><p className="mt-4 text-base leading-7 text-muted sm:text-lg">처음부터 모두 볼 필요는 없습니다. 지금 내 상황을 선택하면 바로 필요한 도구와 정보만 보여드립니다.</p></div>
    <div className="mt-9 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col" role="tablist" aria-label="호주 생활 단계">{stages.map((stage)=><button key={stage.id} type="button" role="tab" aria-selected={active.id===stage.id} aria-controls="journey-panel" onClick={()=>setActiveId(stage.id)} className={`flex min-h-14 shrink-0 items-center gap-3 rounded-xl border px-4 text-left text-sm font-semibold transition lg:w-full ${active.id===stage.id?"border-navy bg-navy text-white":"border-border bg-background text-navy hover:border-gold/60"}`}><span className={active.id===stage.id?"text-gold":"text-muted"}>{stage.number}</span><span>{stage.tab}</span></button>)}</div>
      <div id="journey-panel" role="tabpanel" className="rounded-3xl border border-gold/40 bg-gold/5 p-6 sm:p-8"><p className="text-sm font-semibold text-gold">STEP {active.number}</p><h3 className="mt-2 text-2xl font-semibold text-navy sm:text-3xl">{active.title}</h3><p className="mt-3 max-w-2xl leading-7 text-muted">{active.description}</p><div className="mt-7 grid gap-3 sm:grid-cols-3">{active.links.map((link,index)=><Link key={link.href} href={link.href} className={`flex min-h-24 flex-col justify-between rounded-xl border p-4 text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-sm ${index===0?"border-navy bg-navy text-white":"border-border bg-white text-navy"}`}><span className={index===0?"text-gold":"text-muted"}>0{index+1}</span><span>{link.label} &rarr;</span></Link>)}</div></div>
    </div>
    <div className="mt-6 text-right"><Link href="/tools" className="inline-flex min-h-11 items-center text-sm font-semibold text-navy">상황과 관계없이 전체 도구 보기 &rarr;</Link></div>
  </Container></section>;
}
