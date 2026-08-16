"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ARTICLE_READING_UPDATED_EVENT, readArticleHistory, type ReadArticleRecord } from "@/lib/articleProgress";

type DashboardItem = { href: string; eyebrow: string; title: string; detail: string; progress?: number; active: boolean; action: string };
type Bookmark = { href: string; title: string; savedAt: string };

function readJson(key: string) {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : null; }
  catch { return null; }
}

function projectItem(key: string, total: number, href: string, eyebrow: string, title: string): DashboardItem {
  const data = readJson(key);
  const completed = Array.isArray(data?.checked) ? data.checked.length : 0;
  const progress = Math.min(100, Math.round(completed / total * 100));
  const date = typeof data?.targetDate === "string" && data.targetDate ? ` · 목표일 ${new Date(`${data.targetDate}T00:00:00`).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}` : "";
  return { href, eyebrow, title, detail: completed ? `${completed}/${total}개 완료${date}` : "아직 시작하지 않았습니다.", progress, active: Boolean(data), action: data ? "계속하기" : "시작하기" };
}

function buildItems(): DashboardItem[] {
  const items = [
    projectItem("visa-preparation-project", 12, "/visa-preparation-guide", "출국 전", "비자 신청 준비"),
    projectItem("arrival-first-30-days", 16, "/arrival-checklist", "호주 도착", "첫 30일 정착"),
    projectItem("house-hunt-project", 12, "/property-inspection-checklist", "주거", "집 구하기 프로젝트"),
    projectItem("moving-project", 23, "/moving-checklist", "주거", "이사 준비"),
    projectItem("leaving-australia-project", 20, "/leaving-australia-guide", "귀국", "호주 생활 마무리"),
  ];

  const personalPlan = readJson("hoju-compass-personal-plan-v1");
  if (personalPlan && Array.isArray(personalPlan.steps) && personalPlan.steps.length > 0) {
    const completedHrefs = Array.isArray(personalPlan.completed) ? personalPlan.completed.filter((href: string) => personalPlan.steps.some((step: { href?: string }) => step.href === href)) : [];
    const completed = completedHrefs.length;
    const nextStep = personalPlan.steps.find((step: { href?: string }) => !completedHrefs.includes(step.href));
    items.unshift({ href: "/#route-finder", eyebrow: "맞춤 경로", title: `${personalPlan.stageLabel || "나의"} 3단계 계획`, detail: completed === personalPlan.steps.length ? "추천 단계를 모두 완료했습니다." : `${completed}/${personalPlan.steps.length}개 완료${nextStep?.title ? ` · 다음: ${nextStep.title}` : ""}`, progress: Math.round(completed / personalPlan.steps.length * 100), active: true, action: completed === personalPlan.steps.length ? "새 계획 만들기" : "계속하기" });
  }

  const tax = readJson("aussie-compass-tax-return-checklist-v1");
  const taxCount = Array.isArray(tax) ? tax.length : 0;
  items.push({ href: "/tax-return-guide", eyebrow: "EOFY", title: "택스 리턴 준비", detail: taxCount ? `${taxCount}/12개 완료` : "아직 시작하지 않았습니다.", progress: Math.round(taxCount / 12 * 100), active: Boolean(tax), action: tax ? "계속하기" : "시작하기" });

  const jobs = readJson("aussie-compass-job-tracker-v1");
  const jobCount = Array.isArray(jobs) ? jobs.length : 0;
  const openJobs = Array.isArray(jobs) ? jobs.filter((item) => item?.status !== "closed").length : 0;
  items.push({ href: "/job-application-tracker", eyebrow: "구직", title: "지원 현황", detail: jobCount ? `전체 ${jobCount}건 · 진행 중 ${openJobs}건` : "지원할 공고를 한곳에서 관리하세요.", active: Boolean(jobs), action: jobs ? "현황 보기" : "공고 추가" });

  const savings = readJson("aussie-compass-savings-goal-v1");
  const savingProgress = savings?.target > 0 ? Math.min(100, Math.round((Number(savings.starting) || 0) / Number(savings.target) * 100)) : 0;
  items.push({ href: "/savings-goal-calculator", eyebrow: "돈 관리", title: "저축 목표", detail: savings ? `${savingProgress}% 진행 · 저축 기록 ${Array.isArray(savings.checkIns) ? savings.checkIns.length : 0}회` : "목표와 정기 저축액을 정해 보세요.", progress: savingProgress, active: Boolean(savings), action: savings ? "저축 기록" : "목표 만들기" });

  const resume = readJson("aussie-compass-resume-v1");
  const resumeFields = resume ? [resume.name, resume.title, resume.phone, resume.email, resume.summary, resume.skills, resume.experiences?.[0]?.role].filter(Boolean).length : 0;
  items.push({ href: "/resume-builder", eyebrow: "구직", title: "영문 이력서", detail: resume ? `기본 작성 ${resumeFields}/7개 · 개인정보는 여기에 표시하지 않습니다.` : "호주식 영문 이력서 초안을 만드세요.", progress: Math.round(resumeFields / 7 * 100), active: Boolean(resume), action: resume ? "초안 열기" : "작성 시작" });

  const salary = readJson("aussie-compass-salary-calculation");
  items.push({ href: "/salary-calculator", eyebrow: "급여", title: "저장한 급여 계산", detail: salary ? "저장된 계산이 있습니다. 금액은 대시보드에 표시하지 않습니다." : "시급·연봉의 세후 금액과 Super를 확인하세요.", active: Boolean(salary), action: salary ? "계산 불러오기" : "급여 계산" });

  const budget = readJson("aussie-compass-living-budget-v1");
  items.push({ href: "/cost-of-living-calculator", eyebrow: "생활비", title: "생활비 예산", detail: budget ? "저장된 예산이 있습니다. 상세 금액은 계산기에서 확인하세요." : "주·월·연 지출과 소득을 비교하세요.", active: Boolean(budget), action: budget ? "예산 열기" : "예산 만들기" });
  const reminders = readJson("aussie-compass-life-reminders-v1");
  const reminderCount = Array.isArray(reminders) ? reminders.length : 0;
  items.push({ href: "/life-admin-reminder", eyebrow: "생활 관리", title: "만료일·갱신 일정", detail: reminderCount ? `${reminderCount}개의 일정을 저장했습니다.` : "비자, 렌트, Rego와 보험 갱신일을 관리하세요.", active: reminderCount > 0, action: reminderCount ? "일정 보기" : "일정 추가" });
  return items;
}

