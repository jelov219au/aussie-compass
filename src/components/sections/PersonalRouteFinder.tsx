"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";

type StageId = "prepare" | "arrive" | "live" | "depart";
type ConcernId = "admin" | "work" | "home" | "money" | "safety";

type RouteTool = {
  href: string;
  title: string;
  description: string;
  stages: StageId[];
  concerns: ConcernId[];
};

const storageKey = "hoju-compass-route-finder-v1";

const stages: Array<{ id: StageId; label: string; detail: string }> = [
  { id: "prepare", label: "출국 준비 중", detail: "비자 신청부터 출발 전" },
  { id: "arrive", label: "도착한 지 얼마 안 됨", detail: "첫 집·첫 일자리 준비" },
  { id: "live", label: "호주에서 생활 중", detail: "일·돈·생활 관리" },
  { id: "depart", label: "귀국을 준비 중", detail: "퇴거·세금·Super 정리" },
];

const concerns: Array<{ id: ConcernId; label: string }> = [
  { id: "admin", label: "비자·필수 절차" },
  { id: "work", label: "일자리·급여" },
  { id: "home", label: "집·교통" },
  { id: "money", label: "생활비·세금" },
  { id: "safety", label: "안전·생활 문제" },
];

const tools: RouteTool[] = [
  { href: "/visa-preparation-guide", title: "비자·신체검사 준비", description: "공식 신청 경로와 비용, 지정 병원을 순서대로 확인합니다.", stages: ["prepare"], concerns: ["admin"] },
  { href: "/arrival-checklist", title: "첫 30일 정착 체크리스트", description: "전화, 교통, 은행, TFN과 의료 준비를 놓치지 않습니다.", stages: ["prepare", "arrive"], concerns: ["admin", "safety"] },
  { href: "/career-pathways", title: "직업·부족 분야 탐색", description: "직업의 실제 업무와 자격 준비, 공식 비자 목록을 구분합니다.", stages: ["prepare", "arrive", "live"], concerns: ["work"] },
  { href: "/resume-builder", title: "영문 이력서 만들기", description: "영문 예시와 디자인을 선택해 호주식 이력서 초안을 만듭니다.", stages: ["prepare", "arrive", "live"], concerns: ["work"] },
  { href: "/job-application-tracker", title: "구직 지원 현황 관리", description: "관심 공고, 면접과 다음 행동을 한곳에서 이어갑니다.", stages: ["arrive", "live"], concerns: ["work"] },
  { href: "/salary-calculator", title: "세후 급여 확인", description: "시급·연봉의 세후 금액과 Super를 함께 계산합니다.", stages: ["prepare", "arrive", "live"], concerns: ["work", "money"] },
  { href: "/minimum-wage-guide", title: "최저임금·권리 확인", description: "최저임금, Award와 실제 Payslip 확인 순서를 살펴봅니다.", stages: ["prepare", "arrive", "live"], concerns: ["work", "safety"] },
  { href: "/cost-of-living-calculator", title: "생활비 예산 만들기", description: "주거비와 지출을 주·월·연 단위로 비교합니다.", stages: ["prepare", "arrive", "live"], concerns: ["money", "home"] },
  { href: "/public-transport-guide", title: "통학·생활권 비교", description: "집값과 통학시간, 대중교통 경로를 함께 비교합니다.", stages: ["prepare", "arrive", "live"], concerns: ["home"] },
  { href: "/property-inspection-checklist", title: "집 방문 체크리스트", description: "쉐어하우스·렌트의 비용, 계약과 안전을 현장에서 점검합니다.", stages: ["prepare", "arrive", "live"], concerns: ["home", "safety"] },
  { href: "/savings-goal-calculator", title: "저축·비상금 프로젝트", description: "목표 기간과 정기 저축액을 정하고 진행을 기록합니다.", stages: ["prepare", "live"], concerns: ["money"] },
  { href: "/tax-return-guide", title: "택스 리턴 준비", description: "EOFY 소득자료와 공제 증빙, 신고 일정을 정리합니다.", stages: ["live", "depart"], concerns: ["money", "admin"] },
  { href: "/life-admin-reminder", title: "만료일·갱신 일정", description: "비자, 여권, 렌트, Rego와 보험 날짜를 관리합니다.", stages: ["arrive", "live", "depart"], concerns: ["admin", "safety"] },
  { href: "/help-directory", title: "호주 생활 도움 연락처", description: "긴급전화, 의료상담, 통역, 직장 문제와 사기 신고처를 찾습니다.", stages: ["prepare", "arrive", "live", "depart"], concerns: ["safety"] },
  { href: "/moving-checklist", title: "이사·퇴거 준비", description: "퇴거 통지, 공과금, 주소 변경과 보증금을 점검합니다.", stages: ["live", "depart"], concerns: ["home", "admin"] },
  { href: "/leaving-australia-guide", title: "귀국 준비·Super DASP", description: "퇴사와 렌트부터 출국 후 Super 환급 준비까지 이어갑니다.", stages: ["depart"], concerns: ["admin", "work", "home", "money", "safety"] },
  { href: "/service-quote-comparator", title: "생활 서비스 견적 비교", description: "가격뿐 아니라 ABN, 면허, 보증과 작업 범위를 비교합니다.", stages: ["live"], concerns: ["home", "safety"] },
];

