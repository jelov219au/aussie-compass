"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Status = "idea" | "drafting" | "ready" | "published";
type Entry = { id: string; topicId: string; title: string; path: string; date: string; channel: string; format: string; campaign: string; status: Status; hook: string; createdAt: string };

const STORAGE_KEY = "hoju-compass-content-planner-v1";
const topics = [
  { id: "arrival", stage: "도착", title: "호주 도착 첫 30일 순서", path: "/arrival-checklist", campaign: "first-30-days" },
  { id: "arrival-english", stage: "도착", title: "영어가 막힐 때 바로 쓰는 확인 문장", path: "/resources/australia-arrival-english-clarifying-phrases", campaign: "arrival-english-phrases" },
  { id: "sim", stage: "도착", title: "호주 첫 SIM·eSIM 안전하게 개통하기", path: "/resources/australia-sim-esim-setup-guide", campaign: "first-australian-sim" },
  { id: "bank", stage: "도착", title: "호주 첫 은행 계좌 안전하게 열기", path: "/resources/australia-bank-account-opening-guide", campaign: "first-bank-account" },
  { id: "health", stage: "도착", title: "처음 아플 때 GP·병원·약국 이용 순서", path: "/resources/australia-gp-hospital-pharmacy-guide", campaign: "first-healthcare-visit" },
  { id: "payslip", stage: "일", title: "첫 Payslip에서 확인할 5가지", path: "/payslip-guide", campaign: "first-payslip" },
  { id: "public-holiday-pay", stage: "일", title: "공휴일 근무수당 확인 순서", path: "/resources/australia-public-holiday-work-pay-guide", campaign: "public-holiday-pay" },
  { id: "resume", stage: "구직", title: "호주식 영문 이력서 시작하기", path: "/resume-builder", campaign: "resume-starter" },
  { id: "rent", stage: "집", title: "쉐어하우스 방문 체크리스트", path: "/property-inspection-checklist", campaign: "rental-check" },
  { id: "transport", stage: "이동", title: "차 없이 통학·출근 생활권 고르기", path: "/public-transport-guide", campaign: "commute-planning" },
  { id: "salary", stage: "돈", title: "시급·세후 급여·Super 함께 보기", path: "/salary-calculator", campaign: "salary-check" },
  { id: "tax", stage: "정기", title: "EOFY 전에 모아야 할 자료", path: "/tax-return-guide", campaign: "eofy-ready" },
  { id: "underpayment", stage: "일", title: "급여가 예상보다 적을 때 확인 순서", path: "/underpayment-guide", campaign: "pay-check" },
  { id: "leaving", stage: "귀국", title: "귀국 전후 놓치기 쉬운 정산", path: "/leaving-australia-guide", campaign: "leaving-australia" },
  { id: "pro", stage: "Pro", title: "상황별 Hoju Compass Pro 비교", path: "/pro", campaign: "pro-tools" },
] as const;
const channels = [["instagram", "Instagram"], ["youtube", "YouTube"], ["naver", "Naver Blog·Cafe"], ["facebook", "Facebook"], ["kakao", "Kakao"], ["newsletter", "Newsletter"]] as const;
const formats = [["card", "카드뉴스"], ["reel", "Reel·Shorts"], ["post", "긴 글"], ["story", "Story"], ["email", "이메일"]] as const;
const statusLabels: Record<Status, string> = { idea: "아이디어", drafting: "제작 중", ready: "발행 준비", published: "발행 완료" };

