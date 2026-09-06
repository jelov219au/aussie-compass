"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ARTICLE_READING_UPDATED_EVENT, type ReadArticleRecord } from "@/lib/articleProgress";
import { LOCAL_RECORD_UPDATED_EVENT, recordNeedsReview, localRecordIssue } from "@/lib/localRecordState";
import { readCompassRecords, type DashboardItem } from "@/lib/compassRecords";
import { countUnknownCompassRecords, deriveMyCompassNextAction, readMyCompassActionRecords, type MyCompassActionCandidate, type MyCompassNextActionOutcome, type MyCompassRecordIssue } from "@/lib/myCompassNextAction";
import type { Bookmark } from "@/lib/bookmarks";
import { ResourceReadingProgress, type ResourceSummary } from "@/components/dashboard/ResourceReadingProgress";
export function MyCompassDashboard({ resourceArticles }: { resourceArticles: ResourceSummary[] }) {
  const [items, setItems] = useState<DashboardItem[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [readArticles, setReadArticles] = useState<ReadArticleRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [recordIssues, setRecordIssues] = useState<MyCompassRecordIssue[]>([]);
  const [actionCandidates, setActionCandidates] = useState<MyCompassActionCandidate[]>([]);
  const [unknownRecordCount, setUnknownRecordCount] = useState(0);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const refresh = useCallback(() => {
    const records = readCompassRecords();
    const actionRecords = readMyCompassActionRecords();
    const unknownRecords = countUnknownCompassRecords(localStorage);
    const issues: MyCompassRecordIssue[] = [
      ...records.items.filter(recordNeedsReview).map((item) => ({ toolId: item.toolId, title: item.title, href: item.href, detail: item.detail, status: item.status as "invalid" | "unavailable" })),
      ...(recordNeedsReview(records.bookmarks) ? [{ toolId: "bookmarks", title: "나중에 볼 페이지", href: "/data-transfer", detail: localRecordIssue(records.bookmarks), status: records.bookmarks.status as "invalid" | "unavailable" }] : []),
      ...(recordNeedsReview(records.reading) ? [{ toolId: "read-articles", title: "아래까지 본 자료 기록", href: "/resources", detail: localRecordIssue(records.reading), status: records.reading.status as "invalid" | "unavailable" }] : []),
      ...actionRecords.issues,
    ];
    const unavailable = unknownRecords.unavailable || issues.some((issue) => issue.status === "unavailable");
    setItems(records.items);
    setBookmarks(records.bookmarks.status === "valid" ? records.bookmarks.value : []);
    setReadArticles(records.reading.status === "valid" ? records.reading.value.filter(item => Date.parse(item.completedAt) <= Date.now()) : []);
    setRecordIssues(unavailable ? [{ toolId: "none", title: "현재 브라우저 저장소", href: "/data-transfer", detail: "기기 저장소를 읽지 못했습니다. 원문을 변경하지 않았으며 원래 도구와 백업 안내에서 다시 확인하세요.", status: "unavailable" }] : issues);
    setActionCandidates(actionRecords.candidates);
    setUnknownRecordCount(unknownRecords.count);
    setStorageUnavailable(unavailable);
    setLoaded(true);
  }, []);
  useEffect(() => {
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener(ARTICLE_READING_UPDATED_EVENT, refresh);
    window.addEventListener(LOCAL_RECORD_UPDATED_EVENT, refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener(ARTICLE_READING_UPDATED_EVENT, refresh);
      window.removeEventListener(LOCAL_RECORD_UPDATED_EVENT, refresh);
    };
  }, [refresh]);
  const active = useMemo(() => items.filter((item) => item.active), [items]);
  const suggestions = useMemo(() => items.filter((item) => !item.active && !recordNeedsReview(item)).slice(0, 4), [items]);
  const outcome = useMemo(() => deriveMyCompassNextAction({ sources: items, candidates: actionCandidates, issues: recordIssues, unknownRecordCount, storageUnavailable }), [items, actionCandidates, recordIssues, storageUnavailable, unknownRecordCount]);
  if (!loaded) return <div className="mt-10 min-h-48 animate-pulse bg-surface" aria-label="저장된 진행 상황 불러오는 중" />;

  const outcomeFields = Object.keys(outcome) as Array<keyof MyCompassNextActionOutcome>;
  const officialRoute = outcome.official_route === "none" ? null : outcome.official_route;
  const primaryHref = outcome.next_action === "repair_local_record" ? "/data-transfer" : outcome.next_action === "open_official_route_then_return" && officialRoute ? officialRoute.href : outcome.tool_return;
  const primaryLabel: Record<MyCompassNextActionOutcome["next_action"], string> = {
    open_start_selector: "무료 도구에서 시작점 고르기",
    review_in_tool: "원래 도구에서 상태 확인",
    open_official_route_then_return: officialRoute ? `${officialRoute.label} 열기` : "원래 도구에서 공식 경로 확인",
    wait_until_recheck: "도구에서 재확인 일정 보기",
    repair_local_record: "백업·복구 안내 열기",
    no_action_applicable: "도구에서 해당 없음 확인",
  };
  const heading = outcome.source_state === "empty" ? "처음 시작할 무료 도구를 고르세요." : outcome.next_action === "repair_local_record" ? "기록을 바꾸지 말고 먼저 복구 경로를 확인하세요." : outcome.due_state === "overdue" ? "재확인일이 지난 한 작업부터 확인하세요." : outcome.due_state === "due_today" ? "오늘 다시 확인할 한 작업이 있습니다." : "원래 도구에서 다음 상태를 확인하세요.";

  return <div className="mt-6 min-w-0 [overflow-wrap:anywhere]"><section className="border-2 border-navy bg-white p-4 shadow-sm sm:p-5" aria-labelledby="my-compass-next-action-heading" data-my-compass-next-action><p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">my_compass_next_action</p><h2 id="my-compass-next-action-heading" className="mt-1 text-lg font-semibold leading-6 text-navy">{heading}</h2><p className="mt-2 text-sm leading-6 text-muted">이어갈 작업 {active.length}개 · 저장 페이지 {bookmarks.length}개 · 본 자료 {readArticles.length}개{unknownRecordCount ? ` · 확인할 이전 기록 ${unknownRecordCount}개` : ""}</p><div className="mt-3 flex flex-wrap gap-3">{officialRoute && primaryHref === officialRoute.href ? <a href={primaryHref} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center bg-navy px-5 text-sm font-semibold text-white">{primaryLabel[outcome.next_action]} ↗</a> : <Link href={primaryHref} className="inline-flex min-h-12 items-center justify-center bg-navy px-5 text-sm font-semibold text-white">{primaryLabel[outcome.next_action]} →</Link>}{outcome.next_action === "repair_local_record" && outcome.tool_return !== "/data-transfer" ? <Link href={outcome.tool_return} className="inline-flex min-h-12 items-center justify-center border border-navy px-4 text-sm font-semibold text-navy">원래 도구 열기 →</Link> : null}{officialRoute && primaryHref === officialRoute.href ? <Link href={outcome.tool_return} className="inline-flex min-h-12 items-center justify-center border border-navy px-4 text-sm font-semibold text-navy">도구로 돌아가기 →</Link> : null}</div><p className="mt-3 text-xs leading-5 text-muted">이 화면의 0개는 현재 브라우저의 로컬 작업공간만 뜻합니다. 구매 이용권·복구 코드는 별도이며, 다른 브라우저·설치형 PWA·JSON 백업은 서로 다른 사본일 수 있습니다.</p><div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs font-semibold"><Link href="/data-transfer" className="inline-flex min-h-11 items-center text-navy underline decoration-gold underline-offset-4">백업·기기 이전</Link><Link href="/payment-help" className="inline-flex min-h-11 items-center text-navy underline decoration-gold underline-offset-4">구매 이용권 확인</Link><Link href="/install" className="inline-flex min-h-11 items-center text-navy underline decoration-gold underline-offset-4">브라우저·PWA 차이</Link></div><details className="mt-1 text-sm"><summary className="flex min-h-11 cursor-pointer items-center font-semibold text-navy">9개 판정 필드 보기</summary><dl className="grid gap-2 sm:grid-cols-3">{outcomeFields.map((field) => <div key={field} className="border border-border bg-surface p-3"><dt className="font-mono text-xs text-muted">{field}</dt><dd className="mt-1 break-words text-sm font-semibold text-navy">{field === "official_route" && officialRoute ? `${officialRoute.label} · ${officialRoute.href} · checked ${officialRoute.checked_on}` : String(outcome[field])}</dd></div>)}</dl></details></section><section className="mt-6 grid gap-4 border-y border-navy/20 py-5 sm:grid-cols-[1fr_auto] sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-ink">이 기기에 남아 있는 기록</p><h2 className="mt-2 text-2xl font-semibold text-navy">전체 로컬 기록 요약</h2><p className="mt-2 text-sm leading-6 text-muted">이름이나 연락처, 급여와 예산 금액은 이 요약 화면에 표시하지 않아요. 현재 브라우저에 저장된 진행 상태만 불러옵니다.</p></div><div className="flex flex-wrap items-center gap-5"><Link href="/data-transfer" className="inline-flex min-h-11 items-center border-b-2 border-navy text-sm font-semibold text-navy hover:border-gold">백업·기기 이전</Link><button type="button" onClick={refresh} className="min-h-11 border-b-2 border-gold text-sm font-semibold text-navy">진행 상황 새로고침</button></div></section>

    {(recordIssues.length > 0 || unknownRecordCount > 0) && <section className="mt-8 rounded-xl border border-amber-400 bg-amber-50 p-5" aria-labelledby="compass-record-issues"><h2 id="compass-record-issues" className="font-semibold text-navy">기록 확인 필요</h2><p className="mt-2 text-sm leading-6">이 화면은 기록을 읽기만 합니다. 확인하지 못한 원문과 알 수 없는 이전 기록을 변경·삭제하지 않았습니다. 삭제나 초기화 없이 원래 도구 또는 백업 복구 안내에서 확인하세요.</p><ul className="mt-3 grid gap-3">{recordIssues.map(item => <li key={`${item.toolId}-${item.title}`} className="border-t border-amber-400/60 pt-2"><Link href={item.href} className="inline-flex min-h-11 items-center font-semibold underline">{item.title} 확인 →</Link><details className="text-sm text-muted"><summary className="flex min-h-11 cursor-pointer items-center font-semibold text-navy">문제 내용 보기</summary><p className="pb-2">{item.detail}</p></details></li>)}{unknownRecordCount > 0 ? <li className="border-t border-amber-400/60 pt-2"><Link href="/data-transfer" className="inline-flex min-h-11 items-center font-semibold underline">알 수 없는 이전 기록 {unknownRecordCount}개 복구 안내 →</Link><p className="text-sm text-muted">키 이름과 원문 내용은 이 화면에 표시하지 않으며 그대로 보존했습니다.</p></li> : null}</ul></section>}
    {active.length ? <section className="mt-10" aria-labelledby="active-projects"><div className="flex items-end justify-between border-b border-navy/20 pb-4"><h2 id="active-projects" className="text-2xl font-semibold text-navy">이어서 할 일</h2><span className="font-mono text-xs text-muted">{String(active.length).padStart(2,"0")}</span></div><ol>{active.map((item,index)=><li key={item.href} className="border-b border-border"><Link href={item.href} className="group grid gap-4 py-6 sm:grid-cols-[3rem_minmax(12rem,0.8fr)_1.2fr_auto] sm:items-center sm:px-3"><span className="font-mono text-xs text-gold-ink">{String(index+1).padStart(2,"0")}</span><span><span className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">{item.eyebrow}</span><strong className="mt-1 block text-lg text-navy">{item.title}</strong></span><span><span className="block text-sm leading-6 text-muted">{item.detail}</span>{typeof item.progress === "number" && <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-surface"><span className="block h-full bg-gold" style={{width:`${item.progress}%`}} /></span>}</span><span className="text-sm font-semibold text-navy">{item.action} →</span></Link></li>)}</ol></section> : <section className="mt-10 rounded-2xl bg-navy p-7 text-white sm:p-9"><p className="text-sm font-semibold text-gold">처음이라면</p><h2 className="mt-2 text-2xl font-semibold">지금 가장 필요한 한 가지만 골라보세요.</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">기기 저장이 가능한 브라우저에서 저장을 확인하면 다음 방문에도 이어볼 수 있어요. 계정을 만들거나 개인정보를 제출할 필요는 없어요.</p><Link href="/tools" className="mt-5 inline-flex min-h-11 items-center bg-gold px-4 text-sm font-semibold text-navy">무료 도구에서 시작점 고르기 →</Link></section>}

    <ResourceReadingProgress articles={resourceArticles} readArticles={readArticles} />
    {suggestions.length > 0 && <section className="mt-12" aria-labelledby="suggested-projects"><h2 id="suggested-projects" className="text-2xl font-semibold text-navy">다음에 시작할 수 있는 것</h2><ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{suggestions.map((item)=><li key={item.href}><Link href={item.href} className="flex h-full flex-col border-t-2 border-navy bg-white px-1 py-5"><span className="text-xs font-semibold text-gold-ink">{item.eyebrow}</span><strong className="mt-2 text-lg text-navy">{item.title}</strong><span className="mt-2 flex-1 text-sm leading-6 text-muted">{item.detail}</span><span className="mt-5 text-sm font-semibold text-navy">{item.action} →</span></Link></li>)}</ul></section>}
    {readArticles.length > 0 && <section className="mt-12 border-t border-navy/20 pt-7" aria-labelledby="read-articles"><div className="flex items-end justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-ink">전에 살펴본 글</p><h2 id="read-articles" className="mt-1 text-2xl font-semibold text-navy">아래까지 본 실용 자료</h2></div><span className="font-mono text-xs text-muted">{String(readArticles.length).padStart(2,"0")}</span></div><ul className="mt-4 grid gap-x-8 md:grid-cols-2">{readArticles.map((item)=><li key={item.href} className="border-b border-border"><Link href={item.href} className="group flex min-h-20 items-center justify-between gap-4 py-4"><span><strong className="block text-navy">{item.title}</strong><span className="mt-1 block text-xs text-muted">{new Date(item.completedAt).toLocaleDateString("ko-KR")} 아래까지 봄</span></span><span className="text-xl text-navy transition group-hover:translate-x-1">→</span></Link></li>)}</ul></section>}
    {bookmarks.length > 0 && <section className="mt-12 border-t border-navy/20 pt-7" aria-labelledby="saved-pages"><div className="flex items-end justify-between"><h2 id="saved-pages" className="text-2xl font-semibold text-navy">나중에 볼 페이지</h2><span className="font-mono text-xs text-muted">{String(bookmarks.length).padStart(2,"0")}</span></div><ul className="mt-4 grid gap-x-8 md:grid-cols-2">{bookmarks.map((item)=><li key={item.href} className="border-b border-border"><Link href={item.href} className="group flex min-h-20 items-center justify-between gap-4 py-4"><span><strong className="block text-navy">{item.title}</strong><span className="mt-1 block text-xs text-muted">{new Date(item.savedAt).toLocaleDateString("ko-KR")} 저장</span></span><span className="text-xl text-navy transition group-hover:translate-x-1">→</span></Link></li>)}</ul></section>}
  </div>;
}