export function PersonalRouteFinder() {
  const [stage, setStage] = useState<StageId>("prepare");
  const [concern, setConcern] = useState<ConcernId>("admin");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null") as { stage?: StageId; concern?: ConcernId } | null;
      if (saved && stages.some((item) => item.id === saved.stage)) setStage(saved.stage as StageId);
      if (saved && concerns.some((item) => item.id === saved.concern)) setConcern(saved.concern as ConcernId);
    } catch {
      // Invalid local data falls back to the safest first-visit route.
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(storageKey, JSON.stringify({ stage, concern })); }
    catch { /* Saving a preference is optional. */ }
  }, [stage, concern, loaded]);

  const recommendations = useMemo(() => tools.map((tool, index) => ({
    ...tool,
    index,
    score: tool.concerns.includes(concern) ? 1 : 0,
  })).filter((tool) => tool.stages.includes(stage)).sort((a, b) => b.score - a.score || a.index - b.index).slice(0, 3), [stage, concern]);

  const stageLabel = stages.find((item) => item.id === stage)?.label;
  const concernLabel = concerns.find((item) => item.id === concern)?.label;

  return <section id="route-finder" className="scroll-mt-20 border-b border-border bg-surface py-16 sm:py-20" aria-labelledby="route-finder-heading"><Container>
    <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">Personal starting point</p>
        <h2 id="route-finder-heading" className="mt-2 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">두 번만 고르면,<br/>오늘 할 일 세 가지.</h2>
        <p className="mt-4 max-w-xl text-base leading-7 text-muted">모든 정보를 처음부터 읽을 필요는 없습니다. 현재 단계와 가장 급한 고민을 선택하면 먼저 볼 도구를 추려드립니다.</p>

        <fieldset className="mt-8"><legend className="text-sm font-semibold text-navy"><span className="mr-2 font-mono text-gold">01</span>지금 어느 단계인가요?</legend><div className="mt-3 grid gap-2 sm:grid-cols-2">{stages.map((item) => <label key={item.id} className={`cursor-pointer border px-4 py-3 transition ${stage === item.id ? "border-navy bg-white shadow-sm" : "border-border bg-transparent hover:border-navy/40"}`}><input type="radio" name="route-stage" value={item.id} checked={stage === item.id} onChange={() => setStage(item.id)} className="sr-only"/><span className="block text-sm font-semibold text-navy">{item.label}</span><span className="mt-1 block text-xs text-muted">{item.detail}</span></label>)}</div></fieldset>

        <fieldset className="mt-7"><legend className="text-sm font-semibold text-navy"><span className="mr-2 font-mono text-gold">02</span>지금 가장 급한 것은?</legend><div className="mt-3 flex flex-wrap gap-2">{concerns.map((item) => <label key={item.id} className={`inline-flex min-h-11 cursor-pointer items-center border px-4 text-sm font-semibold transition ${concern === item.id ? "border-gold bg-gold text-navy" : "border-border bg-white text-muted hover:border-navy/40 hover:text-navy"}`}><input type="radio" name="route-concern" value={item.id} checked={concern === item.id} onChange={() => setConcern(item.id)} className="sr-only"/>{item.label}</label>)}</div></fieldset>
        <p className="mt-4 text-xs leading-5 text-muted">선택만 현재 브라우저에 저장되며 이름이나 연락처는 수집하지 않습니다.</p>
      </div>

      <div className="self-start bg-navy p-6 text-white sm:p-8" aria-live="polite">
        <div className="flex items-end justify-between gap-4 border-b border-white/15 pb-5"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">Your next three</p><h3 className="mt-2 text-2xl font-semibold">{stageLabel} · {concernLabel}</h3></div><span className="font-mono text-xs text-white/45">03 steps</span></div>
        <ol>{recommendations.map((tool, index) => <li key={tool.href} className="border-b border-white/15"><Link href={tool.href} className="group grid gap-3 py-6 sm:grid-cols-[2rem_1fr_auto] sm:items-center"><span className="font-mono text-xs text-gold">0{index + 1}</span><span><strong className="block text-lg text-white">{tool.title}</strong><span className="mt-1 block text-sm leading-6 text-white/60">{tool.description}</span></span><span className="text-xl text-gold transition group-hover:translate-x-1" aria-hidden="true">→</span></Link></li>)}</ol>
        <Link href="/tools" className="mt-6 inline-flex min-h-11 items-center border-b border-gold text-sm font-semibold text-white">추천 외 전체 도구 보기 →</Link>
      </div>
    </div>
  </Container></section>;
}