function cleanTag(value: string) { return value.trim().toLocaleLowerCase("ko-KR").replace(/\s+/g, "-").replace(/[^a-z0-9가-힣_-]/g, "").replace(/-+/g, "-").slice(0, 64); }
function dateOffset(offset: number) { const date = new Date(); date.setDate(date.getDate() + offset); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function displayDate(value: string) { return new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric", weekday: "short" }).format(new Date(`${value}T12:00:00`)); }
function icsEscape(value: string) { return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;"); }

function safeEntries(value: unknown): Entry[] {
  if (!Array.isArray(value)) return [];
  const topicPaths = new Set(topics.map((topic) => topic.path));
  const channelIds = new Set(channels.map(([id]) => id));
  const formatIds = new Set(formats.map(([id]) => id));
  const statuses = new Set<Status>(["idea", "drafting", "ready", "published"]);
  return value.filter((item): item is Entry => Boolean(item && typeof item === "object" && typeof item.id === "string" && typeof item.title === "string" && typeof item.path === "string" && topicPaths.has(item.path as typeof topics[number]["path"]) && typeof item.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.date) && typeof item.channel === "string" && channelIds.has(item.channel as typeof channels[number][0]) && typeof item.format === "string" && formatIds.has(item.format as typeof formats[number][0]) && typeof item.status === "string" && statuses.has(item.status as Status))).slice(0, 60).map((item) => ({ ...item, title: item.title.slice(0, 80), campaign: cleanTag(item.campaign || "content"), hook: typeof item.hook === "string" ? item.hook.slice(0, 140) : "" }));
}

export function ContentPublishingPlanner() {
  const [topicId, setTopicId] = useState<string>(topics[0].id);
  const [date, setDate] = useState("");
  const [channel, setChannel] = useState<string>("instagram");
  const [format, setFormat] = useState<string>("card");
  const [campaign, setCampaign] = useState<string>(topics[0].campaign);
  const [hook, setHook] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const topic = topics.find((item) => item.id === topicId) ?? topics[0];

  useEffect(() => {
    setDate(dateOffset(1));
    try { const stored = localStorage.getItem(STORAGE_KEY); if (stored) setEntries(safeEntries(JSON.parse(stored))); } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => { if (!loaded) return; try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 60))); } catch {} }, [entries, loaded]);

  const sorted = useMemo(() => [...entries].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt)), [entries]);
  const counts = useMemo(() => ({ total: entries.length, ready: entries.filter((item) => item.status === "ready").length, published: entries.filter((item) => item.status === "published").length }), [entries]);
  const changeTopic = (id: string) => { const next = topics.find((item) => item.id === id) ?? topics[0]; setTopicId(next.id); setCampaign(next.campaign); };
  const addEntry = () => {
    if (!date || !cleanTag(campaign)) { setMessage("발행일과 캠페인 이름을 확인해 주세요."); return; }
    const item: Entry = { id: crypto.randomUUID(), topicId: topic.id, title: topic.title, path: topic.path, date, channel, format, campaign: cleanTag(campaign), status: "idea", hook: hook.trim().slice(0, 140), createdAt: new Date().toISOString() };
    setEntries((current) => [...current, item].slice(-60)); setHook(""); setDate(dateOffset(2)); setMessage("발행 계획에 추가했습니다.");
  };
  const loadSampleWeek = () => {
    const samples = [topics[0], topics[3], topics[4], topics[6], topics[7]].map((item, index): Entry => ({ id: crypto.randomUUID(), topicId: item.id, title: item.title, path: item.path, date: dateOffset(index + 1), channel: index % 2 ? "naver" : "instagram", format: index % 2 ? "post" : "card", campaign: item.campaign, status: "idea", hook: "", createdAt: new Date().toISOString() }));
    setEntries((current) => current.length ? current : samples); setMessage(entries.length ? "기존 계획이 있어 샘플을 추가하지 않았습니다." : "5일 샘플 발행 계획을 불러왔습니다.");
  };
  const updateStatus = (id: string, status: Status) => setEntries((current) => current.map((item) => item.id === id ? { ...item, status } : item));
  const downloadCalendar = () => {
    if (!entries.length) return;
    const events = sorted.map((item) => ["BEGIN:VEVENT", `UID:content-${item.id}@hojucompass.com`, `DTSTART;VALUE=DATE:${item.date.replace(/-/g, "")}`, `SUMMARY:${icsEscape(`[${channels.find(([id]) => id === item.channel)?.[1] ?? item.channel}] ${item.title}`)}`, `DESCRIPTION:${icsEscape(`${formats.find(([id]) => id === item.format)?.[1] ?? item.format} · ${statusLabels[item.status]}\nHoju Compass 콘텐츠 발행 준비`)}`, `URL:https://hojucompass.com/content-planner`, "END:VEVENT"].join("\r\n"));
    const body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Hoju Compass//Content Planner//KO", "CALSCALE:GREGORIAN", ...events, "END:VCALENDAR"].join("\r\n");
    const url = URL.createObjectURL(new Blob([body], { type: "text/calendar;charset=utf-8" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "hoju-compass-content-plan.ics"; anchor.click(); URL.revokeObjectURL(url);
  };

  return <div className="grid min-w-0 items-start gap-8 xl:grid-cols-[minmax(19rem,0.72fr)_minmax(0,1.28fr)]">
    <section className="min-w-0 border border-border bg-white p-5 shadow-sm sm:p-7" aria-labelledby="content-entry-heading">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Plan one useful post</p><h2 id="content-entry-heading" className="mt-2 text-2xl font-semibold text-navy">다음 게시물 정하기</h2><p className="mt-3 text-sm leading-6 text-muted">사람이 실제로 다음 행동을 할 수 있는 Hoju Compass 페이지 한 곳을 연결합니다.</p>
      <div className="mt-6 space-y-4"><label className="block text-sm font-medium text-navy">주제<select className="mt-1.5 min-h-11 w-full border border-border bg-white px-3" value={topicId} onChange={(event) => changeTopic(event.target.value)}>{topics.map((item) => <option key={item.id} value={item.id}>{item.stage} · {item.title}</option>)}</select></label><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1"><label className="text-sm font-medium text-navy">발행일<input type="date" className="mt-1.5 min-h-11 w-full border border-border px-3" value={date} onChange={(event) => setDate(event.target.value)} /></label><label className="text-sm font-medium text-navy">채널<select className="mt-1.5 min-h-11 w-full border border-border bg-white px-3" value={channel} onChange={(event) => setChannel(event.target.value)}>{channels.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1"><label className="text-sm font-medium text-navy">형식<select className="mt-1.5 min-h-11 w-full border border-border bg-white px-3" value={format} onChange={(event) => setFormat(event.target.value)}>{formats.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label><label className="text-sm font-medium text-navy">캠페인 이름<input className="mt-1.5 min-h-11 w-full border border-border px-3" value={campaign} onChange={(event) => setCampaign(event.target.value)} /></label></div><label className="block text-sm font-medium text-navy">첫 문장 메모 <span className="font-normal text-muted">선택</span><textarea rows={3} maxLength={140} className="mt-1.5 w-full resize-y border border-border p-3 text-sm" value={hook} onChange={(event) => setHook(event.target.value)} placeholder="예: 첫 Payslip, 입금액만 보면 놓치는 게 있습니다." /></label></div>
      <button type="button" onClick={addEntry} className="mt-5 min-h-12 w-full bg-navy px-4 text-sm font-semibold text-white">발행 계획에 추가</button><button type="button" onClick={loadSampleWeek} className="mt-2 min-h-11 w-full border border-border px-4 text-sm font-semibold text-navy">5일 샘플 불러오기</button><p className="mt-3 min-h-5 text-xs leading-5 text-muted" aria-live="polite">{message}</p>
    </section>

    <section className="min-w-0" aria-labelledby="publishing-plan-heading">
      <div className="grid gap-3 border-y border-navy/20 py-5 sm:grid-cols-3"><div><span className="font-mono text-xs text-gold">TOTAL</span><strong className="mt-1 block text-2xl text-navy">{counts.total}</strong><span className="text-xs text-muted">전체 계획</span></div><div><span className="font-mono text-xs text-gold">READY</span><strong className="mt-1 block text-2xl text-navy">{counts.ready}</strong><span className="text-xs text-muted">발행 준비</span></div><div><span className="font-mono text-xs text-gold">DONE</span><strong className="mt-1 block text-2xl text-navy">{counts.published}</strong><span className="text-xs text-muted">발행 완료</span></div></div>
      <div className="flex flex-wrap items-end justify-between gap-4 py-6"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Local publishing desk</p><h2 id="publishing-plan-heading" className="mt-2 text-2xl font-semibold text-navy">발행 일정</h2></div>{entries.length ? <div className="flex gap-4"><button type="button" onClick={downloadCalendar} className="min-h-11 border-b-2 border-gold text-sm font-semibold text-navy">캘린더 저장</button><button type="button" onClick={() => setEntries([])} className="min-h-11 text-sm text-muted hover:text-red-700">전체 삭제</button></div> : null}</div>
      {sorted.length ? <ol className="divide-y divide-border border-y border-navy/20">{sorted.map((item, index) => <li key={item.id} className="py-5"><div className="flex min-w-0 gap-3"><span className="mt-1 font-mono text-xs text-gold">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{displayDate(item.date)} · {channels.find(([id]) => id === item.channel)?.[1]} · {formats.find(([id]) => id === item.format)?.[1]}</p><h3 className="mt-1 text-lg font-semibold text-navy">{item.title}</h3></div><select aria-label={`${item.title} 상태`} value={item.status} onChange={(event) => updateStatus(item.id, event.target.value as Status)} className="min-h-10 border border-border bg-white px-2 text-xs font-semibold text-navy">{Object.entries(statusLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></div>{item.hook ? <p className="mt-3 border-l-2 border-gold pl-3 text-sm leading-6 text-muted">{item.hook}</p> : null}<div className="mt-4 flex flex-wrap gap-x-5 gap-y-2"><Link href={{ pathname: "/campaign-link-builder", query: { target: item.path, source: item.channel, campaign: item.campaign, content: `${item.format}-${item.date}` } }} className="inline-flex min-h-10 items-center border-b border-gold text-xs font-semibold text-navy">링크·카드 준비 →</Link><Link href={{ pathname: "/content-performance", query: { target: item.path, source: item.channel, campaign: item.campaign, date: item.date, format: item.format } }} className="inline-flex min-h-10 items-center text-xs font-semibold text-navy">발행 후 성과 기록 →</Link><Link href={item.path} className="inline-flex min-h-10 items-center text-xs font-medium text-muted">원문 확인</Link><button type="button" onClick={() => setEntries((current) => current.filter((entry) => entry.id !== item.id))} className="min-h-10 text-xs text-muted hover:text-red-700">삭제</button></div></div></div></li>)}</ol> : <div className="border-y border-border py-12 text-center"><p className="font-semibold text-navy">아직 발행 계획이 없습니다.</p><p className="mt-2 text-sm text-muted">왼쪽에서 한 건을 추가하거나 5일 샘플을 불러오세요.</p></div>}
      <p className="mt-5 text-xs leading-5 text-muted">계획은 현재 브라우저에만 저장됩니다. 자동 게시, 계정 연결, 방문자 추적은 하지 않습니다.</p>
    </section>
  </div>;
}
