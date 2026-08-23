"use client";

import { useState } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import { ResumeProCtaLink, trackResumeJobAdChecked } from "@/components/analytics/ResumeFunnelAnalytics";
import { resumeFunnelContexts, resumeFunnelSurfaces } from "@/lib/resumeFunnelAnalyticsContract";
import { analyseResumeJobAd, type ResumeJobAdTerm } from "@/lib/resumeJobAdMatch";

const MAX_LENGTH = 12_000;
const sampleResume = `Customer Service Assistant
Provided customer service in a busy retail store and resolved product enquiries.
Processed point of sale payments and cash handling tasks.
Worked with colleagues to restock inventory and keep records accurate.
Used Microsoft Excel to update weekly stock records.`;
const sampleJobAd = `We are looking for a Retail Operations Assistant with strong customer service and communication skills.
Responsibilities include customer service, point of sale transactions, cash handling, inventory management and weekly reporting.
The successful candidate will demonstrate attention to detail, teamwork and confidence using Microsoft Excel.
Weekend availability is required.`;

function trackCheckerShare(method: "native" | "clipboard") {
  try {
    track("Page Shared", { content: "resume_job_ad_checker", method });
  } catch {
    // Analytics must never interrupt sharing or expose local input.
  }
}

function TermRow({ item }: { item: ResumeJobAdTerm }) {
  return (
    <li className="grid gap-3 border-b border-border py-4 last:border-b-0 sm:grid-cols-[minmax(10rem,0.8fr)_1.2fr] sm:items-center">
      <div><strong className="text-navy">{item.term}</strong><span className="ml-2 text-xs text-muted">공고 {item.jobAdOccurrences}회</span></div>
      <div className={`border-l-2 px-3 py-2 text-sm ${item.matched ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-gold bg-surface text-navy"}`}>
        {item.matched ? `이력서에서 문구 확인 · ${item.resumeOccurrences}회` : "이력서에서 바로 찾지 못함 · 실제 근거부터 확인"}
      </div>
    </li>
  );
}

