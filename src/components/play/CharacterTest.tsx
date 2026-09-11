"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { characterQuestions, characters } from "@/data/playground";
import { characterResult, characterShareText } from "@/lib/playground";
import { downloadCharacterCard } from "@/lib/playgroundCard";
import styles from "./Playground.module.css";

export function CharacterTest() {
  const [answers, setAnswers] = useState<number[]>([]);
  const [step, setStep] = useState(0);
  const [finished, setFinished] = useState(false);
  const [message, setMessage] = useState("");
  const [copyFallback, setCopyFallback] = useState("");
  const [downloading, setDownloading] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(false);
  const id = finished ? characterResult(answers) : null;
  const character = id ? characters[id] : null;
  const question = characterQuestions[step];

  useEffect(() => {
    if (mounted.current) heading.current?.focus();
    mounted.current = true;
  }, [step, finished]);

  function next() {
    if (!question.options[answers[step]]) return;
    if (step === characterQuestions.length - 1) setFinished(true);
    else setStep(value => value + 1);
  }
  async function copy() {
    if (!id) return;
    const text = characterShareText(id);
    try { await navigator.clipboard.writeText(text); setCopyFallback(""); setMessage("복사했어요. 원하는 곳에 직접 붙여 넣어 보내세요."); }
    catch { setCopyFallback(text); setMessage("자동 복사가 어려워요. 아래 문구를 선택해 복사해 주세요."); }
  }
  async function download() {
    if (!id || downloading) return;
    setDownloading(true);
    try { await downloadCharacterCard(id); setMessage("이미지 다운로드를 요청했어요. 브라우저 다운로드 목록을 확인해 주세요."); }
    catch { setMessage("이미지를 만들지 못했어요. 결과 화면을 캡처하거나 문구를 복사해 주세요."); }
    finally { setDownloading(false); }
  }

  return <section id="character-test" className={`${styles.panel} ${styles.characterPanel}`} aria-labelledby="character-heading">
    <div className={styles.panelTop}><span className={styles.eyebrow}>02 / MY AUSSIE VIBE</span><span className={styles.chip}>5문항 · 약 1분</span></div>
    <h2 id="character-heading" className={styles.panelHeading}>호주에서의 나는?</h2>
    <p className={styles.subtitle}>정답 없이, 지금 더 끌리는 쪽을 골라요.</p>
    {character ? <div className={styles.characterResult}>
      <div className={styles.resultCard} style={{ "--character-color": character.color } as CSSProperties}>
        <span className={styles.resultStamp}>MY HOJU CHARACTER</span>
        <span className={styles.mascot} aria-hidden="true">{character.emoji}</span>
        <p className={styles.resultLabel}>오늘의 나는</p>
        <h3 ref={heading} tabIndex={-1}>{character.name}</h3>
        <p className={styles.catchphrase}>{character.title}</p>
        <p>{character.line}</p>
        <span className={styles.cardBrand}>HOJU COMPASS</span>
      </div>
      <p className={styles.characterDescription}>{character.description}</p>
      <div className={styles.mission}><strong>오늘의 작은 미션</strong><p>{character.mission}</p></div>
      <div className={styles.actions}>
        <button type="button" className={styles.primaryButton} onClick={download} disabled={downloading}>{downloading ? "카드 만드는 중…" : "결과 카드 저장 ↓"}</button>
        <button type="button" className={styles.smallButton} onClick={copy}>친구에게 보낼 문구 복사</button>
      </div>
      {message && <p className={styles.storageNote} role="status">{message}</p>}
      {copyFallback && <label className={styles.copyFallback}>복사할 결과 문구<textarea rows={5} readOnly value={copyFallback} onFocus={event => event.target.select()} /></label>}
      <button type="button" className={styles.textButton} onClick={() => { setAnswers([]); setStep(0); setFinished(false); setMessage(""); setCopyFallback(""); }}>다른 선택으로 다시 해보기 ↺</button>
    </div> : <>
      <div className={styles.progressRow}><span>질문 {step + 1} / {characterQuestions.length}</span><span aria-hidden="true">🦘 🐨 🦜 🐧</span></div>
      <progress className={styles.progress} value={step + 1} max={characterQuestions.length} aria-label={`질문 ${step + 1}/${characterQuestions.length}`} />
      <fieldset className={styles.fieldset}>
        <legend><h3 ref={heading} tabIndex={-1}>{question.question}</h3></legend>
        <div className={styles.characterOptions}>{question.options.map((option, index) => <label key={`${step}-${index}`} className={`${styles.characterOption} ${answers[step] === index ? styles.selected : ""}`}>
          <input type="radio" name={`character-question-${step}`} checked={answers[step] === index} onChange={() => setAnswers(current => { const nextAnswers = [...current]; nextAnswers[step] = index; return nextAnswers; })} />
          <span>{option.text}</span>
        </label>)}</div>
      </fieldset>
      <div className={styles.stepActions}>
        <button type="button" className={styles.textButton} disabled={step === 0} onClick={() => setStep(value => Math.max(0, value - 1))}>← 이전</button>
        <button type="button" className={styles.primaryButton} disabled={answers[step] === undefined} onClick={next}>{step === characterQuestions.length - 1 ? "내 캐릭터 만나기 ✨" : "다음 질문 →"}</button>
      </div>
    </>}
    <p className={styles.finePrint}><span>다섯 가지 선택으로 만드는</span><span>재미용 캐릭터예요.</span></p>
  </section>;
}
