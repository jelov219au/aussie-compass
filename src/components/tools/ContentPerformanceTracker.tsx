"use client";

import { useEffect, useMemo, useState } from "react";

type ResultEntry = { id: string; topicId: string; topic: string; path: string; channel: string; format: string; campaign: string; date: string; reach: number; clicks: number; saves: number; createdAt: string };
type InitialValues = { target?: string; source?: string; campaign?: string; date?: string; format?: string };

const STORAGE_KEY = "hoju-compass-content-results-v1";
const topics = [
  { id: "arrival", title: "호주 도착 첫 30일 순서", path: "/arrival-checklist" },
  { id: "arrival-english", title: "영어가 막힐 때 바로 쓰는 확인 문장", path: "/resources/australia-arrival-english-clarifying-phrases" },
  { id: "sim", title: "호주 첫 SIM·eSIM 안전하게 개통하기", path: "/resources/australia-sim-esim-setup-guide" },
  { id: "bank", title: "호주 첫 은행 계좌 안전하게 열기", path: "/resources/australia-bank-account-opening-guide" },
  { id: "health", title: "처음 아플 때 GP·병원·약국 이용 순서", path: "/resources/australia-gp-hospital-pharmacy-guide" },
  { id: "payslip", title: "첫 Payslip에서 확인할 5가지", path: "/payslip-guide" },
  { id: "resume", title: "호주식 영문 이력서 시작하기", path: "/resume-builder" },
  { id: "rent", title: "쉐어하우스 방문 체크리스트", path: "/property-inspection-checklist" },
  { id: "transport", title: "차 없이 통학·출근 생활권 고르기", path: "/public-transport-guide" },
  { id: "salary", title: "시급·세후 급여·Super 함께 보기", path: "/salary-calculator" },
  { id: "tax", title: "EOFY 전에 모아야 할 자료", path: "/tax-return-guide" },
  { id: "underpayment", title: "급여가 예상보다 적을 때 확인 순서", path: "/underpayment-guide" },
  { id: "leaving", title: "귀국 전후 놓치기 쉬운 정산", path: "/leaving-australia-guide" },
  { id: "pro", title: "상황별 Hoju Compass Pro 비교", path: "/pro" },
] as const;
const channels = [["instagram", "Instagram"], ["youtube", "YouTube"], ["naver", "Naver Blog·Cafe"], ["facebook", "Facebook"], ["kakao", "Kakao"], ["newsletter", "Newsletter"], ["other", "기타"]] as const;
const formats = [["card", "카드뉴스"], ["reel", "Reel·Shorts"], ["post", "긴 글"], ["story", "Story"], ["email", "이메일"]] as const;

function cleanTag(value: string) { return value.trim().toLocaleLowerCase("ko-KR").replace(/\s+/g, "-").replace(/[^a-z0-9가-힣_-]/g, "").replace(/-+/g, "-").slice(0, 64); }
function safeCount(value: string) { const parsed = Number.parseInt(value.replace(/,/g, ""), 10); return Number.isFinite(parsed) ? Math.max(0, Math.min(parsed, 100_000_000)) : 0; }
function rate(part: number, total: number) { return total > 0 ? `${((part / total) * 100).toFixed(1)}%` : "—"; }
function displayDate(value: string) { return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "short", day: "numeric" }).format(new Date(`${value}T12:00:00`)); }
function safeStored(value: unknown): ResultEntry[] {
  if (!Array.isArray(value)) return [];
  const paths = new Set(topics.map((item) => item.path)); const channelIds = new Set(channels.map(([id]) => id)); const formatIds = new Set(formats.map(([id]) => id));
  return value.filter((item): item is ResultEntry => Boolean(item && typeof item === "object" && typeof item.id === "string" && typeof item.path === "string" && paths.has(item.path as typeof topics[number]["path"]) && typeof item.channel === "string" && channelIds.has(item.channel as typeof channels[number][0]) && typeof item.format === "string" && formatIds.has(item.format as typeof formats[number][0]) && typeof item.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.date) && Number.isFinite(item.reach) && Number.isFinite(item.clicks) && Number.isFinite(item.saves))).slice(0, 100).map((item) => ({ ...item, campaign: cleanTag(item.campaign || "content"), reach: Math.max(0, item.reach), clicks: Math.max(0, item.clicks), saves: Math.max(0, item.saves) }));
}

