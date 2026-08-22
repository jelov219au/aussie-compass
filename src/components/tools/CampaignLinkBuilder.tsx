"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type SavedLink = { id: string; target: string; source: string; campaign: string; url: string; createdAt: string };
type Target = { path: string; label: string; title: string; body: string; cta: string };

const STORAGE_KEY = "hoju-compass-campaign-links-v1";
const targets: Target[] = [
  { path: "/arrival-checklist", label: "첫 30일 정착", title: "호주 도착 후 첫 30일, 무엇부터 해야 할까?", body: "전화·교통·은행부터 TFN과 첫 Payslip까지 순서대로 준비하세요.", cta: "무료 체크리스트 보기" },
  { path: "/english-phrase-cards", label: "생활 영어 문장 카드", title: "호주 생활에서 바로 쓰는 확인 문장", body: "은행, 렌트, 직장과 병원에서 막혔을 때 필요한 말부터 골라 쓰세요.", cta: "상황별 문장 보기" },
  { path: "/resources/australia-sim-esim-setup-guide", label: "SIM·eSIM 개통", title: "호주 도착 당일, SIM부터 급하게 고르지 마세요", body: "선불·후불, 신분 확인, 커버리지, 번호 이동과 SIM swap 예방을 순서대로 확인하세요.", cta: "무료 SIM 가이드 보기" },
  { path: "/resources/australia-bank-account-opening-guide", label: "첫 은행 계좌", title: "호주 첫 은행 계좌, 수수료부터 보안까지", body: "신원 확인, 급여 입금, TFN·PayID와 예금자 보호를 순서대로 점검하세요.", cta: "무료 계좌 가이드 보기" },
  { path: "/resources/australia-gp-hospital-pharmacy-guide", label: "GP·병원 이용", title: "호주에서 처음 아프면 어디로 가야 할까?", body: "000, 응급실, GP, 약국을 구분하고 진료비·Medicare·OSHC와 검사 결과를 확인하세요.", cta: "무료 의료 이용 가이드 보기" },
  { path: "/salary-calculator", label: "급여 계산기", title: "호주 급여, 시급만 보고 판단하면 안 되는 이유", body: "세전·세후 급여와 Super를 같은 화면에서 확인하세요.", cta: "급여 계산기 열기" },
  { path: "/resume-builder", label: "영문 이력서 빌더", title: "호주 구직용 영문 이력서를 무료로 준비하세요", body: "영문 예시 문장과 디자인을 선택해 PDF로 저장할 수 있습니다.", cta: "이력서 만들기" },
  { path: "/property-inspection-checklist", label: "집 방문 체크리스트", title: "쉐어하우스 방문에서 놓치기 쉬운 것", body: "Bond, 공과금, 계약 상대, 곰팡이와 교통까지 현장에서 확인하세요.", cta: "집 체크리스트 보기" },
  { path: "/tax-return-guide", label: "택스 리턴 준비", title: "EOFY 전에 먼저 모아야 할 자료", body: "Income statement와 공제 증빙을 신고 전에 정리하세요.", cta: "택스 리턴 가이드 보기" },
  { path: "/leaving-australia-guide", label: "귀국·DASP", title: "귀국 뒤에도 남는 호주 생활 정산", body: "퇴거, 마지막 급여, 세금과 DASP를 출국 전후로 준비하세요.", cta: "귀국 준비 시작하기" },
  { path: "/pro", label: "Pro 도구 비교", title: "호주 생활 준비 시간을 줄이는 5개 작업 공간", body: "이력서, 렌트, 급여 증빙, EOFY와 귀국 준비 제품 구성을 비교하세요.", cta: "Pro 제품 비교하기" },
];

