"use client";

import { useEffect, useMemo, useState } from "react";
import { readLocalRecord, LOCAL_RECORD_UPDATED_EVENT } from "@/lib/localRecordState";
import { parsePersonalPlan, parseRoutePreference, personalPlanCalendar, type StageId, type ConcernId, type SavedPlan } from "@/lib/personalRoutePlan";
import Link from "next/link";
import { track } from "@vercel/analytics";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import { Container } from "@/components/ui/Container";

type RouteTool = {
  href: string;
  title: string;
  description: string;
  stages: StageId[];
  concerns: ConcernId[];
};

const storageKey = "hoju-compass-route-finder-v1";
const planStorageKey = "hoju-compass-personal-plan-v1";
const routePlanActions = {
  save: "save_plan",
  viewSaved: "view_saved_plan",
  viewCurrent: "view_current_recommendations",
  markComplete: "mark_step_complete",
  markIncomplete: "mark_step_incomplete",
  share: "share_recommendations",
  reminder: "download_reminder",
} as const;

function trackRoutePlanAction(action: typeof routePlanActions[keyof typeof routePlanActions], stage: StageId, concern: ConcernId) {
  try {
    track("Route Plan Action", { action, stage, concern });
  } catch {
    // Plan actions must remain independent from optional analytics.
  }
}

function trackRecommendation(destination: string, stage: StageId, concern: ConcernId) {
  try {
    track("Route Recommendation Opened", { destination, stage, concern });
  } catch {
    // Navigation must remain independent from optional analytics.
  }
}

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
  { href: "/english-phrase-cards", title: "첫 생활 영어 문장", description: "숙소, 집, 은행과 직장에서 바로 쓸 확인 문장을 골라 저장해요.", stages: ["arrive"], concerns: ["admin", "home", "safety"] },
  { href: "/career-pathways", title: "직업·부족 분야 탐색", description: "실제 업무와 필요한 자격, 비자 목록의 차이를 알아봐요.", stages: ["prepare", "arrive", "live"], concerns: ["work"] },
  { href: "/resume-builder", title: "영문 이력서 만들기", description: "영문 예시를 참고해 내 경력에 맞는 이력서 초안을 만들어요.", stages: ["prepare", "arrive", "live"], concerns: ["work"] },
  { href: "/job-application-tracker", title: "구직 지원 현황 관리", description: "관심 공고와 면접 일정, 다음에 할 일을 한곳에 적어둬요.", stages: ["arrive", "live"], concerns: ["work"] },
  { href: "/salary-calculator", title: "세후 급여 확인", description: "시급이나 연봉을 넣어 세후 금액과 Super를 함께 계산해요.", stages: ["prepare", "arrive", "live"], concerns: ["work", "money"] },
  { href: "/minimum-wage-guide", title: "최저임금·권리 확인", description: "최저임금과 Award를 찾고 Payslip을 확인하는 순서를 알아봐요.", stages: ["prepare", "arrive", "live"], concerns: ["work", "safety"] },
  { href: "/cost-of-living-calculator", title: "생활비 예산 만들기", description: "주거비와 생활비를 주·월·연 단위로 바꿔 비교해요.", stages: ["prepare", "arrive", "live"], concerns: ["money", "home"] },
  { href: "/public-transport-guide", title: "통학·생활권 비교", description: "집값뿐 아니라 실제 통학시간과 교통편도 함께 비교해요.", stages: ["prepare", "arrive", "live"], concerns: ["home"] },
  { href: "/property-inspection-checklist", title: "집 방문 체크리스트", description: "집을 보러 간 자리에서 비용과 계약 조건, 안전을 확인해요.", stages: ["prepare", "arrive", "live"], concerns: ["home", "safety"] },
  { href: "/savings-goal-calculator", title: "저축·비상금 프로젝트", description: "목표 기간과 저축액을 정하고 얼마나 모았는지 기록해요.", stages: ["prepare", "live"], concerns: ["money"] },
  { href: "/tax-prep-tracker", title: "연중 택스 리턴 기록", description: "소득·지출과 증빙 상태를 매달 조금씩 기록해 EOFY 준비를 쌓아가요.", stages: ["live"], concerns: ["money", "admin"] },
  { href: "/tax-return-guide", title: "택스 리턴 제출 준비", description: "EOFY 소득자료와 공제 증빙, 신고 일정과 직접 신고 범위를 확인해요.", stages: ["live", "depart"], concerns: ["money", "admin"] },
  { href: "/life-admin-reminder", title: "만료일·갱신 일정", description: "비자, 여권, 렌트, Rego와 보험 날짜를 적어둬요.", stages: ["arrive", "live", "depart"], concerns: ["admin", "safety"] },
  { href: "/help-directory", title: "호주 생활 도움 연락처", description: "응급전화부터 의료, 통역, 직장 문제와 사기 신고처까지 찾아봐요.", stages: ["prepare", "arrive", "live", "depart"], concerns: ["safety"] },
  { href: "/moving-checklist", title: "이사·퇴거 준비", description: "퇴거 통지와 공과금, 주소 변경, 보증금을 빠짐없이 챙겨요.", stages: ["live", "depart"], concerns: ["home", "admin"] },
  { href: "/leaving-australia-guide", title: "귀국 준비·Super DASP", description: "퇴사와 렌트 정리부터 출국 후 Super 신청까지 순서대로 알아봐요.", stages: ["depart"], concerns: ["admin", "work", "home", "money", "safety"] },
  { href: "/service-quote-comparator", title: "생활 서비스 견적 비교", description: "가격과 함께 ABN, 면허, 보증, 작업 범위도 비교해요.", stages: ["live"], concerns: ["home", "safety"] },
  { href: "/used-car-comparison", title: "중고차 구매처·체크리스트", description: "대표 매물 사이트에서 후보를 찾고 연락·검사·PPSR 순서를 확인해요.", stages: ["arrive", "live"], concerns: ["home", "money", "safety"] },
];

