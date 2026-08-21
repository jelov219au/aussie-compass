"use client";

import { useEffect, useRef, useState } from "react";

import { jobMoveSurveyQuestions, type JobMoveSurveyAnswers, type JobMoveSurveyQuestionId } from "@/lib/jobMoveSurvey";

type SubmitState = "idle" | "submitting" | "success" | "error";

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
      setState("success");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "응답 전송에 실패했습니다.");
    }
  }

  if (state === "success") {
    return (
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-7 text-center sm:p-10" aria-live="polite">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Response received</p>
        <h2 className="mt-3 text-2xl font-semibold text-navy">응답해주셔서 감사합니다.</h2>
        <p className="mt-3 text-sm leading-7 text-muted">제출된 답변은 제품 방향을 결정하는 통계 목적으로만 검토합니다.</p>
      </section>
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
