"use client";

import { useEffect, useRef, useState } from "react";
import { wordPuzzles } from "@/data/playMore";
import { puzzleAnswer, puzzleTiles } from "@/lib/playMore";
import styles from "./Playground.module.css";
import { BalancedLetters } from "./BalancedLetters";

type Finish = "solo" | "hint" | "reveal";
export function WordPuzzle() {
  const [step, setStep] = useState(0);
  const [chosen, setChosen] = useState<number[]>([]);
  const [hint, setHint] = useState(false);
  const [results, setResults] = useState<Finish[]>([]);
  const [finished, setFinished] = useState(false);
  const [notice, setNotice] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);
  const puzzle = wordPuzzles[step];
  const tiles = puzzleTiles(puzzle.word);
  const result = results[step];
  const text = chosen.map(id => puzzle.word[id]).join("");
  useEffect(() => {
    if (mounted.current) heading.current?.focus();
    mounted.current = true;
  }, [step, finished]);

  function finish(value: Finish) {
    setResults(current => [...current.slice(0, step), value]);
    setNotice("");
    window.requestAnimationFrame(() => resultRef.current?.focus());
  }
  function check() {
    if (result) return;
    const answer = puzzleAnswer(puzzle.word, chosen);
    if (answer === "correct") finish(hint ? "hint" : "solo");
    else setNotice(answer === "incomplete" ? "빈칸을 모두 채운 뒤 확인해 주세요." : "아직 다른 단어예요. 넣은 글자를 눌러 빼거나 순서를 바꿔봐요.");
  }
  function next() {
    if (!result) return;
    if (step === wordPuzzles.length - 1) setFinished(true);
    else { setStep(value => value + 1); setChosen([]); setHint(false); setNotice(""); }
  }

  return <section id="word-puzzle" className={`${styles.panel} ${styles.puzzlePanel}`} aria-labelledby="puzzle-heading">
    <div className={styles.panelTop}><span className={styles.eyebrow}>03 / WORD MIX</span><span className={styles.chip}>글자 톡톡 · 단어 6개</span></div>
    <h2 id="puzzle-heading" className={styles.panelHeading}>흩어진 호주 말을 모아봐요</h2>
    <p className={styles.subtitle}>글자를 순서대로 눌러 호주식 표현을 완성해요.</p>
    {finished ? <>
      <div className={styles.wordAlbum}>
        <span className={styles.albumEmoji} aria-hidden="true">🎉</span>
        <h3 ref={heading} tabIndex={-1}>호주 말 여섯 개, 만나서 반가워!</h3>
        <p>오늘의 작은 단어 모음집이 완성됐어요.</p>
        <ul>{wordPuzzles.map((item, index) => <li key={item.id}><strong lang="en">{item.word}</strong><span>{item.meaning}</span><small>{results[index] === "solo" ? "스스로 완성 ✓" : results[index] === "hint" ? "힌트와 함께 완성 ✓" : "정답 살펴봄 👀"}</small></li>)}</ul>
      </div>
      <button type="button" className={styles.primaryButton} onClick={() => { setStep(0); setChosen([]); setHint(false); setResults([]); setFinished(false); setNotice(""); }}>여섯 단어 다시 도전 ↺</button>
    </> : <>
      <div className={styles.progressRow}><span>단어 {step + 1} / {wordPuzzles.length}</span><span aria-hidden="true">🔤</span></div>
      <div className={styles.puzzleClue}><span>이 뜻의 호주식 표현은?</span><h3 ref={heading} tabIndex={-1}>{puzzle.meaning}</h3><p>영어 {puzzle.word.length}글자{hint && !result ? ` · 첫 글자는 ${puzzle.word[0]}` : ""}</p></div>
      <BalancedLetters className={styles.letterSlots} label={`만든 단어: ${text || "아직 없음"}`}>{Array.from(puzzle.word, (_, index) => chosen[index] === undefined ? <span key={index} className={styles.emptyTile} aria-hidden="true">·</span> : <button key={index} type="button" className={styles.answerTile} disabled={!!result} aria-label={`${index + 1}번째 글자 ${puzzle.word[chosen[index]]} 빼기`} onClick={() => { setChosen(current => current.filter((_, i) => i !== index)); setNotice(""); }}>{puzzle.word[chosen[index]]}</button>)}</BalancedLetters>
      {!result && <>
        <p className={styles.tileInstruction}>아래 글자를 골라요. 위에 넣은 글자는 다시 누르면 빠져요.</p>
        <BalancedLetters className={styles.letterBank} label="고를 글자">{tiles.map(tile => <button type="button" key={tile.id} className={styles.letterTile} disabled={chosen.includes(tile.id)} aria-label={`글자 ${tile.letter}, 타일 ${tile.id + 1}`} onClick={() => { setChosen(current => current.includes(tile.id) ? current : [...current, tile.id]); setNotice(""); }}>{tile.letter}</button>)}</BalancedLetters>
        <div className={styles.actions}><button type="button" className={styles.primaryButton} disabled={chosen.length !== puzzle.word.length} onClick={check}>맞춰보기 ✓</button><button type="button" className={styles.textButton} disabled={!chosen.length} onClick={() => { setChosen([]); setNotice(""); }}>글자 비우기</button></div>
        <div className={styles.actions}><button type="button" className={styles.textButton} disabled={hint} onClick={() => { setHint(true); setNotice(`첫 글자는 ${puzzle.word[0]}예요. 나머지 글자도 모아봐요.`); }}>{hint ? "첫 글자 힌트 사용함" : "첫 글자 힌트"}</button><button type="button" className={styles.textButton} onClick={() => { setChosen(Array.from(puzzle.word, (_, index) => index)); finish("reveal"); }}>정답 보고 배우기</button></div>
      </>}
      {notice && <p className={styles.storageNote} role="status">{notice}</p>}
      {result && <div ref={resultRef} tabIndex={-1} className={styles.quizResult}>
        <strong>{result === "reveal" ? "오늘은 이렇게 기억해요 👀" : "맞았어요! 글자들이 제자리를 찾았네요 🥳"}</strong>
        <p><b lang="en">{puzzle.word}</b> · {puzzle.explanation}</p><a href={puzzle.source} target="_blank" rel="noreferrer">뜻 확인: ABC Education ↗</a>
        <div className={styles.actions}><button type="button" className={styles.smallButton} onClick={next}>{step === wordPuzzles.length - 1 ? "나의 단어 모음집 보기 →" : "다음 단어 →"}</button></div>
      </div>}
    </>}
    <p className={styles.finePrint}>시간 제한 없이 즐겨요. 힌트나 정답을 봐도 괜찮아요. 진행 기록은 저장되지 않아 새로고침하면 처음부터 시작해요.</p>
  </section>;
}
