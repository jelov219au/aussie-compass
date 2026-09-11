"use client";

import { useEffect, useRef, useState } from "react";
import { dailyPlayStorageKey, emptyDailyPlayAnswers, millisecondsToSydneyMidnight, parseDailyPlayAnswers,
  validPlayDate, type DailyPlayAnswers, type DailyPlayResponse, type DailyPlaySet } from "@/lib/dailyPlay";
import { puzzleTiles } from "@/lib/playMore";
import styles from "./Playground.module.css";
import { BalancedLetters } from "./BalancedLetters";
import { WordExplanation } from "./WordExplanation";

function DailySession({ set }: { set: DailyPlaySet }) {
  const [answers, setAnswers] = useState(() => emptyDailyPlayAnswers(set));
  const state = useRef(answers);
  const [ready, setReady] = useState(false);
  const blocked = useRef(false);
  const [note, setNote] = useState("이 브라우저의 마지막 한 세트만 저장해요.");
  const [puzzleNote, setPuzzleNote] = useState("");
  const quizResult = useRef<HTMLDivElement>(null), puzzleResult = useRef<HTMLDivElement>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(dailyPlayStorageKey);
      if (raw) {
        const parsed = parseDailyPlayAnswers(raw, set);
        if (parsed) { state.current = parsed; setAnswers(parsed); setNote("날짜와 문항이 일치하는 마지막 답을 불러왔어요."); }
        else {
          let previousDate = false;
          try { const old = JSON.parse(raw); previousDate = raw.length <= 4096 && old?.version === 2 && validPlayDate(old.date) && old.date !== set.date; } catch { /* Preserve unreadable records. */ }
          blocked.current = !previousDate;
          setNote(previousDate ? "다른 날짜의 답은 이 문제에 적용하지 않아요. 새 답을 고르면 마지막 세트 기록을 교체해요." : "문항이 달라졌거나 기록을 읽을 수 없어요. 기존 기록을 보존하며 저장 없이 즐길 수 있어요.");
        }
      }
    } catch { blocked.current = true; setNote("브라우저 저장을 사용할 수 없어요. 저장 없이 즐길 수 있어요."); }
    setReady(true);
  }, [set]);
  function update(patch: Partial<DailyPlayAnswers>) {
    if (!ready) return;
    const next = { ...state.current, ...patch };
    state.current = next; setAnswers(next);
    if (!blocked.current) {
      try { localStorage.setItem(dailyPlayStorageKey, JSON.stringify(next)); setNote("이번 세트의 진행을 이 브라우저에 저장했어요."); }
      catch { blocked.current = true; setNote("진행은 유지되지만 저장하지 못했어요. 새로고침하면 사라질 수 있어요."); }
    }
  }
  function finish(reveal = false) {
    if (state.current.finish) return;
    const value = state.current.tiles.map(id => set.puzzle.word[id]).join("");
    if (!reveal && value !== set.puzzle.word) { setPuzzleNote("아직 다른 단어예요. 넣은 글자를 눌러 빼고 다시 맞춰봐요."); return; }
    update({ tiles: reveal ? Array.from(set.puzzle.word, (_, id) => id) : state.current.tiles,
      finish: reveal ? "reveal" : state.current.hint ? "hint" : "solo" });
    setPuzzleNote(""); window.requestAnimationFrame(() => puzzleResult.current?.focus());
  }
  const complete = answers.quiz !== null && answers.finish && answers.choice !== null;
  return <div data-daily-session-ready={ready}>
    <div className={styles.dailyCards}>
      <section className={`${styles.dailyCard} ${styles.quizPanel}`} aria-labelledby="new-quiz-heading">
        <span className={styles.eyebrow}>01 / 알아가는 한 문제</span>
        <h3 id="new-quiz-heading">{set.quiz.question}</h3>
        <div className={styles.quizOptions}>{set.quiz.choices.map((text, i) => <button key={text} type="button" disabled={!ready || answers.quiz !== null}
          className={`${styles.option} ${answers.quiz !== null && i === set.quiz.answer ? styles.correct : ""} ${answers.quiz === i && i !== set.quiz.answer ? styles.incorrect : ""}`}
          onClick={() => { if (state.current.quiz !== null) return; update({ quiz: i }); window.requestAnimationFrame(() => quizResult.current?.focus()); }}>
          <span className={styles.optionLetter}>{String.fromCharCode(65 + i)}</span><span>{text}</span>{answers.quiz === i && <span className={styles.picked}>내 선택</span>}
        </button>)}</div>
        {answers.quiz !== null && <div className={styles.quizResult} ref={quizResult} tabIndex={-1}>
          <strong>{answers.quiz === set.quiz.answer ? "정답이에요! 🥳" : "새로운 발견이에요 👀"}</strong>
          <p>정답: {set.quiz.choices[set.quiz.answer]}</p><p>{set.quiz.explanation}</p>
          <a href={set.quiz.source.url} target="_blank" rel="noreferrer">출처 원문 보기 · 영어(새 창) ↗</a>
          <small>{set.quiz.source.title}</small>
          <small>확인 {set.quiz.source.checkedAt}</small>
        </div>}
      </section>
      <section className={`${styles.dailyCard} ${styles.puzzlePanel}`} aria-labelledby="new-puzzle-heading">
        <span className={styles.eyebrow}>02 / 글자 톡톡</span><h3 id="new-puzzle-heading">{set.puzzle.meaning}</h3>
        <p className={styles.subtitle}>영어 {set.puzzle.word.length}글자 · 넣은 글자를 누르면 빠져요.</p>
        <BalancedLetters className={styles.letterSlots} label="내가 만든 단어">{Array.from(set.puzzle.word, (_, i) => answers.tiles[i] === undefined ? <span key={i} className={styles.emptyTile} aria-hidden="true">·</span>
          : <button key={i} type="button" className={styles.answerTile} disabled={!ready || !!answers.finish} aria-label={`${i + 1}번째 글자 ${set.puzzle.word[answers.tiles[i]]} 빼기`}
            onClick={() => { update({ tiles: state.current.tiles.filter((_, index) => index !== i) }); setPuzzleNote(""); }}>{set.puzzle.word[answers.tiles[i]]}</button>)}</BalancedLetters>
        {!answers.finish && <>
          <BalancedLetters className={styles.letterBank} label="오늘 퍼즐의 고를 글자">{puzzleTiles(set.puzzle.word).map(tile => <button key={tile.id} type="button" className={styles.letterTile} disabled={!ready || answers.tiles.includes(tile.id)}
            aria-label={`글자 ${tile.letter}, 타일 ${tile.id + 1}`} onClick={() => { if (!state.current.tiles.includes(tile.id)) update({ tiles: [...state.current.tiles, tile.id] }); setPuzzleNote(""); }}>{tile.letter}</button>)}</BalancedLetters>
          <div className={styles.actions}><button type="button" className={styles.primaryButton} disabled={!ready || answers.tiles.length !== set.puzzle.word.length} onClick={() => finish()}>맞춰보기 ✓</button>
            <button type="button" className={styles.textButton} disabled={!ready || answers.hint} onClick={() => update({ hint: true })}>첫 글자 힌트</button>
            <button type="button" className={styles.textButton} disabled={!ready} onClick={() => finish(true)}>정답 보고 배우기</button></div>
          {answers.hint && <p className={styles.storageNote}>첫 글자는 {set.puzzle.word[0]}예요.</p>}
        </>}
        {puzzleNote && <p role="status" className={styles.storageNote}>{puzzleNote}</p>}
        {answers.finish && <div className={styles.quizResult} ref={puzzleResult} tabIndex={-1}><strong lang="en">{set.puzzle.word}</strong>
          <p>{answers.finish === "solo" ? "스스로 완성 ✓" : answers.finish === "hint" ? "힌트와 함께 완성 ✓" : "정답 살펴봄 👀"}</p>
          <WordExplanation {...set.puzzle} />
          <a href={set.puzzle.source.url} target="_blank" rel="noreferrer">출처 원문 보기 · 영어(새 창) ↗</a><small>{set.puzzle.source.title} · 확인 {set.puzzle.source.checkedAt}</small></div>}
      </section>
      <section className={`${styles.dailyCard} ${styles.balancePanel}`} aria-labelledby="new-choice-heading">
        <span className={styles.eyebrow}>03 / 상상 한 스푼</span><h3 id="new-choice-heading">{set.choice.question}</h3>
        <p className={styles.subtitle}>재미로 고르는 창작 질문 · 정답도 실제 투표율도 없어요.</p>
        <div className={styles.quizOptions}>{set.choice.choices.map((text, i) => <button key={text} type="button" className={`${styles.option} ${answers.choice === i ? styles.correct : ""}`} aria-pressed={answers.choice === i} disabled={!ready} onClick={() => update({ choice: i })}>{text}</button>)}</div>
        {answers.choice !== null && <p className={styles.balanceReaction} role="status">{set.choice.reactions[answers.choice]}</p>}
      </section>
    </div>
    {complete && <p className={styles.dailyComplete} role="status">세 가지 모두 만나봤어요! 내일의 작은 발견도 기대해요 ☀️</p>}
    <p className={styles.storageNote} role="status">{note} 다른 브라우저·설치형 앱과 자동 공유되지 않아요.</p>
    <button type="button" className={styles.textButton} disabled={!ready} onClick={() => {
      try { localStorage.removeItem(dailyPlayStorageKey); blocked.current = false; state.current = emptyDailyPlayAnswers(set); setAnswers(state.current); setPuzzleNote(""); setNote("새 문제 기록을 지웠어요. 이 세트를 다시 풀 수 있어요."); }
      catch { setNote("기록을 지우지 못했어요. 현재 진행은 유지됩니다."); }
    }}>새 문제 기록 지우고 다시 풀기</button>
  </div>;
}