export function MyCompassDashboard() {
  const [items, setItems] = useState<DashboardItem[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [readArticles, setReadArticles] = useState<ReadArticleRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const refresh = useCallback(() => {
    setItems(buildItems());
    const savedBookmarks = readJson("aussie-compass-bookmarks-v1");
    setBookmarks(Array.isArray(savedBookmarks) ? savedBookmarks : []);
    setReadArticles(readArticleHistory());
    setLoaded(true);
  }, []);
  useEffect(() => {
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener(ARTICLE_READING_UPDATED_EVENT, refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener(ARTICLE_READING_UPDATED_EVENT, refresh);
    };
  }, [refresh]);
  const active = useMemo(() => items.filter((item) => item.active), [items]);
  const suggestions = useMemo(() => items.filter((item) => !item.active).slice(0, 4), [items]);
  if (!loaded) return <div className="mt-10 min-h-48 animate-pulse bg-surface" aria-label="저장된 진행 상황 불러오는 중" />;

  return <div className="mt-10"><section className="grid gap-6 border-y border-navy/20 py-7 sm:grid-cols-[1fr_auto] sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Saved on this device</p><h2 className="mt-2 text-2xl font-semibold text-navy">현재 기기에 {active.length + bookmarks.length + readArticles.length}개의 기록이 있습니다.</h2><p className="mt-2 text-sm leading-6 text-muted">이 화면은 브라우저에 이미 저장된 진행 상태만 읽으며, 이름·연락처·급여·예산 금액은 요약 화면에 표시하지 않습니다.</p></div><div className="flex flex-wrap items-center gap-5"><Link href="/data-transfer" className="inline-flex min-h-11 items-center border-b-2 border-navy text-sm font-semibold text-navy hover:border-gold">백업·기기 이전</Link><button type="button" onClick={refresh} className="min-h-11 border-b-2 border-gold text-sm font-semibold text-navy">진행 상황 새로고침</button></div></section>

    {active.length ? <section className="mt-10" aria-labelledby="active-projects"><div className="flex items-end justify-between border-b border-navy/20 pb-4"><h2 id="active-projects" className="text-2xl font-semibold text-navy">이어서 할 일</h2><span className="font-mono text-xs text-muted">{String(active.length).padStart(2,"0")}</span></div><ol>{active.map((item,index)=><li key={item.href} className="border-b border-border"><Link href={item.href} className="group grid gap-4 py-6 sm:grid-cols-[3rem_minmax(12rem,0.8fr)_1.2fr_auto] sm:items-center sm:px-3"><span className="font-mono text-xs text-gold">{String(index+1).padStart(2,"0")}</span><span><span className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">{item.eyebrow}</span><strong className="mt-1 block text-lg text-navy">{item.title}</strong></span><span><span className="block text-sm leading-6 text-muted">{item.detail}</span>{typeof item.progress === "number" && <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-surface"><span className="block h-full bg-gold" style={{width:`${item.progress}%`}} /></span>}</span><span className="text-sm font-semibold text-navy">{item.action} →</span></Link></li>)}</ol></section> : <section className="mt-10 rounded-2xl bg-navy p-7 text-white sm:p-9"><p className="text-sm font-semibold text-gold">처음이라면</p><h2 className="mt-2 text-2xl font-semibold">한 가지 프로젝트만 시작해 보세요.</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">진행 상태를 저장하면 다음 방문부터 이 화면에서 바로 이어갈 수 있습니다. 계정이나 개인정보 제출은 필요하지 않습니다.</p><Link href="/arrival-checklist" className="mt-5 inline-flex min-h-11 items-center bg-gold px-4 text-sm font-semibold text-navy">첫 30일 체크리스트 시작 →</Link></section>}

    {suggestions.length > 0 && <section className="mt-12" aria-labelledby="suggested-projects"><h2 id="suggested-projects" className="text-2xl font-semibold text-navy">다음에 시작할 수 있는 것</h2><ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{suggestions.map((item)=><li key={item.href}><Link href={item.href} className="flex h-full flex-col border-t-2 border-navy bg-white px-1 py-5"><span className="text-xs font-semibold text-gold">{item.eyebrow}</span><strong className="mt-2 text-lg text-navy">{item.title}</strong><span className="mt-2 flex-1 text-sm leading-6 text-muted">{item.detail}</span><span className="mt-5 text-sm font-semibold text-navy">{item.action} →</span></Link></li>)}</ul></section>}
    {readArticles.length > 0 && <section className="mt-12 border-t border-navy/20 pt-7" aria-labelledby="read-articles"><div className="flex items-end justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">Reading history</p><h2 id="read-articles" className="mt-1 text-2xl font-semibold text-navy">읽은 실용 자료</h2></div><span className="font-mono text-xs text-muted">{String(readArticles.length).padStart(2,"0")}</span></div><ul className="mt-4 grid gap-x-8 md:grid-cols-2">{readArticles.map((item)=><li key={item.href} className="border-b border-border"><Link href={item.href} className="group flex min-h-20 items-center justify-between gap-4 py-4"><span><strong className="block text-navy">{item.title}</strong><span className="mt-1 block text-xs text-muted">{new Date(item.completedAt).toLocaleDateString("ko-KR")} 읽음 완료</span></span><span className="text-xl text-navy transition group-hover:translate-x-1">→</span></Link></li>)}</ul></section>}
    {bookmarks.length > 0 && <section className="mt-12 border-t border-navy/20 pt-7" aria-labelledby="saved-pages"><div className="flex items-end justify-between"><h2 id="saved-pages" className="text-2xl font-semibold text-navy">나중에 볼 페이지</h2><span className="font-mono text-xs text-muted">{String(bookmarks.length).padStart(2,"0")}</span></div><ul className="mt-4 grid gap-x-8 md:grid-cols-2">{bookmarks.map((item)=><li key={item.href} className="border-b border-border"><Link href={item.href} className="group flex min-h-20 items-center justify-between gap-4 py-4"><span><strong className="block text-navy">{item.title}</strong><span className="mt-1 block text-xs text-muted">{new Date(item.savedAt).toLocaleDateString("ko-KR")} 저장</span></span><span className="text-xl text-navy transition group-hover:translate-x-1">→</span></Link></li>)}</ul></section>}
  </div>;
}