const campaignCardCopy: Record<string, Pick<Target, "title" | "body" | "cta">> = {
  "english-phrase-bank": { title: "Are there any monthly or ATM fees?", body: "월 관리비나 ATM 수수료가 있나요? 계좌를 열기 전에 비용과 조건을 글로 확인해 두세요.", cta: "은행에서 쓰는 문장 더 보기" },
  "english-phrase-rent": { title: "Could you send me the agreement before I pay?", body: "돈을 보내기 전에 계약서를 보내주실 수 있나요? Bond와 포함 비용도 글로 확인하세요.", cta: "렌트할 때 쓰는 문장 더 보기" },
  "english-phrase-work": { title: "Could you confirm my hourly rate in writing?", body: "시급과 Classification을 글로 확인해 주실 수 있나요? 첫 근무 전에 기록을 남겨두세요.", cta: "직장에서 쓰는 문장 더 보기" },
  "english-phrase-health": { title: "I need a Korean interpreter, please.", body: "한국어 통역이 필요합니다. 증상, 동의서와 약 복용처럼 중요한 내용은 정확히 이해할 때까지 물어보세요.", cta: "병원에서 쓰는 문장 더 보기" },
};

const campaignPhraseDestination: Record<string, { situation: string; phrase: string }> = {
  "english-phrase-bank": { situation: "bank", phrase: "bank-fees" },
  "english-phrase-rent": { situation: "home", phrase: "rent-agreement" },
  "english-phrase-work": { situation: "work", phrase: "work-rate" },
  "english-phrase-health": { situation: "health", phrase: "health-interpreter" },
};

const sourceOptions = [
  ["instagram", "Instagram", "social"], ["youtube", "YouTube", "video"], ["naver", "Naver Blog·Cafe", "community"],
  ["facebook", "Facebook", "social"], ["kakao", "Kakao", "messenger"], ["newsletter", "Email newsletter", "email"], ["other", "직접 입력", "referral"],
] as const;

function cleanTag(value: string) {
  return value.trim().toLocaleLowerCase("ko-KR").replace(/\s+/g, "-").replace(/[^a-z0-9가-힣_-]/g, "").replace(/-+/g, "-").slice(0, 64);
}

type InitialValues = { target?: string; source?: string; campaign?: string; content?: string };