export function DailyPlay() {
  const [data, setData] = useState<DailyPlayResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const current = useRef<DailyPlayResponse | null>(null);
  const controller = useRef<AbortController | null>(null);
  const alive = useRef(true);
  const loadRef = useRef<(date?: string) => void>(() => {});
  async function load(date?: string) {
    controller.current?.abort();
    const request = new AbortController(); controller.current = request;
    setLoading(true);
    const timeout = window.setTimeout(() => {
      if (!alive.current || controller.current !== request) return;
      request.abort(); setLoading(false);
      setError("새 문제 확인이 오래 걸리고 있어요. 잠시 후 다시 확인해 주세요. 열어둔 문제는 유지됩니다.");
    }, 15000);
    try {
      const response = await fetch(`/api/play/daily${date ? `?date=${encodeURIComponent(date)}` : ""}`, { cache: "no-store", signal: request.signal });
      if (!response.ok) throw Error("unavailable");
      const result: DailyPlayResponse = await response.json();
      if (!validPlayDate(result.today) || !validPlayDate(result.date) || !Array.isArray(result.dates)
        || result.dates.some(day => !validPlayDate(day) || day > result.today)
        || result.set && (result.set.date !== result.date || result.set.date > result.today)) throw Error("invalid response");
      if (request.signal.aborted || !alive.current) return;
      // Keep the same object while polling the same published set, preserving
      // unsaved progress and keyboard focus during midnight/focus refreshes.
      if (current.current?.set && JSON.stringify(result.set) === JSON.stringify(current.current.set)) result.set = current.current.set;
      current.current = result; setData(result); setError("");
    } catch { if (!request.signal.aborted && alive.current) setError("새 문제를 확인하지 못했어요. 인터넷 연결 후 다시 확인해 주세요. 열어둔 문제는 계속 풀 수 있어요."); }
    finally { window.clearTimeout(timeout); if (!request.signal.aborted && alive.current) setLoading(false); }
  }
  useEffect(() => { loadRef.current = load; });
  useEffect(() => {
    alive.current = true; loadRef.current();
    let timer = 0;
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => { loadRef.current(current.current?.date); schedule(); }, millisecondsToSydneyMidnight() + 100);
    };
    const refresh = () => { if (document.visibilityState === "visible") { loadRef.current(current.current?.date); schedule(); } };
    schedule(); document.addEventListener("visibilitychange", refresh); window.addEventListener("focus", refresh); window.addEventListener("online", refresh);
    return () => { alive.current = false; controller.current?.abort(); window.clearTimeout(timer); document.removeEventListener("visibilitychange", refresh); window.removeEventListener("focus", refresh); window.removeEventListener("online", refresh); };
  }, []);
  const old = data && data.date < data.today;
  return <section id="daily-quiz" data-quiz-ready={!!data || !!error} className={`${styles.panel} ${styles.dailyPanel}`} aria-labelledby="daily-heading">
    <div className={styles.panelTop}><span className={styles.eyebrow}>A LITTLE SOMETHING, EVERY DAY</span><span className={styles.chip}>{old ? "지난 문제 다시 풀기" : "오늘의 세 가지"}</span></div>
    <h2 id="daily-heading" className={styles.panelHeading}>하루 한 판, 작은 발견 세 개</h2>
    <p className={styles.subtitle}>{data ? `${data.date} · 시드니 날짜 기준` : "오늘 공개된 문제를 확인하고 있어요…"}</p>
    {old && <div className={styles.dayNotice} role="status"><p>시드니의 오늘은 {data.today}이에요. 지금 문제는 계속 풀 수 있어요.</p><button type="button" className={styles.smallButton} disabled={loading} onClick={() => void load()}>오늘 세트 확인 →</button></div>}
    {error && <p className={styles.storageNote} role="status">{error}</p>}
    {error && <button type="button" className={styles.textButton} disabled={loading} onClick={() => void load(data?.date)}>다시 확인</button>}
    {data?.set ? <DailySession key={`${data.set.id}:${data.set.quiz.id}:${data.set.puzzle.id}:${data.set.choice.id}`} set={data.set} />
      : data && <p className={styles.dayNotice}>이 날짜의 새 세트는 아직 준비되지 않았어요. 아래 지난 문제나 연습 코너를 즐겨 주세요. 기존 문제를 새 문제로 바꿔 표시하지 않아요.</p>}
    <details className={styles.details}><summary>지난 문제 골라보기</summary>
      <div className={styles.archiveDates}>{data?.dates.filter(day => day < data.today).map(day => <button key={day} type="button" className={styles.smallButton} aria-pressed={data.date === day} disabled={loading} onClick={() => void load(day)}>{day}</button>)}</div>
      {data && !data.dates.some(day => day < data.today) && <p>아직 공개된 지난 세트가 없어요. 첫날부터 차곡차곡 모아둘게요.</p>}
      <p>게시일이 지난 검수 완료 세트만 보여요. 미래 문제는 미리 열리지 않아요.</p>
    </details>
  </section>;
}
