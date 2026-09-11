"use client";

import { useEffect, useRef, useState } from "react";
import { dailyQuizzes } from "@/data/playground";
import { dailyQuizIndex, dailyQuizKey, parseDailyAnswer, sydneyDay, type DailyAnswer } from "@/lib/playground";
import styles from "./Playground.module.css";

export function DailyQuiz() {
  const [day, setDay] = useState("");
  const [offset, setOffset] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [saved, setSaved] = useState<DailyAnswer | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [note, setNote] = useState("");
  const dayRef = useRef("");
  const resultRef = useRef<HTMLDivElement>(null);
  const questionRef = useRef<HTMLHeadingElement>(null);

  function restore(nextDay: string) {
    dayRef.current = nextDay;
    setDay(nextDay); setOffset(0); setChoice(null); setSaved(null);
    try {
      const raw = localStorage.getItem(dailyQuizKey);
      const answer = raw === null ? null : parseDailyAnswer(raw);
      if (raw !== null && !answer) {
        setBlocked(true); setNote("기존 퀴즈 기록을 확인하지 못했어요. 이번 답은 저장하지 않고 즐길 수 있어요."); return;
      }
      setBlocked(false);
      if (answer?.day === nextDay) {
        setSaved(answer); setChoice(answer.choice); setNote("이 브라우저에 남긴 오늘의 답을 불러왔어요.");
      } else setNote("오늘의 답 하나만 이 브라우저에 저장해요.");
    } catch { setBlocked(true); setNote("브라우저 저장을 사용할 수 없어요. 게임은 그대로 즐길 수 있어요."); }
  }

  useEffect(() => {
    const refresh = () => { const next = sydneyDay(); if (dayRef.current !== next) restore(next); };
    refresh();
    const timer = window.setInterval(refresh, 60000);
    const visible = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", visible);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", visible); };
  }, []);

  const question = day ? dailyQuizzes[(dailyQuizIndex(day) + offset) % dailyQuizzes.length] : null;
  const answered = choice !== null;
  const correct = question && choice === question.answer;

  function answer(index: number) {
    if (!question || answered || !Number.isInteger(index) || index < 0 || index >= question.choices.length) return;
    const currentDay = sydneyDay();
    if (currentDay !== day) { restore(currentDay); return; }
    setChoice(index);
    if (offset === 0) {
      const record: DailyAnswer = { version: 1, day, questionId: question.id, choice: index };
      setSaved(record);
      if (!blocked) {
        try { localStorage.setItem(dailyQuizKey, JSON.stringify(record)); setNote("오늘의 답을 이 브라우저에 저장했어요."); }
        catch { setNote("답은 확인했지만 저장하지 못했어요. 새로고침하면 기록이 사라질 수 있어요."); }
      }
    }
    // Wait for the explanation to mount before moving keyboard focus.
    window.requestAnimationFrame(() => resultRef.current?.focus());
  }

  function another() {
    if (!answered || offset >= dailyQuizzes.length - 1) return;
    setOffset(value => value + 1); setChoice(null);
    window.requestAnimationFrame(() => questionRef.current?.focus());
  }

  return <section id="practice-quiz" className={`${styles.panel} ${styles.quizPanel}`} aria-labelledby="practice-quiz-heading">
    <div className={styles.panelTop}><span className={styles.eyebrow}>PRACTICE / 기존 표현 퀴즈</span><span className={styles.chip}>기존 14문제 연습</span></div>
    <h2 id="practice-quiz-heading" className={styles.panelHeading}>이 말, 들어봤나요?</h2>
    <p className={styles.subtitle}>{day ? `${day.slice(5).replace("-", "월 ")}일의 추천 연습 · 새 일일 문제와 별개예요` : "연습 문제를 고르고 있어요…"}</p>
    {question && <>
      <div className={styles.wordCard}>
        <p>{question.scene}</p><span className={styles.word} lang="en">{question.word}</span>
        <h3 ref={questionRef} tabIndex={-1}>{question.question}</h3>
      </div>
      <div className={styles.quizOptions} aria-label="정답 선택">
        {question.choices.map((option, index) => <button key={option} type="button" disabled={answered} onClick={() => answer(index)} className={`${styles.option} ${answered && index === question.answer ? styles.correct : ""} ${answered && index === choice && !correct ? styles.incorrect : ""}`}>
          <span className={styles.optionLetter} aria-hidden="true">{answered && index === question.answer ? "✓" : String.fromCharCode(65 + index)}</span>
          <span>{option}</span>{answered && index === choice && <span className={styles.picked}>내 선택</span>}{answered && index === question.answer && <span className="sr-only">정답</span>}
        </button>)}
      </div>
      {answered && <div ref={resultRef} tabIndex={-1} className={styles.quizResult} aria-live="polite">
        <strong>{correct ? "정답! 오늘 호주 말 하나 접수 🥳" : "앗, 오늘 하나 새로 알았네요 👀"}</strong>
        <p>{question.explanation}</p>
        <a href={question.source} target="_blank" rel="noreferrer">뜻 확인: ABC Education ↗</a>
        <div className={styles.actions}>
          {offset < dailyQuizzes.length - 1 ? <button type="button" className={styles.smallButton} onClick={another}>한 문제 더 →</button> : <span>준비한 {dailyQuizzes.length}문제를 모두 봤어요. 멋져요!</span>}
          {offset > 0 && <button type="button" className={styles.textButton} onClick={() => { setOffset(0); setChoice(saved?.choice ?? null); }}>첫 연습 문제로</button>}
        </div>
      </div>}
      <p className={styles.storageNote} role="status">{offset ? "보너스 연습은 기록하지 않아요." : note}</p>
    </>}
    <details className={styles.details}><summary>퀴즈와 기록에 대해</summary><p>처음 공개한 {dailyQuizzes.length}문제 중 시작 문제만 날짜별로 순환해요. 새로운 문제 추가가 아닌 복습이에요. 기존 퀴즈 기록은 그대로 이어서 사용해요. 친근한 대화에서 쓰는 표현이며 상황에 따라 쓰임이 달라질 수 있어요. 다른 브라우저·설치형 앱과 기록이 자동으로 공유되지는 않아요.</p>
      <button type="button" className={styles.textButton} onClick={() => { try { localStorage.removeItem(dailyQuizKey); restore(sydneyDay()); } catch { setNote("기록을 지우지 못했어요. 기존 기록은 유지됩니다."); } }}>이 브라우저의 퀴즈 기록 지우기</button>
    </details>
  </section>;
}