export function ContentPerformanceTracker({ initialValues }: { initialValues?: InitialValues }) {
  const initialTopic = topics.find((item) => item.path === initialValues?.target) ?? topics[0];
  const initialChannel = channels.some(([id]) => id === initialValues?.source) ? initialValues?.source ?? "instagram" : "instagram";
  const initialFormat = formats.some(([id]) => id === initialValues?.format) ? initialValues?.format ?? "card" : "card";
  const [topicId, setTopicId] = useState<string>(initialTopic.id);
  const [channel, setChannel] = useState<string>(initialChannel);
  const [format, setFormat] = useState<string>(initialFormat);
  const [campaign, setCampaign] = useState(cleanTag(initialValues?.campaign ?? "content"));
  const [date, setDate] = useState(initialValues?.date && /^\d{4}-\d{2}-\d{2}$/.test(initialValues.date) ? initialValues.date : "");
  const [reach, setReach] = useState(""); const [clicks, setClicks] = useState(""); const [saves, setSaves] = useState("");
  const [entries, setEntries] = useState<ResultEntry[]>([]); const [loaded, setLoaded] = useState(false); const [message, setMessage] = useState("");
  const topic = topics.find((item) => item.id === topicId) ?? topics[0];

  useEffect(() => { const now = new Date(); setDate((current) => current || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`); try { const stored = localStorage.getItem(STORAGE_KEY); if (stored) setEntries(safeStored(JSON.parse(stored))); } catch {} setLoaded(true); }, []);
  useEffect(() => { if (!loaded) return; try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 100))); } catch {} }, [entries, loaded]);
  const totals = useMemo(() => entries.reduce((sum, item) => ({ reach: sum.reach + item.reach, clicks: sum.clicks + item.clicks, saves: sum.saves + item.saves }), { reach: 0, clicks: 0, saves: 0 }), [entries]);
  const leaders = useMemo(() => {
    const channelMap = new Map<string, number>(); const topicMap = new Map<string, number>();
    entries.forEach((item) => { channelMap.set(item.channel, (channelMap.get(item.channel) ?? 0) + item.clicks); topicMap.set(item.topic, (topicMap.get(item.topic) ?? 0) + item.clicks); });
    const topChannelId = [...channelMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    return { channel: channels.find(([id]) => id === topChannelId)?.[1] ?? "기록 필요", topic: [...topicMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "기록 필요" };
  }, [entries]);
  const addResult = () => {
    const nextReach = safeCount(reach); const nextClicks = safeCount(clicks); const nextSaves = safeCount(saves);
    if (!date || !cleanTag(campaign)) { setMessage("게시일과 캠페인 이름을 확인해 주세요."); return; }
    if (nextClicks > nextReach && nextReach > 0) { setMessage("링크 클릭 수가 조회·도달 수보다 큰지 다시 확인해 주세요."); return; }
    const item: ResultEntry = { id: crypto.randomUUID(), topicId: topic.id, topic: topic.title, path: topic.path, channel, format, campaign: cleanTag(campaign), date, reach: nextReach, clicks: nextClicks, saves: nextSaves, createdAt: new Date().toISOString() };
    setEntries((current) => [item, ...current].slice(0, 100)); setReach(""); setClicks(""); setSaves(""); setMessage("성과 합계를 기록했습니다.");
  };
  const downloadCsv = () => {
    const header = ["date", "topic", "channel", "format", "campaign", "reach", "link_clicks", "saves", "click_rate"];
    const rows = entries.map((item) => [item.date, item.topic, item.channel, item.format, item.campaign, item.reach, item.clicks, item.saves, rate(item.clicks, item.reach)]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "hoju-compass-content-results.csv"; anchor.click(); URL.revokeObjectURL(url);
  };

  return <div className="grid min-w-0 items-start gap-8 xl:grid-cols-[minmax(19rem,0.72fr)_minmax(0,1.28fr)]">
    <section className="min-w-0 border border-border bg-white p-5 shadow-sm sm:p-7" aria-labelledby="result-entry-heading"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Aggregate results only</p><h2 id="result-entry-heading" className="mt-2 text-2xl font-semibold text-navy">게시물 합계 기록</h2><p className="mt-3 text-sm leading-6 text-muted">각 플랫폼 화면에 표시된 전체 숫자만 옮겨 적습니다. 사용자 이름이나 계정 ID는 입력하지 않습니다.</p>
      <div className="mt-6 space-y-4"><label className="block text-sm font-medium text-navy">주제<select value={topicId} onChange={(event) => setTopicId(event.target.value)} className="mt-1.5 min-h-11 w-full border border-border bg-white px-3">{topics.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1"><label className="text-sm font-medium text-navy">게시일<input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1.5 min-h-11 w-full border border-border px-3" /></label><label className="text-sm font-medium text-navy">채널<select value={channel} onChange={(event) => setChannel(event.target.value)} className="mt-1.5 min-h-11 w-full border border-border bg-white px-3">{channels.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1"><label className="text-sm font-medium text-navy">형식<select value={format} onChange={(event) => setFormat(event.target.value)} className="mt-1.5 min-h-11 w-full border border-border bg-white px-3">{formats.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label><label className="text-sm font-medium text-navy">캠페인<input value={campaign} onChange={(event) => setCampaign(event.target.value)} className="mt-1.5 min-h-11 w-full border border-border px-3" /></label></div><div className="grid grid-cols-3 gap-3"><label className="text-xs font-medium text-navy">조회·도달<input inputMode="numeric" value={reach} onChange={(event) => setReach(event.target.value)} placeholder="0" className="mt-1.5 min-h-11 w-full border border-border px-2" /></label><label className="text-xs font-medium text-navy">링크 클릭<input inputMode="numeric" value={clicks} onChange={(event) => setClicks(event.target.value)} placeholder="0" className="mt-1.5 min-h-11 w-full border border-border px-2" /></label><label className="text-xs font-medium text-navy">저장<input inputMode="numeric" value={saves} onChange={(event) => setSaves(event.target.value)} placeholder="0" className="mt-1.5 min-h-11 w-full border border-border px-2" /></label></div></div>
      <button type="button" onClick={addResult} className="mt-5 min-h-12 w-full bg-navy px-4 text-sm font-semibold text-white">성과 합계 저장</button><p className="mt-3 min-h-5 text-xs leading-5 text-muted" aria-live="polite">{message}</p>
    </section>
    <section className="min-w-0" aria-labelledby="result-dashboard-heading"><div className="grid gap-3 border-y border-navy/20 py-5 sm:grid-cols-3"><div><span className="font-mono text-xs text-gold">REACH</span><strong className="mt-1 block text-2xl text-navy">{totals.reach.toLocaleString()}</strong><span className="text-xs text-muted">조회·도달 합계</span></div><div><span className="font-mono text-xs text-gold">CLICKS</span><strong className="mt-1 block text-2xl text-navy">{totals.clicks.toLocaleString()}</strong><span className="text-xs text-muted">링크 클릭 합계</span></div><div><span className="font-mono text-xs text-gold">RATE</span><strong className="mt-1 block text-2xl text-navy">{rate(totals.clicks, totals.reach)}</strong><span className="text-xs text-muted">단순 클릭률</span></div></div>
      <div className="grid gap-4 border-b border-navy/20 py-5 sm:grid-cols-2"><div><span className="text-xs text-muted">클릭이 가장 많은 채널</span><strong className="mt-1 block text-navy">{leaders.channel}</strong></div><div><span className="text-xs text-muted">클릭이 가장 많은 주제</span><strong className="mt-1 block text-navy">{leaders.topic}</strong></div></div>
      <div className="flex flex-wrap items-end justify-between gap-4 py-6"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Manual scorecard</p><h2 id="result-dashboard-heading" className="mt-2 text-2xl font-semibold text-navy">콘텐츠별 성과</h2></div>{entries.length ? <div className="flex gap-4"><button type="button" onClick={downloadCsv} className="min-h-11 border-b-2 border-gold text-sm font-semibold text-navy">CSV 저장</button><button type="button" onClick={() => setEntries([])} className="min-h-11 text-sm text-muted hover:text-red-700">전체 삭제</button></div> : null}</div>
      {entries.length ? <ol className="divide-y divide-border border-y border-navy/20">{entries.map((item, index) => <li key={item.id} className="py-5"><div className="flex min-w-0 gap-3"><span className="font-mono text-xs text-gold">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{displayDate(item.date)} · {channels.find(([id]) => id === item.channel)?.[1]} · {formats.find(([id]) => id === item.format)?.[1]}</p><h3 className="mt-1 text-lg font-semibold text-navy">{item.topic}</h3></div><button type="button" onClick={() => setEntries((current) => current.filter((entry) => entry.id !== item.id))} className="min-h-10 text-xs text-muted hover:text-red-700">삭제</button></div><dl className="mt-4 grid grid-cols-4 gap-2 text-center"><div className="bg-surface p-2"><dt className="text-[11px] text-muted">조회</dt><dd className="mt-1 font-semibold text-navy">{item.reach.toLocaleString()}</dd></div><div className="bg-surface p-2"><dt className="text-[11px] text-muted">클릭</dt><dd className="mt-1 font-semibold text-navy">{item.clicks.toLocaleString()}</dd></div><div className="bg-surface p-2"><dt className="text-[11px] text-muted">저장</dt><dd className="mt-1 font-semibold text-navy">{item.saves.toLocaleString()}</dd></div><div className="bg-surface p-2"><dt className="text-[11px] text-muted">클릭률</dt><dd className="mt-1 font-semibold text-navy">{rate(item.clicks, item.reach)}</dd></div></dl></div></div></li>)}</ol> : <div className="border-y border-border py-12 text-center"><p className="font-semibold text-navy">아직 기록한 성과가 없습니다.</p><p className="mt-2 text-sm text-muted">게시 후 플랫폼의 합계 숫자를 확인해 첫 기록을 추가하세요.</p></div>}
      <p className="mt-5 text-xs leading-5 text-muted">플랫폼마다 조회·도달·클릭 정의가 다를 수 있습니다. 같은 채널 안에서 기간과 형식이 비슷한 게시물의 추세를 비교하는 용도로 사용하세요.</p>
    </section>
  </div>;
}