export function CampaignLinkBuilder({ baseUrl, initialValues }: { baseUrl: string; initialValues?: InitialValues }) {
  const initialTarget = targets.some((item) => item.path === initialValues?.target) ? initialValues?.target ?? targets[0].path : targets[0].path;
  const initialSource = sourceOptions.some(([id]) => id === initialValues?.source) ? initialValues?.source ?? "instagram" : "instagram";
  const initialMedium = sourceOptions.find(([id]) => id === initialSource)?.[2] ?? "social";
  const [targetPath, setTargetPath] = useState(initialTarget);
  const [sourceChoice, setSourceChoice] = useState(initialSource);
  const [customSource, setCustomSource] = useState("");
  const [medium, setMedium] = useState<string>(initialMedium);
  const [campaign, setCampaign] = useState(cleanTag(initialValues?.campaign ?? "first-30-days"));
  const [content, setContent] = useState(cleanTag(initialValues?.content ?? "card-01"));
  const [saved, setSaved] = useState<SavedLink[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const target = targets.find((item) => item.path === targetPath) ?? targets[0];
  const cardCopy = campaignCardCopy[cleanTag(campaign)] ?? target;
  const source = sourceChoice === "other" ? cleanTag(customSource) : sourceChoice;

  useEffect(() => {
    try { const value = window.localStorage.getItem(STORAGE_KEY); if (value) setSaved(JSON.parse(value)); } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => { if (!loaded) return; try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved.slice(0, 20))); } catch {} }, [loaded, saved]);

  const trackedPath = useMemo(() => {
    const params = new URLSearchParams();
    const phraseDestination = target.path === "/english-phrase-cards" ? campaignPhraseDestination[cleanTag(campaign)] : undefined;
    if (phraseDestination) {
      params.set("situation", phraseDestination.situation);
      params.set("phrase", phraseDestination.phrase);
    }
    if (source) params.set("utm_source", source);
    if (cleanTag(medium)) params.set("utm_medium", cleanTag(medium));
    if (cleanTag(campaign)) params.set("utm_campaign", cleanTag(campaign));
    if (cleanTag(content)) params.set("utm_content", cleanTag(content));
    const query = params.toString();
    return `${target.path}${query ? `?${query}` : ""}${phraseDestination ? `#phrase-${phraseDestination.phrase}` : ""}`;
  }, [campaign, content, medium, source, target.path]);
  const trackedUrl = `${baseUrl.replace(/\/$/, "")}${trackedPath}`;
  const ready = Boolean(source && cleanTag(medium) && cleanTag(campaign));

  const changeSource = (value: string) => {
    setSourceChoice(value);
    const option = sourceOptions.find(([id]) => id === value);
    if (option) setMedium(option[2]);
  };
  const copyLink = async () => {
    if (!ready) { setMessage("출처, 매체와 캠페인 이름을 먼저 입력하세요."); return; }
    try { await navigator.clipboard.writeText(trackedUrl); setMessage("캠페인 링크를 복사했습니다."); } catch { setMessage("복사할 수 없습니다. 링크를 직접 선택해 복사하세요."); }
  };
  const saveLink = () => {
    if (!ready) { setMessage("출처, 매체와 캠페인 이름을 먼저 입력하세요."); return; }
    const item: SavedLink = { id: crypto.randomUUID(), target: target.label, source, campaign: cleanTag(campaign), url: trackedUrl, createdAt: new Date().toISOString() };
    setSaved((current) => [item, ...current].slice(0, 20));
    setMessage("이 기기의 캠페인 링크 목록에 저장했습니다.");
  };

  return <div className="grid min-w-0 items-start gap-8 xl:grid-cols-[minmax(0,0.9fr)_minmax(32rem,1.1fr)]">
    <section className="min-w-0 border border-border bg-white p-5 shadow-sm sm:p-7" aria-labelledby="campaign-builder-heading"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Campaign setup</p><h2 id="campaign-builder-heading" className="mt-2 text-2xl font-semibold text-navy">공유 목적을 링크에 표시하세요.</h2><p className="mt-3 text-sm leading-6 text-muted">개인의 이름·이메일·계정 ID는 넣지 않고 채널, 캠페인과 게시물 버전만 구분합니다.</p><div className="mt-6 space-y-4"><label className="block text-sm font-medium text-navy">연결할 페이지<select className="mt-1.5 min-h-11 w-full border border-border bg-white px-3 text-sm" value={targetPath} onChange={(event) => setTargetPath(event.target.value)}>{targets.map((item) => <option key={item.path} value={item.path}>{item.label}</option>)}</select></label><label className="block text-sm font-medium text-navy">공유 채널<select className="mt-1.5 min-h-11 w-full border border-border bg-white px-3 text-sm" value={sourceChoice} onChange={(event) => changeSource(event.target.value)}>{sourceOptions.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>{sourceChoice === "other" ? <label className="block text-sm font-medium text-navy">직접 입력한 출처<input className="mt-1.5 min-h-11 w-full border border-border px-3 text-sm" value={customSource} onChange={(event) => setCustomSource(event.target.value)} placeholder="예: university-club" /></label> : null}<div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-navy">매체 유형 <span className="font-normal text-muted">utm_medium</span><input className="mt-1.5 min-h-11 w-full border border-border px-3 text-sm" value={medium} onChange={(event) => setMedium(event.target.value)} /></label><label className="text-sm font-medium text-navy">캠페인 이름 <span className="font-normal text-muted">utm_campaign</span><input className="mt-1.5 min-h-11 w-full border border-border px-3 text-sm" value={campaign} onChange={(event) => setCampaign(event.target.value)} placeholder="first-30-days" /></label></div><label className="block text-sm font-medium text-navy">게시물 버전 <span className="font-normal text-muted">utm_content · 선택</span><input className="mt-1.5 min-h-11 w-full border border-border px-3 text-sm" value={content} onChange={(event) => setContent(event.target.value)} placeholder="card-01" /></label></div><section className="mt-6 border border-border bg-surface p-4" aria-labelledby="naming-guide"><h3 id="naming-guide" className="text-sm font-semibold text-navy">일관된 이름 예시</h3><dl className="mt-3 grid gap-2 text-xs leading-5 text-muted"><div><dt className="inline font-semibold text-navy">source</dt><dd className="inline"> · instagram, youtube, naver처럼 유입 채널</dd></div><div><dt className="inline font-semibold text-navy">medium</dt><dd className="inline"> · social, video, community, email처럼 게시 방식</dd></div><div><dt className="inline font-semibold text-navy">campaign</dt><dd className="inline"> · eofy-2026, first-30-days처럼 한 홍보 묶음</dd></div><div><dt className="inline font-semibold text-navy">content</dt><dd className="inline"> · card-01, reel-hook-a처럼 같은 캠페인의 버전</dd></div></dl></section></section>

    <div className="min-w-0 space-y-8">
      <section className="bg-navy p-5 text-white sm:p-7" aria-labelledby="campaign-result-heading"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Ready to share</p><h2 id="campaign-result-heading" className="mt-2 text-xl font-semibold">생성된 캠페인 링크</h2></div><span className={`border px-3 py-1 text-xs font-semibold ${ready ? "border-emerald-300 text-emerald-200" : "border-white/20 text-white/55"}`}>{ready ? "사용 가능" : "입력 확인"}</span></div><p className="mt-5 break-all border border-white/15 bg-white/5 p-4 font-mono text-xs leading-6 text-white/75">{trackedUrl}</p><div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={copyLink} className="min-h-11 bg-gold px-4 text-sm font-semibold text-navy">링크 복사</button><button type="button" onClick={saveLink} className="min-h-11 border border-white/25 px-4 text-sm font-semibold">목록에 저장</button><Link href={{ pathname: "/social-card-maker", query: { eyebrow: "Hoju Compass 실용 정보", title: cardCopy.title, body: cardCopy.body, cta: cardCopy.cta, path: trackedPath } }} className="inline-flex min-h-11 items-center border border-white/25 px-4 text-sm font-semibold">이 링크로 카드 만들기 →</Link></div><p className="mt-4 min-h-5 text-xs leading-5 text-white/60" aria-live="polite">{message}</p></section>

      <section className="border border-border bg-white p-5 sm:p-7" aria-labelledby="campaign-history-heading"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Local campaign log</p><h2 id="campaign-history-heading" className="mt-2 text-xl font-semibold text-navy">저장한 공유 링크</h2></div>{saved.length ? <button type="button" onClick={() => setSaved([])} className="min-h-10 text-xs font-medium text-muted hover:text-red-700">목록 비우기</button> : null}</div>{saved.length ? <ol className="mt-5 divide-y divide-border border-y border-navy/20">{saved.map((item, index) => <li key={item.id} className="py-4"><div className="flex items-start gap-3"><span className="font-mono text-xs text-gold">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap gap-x-3 gap-y-1"><strong className="text-sm text-navy">{item.target}</strong><span className="text-xs text-muted">{item.source} · {item.campaign}</span></div><p className="mt-2 truncate font-mono text-xs text-muted">{item.url}</p></div><button type="button" onClick={() => setSaved((current) => current.filter((entry) => entry.id !== item.id))} className="min-h-9 text-xs text-muted">삭제</button></div></li>)}</ol> : <p className="mt-5 border-y border-border py-8 text-center text-sm text-muted">아직 저장한 링크가 없습니다.</p>}<p className="mt-4 text-xs leading-5 text-muted">목록은 현재 브라우저에만 저장됩니다. UTM 링크를 만든 것만으로 방문 통계가 생기지는 않으며, 실제 성과 집계는 향후 분석 도구 연결이 필요합니다.</p></section>
    </div>
  </div>;
}
