"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import { ResumeProCtaLink, trackResumeJobAdChecked, trackResumeJobAdSampleViewed } from "@/components/analytics/ResumeFunnelAnalytics";
import { resumeFunnelContexts, resumeFunnelSurfaces } from "@/lib/resumeFunnelAnalyticsContract";
import { analyseResumeJobAd, type ResumeJobAdTerm } from "@/lib/resumeJobAdMatch";
import { clearResumeJobAdProofSummary, saveResumeJobAdProofSummary } from "@/lib/resumeJobAdProofHandoff";

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
  const [resultKind, setResultKind] = useState<"real" | "sample" | null>(null);
  const [handoffStatus, setHandoffStatus] = useState<"ready" | "unavailable" | null>(null);
  const [message, setMessage] = useState("");
  const [resultActionMessage, setResultActionMessage] = useState("");
  const [jobAdCopyMessage, setJobAdCopyMessage] = useState("");
  const [memoFallback, setMemoFallback] = useState("");
  const [shareFallback, setShareFallback] = useState("");
  const revealResultRef = useRef(false);
  const resumeInputRef = useRef<HTMLTextAreaElement>(null);
  const jobAdInputRef = useRef<HTMLTextAreaElement>(null);
  const priorityTerms = result
    ? (result.missingCount > 0
      ? result.terms.filter((item) => !item.matched)
      : result.terms.filter((item) => item.matched)
    ).slice(0, 3)
    : [];

  useEffect(() => {
    if (!result || !revealResultRef.current) return;
    revealResultRef.current = false;
    const heading = document.getElementById("job-ad-result-heading");
    heading?.focus({ preventScroll: true });
    heading?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
  }, [result]);

  function invalidateResult() {
    const cleared = clearResumeJobAdProofSummary();
    setResult(null);
    setResultKind(null);
    setHandoffStatus(cleared ? null : "unavailable");
    setResultActionMessage("");
    setMemoFallback("");
    setShareFallback("");
  }

  function compare() {
    const invalidResume = resumeText.trim().length < 80 || resumeText.length > MAX_LENGTH;
    const invalidJobAd = jobAdText.trim().length < 80 || jobAdText.length > MAX_LENGTH;
    if (invalidResume || invalidJobAd) {
      const cleared = clearResumeJobAdProofSummary();
      setResult(null);
      setResultKind(null);
      setHandoffStatus(cleared ? null : "unavailable");
      const target = invalidResume ? resumeInputRef.current : jobAdInputRef.current;
      target?.focus();
      const label = invalidResume ? "이력서" : "Job Ad";
      const length = invalidResume ? resumeText.length : jobAdText.length;
      setMessage(length > MAX_LENGTH
        ? `${label} 원문 ${length.toLocaleString()}자를 그대로 남겨 두었습니다. ${(length - MAX_LENGTH).toLocaleString()}자 초과이므로 업무·필수·우대 조건 중심으로 12,000자 이하로 직접 줄인 뒤 비교해 주세요.`
        : `${label} 영문 텍스트를 80자 이상 입력해 주세요. 다른 입력 원문은 그대로 남아 있습니다.`);
      return;
    }
    const cleared = clearResumeJobAdProofSummary();
    const next = analyseResumeJobAd(resumeText, jobAdText);
    if (!next.terms.length) {
      setResult(null);
      setResultKind(null);
      setHandoffStatus(cleared ? null : "unavailable");
      setMessage("비교할 영문 표현을 충분히 찾지 못했어요. Job Ad의 업무와 요구사항 부분을 조금 더 포함해 주세요.");
      return;
    }
    revealResultRef.current = true;
    setResult(next);
    setResultKind("real");
    setMessage("비교가 끝났어요. 일치 여부는 문구 확인일 뿐, 경력의 사실 여부나 채용 가능성을 판정하지 않습니다.");
    setResultActionMessage("");
    setJobAdCopyMessage("");
    setMemoFallback("");
    setShareFallback("");
    const saved = cleared && saveResumeJobAdProofSummary(next);
    setHandoffStatus(saved ? "ready" : "unavailable");
    trackResumeJobAdChecked();
  }

  function loadSample() {
    if ((resumeText.length > 0 || jobAdText.length > 0 || result) && !window.confirm("현재 입력과 결과를 가상 예시로 바꿀까요? 원문은 이 화면에만 있으므로 필요한 내용은 먼저 본인 파일에 보관해 주세요.")) return;
    const cleared = clearResumeJobAdProofSummary();
    const next = analyseResumeJobAd(sampleResume, sampleJobAd);
    setResumeText(sampleResume);
    setJobAdText(sampleJobAd);
    revealResultRef.current = true;
    setResult(next);
    setResultKind("sample");
    setHandoffStatus(cleared ? null : "unavailable");
    setMessage("가상 예시 결과를 열었어요. 일치 문구와 실제 경험을 확인할 질문이 어떻게 나뉘는지 먼저 살펴보세요.");
    setResultActionMessage("");
    setJobAdCopyMessage("");
    setMemoFallback("");
    setShareFallback("");
    trackResumeJobAdSampleViewed();
  }

  function clear() {
    if ((resumeText.length > 0 || jobAdText.length > 0 || result) && !window.confirm("현재 입력과 결과를 모두 지울까요? 원문은 이 화면에만 있으므로 필요한 내용은 먼저 본인 파일에 보관해 주세요.")) return;
    if (!clearResumeJobAdProofSummary()) {
      setHandoffStatus("unavailable");
      setMessage("현재 탭의 이전 Pro 인계 요약을 확인해 지우지 못해 입력을 그대로 두었습니다. 브라우저 저장소를 사용할 수 있을 때 다시 시도해 주세요.");
      return;
    }
    setResumeText("");
    setJobAdText("");
    setResult(null);
    setResultKind(null);
    setHandoffStatus(null);
    revealResultRef.current = false;
    setMessage("입력 내용을 이 화면에서 지웠습니다.");
    setResultActionMessage("");
    setJobAdCopyMessage("");
    setMemoFallback("");
    setShareFallback("");
  }

  function buildEvidenceMemo() {
    if (!result) return;
    const matched = result.terms.filter((item) => item.matched).map((item) => `• ${item.term}`);
    const missing = result.terms.filter((item) => !item.matched).map((item) => `• ${item.term} — 언제, 어떤 행동을 했고 어떤 결과가 있었는지 확인`);
    const priority = priorityTerms.map((item, index) => [
      `${index + 1}. ${item.term}`,
      "   - 언제·어디서 한 일인가?",
      "   - 내가 직접 한 행동은 무엇인가?",
      "   - 숫자·변화·피드백으로 확인할 결과가 있는가?",
    ].join("\n"));
    return [
      "Hoju Compass · Job Ad 맞춤 근거 메모",
      "",
      `현재 이력서에서 문구 확인 ${result.matchedCount}개`,
      ...(matched.length ? matched : ["• 없음"]),
      "",
      `추가 전 실제 경험 근거 확인 ${result.missingCount}개`,
      ...(missing.length ? missing : ["• 없음"]),
      "",
      "이번 지원 준비 우선순위",
      ...priority,
      "",
      "공고 문구를 그대로 복사하거나 없는 경험을 만들지 않습니다.",
      "https://hojucompass.com/resume-job-ad-checker",
    ].join("\n");
  }

  function downloadEvidenceMemo() {
    const memo = buildEvidenceMemo();
    if (!memo) return;
    setMemoFallback("");
    try {
      const url = URL.createObjectURL(new Blob([memo], { type: "text/plain;charset=utf-8" }));
      try {
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "resume-job-ad-evidence-memo.txt";
        anchor.click();
      } finally {
        URL.revokeObjectURL(url);
      }
      setResultActionMessage("TXT 내려받기를 요청했습니다. 브라우저의 다운로드 목록에서 파일 저장 여부를 확인해 주세요. 저장됐다면 다음 지원에서 파일을 다시 열어 재사용할 수 있어요. 공고·이력서 원문은 포함하지 않았습니다.");
    } catch {
      setMemoFallback(memo);
      setResultActionMessage("TXT 내려받기를 시작하지 못했습니다. 아래 전체 메모를 선택해 본인 파일에 저장해 주세요.");
    }
  }

  async function copyEvidenceMemo() {
    const memo = buildEvidenceMemo();
    if (!memo) return;

    try {
      await navigator.clipboard.writeText(memo);
      setMemoFallback("");
      setResultActionMessage("공고 원문이나 이력서 원문 없이, 표현 후보와 근거 질문만 복사했습니다.");
    } catch {
      setMemoFallback(memo);
      setResultActionMessage("자동 복사를 완료하지 못했습니다. 아래 전체 메모를 선택해 복사해 주세요.");
    }
  }

  async function copyJobAdForPro() {
    const jobAd = jobAdText.trim();
    if (!jobAd) return;

    try {
      await navigator.clipboard.writeText(jobAd);
      setJobAdCopyMessage("Job Ad 원문을 클립보드에 복사했습니다. Pro 작업공간의 ‘채용 공고’에 직접 붙여 넣으세요.");
    } catch {
      setJobAdCopyMessage("이 브라우저에서는 자동 복사가 어렵습니다. 위 Job Ad 입력란의 원문을 직접 선택해 복사해 주세요.");
      jobAdInputRef.current?.focus();
      jobAdInputRef.current?.select();
    }
  }

  async function shareChecker() {
    const url = `${window.location.origin}/resume-job-ad-checker`;
    const shareData = {
      title: "호주 이력서·Job Ad 공고 맞춤 근거 점검기",
      text: "이력서와 Job Ad를 서버 전송 없이 비교하고, 실제 경험 근거부터 확인해 보세요.",
      url,
    };

    setShareFallback("");
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        trackCheckerShare("native");
        setResultActionMessage("공유 메뉴를 열었습니다. 입력한 이력서와 공고 원문은 공유되지 않습니다.");
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      trackCheckerShare("clipboard");
      setResultActionMessage("점검기 링크만 복사했습니다. 입력한 이력서와 공고 원문은 포함되지 않습니다.");
    } catch {
      setShareFallback(url);
      setResultActionMessage("자동 공유와 링크 복사를 완료하지 못했습니다. 아래의 깨끗한 점검기 링크를 선택해 복사해 주세요.");
    }
  }

  return (
    <div className="space-y-8">
      <section className="border border-navy/15 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="job-ad-input-heading">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Local comparison</p><h2 id="job-ad-input-heading" className="mt-2 text-2xl font-semibold text-navy">이력서와 Job Ad 붙여 넣기</h2></div>
          <button type="button" onClick={loadSample} className="min-h-11 border-b-2 border-gold text-sm font-semibold text-navy">가상 예시 결과 바로 보기</button>
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">붙여 넣은 원문은 서버로 보내거나 브라우저에 저장하지 않습니다. 점검을 마치면 표현 후보와 확인 상태만 현재 탭에 최대 30분 남겨 Pro에서 이어 쓸 수 있어요. 이름, 전화번호, 이메일, 주소, 추천인 연락처, 회사 기밀은 먼저 지워도 비교할 수 있습니다.</p>
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-navy">현재 이력서 영문 텍스트</span>
            <textarea ref={resumeInputRef} value={resumeText} onChange={(event) => { invalidateResult(); setResumeText(event.target.value); }} rows={13} spellCheck={false} placeholder="PDF나 DOCX에서 필요한 영문 부분만 복사해 붙여 넣으세요." aria-invalid={resumeText.length > MAX_LENGTH} className="mt-2 w-full resize-y border border-border bg-surface p-4 text-sm leading-6 text-navy outline-none focus:border-gold" />
            <span className={`mt-1 block text-right font-mono text-xs ${resumeText.length > MAX_LENGTH ? "font-semibold text-red-700" : "text-muted"}`}>{resumeText.length.toLocaleString()} / {MAX_LENGTH.toLocaleString()}{resumeText.length > MAX_LENGTH ? ` · ${(resumeText.length - MAX_LENGTH).toLocaleString()}자 초과` : ""}</span>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-navy">지원할 Job Ad 영문 텍스트</span>
            <textarea ref={jobAdInputRef} value={jobAdText} onChange={(event) => { invalidateResult(); setJobAdText(event.target.value); setJobAdCopyMessage(""); }} rows={13} spellCheck={false} placeholder="업무, 필수·우대 조건이 포함된 공고 본문을 붙여 넣으세요." aria-invalid={jobAdText.length > MAX_LENGTH} className="mt-2 w-full resize-y border border-border bg-surface p-4 text-sm leading-6 text-navy outline-none focus:border-gold" />
            <span className={`mt-1 block text-right font-mono text-xs ${jobAdText.length > MAX_LENGTH ? "font-semibold text-red-700" : "text-muted"}`}>{jobAdText.length.toLocaleString()} / {MAX_LENGTH.toLocaleString()}{jobAdText.length > MAX_LENGTH ? ` · ${(jobAdText.length - MAX_LENGTH).toLocaleString()}자 초과` : ""}</span>
          </label>
        </div>
        <div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={compare} className="min-h-12 bg-navy px-6 py-3 text-sm font-semibold text-white">공고 맞춤 근거 점검하기</button><button type="button" onClick={clear} className="min-h-12 border border-border px-5 py-3 text-sm font-semibold text-muted hover:text-red-700">입력 내용 지우기</button></div>
        <p className="mt-4 min-h-6 text-sm leading-6 text-muted" aria-live="polite">{message}</p>
      </section>

      {result ? <section className="border-y border-navy/20 py-8" aria-labelledby="job-ad-result-heading">
        <div className="grid gap-6 lg:grid-cols-[1fr_18rem] lg:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Evidence check</p><h2 id="job-ad-result-heading" tabIndex={-1} className="mt-2 scroll-mt-24 text-2xl font-semibold text-navy focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-4">공고 표현 후보와 현재 이력서</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-muted">공고에서 반복되거나 구직과 관련 있는 표현 후보만 비교했습니다. ‘찾음’은 같은 문구가 있다는 뜻이지, 실제 경험이 충분하다는 뜻은 아닙니다.</p></div><dl className="grid grid-cols-2 gap-px bg-border text-center"><div className="bg-white p-4"><dt className="text-xs text-muted">문구 확인</dt><dd className="mt-1 text-3xl font-semibold text-emerald-700">{result.matchedCount}</dd></div><div className="bg-white p-4"><dt className="text-xs text-muted">근거 확인</dt><dd className="mt-1 text-3xl font-semibold text-gold-ink">{result.missingCount}</dd></div></dl></div>
        <ul className="mt-6 border-t border-border">{result.terms.map((item) => <TermRow key={item.term} item={item} />)}</ul>
        <div className="mt-7 border-l-2 border-gold bg-surface p-5"><h3 className="font-semibold text-navy">빠진 표현을 그대로 추가하지 마세요</h3><p className="mt-2 text-sm leading-6 text-muted">먼저 “내가 실제로 언제, 어떤 행동을 했고 어떤 결과가 있었는가?”를 답할 수 있는지 확인하세요. 근거가 있을 때만 내 말로 작성하고, 없으면 공고 문구를 복사하거나 AI로 경험을 만들지 않습니다.</p></div>
        <section className="mt-7 border border-navy/15 bg-white p-5 sm:p-6" aria-labelledby="inventory-example-heading">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Fictional action example · 자동 삽입 아님</p>
          <h3 id="inventory-example-heading" className="mt-2 text-xl font-semibold text-navy">오늘 한 문장을 고치는 순서</h3>
          <ol className="mt-4 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
            <li className="bg-surface p-4 text-sm leading-6 text-muted"><strong className="block text-navy">1 · 원문 조건 표시</strong><span className="font-mono text-xs">inventory management</span></li>
            <li className="bg-white p-4 text-sm leading-6 text-muted"><strong className="block text-navy">2 · 내 실제 사례 1개</strong>소매점에서 매주 재고를 세고 Excel 목록의 차이를 책임자에게 보고했다.</li>
            <li className="bg-white p-4 text-sm leading-6 text-muted"><strong className="block text-navy">3 · 사실일 때만 영문 수정</strong><span lang="en">Counted stock weekly, updated the Excel inventory list and reported discrepancies to the supervisor.</span></li>
            <li className="bg-white p-4 text-sm leading-6 text-muted"><strong className="block text-navy">4 · 공고와 다시 대조</strong>필수·우대 구분과 원문에서 빠진 조건도 직접 확인한다.</li>
          </ol>
          <p className="mt-4 text-sm leading-6 text-muted">‘표현 없음’이 곧 경험 없음이라는 뜻은 아닙니다. 다른 말로 쓴 실제 근거부터 찾으세요. 재고 발주나 예산을 직접 관리하지 않았다면 <span lang="en">Managed inventory budgets</span> 또는 매출 개선 20% 같은 내용을 넣지 말고, 확인한 빈도와 행동만 적으세요. 사실이 없으면 요구사항을 충족했다고 쓰지 않습니다.</p>
        </section>
        <section className="mt-7 border border-navy/15 bg-white p-5 sm:p-6" aria-labelledby="evidence-priority-heading">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Your next evidence</p>
          <h3 id="evidence-priority-heading" className="mt-2 text-xl font-semibold text-navy">이번 지원 준비 우선순위</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            {result.missingCount > 0
              ? "아래 표현부터 실제 사례가 있는지 확인하세요. 답할 수 없는 항목은 이력서에 추가하지 않습니다."
              : "문구는 확인됐지만 사실의 깊이까지 확인된 것은 아닙니다. 아래 표현부터 면접에서도 설명할 수 있는 사례로 점검하세요."}
          </p>
          <ol className="mt-5 grid gap-4 lg:grid-cols-3">
            {priorityTerms.map((item, index) => <li key={item.term} className="border-t-2 border-gold bg-surface p-4">
              <div className="flex items-start gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-semibold text-white" aria-hidden="true">{index + 1}</span><strong className="pt-0.5 text-navy">{item.term}</strong></div>
              <ul className="mt-3 space-y-2 pl-10 text-sm leading-5 text-muted">
                <li>언제·어디서 한 일인가?</li>
                <li>내가 직접 한 행동은 무엇인가?</li>
                <li>숫자·변화·피드백으로 확인할 결과가 있는가?</li>
              </ul>
            </li>)}
          </ol>
          <p className="mt-4 text-xs leading-5 text-muted">최대 3개만 먼저 보여줍니다. 근거 메모를 복사하면 같은 질문을 원문 없이 가져갈 수 있어요.</p>
        </section>
        <div className="mt-6 flex flex-wrap gap-3"><button type="button" onClick={downloadEvidenceMemo} className="inline-flex min-h-12 items-center bg-navy px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2">근거 메모 TXT 저장</button><button type="button" onClick={copyEvidenceMemo} className="inline-flex min-h-11 items-center border-b-2 border-gold px-2 text-sm font-semibold text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">근거 메모 복사</button><button type="button" onClick={shareChecker} className="inline-flex min-h-11 items-center border-b-2 border-border px-2 text-sm font-semibold text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">점검기 링크 공유 ↗</button></div>
        <p className="mt-2 min-h-5 text-xs leading-5 text-muted" aria-live="polite">{resultActionMessage}</p>
        {memoFallback ? <label className="mt-3 block"><span className="text-xs font-semibold text-navy">전체 근거 메모 · 선택해서 복사</span><textarea value={memoFallback} readOnly rows={12} onFocus={(event) => event.currentTarget.select()} className="mt-2 w-full resize-y border border-gold bg-surface p-3 font-mono text-xs leading-5 text-navy" /></label> : null}
        {shareFallback ? <label className="mt-3 block"><span className="text-xs font-semibold text-navy">깨끗한 점검기 링크 · 선택해서 복사</span><input value={shareFallback} readOnly onFocus={(event) => event.currentTarget.select()} className="mt-2 w-full border border-gold bg-surface p-3 font-mono text-xs text-navy" /></label> : null}
        <section className="mt-7 border border-navy/20 bg-white p-5 sm:p-6" aria-labelledby="job-ad-next-step-heading" aria-describedby="job-ad-next-step-description">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Resume Pro가 줄이는 반복 · 현재 결과로 결정하기</p>
          <h3 id="job-ad-next-step-heading" className="mt-2 text-xl font-semibold text-navy">이번 이력서만 고칠지, 이 회사 지원서를 저장할지 선택하세요.</h3>
          <p id="job-ad-next-step-description" className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            현재 결과는 문구 확인 {result.matchedCount}개 · 실제 근거 확인 {result.missingCount}개입니다. 이 개수는 합격 점수가 아니에요. 이번 한 번만 고치면 무료 TXT와 Builder로 끝내고, 같은 근거를 회사별 지원서로 다시 열어 비교해야 하면 Pro 저장 결과를 확인하세요.
          </p>
          <p className="mt-3 max-w-3xl text-xs leading-5 text-muted">무료 점검의 이력서·공고 원문은 저장되지 않습니다. {resultKind === "real" && handoffStatus === "ready" ? "이 실제 비교의 표현 후보와 확인 상태만 현재 탭에 최대 30분 남아요." : resultKind === "sample" ? "가상 예시는 내 Pro 결과로 이어지지 않아요." : "현재 브라우저에서는 Pro 인계 요약을 확인해 저장하지 못했습니다. 화면 결과와 TXT는 계속 사용할 수 있어요."}</p>
          <ol className="mt-5 grid gap-px bg-border sm:grid-cols-3" aria-label="무료 점검과 Resume Pro 저장 가치 비교">
            <li className="bg-surface p-4"><span className="font-mono text-xs text-muted">01 · 무료 저장</span><strong className="mt-2 block text-navy">근거 메모 TXT 저장</strong><span className="mt-1 block text-xs leading-5 text-muted">원문 없이 표현 후보와 근거 질문을 저장해 다음 지원에서 파일로 다시 열어요.</span></li>
            <li className="bg-white p-4"><span className="font-mono text-xs text-muted">02 · 회사별</span><strong className="mt-2 block text-navy">경력 + 실제 공고 저장</strong><span className="mt-1 block text-xs leading-5 text-muted">저장된 Builder 경력과 공고를 공고별 이력서·커버레터·면접 메모로 묶어요.</span></li>
            <li className="bg-white p-4"><span className="font-mono text-xs text-muted">03 · 다음 지원</span><strong className="mt-2 block text-navy">다시 열어 나란히 비교</strong><span className="mt-1 block text-xs leading-5 text-muted">회사별 버전의 마감일·지원 상태를 저장하고, 확인한 근거와 체크리스트를 다시 열어요.</span></li>
          </ol>
          <div className="mt-4 border-l-2 border-gold bg-surface p-4">
            <p className="text-sm font-semibold text-navy">결제 후 같은 공고를 다시 찾지 않도록 준비하세요.</p>
            <p className="mt-1 text-xs leading-5 text-muted">원문은 저장·자동 전달되지 않습니다. 아래 버튼을 직접 누르면 현재 Job Ad만 클립보드에 복사되며, Pro 작업공간에서 사용자가 직접 붙여 넣습니다.</p>
            <button type="button" onClick={copyJobAdForPro} className="mt-3 min-h-12 border border-navy bg-white px-4 text-sm font-semibold text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">Job Ad 원문 복사</button>
            <p className="mt-2 min-h-5 text-xs leading-5 text-muted" aria-live="polite">{jobAdCopyMessage}</p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {resultKind === "real" && handoffStatus === "ready" ? <ResumeProCtaLink href="/resume-pro?from=job-ad-checker" surface={resumeFunnelSurfaces.jobAdCheckerResult} context={resumeFunnelContexts.jobAdChecker} className="flex min-h-12 flex-col items-center justify-center bg-navy px-5 py-3 text-center font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"><span>회사별 지원서 저장 방식 비교하기</span><span className="mt-1 text-xs font-medium text-white/75">이 실제 비교의 표현 후보와 확인 상태가 이어져요</span></ResumeProCtaLink> : <div className="flex min-h-12 flex-col items-center justify-center border border-border bg-surface px-5 py-3 text-center font-semibold text-muted" aria-disabled="true"><span>회사별 지원서 저장 방식 비교하기</span><span className="mt-1 text-xs font-medium">{resultKind === "sample" ? "가상 예시는 Pro에 이어지지 않아요" : "현재 탭의 Pro 인계를 확인하지 못했어요"}</span></div>}
            <Link href="/resume-builder" className="inline-flex min-h-12 items-center justify-center border border-navy/30 px-5 py-3 text-center font-semibold text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">이번 이력서만 무료로 수정하기</Link>
          </div>
          <p className="mt-4 text-xs leading-5 text-muted">Resume Pro는 지원할 공고가 정해졌고 회사별 버전을 저장·재열기·비교해야 할 때만 검토하세요. 입력하지 않은 경험을 만들거나 면접·취업 결과를 보장하지 않습니다.</p>
        </section>
      </section> : null}
    </div>
  );
}
