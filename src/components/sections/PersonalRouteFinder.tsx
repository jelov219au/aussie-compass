"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
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

type SavedPlan = {
  stage: StageId;
  concern: ConcernId;
  stageLabel: string;
  concernLabel: string;
  steps: Array<{ href: string; title: string }>;
  completed: string[];
  savedAt: string;
};

const storageKey = "hoju-compass-route-finder-v1";
const planStorageKey = "hoju-compass-personal-plan-v1";

const icsEscape = (value: string) => value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
const icsDate = (date: Date) => `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;

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
  { href: "/visa-preparation-guide", title: "비자·신체검사 준비", description: "신청 경로와 비용, 지정 병원을 공식 사이트에서 확인해요.", stages: ["prepare"], concerns: ["admin"] },
  { href: "/arrival-checklist", title: "첫 30일 정착 체크리스트", description: "전화, 교통, 은행, TFN과 의료 준비를 순서대로 챙겨요.", stages: ["prepare", "arrive"], concerns: ["admin", "safety"] },
  { href: "/career-pathways", title: "직업·부족 분야 탐색", description: "실제 업무와 필요한 자격, 비자 목록의 차이를 알아봐요.", stages: ["prepare", "arrive", "live"], concerns: ["work"] },
  { href: "/resume-builder", title: "영문 이력서 만들기", description: "영문 예시를 참고해 내 경력에 맞는 이력서 초안을 만들어요.", stages: ["prepare", "arrive", "live"], concerns: ["work"] },
  { href: "/job-application-tracker", title: "구직 지원 현황 관리", description: "관심 공고와 면접 일정, 다음에 할 일을 한곳에 적어둬요.", stages: ["arrive", "live"], concerns: ["work"] },
  { href: "/salary-calculator", title: "세후 급여 확인", description: "시급이나 연봉을 넣어 세후 금액과 Super를 함께 계산해요.", stages: ["prepare", "arrive", "live"], concerns: ["work", "money"] },
  { href: "/minimum-wage-guide", title: "최저임금·권리 확인", description: "최저임금과 Award를 찾고 Payslip을 확인하는 순서를 알아봐요.", stages: ["prepare", "arrive", "live"], concerns: ["work", "safety"] },
  { href: "/cost-of-living-calculator", title: "생활비 예산 만들기", description: "주거비와 생활비를 주·월·연 단위로 바꿔 비교해요.", stages: ["prepare", "arrive", "live"], concerns: ["money", "home"] },
  { href: "/public-transport-guide", title: "통학·생활권 비교", description: "집값뿐 아니라 실제 통학시간과 교통편도 함께 비교해요.", stages: ["prepare", "arrive", "live"], concerns: ["home"] },
  { href: "/property-inspection-checklist", title: "집 방문 체크리스트", description: "집을 보러 간 자리에서 비용과 계약 조건, 안전을 확인해요.", stages: ["prepare", "arrive", "live"], concerns: ["home", "safety"] },
  { href: "/savings-goal-calculator", title: "저축·비상금 프로젝트", description: "목표 기간과 저축액을 정하고 얼마나 모았는지 기록해요.", stages: ["prepare", "live"], concerns: ["money"] },
  { href: "/tax-return-guide", title: "택스 리턴 준비", description: "EOFY 소득자료와 공제 증빙, 신고 일정을 한 번에 정리해요.", stages: ["live", "depart"], concerns: ["money", "admin"] },
  { href: "/life-admin-reminder", title: "만료일·갱신 일정", description: "비자, 여권, 렌트, Rego와 보험 날짜를 적어둬요.", stages: ["arrive", "live", "depart"], concerns: ["admin", "safety"] },
  { href: "/help-directory", title: "호주 생활 도움 연락처", description: "응급전화부터 의료, 통역, 직장 문제와 사기 신고처까지 찾아봐요.", stages: ["prepare", "arrive", "live", "depart"], concerns: ["safety"] },
  { href: "/moving-checklist", title: "이사·퇴거 준비", description: "퇴거 통지와 공과금, 주소 변경, 보증금을 빠짐없이 챙겨요.", stages: ["live", "depart"], concerns: ["home", "admin"] },
  { href: "/leaving-australia-guide", title: "귀국 준비·Super DASP", description: "퇴사와 렌트 정리부터 출국 후 Super 신청까지 순서대로 알아봐요.", stages: ["depart"], concerns: ["admin", "work", "home", "money", "safety"] },
  { href: "/service-quote-comparator", title: "생활 서비스 견적 비교", description: "가격과 함께 ABN, 면허, 보증, 작업 범위도 비교해요.", stages: ["live"], concerns: ["home", "safety"] },
];

export function PersonalRouteFinder() {
  const [stage, setStage] = useState<StageId>("prepare");
  const [concern, setConcern] = useState<ConcernId>("admin");
  const [plan, setPlan] = useState<SavedPlan | null>(null);
  const [actionMessage, setActionMessage] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedStage = params.get("stage") as StageId | null;
    const sharedConcern = params.get("concern") as ConcernId | null;
    const hasSharedRoute = stages.some((item) => item.id === sharedStage) && concerns.some((item) => item.id === sharedConcern);
    if (hasSharedRoute) {
      setStage(sharedStage as StageId);
      setConcern(sharedConcern as ConcernId);
      setActionMessage("공유받은 추천 경로를 열었어요. 저장하기 전까지 기존 계획은 그대로 남아 있어요.");
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null") as { stage?: StageId; concern?: ConcernId } | null;
        if (saved && stages.some((item) => item.id === saved.stage)) setStage(saved.stage as StageId);
        if (saved && concerns.some((item) => item.id === saved.concern)) setConcern(saved.concern as ConcernId);
      } catch { /* Invalid preferences fall back to the first route. */ }
    }
    try {
      const savedPlan = JSON.parse(localStorage.getItem(planStorageKey) ?? "null") as SavedPlan | null;
      if (savedPlan && Array.isArray(savedPlan.steps) && Array.isArray(savedPlan.completed)) setPlan(savedPlan);
    } catch { /* Invalid plan data is ignored. */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(storageKey, JSON.stringify({ stage, concern })); }
    catch { /* Saving a preference is optional. */ }
  }, [stage, concern, loaded]);

  useEffect(() => {
    if (!loaded || !plan) return;
    try { localStorage.setItem(planStorageKey, JSON.stringify(plan)); }
    catch { /* Saving a plan is optional. */ }
  }, [plan, loaded]);

  const recommendations = useMemo(() => tools.map((tool, index) => ({
    ...tool,
    index,
    score: tool.concerns.includes(concern) ? 1 : 0,
  })).filter((tool) => tool.stages.includes(stage)).sort((a, b) => b.score - a.score || a.index - b.index).slice(0, 3), [stage, concern]);

  const stageLabel = stages.find((item) => item.id === stage)?.label;
  const concernLabel = concerns.find((item) => item.id === concern)?.label;
  const currentSteps = recommendations.map(({ href, title }) => ({ href, title }));
  const matchesCurrentPlan = Boolean(plan && plan.stage === stage && plan.concern === concern && plan.steps.map((step) => step.href).join("|") === currentSteps.map((step) => step.href).join("|"));
  const completedCount = matchesCurrentPlan && plan ? plan.completed.filter((href) => currentSteps.some((step) => step.href === href)).length : 0;

  const saveCurrentPlan = () => {
    if (!stageLabel || !concernLabel) return;
    setPlan({ stage, concern, stageLabel, concernLabel, steps: currentSteps, completed: [], savedAt: new Date().toISOString() });
    track("Route Plan Saved", { stage, concern });
    window.dispatchEvent(new Event("storage"));
  };

  const toggleCompleted = (href: string) => {
    setPlan((current) => current ? { ...current, completed: current.completed.includes(href) ? current.completed.filter((item) => item !== href) : [...current.completed, href] } : current);
    window.dispatchEvent(new Event("storage"));
  };

  const shareRecommendations = async () => {
    const url = new URL("https://hojucompass.com/");
    url.searchParams.set("stage", stage);
    url.searchParams.set("concern", concern);
    url.hash = "route-finder";
    const shareData = { title: "Hoju Compass 맞춤 시작 경로", text: `${stageLabel} · ${concernLabel}에 맞는 호주 생활 도구 3가지를 확인해 보세요.`, url: url.toString() };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setActionMessage("공유 메뉴를 열었어요.");
      } else {
        await navigator.clipboard.writeText(url.toString());
        setActionMessage("추천 링크를 복사했어요.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(url.toString());
        setActionMessage("추천 링크를 복사했어요.");
      } catch {
        setActionMessage("브라우저 주소를 복사해 공유해 주세요.");
      }
    }
  };

  const downloadReminder = () => {
    if (!matchesCurrentPlan || !plan) return;
    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + 7);
    const remaining = plan.steps.filter((step) => !plan.completed.includes(step.href)).map((step) => step.title);
    const description = [`${plan.stageLabel} · ${plan.concernLabel}`, `${completedCount}/3개 완료`, remaining.length ? `남은 단계: ${remaining.join(", ")}` : "모든 단계를 마쳤어요.", "https://hojucompass.com/#route-finder"].join("\n");
    const body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Hoju Compass//Personal Plan//KO", "CALSCALE:GREGORIAN", "BEGIN:VEVENT", `UID:personal-plan-${icsDate(reminderDate)}-${stage}-${concern}@hojucompass.com`, `DTSTART;VALUE=DATE:${icsDate(reminderDate)}`, "SUMMARY:Hoju Compass 3단계 계획 점검", `DESCRIPTION:${icsEscape(description)}`, "URL:https://hojucompass.com/#route-finder", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const url = URL.createObjectURL(new Blob([body], { type: "text/calendar;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "hoju-compass-7-day-plan-reminder.ics";
    anchor.click();
    URL.revokeObjectURL(url);
    setActionMessage("7일 뒤 다시 볼 수 있도록 캘린더 파일을 저장했어요.");
  };

  return <section id="route-finder" className="scroll-mt-20 border-b border-border bg-white py-16 sm:py-24" aria-labelledby="route-finder-heading"><Container>
    <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
      <div>
        <p className="text-sm font-semibold text-gold">내 상황에 맞춰보기</p>
        <h2 id="route-finder-heading" className="mt-2 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">지금 단계와 고민을<br/>하나씩 골라보세요.</h2>
        <p className="mt-4 max-w-xl text-base leading-7 text-muted">모든 정보를 처음부터 읽지 않아도 괜찮아요. 지금 필요한 순서에 맞춰 먼저 볼 세 가지를 보여드려요.</p>

        <fieldset className="mt-8"><legend className="text-sm font-semibold text-navy"><span className="mr-2 text-gold">01</span>지금 어느 단계인가요?</legend><div className="mt-3 grid gap-2 sm:grid-cols-2">{stages.map((item) => <label key={item.id} className={`cursor-pointer rounded-xl border px-4 py-3 transition ${stage === item.id ? "border-navy bg-surface" : "border-border bg-white hover:border-navy/30"}`}><input type="radio" name="route-stage" value={item.id} checked={stage === item.id} onChange={() => setStage(item.id)} className="sr-only"/><span className="block text-sm font-semibold text-navy">{item.label}</span><span className="mt-1 block text-xs text-muted">{item.detail}</span></label>)}</div></fieldset>

        <fieldset className="mt-7"><legend className="text-sm font-semibold text-navy"><span className="mr-2 text-gold">02</span>요즘 가장 마음 쓰이는 일은 무엇인가요?</legend><div className="mt-3 flex flex-wrap gap-2">{concerns.map((item) => <label key={item.id} className={`inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-sm font-semibold transition ${concern === item.id ? "border-gold bg-gold/15 text-navy" : "border-border bg-white text-muted hover:border-navy/30 hover:text-navy"}`}><input type="radio" name="route-concern" value={item.id} checked={concern === item.id} onChange={() => setConcern(item.id)} className="sr-only"/>{item.label}</label>)}</div></fieldset>
        <p className="mt-4 text-xs leading-5 text-muted">고른 내용은 현재 브라우저에만 저장돼요. 이름이나 연락처는 받지 않아요.</p>
      </div>

      <div className="self-start rounded-3xl bg-navy p-6 text-white sm:p-8" aria-live="polite">
        <div className="flex items-end justify-between gap-4 border-b border-white/15 pb-5"><div><p className="text-xs font-semibold text-gold">이 순서로 시작해보세요</p><h3 className="mt-2 text-2xl font-semibold">{stageLabel} · {concernLabel}</h3></div><span className="shrink-0 text-xs text-white/45">{matchesCurrentPlan ? `${completedCount}/3 완료` : "먼저 볼 3가지"}</span></div>
        <ol>{recommendations.map((tool, index) => { const done = Boolean(matchesCurrentPlan && plan?.completed.includes(tool.href)); return <li key={tool.href} className="border-b border-white/15"><div className="grid sm:grid-cols-[1fr_auto] sm:items-center"><Link href={tool.href} onClick={() => track("Route Recommendation Opened", { destination: tool.href.slice(1), route: `${stage}_${concern}` })} className="group grid gap-3 py-6 sm:grid-cols-[2rem_1fr_auto] sm:items-center"><span className="font-mono text-xs text-gold">0{index + 1}</span><span><strong className={`block text-lg text-white ${done ? "line-through decoration-gold/70" : ""}`}>{tool.title}</strong><span className="mt-1 block text-sm leading-6 text-white/60">{tool.description}</span></span><span className="text-xl text-gold transition group-hover:translate-x-1" aria-hidden="true">→</span></Link>{matchesCurrentPlan && <button type="button" aria-pressed={done} onClick={() => toggleCompleted(tool.href)} className={`mb-4 ml-8 inline-flex min-h-10 items-center justify-center border px-3 text-xs font-semibold sm:mb-0 sm:ml-4 ${done ? "border-gold bg-gold text-navy" : "border-white/25 text-white hover:border-gold"}`}>{done ? "완료됨" : "완료 표시"}</button>}</div></li>; })}</ol>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3"><button type="button" disabled={matchesCurrentPlan} onClick={saveCurrentPlan} className="inline-flex min-h-11 items-center rounded-full bg-gold px-5 text-sm font-semibold text-navy disabled:cursor-default disabled:bg-white/10 disabled:text-white/55">{matchesCurrentPlan ? "나의 계획에 저장됨" : plan ? "현재 추천으로 계획 바꾸기" : "3단계 계획으로 저장"}</button><Link href="/tools" className="inline-flex min-h-11 items-center text-sm font-semibold text-white">전체 도구 보기 →</Link></div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2"><button type="button" onClick={shareRecommendations} className="inline-flex min-h-10 items-center text-sm font-semibold text-white/75 hover:text-white">추천 경로 공유 ↗</button>{matchesCurrentPlan && <button type="button" onClick={downloadReminder} className="inline-flex min-h-10 items-center text-sm font-semibold text-white/75 hover:text-white">7일 뒤 점검 알림 +</button>}</div>
        {actionMessage && <p className="mt-3 text-xs leading-5 text-white/60" role="status" aria-live="polite">{actionMessage}</p>}
        {matchesCurrentPlan && completedCount === 3 && <p className="mt-5 border-l-2 border-gold pl-3 text-sm leading-6 text-white/75">세 단계를 모두 마쳤어요. 다른 고민을 골라 새 계획을 만들 수도 있어요.</p>}
      </div>
    </div>
  </Container></section>;
}