export function ResumeJobAdChecker() {
  const [resumeText, setResumeText] = useState("");
  const [jobAdText, setJobAdText] = useState("");
  const [result, setResult] = useState<ReturnType<typeof analyseResumeJobAd> | null>(null);
  const [message, setMessage] = useState("");
  const [resultActionMessage, setResultActionMessage] = useState("");

  function compare() {
    if (resumeText.trim().length < 80 || jobAdText.trim().length < 80) {
      setResult(null);
      setMessage("이력서와 공고를 각각 80자 이상 붙여 넣어 주세요. 이름·연락처와 회사 내부정보는 먼저 지워도 됩니다.");
      return;
    }
    const next = analyseResumeJobAd(resumeText, jobAdText);
    if (!next.terms.length) {
      setResult(null);
      setMessage("비교할 영문 표현을 충분히 찾지 못했어요. Job Ad의 업무와 요구사항 부분을 조금 더 포함해 주세요.");
      return;
    }
    setResult(next);
    setMessage("비교가 끝났어요. 일치 여부는 문구 확인일 뿐, 경력의 사실 여부나 채용 가능성을 판정하지 않습니다.");
    setResultActionMessage("");
    trackResumeJobAdChecked();
  }

  function loadSample() {
    setResumeText(sampleResume);
    setJobAdText(sampleJobAd);
    setResult(null);
    setMessage("가상 예시를 불러왔어요. 비교하기를 눌러 결과 구조를 확인해 보세요.");
    setResultActionMessage("");
  }

  function clear() {
    setResumeText("");
    setJobAdText("");
    setResult(null);
    setMessage("입력 내용을 이 화면에서 지웠습니다.");
    setResultActionMessage("");
  }

  async function copyEvidenceMemo() {
    if (!result) return;
    const matched = result.terms.filter((item) => item.matched).map((item) => `• ${item.term}`);
    const missing = result.terms.filter((item) => !item.matched).map((item) => `• ${item.term} — 언제, 어떤 행동을 했고 어떤 결과가 있었는지 확인`);
    const memo = [
      "Hoju Compass · Job Ad 맞춤 근거 메모",
      "",
      `현재 이력서에서 문구 확인 ${result.matchedCount}개`,
      ...(matched.length ? matched : ["• 없음"]),
      "",
      `추가 전 실제 경험 근거 확인 ${result.missingCount}개`,
      ...(missing.length ? missing : ["• 없음"]),
      "",
      "공고 문구를 그대로 복사하거나 없는 경험을 만들지 않습니다.",
      "https://hojucompass.com/resume-job-ad-checker",
    ].join("\n");

    try {
      await navigator.clipboard.writeText(memo);
      setResultActionMessage("공고 원문이나 이력서 원문 없이, 표현 후보와 근거 질문만 복사했습니다.");
    } catch {
      setResultActionMessage("이 브라우저에서는 자동 복사가 어렵습니다. 결과 항목을 직접 선택해 복사해 주세요.");
    }
  }

  async function shareChecker() {
    const url = `${window.location.origin}/resume-job-ad-checker`;
    const shareData = {
      title: "호주 이력서·Job Ad 공고 맞춤 근거 점검기",
      text: "이력서와 Job Ad를 서버 전송 없이 비교하고, 실제 경험 근거부터 확인해 보세요.",
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        trackCheckerShare("native");
        setResultActionMessage("공유 메뉴를 열었습니다. 입력한 이력서와 공고 원문은 공유되지 않습니다.");
        return;
      }
      await navigator.clipboard.writeText(url);
      trackCheckerShare("clipboard");
      setResultActionMessage("점검기 링크만 복사했습니다. 입력한 이력서와 공고 원문은 포함되지 않습니다.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setResultActionMessage("주소창의 점검기 링크를 복사해 공유해 주세요. 입력 원문은 링크에 포함되지 않습니다.");
    }
  }

  return (
    <div className="space-y-8">
      <section className="border border-navy/15 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="job-ad-input-heading">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Local comparison</p><h2 id="job-ad-input-heading" className="mt-2 text-2xl font-semibold text-navy">이력서와 Job Ad 붙여 넣기</h2></div>
          <button type="button" onClick={loadSample} className="min-h-11 border-b-2 border-gold text-sm font-semibold text-navy">가상 예시로 먼저 보기</button>
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">입력 내용은 서버로 보내거나 브라우저에 저장하지 않습니다. 이름, 전화번호, 이메일, 주소, 추천인 연락처, 회사 기밀은 지우고 붙여 넣어도 비교할 수 있어요.</p>
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <label className="block"><span className="text-sm font-semibold text-navy">현재 이력서 영문 텍스트</span><textarea value={resumeText} onChange={(event) => { setResumeText(event.target.value.slice(0, MAX_LENGTH)); setResult(null); }} rows={13} spellCheck={false} placeholder="PDF나 DOCX에서 필요한 영문 부분만 복사해 붙여 넣으세요." className="mt-2 w-full resize-y border border-border bg-surface p-4 text-sm leading-6 text-navy outline-none focus:border-gold" /><span className="mt-1 block text-right font-mono text-xs text-muted">{resumeText.length.toLocaleString()} / {MAX_LENGTH.toLocaleString()}</span></label>
          <label className="block"><span className="text-sm font-semibold text-navy">지원할 Job Ad 영문 텍스트</span><textarea value={jobAdText} onChange={(event) => { setJobAdText(event.target.value.slice(0, MAX_LENGTH)); setResult(null); }} rows={13} spellCheck={false} placeholder="업무, 필수·우대 조건이 포함된 공고 본문을 붙여 넣으세요." className="mt-2 w-full resize-y border border-border bg-surface p-4 text-sm leading-6 text-navy outline-none focus:border-gold" /><span className="mt-1 block text-right font-mono text-xs text-muted">{jobAdText.length.toLocaleString()} / {MAX_LENGTH.toLocaleString()}</span></label>
        </div>
        <div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={compare} className="min-h-12 bg-navy px-6 py-3 text-sm font-semibold text-white">공고 맞춤 근거 점검하기</button><button type="button" onClick={clear} className="min-h-12 border border-border px-5 py-3 text-sm font-semibold text-muted hover:text-red-700">입력 내용 지우기</button></div>
        <p className="mt-4 min-h-6 text-sm leading-6 text-muted" aria-live="polite">{message}</p>
      </section>

      {result ? <section className="border-y border-navy/20 py-8" aria-labelledby="job-ad-result-heading">
        <div className="grid gap-6 lg:grid-cols-[1fr_18rem] lg:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Evidence check</p><h2 id="job-ad-result-heading" className="mt-2 text-2xl font-semibold text-navy">공고 표현 후보와 현재 이력서</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-muted">공고에서 반복되거나 구직과 관련 있는 표현 후보만 비교했습니다. ‘찾음’은 같은 문구가 있다는 뜻이지, 실제 경험이 충분하다는 뜻은 아닙니다.</p></div><dl className="grid grid-cols-2 gap-px bg-border text-center"><div className="bg-white p-4"><dt className="text-xs text-muted">문구 확인</dt><dd className="mt-1 text-3xl font-semibold text-emerald-700">{result.matchedCount}</dd></div><div className="bg-white p-4"><dt className="text-xs text-muted">근거 확인</dt><dd className="mt-1 text-3xl font-semibold text-gold-ink">{result.missingCount}</dd></div></dl></div>
        <ul className="mt-6 border-t border-border">{result.terms.map((item) => <TermRow key={item.term} item={item} />)}</ul>
        <div className="mt-7 border-l-2 border-gold bg-surface p-5"><h3 className="font-semibold text-navy">빠진 표현을 그대로 추가하지 마세요</h3><p className="mt-2 text-sm leading-6 text-muted">먼저 “내가 실제로 언제, 어떤 행동을 했고 어떤 결과가 있었는가?”를 답할 수 있는지 확인하세요. 근거가 있을 때만 내 말로 작성하고, 없으면 공고 문구를 복사하거나 AI로 경험을 만들지 않습니다.</p></div>
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2"><button type="button" onClick={copyEvidenceMemo} className="inline-flex min-h-11 items-center border-b-2 border-gold text-sm font-semibold text-navy">근거 메모 복사</button><button type="button" onClick={shareChecker} className="inline-flex min-h-11 items-center border-b-2 border-border text-sm font-semibold text-navy">점검기 링크 공유 ↗</button></div>
        <p className="mt-2 min-h-5 text-xs leading-5 text-muted" aria-live="polite">{resultActionMessage}</p>
        <div className="mt-7 grid gap-3 sm:grid-cols-2"><Link href="/resume-builder" className="inline-flex min-h-12 items-center justify-center bg-navy px-5 py-3 text-center font-semibold text-white">확인한 사실로 무료 이력서 수정하기</Link><ResumeProCtaLink href="/resume-pro?from=job-ad-checker" surface={resumeFunnelSurfaces.jobAdCheckerResult} context={resumeFunnelContexts.jobAdChecker} className="inline-flex min-h-12 items-center justify-center border border-navy/30 px-5 py-3 text-center font-semibold text-navy">공고별 지원서 묶음으로 이어가기</ResumeProCtaLink></div>
        <p className="mt-4 text-xs leading-5 text-muted">Resume Pro는 지원할 공고가 정해졌고 같은 실제 경험을 이력서·커버레터·면접 메모에 다시 연결해야 할 때만 검토하세요. 면접이나 취업 결과를 보장하지 않습니다.</p>
      </section> : null}
    </div>
  );
}
