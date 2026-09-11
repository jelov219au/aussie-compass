"use client";

import { useEffect, useRef, useState } from "react";
import { balanceRounds } from "@/data/playMore";
import { balanceShareText } from "@/lib/playMore";
import styles from "./Playground.module.css";

export function BalanceGame() {
  const [answers, setAnswers] = useState<number[]>([]);
  const [step, setStep] = useState(0);
  const [finished, setFinished] = useState(false);
  const [message, setMessage] = useState("");
  const [fallback, setFallback] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(false);
  const round = balanceRounds[step];
  const selected = round.choices[answers[step]];
  useEffect(() => {
    if (mounted.current) heading.current?.focus();
    mounted.current = true;
  }, [step, finished]);

  function next() {
    if (!selected) return;
    if (step === balanceRounds.length - 1) setFinished(true);
    else setStep(value => value + 1);
  }
  async function copy() {
    const text = balanceShareText(answers);
    if (!text) return;
    try { await navigator.clipboard.writeText(text); setFallback(""); setMessage("복사했어요. 친구에게 보내서 어떤 선택이 같은지 비교해 봐요."); }
    catch { setFallback(text); setMessage("자동 복사가 어려워요. 아래 문구를 선택해 직접 복사해 주세요."); }
  }

  return <section id="balance-game" className={`${styles.panel} ${styles.balancePanel}`} aria-labelledby="balance-heading">
    <div className={styles.panelTop}><span className={styles.eyebrow}>04 / THIS OR THAT</span><span className={styles.chip}>8라운드 · 정답 없음</span></div>
    <h2 id="balance-heading" className={styles.panelHeading}>둘 중 하나만 고른다면?</h2>
    <p className={styles.subtitle}>조금 고민되는 호주 생활, 내 마음은 어느 쪽?</p>
    {finished ? <>
      <div className={styles.balanceResults}>
        <span className={styles.resultStamp}>MY EIGHT PICKS</span>
        <h3 ref={heading} tabIndex={-1}>이렇게 고른 사람이 나야 ✨</h3>
        <ol className={styles.pickList}>{balanceRounds.map((item, index) => {
          const choice = item.choices[answers[index]];
          return <li key={item.topic}><span aria-hidden="true">{choice.emoji}</span><div><small>{index + 1}. {item.topic}</small><strong>{choice.title}</strong></div></li>;
        })}</ol>
      </div>
      <p className={styles.characterDescription}>친구도 골라보면 몇 개나 같을까요? 선택 목록을 보내고 서로의 이유도 들어봐요.</p>
      <div className={styles.actions}><button type="button" className={styles.primaryButton} onClick={copy}>내 선택 8개 복사</button><button type="button" className={styles.textButton} onClick={() => { setFinished(false); setMessage(""); setFallback(""); }}>← 선택 수정하기</button></div>
      {message && <p className={styles.storageNote} role="status">{message}</p>}
      {fallback && <label className={styles.copyFallback}>친구에게 보낼 문구<textarea rows={7} readOnly value={fallback} onFocus={event => event.target.select()} /></label>}
      <button type="button" className={styles.textButton} onClick={() => { setAnswers([]); setStep(0); setFinished(false); setMessage(""); setFallback(""); }}>처음부터 다시 고르기 ↺</button>
    </> : <>
      <div className={styles.progressRow}><span>{step + 1} / {balanceRounds.length} · {round.topic}</span><span aria-hidden="true">⚖️</span></div>
      <progress className={styles.progress} value={step + 1} max={balanceRounds.length} aria-label={`라운드 ${step + 1}/${balanceRounds.length}`} />
      <fieldset className={styles.fieldset}>
        <legend><h3 ref={heading} tabIndex={-1}>{round.question}</h3></legend>
        <div className={styles.balanceChoices}>{round.choices.map((choice, index) => <label key={`${step}-${index}`} className={`${styles.balanceChoice} ${answers[step] === index ? styles.balanceSelected : ""}`}>
          <input type="radio" name={`balance-round-${step}`} checked={answers[step] === index} onChange={() => setAnswers(current => { const nextAnswers = [...current]; nextAnswers[step] = index; return nextAnswers; })} />
          <span className={styles.balanceEmoji} aria-hidden="true">{choice.emoji}</span>
          <strong>{choice.title}</strong><span className={styles.choiceDetail}>{choice.detail}</span>
        </label>)}</div>
      </fieldset>
      <div className={styles.balanceReaction} aria-live="polite">{selected ? selected.reaction : "둘 다 끌려도, 오늘은 딱 하나만 골라요."}</div>
      <div className={styles.stepActions}><button type="button" className={styles.textButton} disabled={step === 0} onClick={() => setStep(value => value - 1)}>← 이전</button><button type="button" className={styles.primaryButton} disabled={!selected} onClick={next}>{step === balanceRounds.length - 1 ? "내 선택 모아보기 ✨" : "다음 고민 →"}</button></div>
    </>}
    <p className={styles.finePrint}>실제 조건이나 추천이 아닌 상상 게임이에요. 선택은 이 화면에만 남고, 새로고침하면 처음부터 시작해요.</p>
  </section>;
}
