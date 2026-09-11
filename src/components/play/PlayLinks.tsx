"use client";

import { useEffect } from "react";
import styles from "./Playground.module.css";

const games = [
  ["daily-quiz", "오늘의 한 문제"], ["character-test", "나의 생활 캐릭터"],
  ["word-puzzle", "호주 단어 퍼즐"], ["balance-game", "생활 밸런스 게임"],
] as const;

export function PlayLinks() {
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!games.some(([game]) => game === id)) return;
    const quiz = document.getElementById("daily-quiz");
    if (!quiz) return;
    let cancelled = false, scheduled = false, frame = 0;
    const cancel = () => { cancelled = true; window.cancelAnimationFrame(frame); };
    // The stored daily answer changes the height above later games. Align once
    // after that restore, without pulling users back after they start playing.
    const alignWhenReady = () => {
      if (quiz.dataset.quizReady !== "true" || scheduled) return;
      scheduled = true;
      observer.disconnect();
      void document.fonts.ready.then(() => {
        if (cancelled) return;
        frame = window.requestAnimationFrame(() => {
          if (!cancelled && window.location.hash === `#${id}`) document.getElementById(id)?.scrollIntoView({ block: "start", behavior: "instant" });
        });
      });
    };
    const observer = new MutationObserver(alignWhenReady);
    observer.observe(quiz, { attributes: true, attributeFilter: ["data-quiz-ready"] });
    window.addEventListener("pointerdown", cancel, { once: true, passive: true });
    window.addEventListener("wheel", cancel, { once: true, passive: true });
    window.addEventListener("keydown", cancel, { once: true });
    alignWhenReady();
    return () => {
      cancel(); observer.disconnect();
      window.removeEventListener("pointerdown", cancel);
      window.removeEventListener("wheel", cancel);
      window.removeEventListener("keydown", cancel);
    };
  }, []);

  return <nav className={styles.jumpLinks} aria-label="놀이 고르기">{games.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}</nav>;
}
