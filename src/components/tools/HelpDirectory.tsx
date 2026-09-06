"use client";

import { useMemo, useState } from "react";
import { accessHubUrl, helpSituations, jurisdictions, type HelpAction, type HelpSituation, type HelpSituationId } from "@/data/helpDirectory";

const tis = helpSituations.find((item) => item.id === "interpreter")!;

function ActionLink({ action }: { action: HelpAction }) {
  const external = action.kind === "web";
  return (
    <a
      href={action.href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="inline-flex min-h-12 items-center justify-center rounded-lg bg-navy px-5 text-center text-sm font-semibold text-white transition hover:bg-navy/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
    >
      {action.label}{external ? " ↗" : ""}
    </a>
  );
}

function EmergencyCard() {
  return (
    <section id="emergency-help" aria-labelledby="emergency-heading" className="mt-4 rounded-2xl bg-red-800 p-4 text-white sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">Emergency · 항상 표시</p>
          <h2 id="emergency-heading" className="mt-1 text-xl font-semibold">지금 생명·안전 위험, 범죄 진행, 의료 응급</h2>
          <p className="mt-1 text-sm leading-6 text-white/85">다른 선택을 멈추고 Police, Fire 또는 Ambulance를 요청하세요.</p>
        </div>
        <a href="tel:000" className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-white px-6 font-mono text-2xl font-bold text-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">000 전화</a>
      </div>
      <details className="mt-3 border-t border-white/25 pt-2 text-sm leading-6">
        <summary className="flex min-h-11 cursor-pointer items-center font-semibold">연결 실패·영어·청각 지원 보기</summary>
        <div className="mt-2 grid gap-3 text-white/85 md:grid-cols-3">
          <p><strong className="text-white">연결 실패</strong><br />약 5초 안에 안 되면 즉시 재시도하고, 다음 시도는 최대 60초 기다리세요. 무망 지역에서는 가능하고 안전할 때 유선·공중전화·Wi-Fi calling·주변 도움을 이용하세요.</p>
          <p><strong className="text-white">영어가 어려울 때</strong><br />TIS를 먼저 거치지 말고 000에서 Police, Fire 또는 Ambulance를 말한 뒤 연결을 유지해 통역을 요청하세요.</p>
          <p><strong className="text-white">청각·언어 접근</strong><br />TTY는 106을 이용합니다. 다른 방법은 <a href={accessHubUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center underline underline-offset-4">Accesshub/NRS 공식 안내 ↗</a></p>
        </div>
      </details>
    </section>
  );
}

function ResultCard({ item, jurisdiction }: { item: HelpSituation; jurisdiction: string }) {
  const facts = [
    ["이용할 때", item.useWhen],
    ["이 서비스가 아닌 경우", item.notFor],
    ["시간 · 지역", `${item.availability} · ${item.region}`],
    ["이용 조건", item.eligibility],
    ["연결되지 않을 때", item.connectionFallback],
    ["다음 확인", item.nextService],
  ];
  return (
    <article id="matched-help-next-action" aria-live="polite" className="mt-6 scroll-mt-4 rounded-2xl border-2 border-gold bg-white p-5 shadow-[0_14px_35px_rgba(15,31,61,0.08)] sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy">Matched help · 지금 할 일</p>
      <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-muted">{item.label}{item.needsJurisdiction ? ` · ${jurisdiction}` : ""}</p>
          <h3 className="mt-1 text-2xl font-semibold text-navy">{item.service}</h3>
          <p className="mt-2 max-w-3xl text-base leading-7 text-navy">{item.now}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <ActionLink action={item.primary} />
          {item.secondary ? <ActionLink action={item.secondary} /> : null}
        </div>
      </div>
      <div className="mt-6 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {facts.map(([title, body]) => (
          <div key={title} className="bg-surface p-4">
            <h4 className="text-sm font-semibold text-navy">{title}</h4>
            <p className="mt-1 text-sm leading-6 text-muted">{body}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-4 border-t border-border pt-5 md:grid-cols-2">
        <p className="text-sm leading-6 text-muted"><strong className="text-navy">통역</strong><br />{item.languageFallback}</p>
        <p className="text-sm leading-6 text-muted"><strong className="text-navy">청각·언어 접근</strong><br />{item.accessFallback}</p>
      </div>
      <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <span>공식 정보 확인일 {item.verifiedOn}</span>
        <a href={item.source} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">공식 출처 확인 ↗</a>
      </div>
    </article>
  );
}

export function HelpDirectory() {
  const [selected, setSelected] = useState<HelpSituationId | null>(null);
  const [jurisdiction, setJurisdiction] = useState<(typeof jurisdictions)[number]>("관할 모름");
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLocaleLowerCase("ko-KR");
  const searchMatches = useMemo(
    () => normalized
      ? helpSituations.filter((item) => [item.label, item.service, ...item.aliases].some((value) => value.toLocaleLowerCase("ko-KR").includes(normalized)))
      : [],
    [normalized],
  );
  const result = selected ? helpSituations.find((item) => item.id === selected) ?? null : null;

  const choose = (id: HelpSituationId) => {
    setSelected(id);
    requestAnimationFrame(() => {
      document.getElementById(id === "immediate_danger" ? "emergency-help" : "matched-help-next-action")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <>
      <EmergencyCard />
      <section className="mt-8" aria-labelledby="situation-heading">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy">비긴급 도움 찾기</p>
          <h2 id="situation-heading" className="mt-1 text-2xl font-semibold text-navy">지금 가장 가까운 상황을 고르세요</h2>
          <p className="mt-2 text-sm leading-6 text-muted">선택과 검색어는 현재 브라우저 메모리에만 있으며 새로고침하면 사라집니다. 이름·주소·전화번호·위기 상세는 입력하지 마세요.</p>
        </div>
        <div role="group" aria-label="상황 선택" className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {helpSituations.filter((item) => item.id !== "immediate_danger").map((item) => {
            const active = selected === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => choose(item.id)}
                aria-pressed={active}
                className={`${active ? "border-gold bg-gold/15 text-navy shadow-sm" : "border-border bg-white text-muted hover:border-navy/35 hover:text-navy"} min-h-12 rounded-xl border-2 px-3 py-2 text-left text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="mt-5 grid gap-4 rounded-2xl bg-surface p-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <label className="block text-sm font-semibold text-navy">
            서비스 이름·짧은 키워드로 찾기
            <span className="mt-1 block text-xs font-normal leading-5 text-muted">예: 렌트, 오늘 잘 곳, 밥, 비자, 급여, 통역</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
              placeholder="개인정보 없이 짧은 키워드만 입력"
              className="mt-2 min-h-12 w-full rounded-xl border border-border bg-white px-4 text-base text-navy outline-none focus:border-navy focus:ring-2 focus:ring-navy/15"
            />
          </label>
          <button type="button" onClick={() => setQuery("")} disabled={!query} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-navy px-5 text-sm font-semibold text-navy disabled:cursor-not-allowed disabled:opacity-40">검색 지우기</button>
        </div>

        {normalized ? (
          <div className="mt-3" aria-live="polite">
            {searchMatches.length ? (
              <div className="flex flex-wrap gap-2">
                {searchMatches.map((item) => <button key={item.id} type="button" onClick={() => choose(item.id)} className="inline-flex min-h-11 items-center rounded-full border border-navy/25 bg-white px-4 text-sm font-semibold text-navy hover:border-gold">{item.label} 선택</button>)}
              </div>
            ) : (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                <strong>검색 결과가 없어요.</strong> 검색을 지우고 위의 고정 상황을 선택하세요. 비긴급 통역은 <a href={tis.primary.href} className="inline-flex min-h-11 items-center font-semibold underline">TIS 131 450 전화</a>를 이용할 수 있습니다.
              </div>
            )}
          </div>
        ) : null}

        {result?.needsJurisdiction ? (
          <label className="mt-5 block max-w-sm text-sm font-semibold text-navy">
            주·준주 선택
            <select value={jurisdiction} onChange={(event) => setJurisdiction(event.target.value as (typeof jurisdictions)[number])} className="mt-2 min-h-12 w-full rounded-xl border border-border bg-white px-4 text-base text-navy focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/15">
              {jurisdictions.map((item) => <option key={item}>{item}</option>)}
            </select>
            <span className="mt-1 block text-xs font-normal leading-5 text-muted">모르면 national official hub를 먼저 여세요. 위치 권한은 요청하지 않습니다.</span>
          </label>
        ) : null}

        {result && result.id !== "immediate_danger" ? (
          <ResultCard item={result} jurisdiction={jurisdiction} />
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-navy/25 p-6 text-sm leading-6 text-muted">
            <strong className="text-navy">아직 선택하지 않았어요.</strong><br />위 상황 하나를 고르면 지금 연락할 곳, 운영시간, 지역과 이용 조건을 한 장에 보여드려요.
          </div>
        )}
      </section>

      <section className="mt-8 rounded-xl border-l-4 border-amber-500 bg-amber-50 p-5 text-sm leading-7 text-amber-950" aria-labelledby="safety-note">
        <h2 id="safety-note" className="font-semibold">안전 안내</h2>
        <p className="mt-1">이 페이지는 상담·진단·법률·이민 조언이나 긴급 대응을 제공하지 않습니다. 즉시 생명·안전 위험, 진행 중인 범죄, 의료 응급이면 다른 흐름을 멈추고 000에 전화하세요. 비긴급 서비스 정보는 연결된 공식 페이지에서 현재 상태를 다시 확인하세요.</p>
      </section>
    </>
  );
}
