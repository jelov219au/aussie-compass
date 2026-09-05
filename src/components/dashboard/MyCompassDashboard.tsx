"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ARTICLE_READING_UPDATED_EVENT, type ReadArticleRecord } from "@/lib/articleProgress";
import { LOCAL_RECORD_UPDATED_EVENT, recordNeedsReview, localRecordIssue } from "@/lib/localRecordState";
import { readCompassRecords, type DashboardItem } from "@/lib/compassRecords";
import type { Bookmark } from "@/lib/bookmarks";
import { ResourceReadingProgress, type ResourceSummary } from "@/components/dashboard/ResourceReadingProgress";
export function MyCompassDashboard({ resourceArticles }: { resourceArticles: ResourceSummary[] }) {
  const [items, setItems] = useState<DashboardItem[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [readArticles, setReadArticles] = useState<ReadArticleRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [recordIssues, setRecordIssues] = useState<Array<{ title: string; href: string; detail: string }>>([]);
  const refresh = useCallback(() => {
    const records = readCompassRecords();
    setItems(records.items);
    setBookmarks(records.bookmarks.status === "valid" ? records.bookmarks.value : []);
    setReadArticles(records.reading.status === "valid" ? records.reading.value.filter(item => Date.parse(item.completedAt) <= Date.now()) : []);
    setRecordIssues([
      ...records.items.filter(recordNeedsReview),
      ...(recordNeedsReview(records.bookmarks) ? [{ title: "나중에 볼 페이지", href: "/data-transfer", detail: localRecordIssue(records.bookmarks) }] : []),
      ...(recordNeedsReview(records.reading) ? [{ title: "아래까지 본 자료 기록", href: "/resources", detail: localRecordIssue(records.reading) }] : []),
    ]);
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
  if (!loaded) return <div className="mt-10 min-h-48 animate-pulse bg-surface" aria-label="저장된 진행 상황 불러오는 중" />;

  return <div className="mt-10 min-w-0 [overflow-wrap:anywhere]"><section className="grid gap-6 border-y border-navy/20 py-7 sm:grid-cols-[1fr_auto] sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">이 기기에 남아 있는 기록</p><h2 className="mt-2 text-2xl font-semibold text-navy">이어갈 작업 {active.length}개 · 저장 페이지 {bookmarks.length}개 · 본 자료 {readArticles.length}개</h2><p className="mt-2 text-sm leading-6 text-muted">이름이나 연락처, 급여와 예산 금액은 이 요약 화면에 표시하지 않아요. 현재 브라우저에 저장된 진행 상태만 불러옵니다.</p></div><div className="flex flex-wrap items-center gap-5"><Link href="/data-transfer" className="inline-flex min-h-11 items-center border-b-2 border-navy text-sm font-semibold text-navy hover:border-gold">백업·기기 이전</Link><button type="button" onClick={refresh} className="min-h-11 border-b-2 border-gold text-sm font-semibold text-navy">진행 상황 새로고침</button></div></section>

    {recordIssues.length > 0 && <section className="mt-8 rounded-xl border border-amber-400 bg-amber-50 p-5" aria-labelledby="compass-record-issues"><h2 id="compass-record-issues" className="font-semibold text-navy">기록 확인 필요</h2><p className="mt-2 text-sm">이 화면은 기록을 읽기만 합니다. 확인하지 못한 원문을 변경하지 않았으며, 아래의 다른 정상 작업은 계속 이용할 수 있습니다.</p><ul className="mt-3 grid gap-3">{recordIssues.map(item => <li key={item.title}><Link href={item.href} className="inline-flex min-h-11 items-center font-semibold underline">{item.title} 확인 →</Link><p className="text-sm text-muted">{item.detail}</p></li>)}</ul></section>}
    {active.length ? <section className="mt-10" aria-labelledby="active-projects"><div className="flex items-end justify-between border-b border-navy/20 pb-4"><h2 id="active-projects" className="text-2xl font-semibold text-navy">이어서 할 일</h2><span className="font-mono text-xs text-muted">{String(active.length).padStart(2,"0")}</span></div><ol>{active.map((item,index)=><li key={item.href} className="border-b border-border"><Link href={item.href} className="group grid gap-4 py-6 sm:grid-cols-[3rem_minmax(12rem,0.8fr)_1.2fr_auto] sm:items-center sm:px-3"><span className="font-mono text-xs text-gold">{String(index+1).padStart(2,"0")}</span><span><span className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">{item.eyebrow}</span><strong className="mt-1 block text-lg text-navy">{item.title}</strong></span><span><span className="block text-sm leading-6 text-muted">{item.detail}</span>{typeof item.progress === "number" && <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-surface"><span className="block h-full bg-gold" style={{width:`${item.progress}%`}} /></span>}</span><span className="text-sm font-semibold text-navy">{item.action} →</span></Link></li>)}</ol></section> : <section className="mt-10 rounded-2xl bg-navy p-7 text-white sm:p-9"><p className="text-sm font-semibold text-gold">처음이라면</p><h2 className="mt-2 text-2xl font-semibold">지금 가장 필요한 한 가지만 골라보세요.</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">기기 저장이 가능한 브라우저에서 저장을 확인하면 다음 방문에도 이어볼 수 있어요. 계정을 만들거나 개인정보를 제출할 필요는 없어요.</p><Link href="/arrival-checklist" className="mt-5 inline-flex min-h-11 items-center bg-gold px-4 text-sm font-semibold text-navy">첫 30일 체크리스트 살펴보기 →</Link></section>}

    <ResourceReadingProgress articles={resourceArticles} readArticles={readArticles} />
    {suggestions.length > 0 && <section className="mt-12" aria-labelledby="suggested-projects"><h2 id="suggested-projects" className="text-2xl font-semibold text-navy">다음에 시작할 수 있는 것</h2><ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{suggestions.map((item)=><li key={item.href}><Link href={item.href} className="flex h-full flex-col border-t-2 border-navy bg-white px-1 py-5"><span className="text-xs font-semibold text-gold">{item.eyebrow}</span><strong className="mt-2 text-lg text-navy">{item.title}</strong><span className="mt-2 flex-1 text-sm leading-6 text-muted">{item.detail}</span><span className="mt-5 text-sm font-semibold text-navy">{item.action} →</span></Link></li>)}</ul></section>}
    {readArticles.length > 0 && <section className="mt-12 border-t border-navy/20 pt-7" aria-labelledby="read-articles"><div className="flex items-end justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">전에 살펴본 글</p><h2 id="read-articles" className="mt-1 text-2xl font-semibold text-navy">아래까지 본 실용 자료</h2></div><span className="font-mono text-xs text-muted">{String(readArticles.length).padStart(2,"0")}</span></div><ul className="mt-4 grid gap-x-8 md:grid-cols-2">{readArticles.map((item)=><li key={item.href} className="border-b border-border"><Link href={item.href} className="group flex min-h-20 items-center justify-between gap-4 py-4"><span><strong className="block text-navy">{item.title}</strong><span className="mt-1 block text-xs text-muted">{new Date(item.completedAt).toLocaleDateString("ko-KR")} 아래까지 봄</span></span><span className="text-xl text-navy transition group-hover:translate-x-1">→</span></Link></li>)}</ul></section>}
    {bookmarks.length > 0 && <section className="mt-12 border-t border-navy/20 pt-7" aria-labelledby="saved-pages"><div className="flex items-end justify-between"><h2 id="saved-pages" className="text-2xl font-semibold text-navy">나중에 볼 페이지</h2><span className="font-mono text-xs text-muted">{String(bookmarks.length).padStart(2,"0")}</span></div><ul className="mt-4 grid gap-x-8 md:grid-cols-2">{bookmarks.map((item)=><li key={item.href} className="border-b border-border"><Link href={item.href} className="group flex min-h-20 items-center justify-between gap-4 py-4"><span><strong className="block text-navy">{item.title}</strong><span className="mt-1 block text-xs text-muted">{new Date(item.savedAt).toLocaleDateString("ko-KR")} 저장</span></span><span className="text-xl text-navy transition group-hover:translate-x-1">→</span></Link></li>)}</ul></section>}
  </div>;
}
