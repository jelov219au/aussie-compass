"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@vercel/analytics";

import { jobMoveSurveyQuestions, type JobMoveSurveyAnswers, type JobMoveSurveyQuestionId } from "@/lib/jobMoveSurvey";

type SubmitState = "idle" | "submitting" | "success" | "error";

const pilotEmailHref = `mailto:support@hojucompass.com?subject=${encodeURIComponent("[Job Move Pro 무료 테스트 신청]")}&body=${encodeURIComponent([
  "지원하려는 직무:",
  "",
  "채용공고 링크:",
  "",
  "최근 관련 경력 한 줄:",
  "",
  "지원 마감일(알고 있다면):",
  "",
  "여권, TFN, 비자번호, 주소, 생년월일 또는 이력서 원문은 보내지 마세요.",
].join("\n"))}`;

export function JobMoveSurveyForm() {
  const startedAt = useRef<number | null>(null);
  const [answers, setAnswers] = useState<Partial<JobMoveSurveyAnswers>>({});
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  function selectAnswer(id: JobMoveSurveyQuestionId, value: string) {
    setAnswers((current) => ({ ...current, [id]: value }));
    setState("idle");
    setMessage("");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (jobMoveSurveyQuestions.some((question) => !answers[question.id])) {
      setState("error");
      setMessage("모든 질문에 하나씩 답해 주세요.");
      return;
    }

    const data = new FormData(event.currentTarget);
    setState("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/job-move-survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          website: data.get("website")?.toString() ?? "",
          startedAt: startedAt.current,
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "응답 전송에 실패했습니다.");
      track("Job Move Survey Completed", { entry: "public_survey" });
      setState("success");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "응답 전송에 실패했습니다.");
    }
  }

  if (state === "success") {
    const highIntent = answers.purchaseLikelihood?.startsWith("7–8점") || answers.purchaseLikelihood?.startsWith("9–10점");

    return (
      <div className="space-y-5" aria-live="polite">
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-7 text-center sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Response received</p>
          <h2 className="mt-3 text-2xl font-semibold text-navy">응답해주셔서 감사합니다.</h2>
          <p className="mt-3 text-sm leading-7 text-muted">제출된 답변은 제품 방향을 결정하는 통계 목적으로만 검토합니다.</p>
        </section>

        {highIntent ? (
          <section className="rounded-2xl bg-navy p-6 text-white sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">Free pilot · 3명</p>
            <h2 className="mt-3 text-2xl font-semibold">실제 채용공고 1개를 무료로 진단받아보세요.</h2>
            <p className="mt-3 text-sm leading-7 text-white/70">공고의 핵심 요구조건, 현재 경력에서 쓸 수 있는 근거, 부족한 근거와 맞춤 면접 질문을 1페이지로 정리해드립니다. 판매나 결제 요청은 없습니다.</p>
            <ul className="mt-5 grid gap-2 text-sm text-white/80 sm:grid-cols-2">
              <li>• 핵심 요구조건 5개</li>
              <li>• 사용할 수 있는 경력 근거 3개</li>
              <li>• 보완할 근거 2개</li>
              <li>• 맞춤 면접 질문 3개</li>
            </ul>
            <a href={pilotEmailHref} onClick={() => track("Job Move Pilot Requested", { entry: "survey_high_intent" })} className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-gold px-5 py-3 text-center font-semibold text-navy sm:w-auto">무료 테스트 신청 이메일 열기</a>
            <p className="mt-4 text-xs leading-5 text-white/55">이메일 앱이 열리면 직무, 공개 채용공고 링크와 관련 경력 한 줄만 입력하세요. 이력서 원문이나 민감정보는 보내지 마세요.</p>
          </section>
        ) : (
          <section className="rounded-2xl border border-border bg-white p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">Product preview</p>
            <h2 className="mt-3 text-xl font-semibold text-navy">어떤 결과물이 나오는지 먼저 확인하세요.</h2>
            <p className="mt-3 text-sm leading-7 text-muted">가상의 경력과 채용공고로 만든 Evidence Pack 샘플을 볼 수 있습니다.</p>
            <a href="/job-move-pro-research-preview" onClick={() => track("Job Move Evidence Preview Opened", { entry: "survey_complete" })} className="mt-5 inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">Evidence Pack 샘플 보기 →</a>
          </section>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="website">웹사이트</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {jobMoveSurveyQuestions.map((question, questionIndex) => (
        <fieldset key={question.id} className="rounded-2xl border border-border bg-white p-5 sm:p-7">
          <legend className="px-1 text-sm font-semibold text-gold">질문 {questionIndex + 1}</legend>
          <p className="mt-1 text-lg font-semibold leading-7 text-navy">{question.prompt}</p>
          <div className="mt-5 grid gap-3">
            {question.options.map((option) => {
              const checked = answers[question.id] === option;
              return (
                <label key={option} className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm leading-6 transition ${checked ? "border-navy bg-navy text-white" : "border-border bg-surface text-navy hover:border-navy/40"}`}>
                  <input
                    type="radio"
                    name={question.id}
                    value={option}
                    checked={checked}
                    onChange={() => selectAnswer(question.id, option)}
                    required
                    className="mt-1 h-4 w-4 shrink-0 accent-gold"
                  />
                  <span>{option}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}

      <div className="rounded-2xl bg-navy p-5 text-white sm:p-7">
        <p className="text-sm leading-6 text-white/70">이 설문은 이름, 이메일, 전화번호, 회사명과 비자 정보를 받지 않습니다. 선택한 답변만 전송됩니다.</p>
        {state === "error" && <p className="mt-4 rounded-lg bg-red-500/15 p-3 text-sm font-semibold text-red-100" role="alert">{message}</p>}
        <button type="submit" disabled={state === "submitting"} className="mt-5 min-h-12 w-full rounded-xl bg-gold px-5 py-3 font-semibold text-navy disabled:cursor-wait disabled:opacity-60">
          {state === "submitting" ? "응답 보내는 중…" : "익명 응답 제출"}
        </button>
      </div>
    </form>
  );
}