const stagePriority: Record<StageId, string[]> = {
  prepare: ["/visa-preparation-guide", "/arrival-checklist", "/career-pathways", "/cost-of-living-calculator", "/public-transport-guide", "/resume-builder", "/minimum-wage-guide", "/salary-calculator", "/help-directory"],
  arrive: ["/arrival-checklist", "/english-phrase-cards", "/property-inspection-checklist", "/public-transport-guide", "/resume-builder", "/job-application-tracker", "/help-directory", "/minimum-wage-guide", "/life-admin-reminder", "/cost-of-living-calculator", "/used-car-comparison", "/salary-calculator", "/career-pathways"],
  live: ["/tax-prep-tracker", "/job-application-tracker", "/cost-of-living-calculator", "/savings-goal-calculator", "/life-admin-reminder", "/minimum-wage-guide", "/service-quote-comparator", "/used-car-comparison", "/tax-return-guide", "/moving-checklist", "/salary-calculator", "/career-pathways", "/resume-builder", "/help-directory"],
  depart: ["/leaving-australia-guide", "/tax-return-guide", "/moving-checklist", "/life-admin-reminder"],
};

export function PersonalRouteFinder() {
  const [stage, setStage] = useState<StageId>("prepare");
  const [concern, setConcern] = useState<ConcernId>("admin");
  const [plan, setPlan] = useState<SavedPlan | null>(null);
  const [actionMessage, setActionMessage] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [taxSeason, setTaxSeason] = useState(false);
  const [planStatus, setPlanStatus] = useState<"missing" | "saved" | "failed" | "blocked">("missing");
  const [planRaw, setPlanRaw] = useState<string | null>(null);
  const [preferenceIssue, setPreferenceIssue] = useState("");
  const [preferenceRaw, setPreferenceRaw] = useState<string | null>(null);
  const [viewSaved, setViewSaved] = useState(false);
  const [shareFallback, setShareFallback] = useState("");
  const [calendarFallback, setCalendarFallback] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shared = parseRoutePreference(JSON.stringify({ stage: params.get("stage"), concern: params.get("concern") }));
    const preferences = readLocalRecord(storageKey, parseRoutePreference);
    const saved = readLocalRecord(planStorageKey, parsePersonalPlan);
    if (preferences.status === "invalid" || preferences.status === "unavailable") { setPreferenceIssue("이전 선택을 확인하지 못했습니다. 원문은 보존하며 화면에서 고른 내용만 사용합니다."); setPreferenceRaw(preferences.raw); }
    if (saved.status === "valid") { setPlan(saved.value); setPlanStatus("saved"); }
    else if (saved.status !== "missing") { setPlanStatus("blocked"); setPlanRaw(saved.raw); setActionMessage("기존 계획을 읽거나 검증하지 못했습니다. 원문을 백업한 뒤 명시적으로 교체할 수 있습니다."); }
    if (params.get("plan") === "saved" && saved.status === "valid") { setStage(saved.value.stage); setConcern(saved.value.concern); setViewSaved(true); }
    else if (shared) { setStage(shared.stage); setConcern(shared.concern); setActionMessage("공유받은 추천 경로를 열었어요. 저장하기 전까지 기존 계획은 그대로 남아 있어요."); }
    else if (preferences.status === "valid") { setStage(preferences.value.stage); setConcern(preferences.value.concern); }
    const sydneyMonth = Number(new Intl.DateTimeFormat("en-AU", { month: "numeric", timeZone: "Australia/Sydney" }).format(new Date()));
    setTaxSeason(sydneyMonth >= 7 && sydneyMonth <= 10);
    setLoaded(true);
  }, []);

  const savePreference = (nextStage: StageId, nextConcern: ConcernId, replaceInvalid = false) => {
    const existing = readLocalRecord(storageKey, parseRoutePreference);
    if ((existing.status === "invalid" || existing.status === "unavailable") && !replaceInvalid) { setPreferenceIssue("화면의 선택만 바뀌었습니다. 이전 선택 원문을 보호해 저장하지 않았습니다."); setPreferenceRaw(existing.raw); return; }
    try { localStorage.setItem(storageKey, JSON.stringify({ stage: nextStage, concern: nextConcern })); setPreferenceIssue(""); setPreferenceRaw(null); }
    catch { setPreferenceIssue("화면의 선택은 유지되지만 기기에는 저장되지 않았습니다."); }
  };
  const chooseStage = (value: StageId) => { setStage(value); setViewSaved(false); savePreference(value, concern); };
  const chooseConcern = (value: ConcernId) => { setConcern(value); setViewSaved(false); savePreference(stage, value); };

  const recommendations = useMemo(() => tools.map((tool, index) => ({
    ...tool,
    index,
    concernRank: tool.concerns.includes(concern) ? 0 : 1,
    stageRank: taxSeason && stage === "live" && tool.href === "/tax-return-guide" ? -1 : stagePriority[stage].indexOf(tool.href) >= 0 ? stagePriority[stage].indexOf(tool.href) : 99,
  })).filter((tool) => tool.stages.includes(stage)).sort((a, b) => a.concernRank - b.concernRank || a.stageRank - b.stageRank || a.index - b.index).slice(0, 3), [stage, concern, taxSeason]);

  const stageLabel = stages.find((item) => item.id === stage)?.label;
  const concernLabel = concerns.find((item) => item.id === concern)?.label;
  const currentSteps = recommendations.map(({ href, title }) => ({ href, title }));
  const matchesCurrentPlan = Boolean(plan && plan.stage === stage && plan.concern === concern && plan.steps.map((step) => step.href).join("|") === currentSteps.map((step) => step.href).join("|"));
  const showPlan = Boolean(plan && (viewSaved || matchesCurrentPlan));
  const completedCount = showPlan && plan ? plan.completed.length : 0;
  const displayedTools = showPlan && plan ? plan.steps.map(step => ({ ...step, description: tools.find(tool => tool.href === step.href)?.description ?? "저장했던 단계입니다." })) : recommendations;
  const displayedStageLabel = showPlan && plan ? plan.stageLabel : stageLabel;
  const displayedConcernLabel = showPlan && plan ? plan.concernLabel : concernLabel;

  const persistPlan = (next: SavedPlan, replaceInvalid = false) => {
    const existing = readLocalRecord(planStorageKey, parsePersonalPlan);
    setPlan(next); setViewSaved(true);
    if ((existing.status === "invalid" || existing.status === "unavailable") && !replaceInvalid) {
      setPlanStatus("blocked"); setPlanRaw(existing.raw); setActionMessage("현재 계획은 화면에만 있습니다. 기존 계획 원문은 교체하지 않았습니다."); return false;
    }
    try { localStorage.setItem(planStorageKey, JSON.stringify(next)); }
    catch { setPlanStatus("failed"); setActionMessage("현재 계획은 화면에 남아 있지만 기기에 저장되지 않았습니다. 백업하거나 다시 저장하세요."); return false; }
    setPlanStatus("saved"); setPlanRaw(null); setActionMessage("계획을 기기에 저장했습니다.");
    window.dispatchEvent(new Event(LOCAL_RECORD_UPDATED_EVENT));
    return true;
  };
  const saveCurrentPlan = () => {
    if (!loaded || !stageLabel || !concernLabel) return;
    if (plan && !window.confirm("현재 계획의 완료 표시 " + plan.completed.length + "개를 포함한 " + plan.steps.length + "단계를 현재 추천으로 교체할까요? 취소하면 기존 계획이 유지됩니다.")) return;
    const blocked = planStatus === "blocked";
    if (blocked && !window.confirm("기존 계획을 확인하지 못했습니다. 필요한 원문을 백업한 뒤 현재 추천으로 교체할까요?")) return;
    const next = { stage, concern, stageLabel, concernLabel, steps: currentSteps, completed: [], savedAt: new Date().toISOString() };
    if (persistPlan(next, blocked)) trackRoutePlanAction(routePlanActions.save, stage, concern);
  };
  const toggleCompleted = (href: string) => {
    if (!plan || !plan.steps.some(step => step.href === href)) return;
    const wasCompleted = plan.completed.includes(href);
    persistPlan({ ...plan, completed: wasCompleted ? plan.completed.filter(item => item !== href) : [...plan.completed, href] });
    trackRoutePlanAction(wasCompleted ? routePlanActions.markIncomplete : routePlanActions.markComplete, plan.stage, plan.concern);
  };

  const shareRecommendations = async () => {
    trackRoutePlanAction(routePlanActions.share, stage, concern);
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
        setShareFallback(url.toString());
        setActionMessage("아래 생성된 추천 링크를 직접 선택해 복사하세요.");
      }
    }
  };

  const downloadReminder = () => {
    if (!showPlan || !plan) return;
    trackRoutePlanAction(routePlanActions.reminder, plan.stage, plan.concern);
    let contents = "", url: string | undefined;
    try {
      const calendar = personalPlanCalendar(plan); contents = calendar.contents;
      url = URL.createObjectURL(new Blob([contents], { type: "text/calendar;charset=utf-8" }));
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = "hoju-compass-7-day-plan-reminder.ics"; anchor.click();
      setCalendarFallback(""); setActionMessage(calendar.date + " 점검 파일 다운로드를 요청했습니다. 달력 앱에서 가져온 뒤 날짜와 알림을 확인하세요. 현재 계획의 사본이며 이후 변경은 자동 반영되지 않습니다. 법정 기한 확인을 대신하지 않습니다.");
    } catch { setCalendarFallback(contents); setActionMessage("파일을 다운로드하지 못했습니다. 아래 내용을 .ics 파일로 보관하거나 달력 앱에 직접 입력하세요."); }
    finally { if (url) URL.revokeObjectURL(url); }
  };

  return <section id="route-finder" className="scroll-mt-20 border-b border-border bg-white py-16 sm:py-24" aria-labelledby="route-finder-heading"><Container>
    <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
      <div>
        <p className="text-sm font-semibold text-gold-ink">내 상황에 맞춰보기</p>
        <h2 id="route-finder-heading" className="mt-2 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">지금 단계와 고민을<br/>하나씩 골라보세요.</h2>
        <p className="mt-4 max-w-xl text-base leading-7 text-muted">모든 정보를 처음부터 읽지 않아도 괜찮아요. 지금 필요한 순서에 맞춰 먼저 볼 세 가지를 보여드려요.</p>

        <fieldset className="mt-8"><legend className="text-sm font-semibold text-navy"><span className="mr-2 text-gold-ink">01</span>지금 어느 단계인가요?</legend><div className="mt-3 grid gap-2 sm:grid-cols-2">{stages.map((item) => <label key={item.id} className={`cursor-pointer rounded-xl border has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold has-[:focus-visible]:ring-offset-2 px-4 py-3 transition ${stage === item.id ? "border-navy bg-surface" : "border-border bg-white hover:border-navy/30"}`}><input type="radio" name="route-stage" value={item.id} checked={stage === item.id} onChange={() => chooseStage(item.id)} className="sr-only"/><span className="block text-sm font-semibold text-navy">{item.label}</span><span className="mt-1 block text-xs text-muted">{item.detail}</span></label>)}</div></fieldset>

        <fieldset className="mt-7"><legend className="text-sm font-semibold text-navy"><span className="mr-2 text-gold-ink">02</span>요즘 가장 마음 쓰이는 일은 무엇인가요?</legend><div className="mt-3 flex flex-wrap gap-2">{concerns.map((item) => <label key={item.id} className={`inline-flex min-h-11 cursor-pointer items-center rounded-full border has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold has-[:focus-visible]:ring-offset-2 px-4 text-sm font-semibold transition ${concern === item.id ? "border-gold bg-gold/15 text-navy" : "border-border bg-white text-muted hover:border-navy/30 hover:text-navy"}`}><input type="radio" name="route-concern" value={item.id} checked={concern === item.id} onChange={() => chooseConcern(item.id)} className="sr-only"/>{item.label}</label>)}</div></fieldset>
        <p className="mt-4 text-xs leading-5 text-muted">선택과 계획은 각각 기기 저장 상태를 확인하세요. 이름이나 연락처는 받지 않아요.</p>
      </div>

      <div className="min-w-0 [overflow-wrap:anywhere] self-start rounded-3xl bg-navy p-6 text-white sm:p-8" aria-live="polite">
        <div className="flex items-end justify-between gap-4 border-b border-white/15 pb-5"><div><p className="text-xs font-semibold text-gold">이 순서로 시작해보세요</p><h3 className="mt-2 text-2xl font-semibold">{displayedStageLabel} · {displayedConcernLabel}</h3></div><span className="shrink-0 text-xs text-white/45">{showPlan && plan ? `${completedCount}/${plan.steps.length} 직접 표시` : "먼저 볼 3가지"}</span></div>
        <p className="mt-3 text-xs leading-5 text-white/65">{showPlan ? "저장한 단계입니다. 필요한 행동을 해 본 뒤 직접 완료 표시하세요." : "현재 선택의 추천입니다. 기존 계획과 구분해서 확인하세요."}</p><ol>{displayedTools.map((tool, index) => { const done = Boolean(showPlan && plan?.completed.includes(tool.href)); return <li key={tool.href} className="border-b border-white/15"><div className="grid sm:grid-cols-[1fr_auto] sm:items-center"><Link href={tool.href} onClick={() => trackRecommendation(tool.href.slice(1), showPlan && plan ? plan.stage : stage, showPlan && plan ? plan.concern : concern)} className="group grid gap-3 py-6 sm:grid-cols-[2rem_1fr_auto] sm:items-center"><span className="font-mono text-xs text-gold">0{index + 1}</span><span><strong className={`block text-lg text-white ${done ? "line-through decoration-gold/70" : ""}`}>{tool.title}</strong><span className="mt-1 block text-sm leading-6 text-white/60">{tool.description}</span></span><span className="text-xl text-gold transition group-hover:translate-x-1" aria-hidden="true">→</span></Link>{showPlan && <button type="button" aria-pressed={done} onClick={() => toggleCompleted(tool.href)} className={`mb-4 ml-8 inline-flex min-h-10 items-center justify-center border px-3 text-xs font-semibold sm:mb-0 sm:ml-4 ${done ? "border-gold bg-gold text-navy" : "border-white/25 text-white hover:border-gold"}`}>{done ? "완료됨" : "완료 표시"}</button>}</div></li>; })}</ol>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3"><button type="button" disabled={!loaded || showPlan} onClick={saveCurrentPlan} className="inline-flex min-h-11 items-center rounded-full bg-gold px-5 text-sm font-semibold text-navy disabled:cursor-default disabled:bg-white/10 disabled:text-white/55">{showPlan ? planStatus === "saved" ? "나의 계획에 저장됨" : "현재 화면의 계획 · 저장 확인 필요" : plan ? "현재 추천으로 계획 바꾸기" : "3단계 계획으로 저장"}</button><TrackedLink href="/tools" eventName="Home Navigation" properties={{ section: "route_finder", destination: "tools" }} className="inline-flex min-h-11 items-center text-sm font-semibold text-white">전체 도구 보기 →</TrackedLink></div>
        {plan && <div className="mt-3 flex flex-wrap gap-4"><button type="button" onClick={() => { trackRoutePlanAction(routePlanActions.viewSaved, plan.stage, plan.concern); setViewSaved(true); setStage(plan.stage); setConcern(plan.concern); }} className="min-h-11 text-sm underline">저장한 계획 보기</button><button type="button" onClick={() => { trackRoutePlanAction(routePlanActions.viewCurrent, stage, concern); setViewSaved(false); }} className="min-h-11 text-sm underline">현재 선택의 추천 보기</button><TrackedLink href="/my-compass" eventName="Home Navigation" properties={{ section: "route_finder", destination: "my_compass" }} className="min-h-11 text-sm underline">내 Compass에서 확인</TrackedLink></div>}
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2"><button type="button" onClick={shareRecommendations} className="inline-flex min-h-10 items-center text-sm font-semibold text-white/75 hover:text-white">추천 경로 공유 ↗</button>{showPlan && <button type="button" onClick={downloadReminder} className="inline-flex min-h-10 items-center text-sm font-semibold text-white/75 hover:text-white">7일 뒤 점검 알림 +</button>}</div>
        {preferenceIssue && <div className="mt-4 border border-amber-300 p-3 text-xs"><p role="status">{preferenceIssue}</p>{preferenceRaw !== null && <label className="mt-2 block">이전 선택 원문<textarea readOnly value={preferenceRaw} onFocus={event => event.target.select()} className="mt-1 min-h-20 w-full bg-white p-2 text-navy" /></label>}<button type="button" onClick={() => { if (window.confirm("현재 화면의 단계·고민 선택으로 이전 선택 기록을 교체할까요? 계획 기록은 바뀌지 않습니다.")) savePreference(stage, concern, true); }} className="min-h-11 underline">현재 선택 저장 다시 확인</button></div>}
        {(planStatus === "failed" || planStatus === "blocked") && <div className="mt-4 border border-amber-300 p-3 text-xs"><p>계획 저장 확인이 필요합니다. 화면의 계획과 기존 원문을 각각 보관할 수 있습니다.</p>{planRaw !== null && <label className="mt-2 block">기존 계획 원문 백업<textarea readOnly value={planRaw} onFocus={event => event.target.select()} className="mt-1 min-h-24 w-full bg-white p-2 text-navy" /></label>}{plan && <><label className="mt-2 block">현재 계획 JSON 백업<textarea readOnly value={JSON.stringify(plan, null, 2)} onFocus={event => event.target.select()} className="mt-1 min-h-24 w-full bg-white p-2 text-navy" /></label><button type="button" onClick={() => { if (planStatus === "blocked" && !window.confirm("원문 백업 후 현재 화면의 계획으로 교체할까요?")) return; persistPlan(plan, planStatus === "blocked"); }} className="min-h-11 underline">현재 계획 다시 저장</button></>}</div>}
        {shareFallback && <label className="mt-3 block text-xs">직접 복사할 추천 링크<input readOnly value={shareFallback} onFocus={event => event.target.select()} className="mt-1 min-h-11 w-full bg-white p-2 text-navy" /></label>}
        {calendarFallback && <label className="mt-3 block text-xs">계획 캘린더 파일 내용<textarea readOnly value={calendarFallback} onFocus={event => event.target.select()} className="mt-1 min-h-24 w-full bg-white p-2 text-navy" /></label>}
        {actionMessage && <p className="mt-3 text-xs leading-5 text-white/60" role="status" aria-live="polite">{actionMessage}</p>}
        {showPlan && plan && completedCount === plan.steps.length && <p className="mt-5 border-l-2 border-gold pl-3 text-sm leading-6 text-white/75">세 단계를 모두 마쳤어요. 다른 고민을 골라 새 계획을 만들 수도 있어요.</p>}
      </div>
    </div>
  </Container></section>;
}
