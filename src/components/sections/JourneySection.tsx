"use client";

import { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";

const stages = [
  { id: "prepare", number: "01", tab: "출국·도착 준비", title: "비자 승인부터 첫 30일 정착까지", description: "공식 비자 절차를 확인한 뒤 도착 직후 전화·교통, 은행, 세금과 의료 준비를 시기별로 이어가세요.", links: [{ href: "/visa-preparation-guide", label: "비자·신체검사 준비" }, { href: "/arrival-checklist", label: "도착 후 30일" }, { href: "/cost-of-living-calculator", label: "생활비 예산" }] },
  { id: "home", number: "02", tab: "첫 집 구하기", title: "주거비와 통학시간을 함께 비교하기", description: "학교·직장까지의 실제 이동시간을 먼저 확인하고, 집 상태와 계약 상대방, 보증금 절차를 차근차근 점검하세요.", links: [{ href: "/public-transport-guide", label: "통학 생활권 비교" }, { href: "/property-inspection-checklist", label: "집 방문 체크리스트" }, { href: "/moving-checklist", label: "이사 준비" }] },
  { id: "work", number: "03", tab: "일자리 구하기", title: "이력서부터 지원 기록까지 이어가기", description: "호주식 영문 이력서를 만들고 공고, 면접과 다음 행동을 하나의 구직 프로젝트로 관리하세요.", links: [{ href: "/resume-builder", label: "영문 이력서 만들기" }, { href: "/job-application-tracker", label: "지원 현황 관리" }, { href: "/minimum-wage-guide", label: "최저임금 확인" }] },
  { id: "settle", number: "04", tab: "생활 정착", title: "돈과 이동, 생활 서비스를 계획하기", description: "비상금과 차량 비용을 준비하고 생활 서비스 견적을 같은 기준으로 비교하세요.", links: [{ href: "/savings-goal-calculator", label: "저축 프로젝트" }, { href: "/used-car-comparison", label: "중고차 비교" }, { href: "/service-quote-comparator", label: "서비스 견적 비교" }] },
  { id: "yearly", number: "05", tab: "세금·정기 점검", title: "택스 리턴과 반복 비용 점검하기", description: "EOFY 서류를 준비하고 실제 서비스 비용을 기록해 다음 신고와 지출 판단에 활용하세요.", links: [{ href: "/tax-return-guide", label: "택스 리턴 준비" }, { href: "/service-price-log", label: "서비스 가격 기록" }, { href: "/tools", label: "전체 도구 보기" }] },
  { id: "departure", number: "06", tab: "귀국 준비", title: "호주 생활을 안전하게 마무리하기", description: "퇴사와 렌트, 계정 접근을 먼저 정리하고 출국 후 비자 종료를 확인해 Super DASP를 신청하세요.", links: [{ href: "/leaving-australia-guide", label: "귀국 준비·DASP" }, { href: "/tax-return-guide", label: "마지막 세금 준비" }, { href: "/moving-checklist", label: "퇴거·이사 점검" }] },
];

export function JourneySection() {
  const [activeId, setActiveId] = useState(stages[0].id);
  const active = stages.find((stage) => stage.id === activeId) ?? stages[0];
  return <section id="journey" className="scroll-mt-20 border-b border-border bg-white py-16 sm:py-20" aria-labelledby="journey-heading"><Container>
    <div className="max-w-3xl"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">내 상황에서 시작하기</p><h2 id="journey-heading" className="mt-2 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">워홀 시작부터 귀국까지, 필요한 순서대로</h2><p className="mt-4 text-base leading-7 text-muted sm:text-lg">처음부터 모두 볼 필요는 없습니다. 지금 내 상황을 선택하면 바로 필요한 도구와 정보만 보여드립니다.</p></div>
    <div className="mt-10 border-y border-navy/20">
      <div className="flex overflow-x-auto" role="tablist" aria-label="호주 생활 단계">{stages.map((stage)=><button key={stage.id} type="button" role="tab" aria-selected={active.id===stage.id} aria-controls="journey-panel" onClick={()=>setActiveId(stage.id)} className={`min-h-24 min-w-40 flex-1 border-r border-border px-4 text-left transition last:border-r-0 ${active.id===stage.id?"bg-navy text-white":"bg-white text-navy hover:bg-surface"}`}><span className={`block font-mono text-xs ${active.id===stage.id?"text-gold":"text-muted"}`}>{stage.number}</span><span className="mt-2 block text-sm font-semibold">{stage.tab}</span></button>)}</div>
      <div id="journey-panel" role="tabpanel" className="grid gap-8 border-t border-navy/20 bg-surface px-6 py-8 sm:px-8 lg:grid-cols-[6rem_1fr] lg:py-10"><span className="font-mono text-5xl text-gold">{active.number}</span><div><h3 className="text-2xl font-semibold text-navy sm:text-3xl">{active.title}</h3><p className="mt-3 max-w-2xl leading-7 text-muted">{active.description}</p><div className="mt-7 grid border-t border-border sm:grid-cols-3">{active.links.map((link,index)=><Link key={link.href} href={link.href} className="group flex min-h-20 items-center justify-between border-b border-border py-4 text-sm font-semibold text-navy sm:border-b-0 sm:border-r sm:px-4 sm:first:pl-0 sm:last:border-r-0"><span><span className="mr-2 font-mono text-xs text-muted">0{index+1}</span>{link.label}</span><span className="transition group-hover:translate-x-1" aria-hidden="true">→</span></Link>)}</div></div></div>
    </div>
    <div className="mt-6 text-right"><Link href="/tools" className="inline-flex min-h-11 items-center text-sm font-semibold text-navy">상황과 관계없이 전체 도구 보기 &rarr;</Link></div>
  </Container></section>;
}
