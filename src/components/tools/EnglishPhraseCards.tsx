"use client";

import { useEffect, useMemo, useState } from "react";

import { categories, findPhrases, parseSavedPhrases, serializeSavedPhrases, type Phrase, type PhraseCategory } from "@/data/englishPhrases";
import { useLocalPlan } from "@/lib/useLocalPlan";
export type { PhraseCategory } from "@/data/englishPhrases";
const initialSaved: string[] = [];

export function EnglishPhraseCards({ initialCategory = "essential", focusPhraseId }: { initialCategory?: PhraseCategory; focusPhraseId?: string }) {
  const [category, setCategory] = useState<PhraseCategory | "saved" | "all">(initialCategory);
  const [query, setQuery] = useState("");
  const { data: savedIds, update: setSavedIds, storage, saveState, reset } = useLocalPlan("hoju-compass-english-phrase-cards-v1", initialSaved, parseSavedPhrases, serializeSavedPhrases, { initial: "아직 저장한 문장 없음", reset: "문장 선택과 저장본을 초기화했습니다" });
  const [focusedPhraseId, setFocusedPhraseId] = useState(focusPhraseId);
  const [copyFallback, setCopyFallback] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    setCategory(initialCategory);
    setFocusedPhraseId(focusPhraseId);
    setQuery("");
  }, [focusPhraseId, initialCategory]);

  useEffect(() => {
    if (!focusedPhraseId || category !== initialCategory) return;
    const timer = window.setTimeout(() => {
      document.getElementById(`phrase-${focusedPhraseId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [category, focusedPhraseId, initialCategory]);

  const visiblePhrases = useMemo(() => findPhrases(category, query, savedIds), [category, query, savedIds]);

  function toggleSaved(phrase: Phrase) {
    const isSaved = savedIds.includes(phrase.id);
    setSavedIds((current) => isSaved ? current.filter((id) => id !== phrase.id) : [...current, phrase.id]);
    setStatus(isSaved ? `‘${phrase.context}’ 문장을 화면 목록에서 뺐어요. 저장 상태를 확인하세요.` : `‘${phrase.context}’ 문장을 화면 목록에 골랐어요. 저장 상태를 확인하세요.`);
  }

  async function copyText(text: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFallback("");
      setStatus(successMessage);
    } catch {
      setCopyFallback(text);
      setStatus("자동 복사가 되지 않았어요. 아래 요약을 선택해 직접 복사해 주세요.");
    }
  }

  function copyPhrase(phrase: Phrase) {
    void copyText(`${phrase.english}\n${phrase.korean}`, `‘${phrase.context}’ 문장을 복사했어요.`);
  }

  function copyVisible() {
    const text = visiblePhrases.map((phrase) => `${phrase.context}\n${phrase.english}\n${phrase.korean}`).join("\n\n");
    void copyText(text, `${visiblePhrases.length}개 문장을 한 번에 복사했어요.`);
  }

  return (
    <section className="mt-10" aria-labelledby="phrase-card-heading">
      <div className="grid gap-6 border-y border-navy/20 py-7 lg:grid-cols-[1fr_18rem] lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Choose, save, use</p>
          <h2 id="phrase-card-heading" className="mt-2 text-2xl font-semibold tracking-tight text-navy sm:text-3xl">지금 필요한 문장을 골라두세요</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted sm:text-base">상황별로 문장을 확인하고, 자주 쓸 문장은 이 기기에 저장하세요. 영어와 한국어를 함께 복사할 수 있어요.</p>
        </div>
        <label className="block text-sm font-semibold text-navy" htmlFor="phrase-search">
          문장 찾기
          <input id="phrase-search" type="search" value={query} onChange={(event) => { setQuery(event.target.value.slice(0, 80)); if (category !== "saved") setCategory("all"); setFocusedPhraseId(undefined); }} placeholder="예: 수수료, bond, payslip" className="mt-2 min-h-12 w-full border border-border bg-white px-3 text-sm font-normal text-navy outline-none placeholder:text-muted focus:border-gold" />
        </label>
      </div>

      <p role="status" className="mt-4 text-sm text-navy">{saveState}</p>
      {storage === "blocked" && <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm leading-6 text-amber-900">기존 문장 목록을 읽거나 확인하지 못해 원문을 보존하고 자동 저장을 중지했습니다. 문장 검색과 읽기는 계속할 수 있지만 새 선택은 저장되지 않습니다.</p>}
      <p className="mt-3 text-sm text-muted">검색 범위: {category === "saved" ? "저장한 문장 목록" : query.trim() || category === "all" ? "전체 문장" : categories.find(item => item.id === category)?.label}. 상황 버튼을 누르면 검색어를 지우고 해당 상황으로 이동합니다.</p>
      <div className="mt-6 flex gap-x-6 gap-y-2 overflow-x-auto border-b border-border pb-2" role="group" aria-label="상황별 문장 필터">
        {categories.map((item) => (
          <button key={item.id} type="button" aria-pressed={category === item.id} onClick={() => { setCategory(item.id); setQuery(""); setFocusedPhraseId(undefined); }} className={`min-h-11 shrink-0 border-b-2 px-0 text-sm font-semibold transition ${category === item.id ? "border-gold text-navy" : "border-transparent text-muted hover:border-border hover:text-navy"}`}>
            {item.label}{item.id === "saved" ? ` ${savedIds.length}` : ""}
          </button>
        ))}
      </div>

      <div className="mt-6 flex min-h-11 items-center justify-between gap-4">
        <p className="font-mono text-xs text-muted">{String(visiblePhrases.length).padStart(2, "0")} phrases</p>
        <button type="button" onClick={copyVisible} disabled={visiblePhrases.length === 0} className="inline-flex min-h-11 items-center border border-navy px-4 py-2 text-sm font-semibold text-navy transition hover:bg-navy hover:text-white disabled:cursor-not-allowed disabled:opacity-40">현재 문장 모두 복사</button>
      </div>

      {visiblePhrases.length > 0 ? (
        <ol className="mt-4 grid gap-4 lg:grid-cols-2">
          {visiblePhrases.map((phrase, index) => {
            const isSaved = savedIds.includes(phrase.id);
            const isFocused = focusedPhraseId === phrase.id;
            return (
              <li id={`phrase-${phrase.id}`} key={phrase.id} className={`scroll-mt-24 grid min-h-64 grid-rows-[auto_1fr_auto] border bg-white p-5 sm:p-6 ${isFocused ? "border-gold ring-2 ring-gold/20" : "border-border"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div><span className="font-mono text-xs text-gold">{String(index + 1).padStart(2, "0")}</span><p className="mt-2 text-xs font-semibold text-muted">{phrase.context}</p>{isFocused ? <p className="mt-2 text-xs font-semibold text-navy">카드에서 본 문장</p> : null}</div>
                  <button type="button" aria-pressed={isSaved} disabled={storage === "loading"} onClick={() => toggleSaved(phrase)} className={`inline-flex min-h-10 items-center border px-3 text-xs font-semibold transition ${isSaved ? "border-gold bg-gold text-navy" : "border-border text-muted hover:border-gold hover:text-navy"}`}>{isSaved ? "선택됨" : "저장목록에 추가"}</button>
                </div>
                <div className="self-center py-6">
                  <p lang="en" className="text-xl font-semibold leading-8 tracking-tight text-navy sm:text-2xl">{phrase.english}</p>
                  <p className="mt-3 text-sm leading-6 text-muted">{phrase.korean}</p>
                </div>
                <button type="button" onClick={() => copyPhrase(phrase)} className="inline-flex min-h-11 items-center justify-between border-t border-border pt-3 text-sm font-semibold text-navy"><span>영어·한국어 복사</span><span aria-hidden="true">↗</span></button>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="mt-4 border border-dashed border-border bg-surface p-8 text-center">
          <p className="font-semibold text-navy">조건에 맞는 문장이 없어요.</p>
          <p className="mt-2 text-sm leading-6 text-muted">검색어를 지우거나 다른 상황을 선택해 보세요.</p><button type="button" onClick={() => { setQuery(""); setCategory("all"); setFocusedPhraseId(undefined); }} className="mt-3 min-h-11 border border-navy px-4 text-sm font-semibold text-navy">전체 문장 보기</button>
        </div>
      )}

      <p className="mt-4 min-h-6 text-sm leading-6 text-muted" role="status" aria-live="polite">{status}</p>
      {copyFallback && <label className="mt-3 block text-sm text-navy">직접 복사할 문장<textarea readOnly rows={6} value={copyFallback} onFocus={event => event.target.select()} className="mt-2 w-full border border-border p-3 text-sm" /></label>}
      <button type="button" disabled={storage === "loading"} onClick={() => { if (window.confirm("이 브라우저의 저장한 문장 선택 목록을 지울까요?")) reset(); }} className="mt-3 min-h-11 border border-border px-4 text-sm text-navy">문장 저장목록 초기화</button>
      <p className="mt-2 border-l-2 border-gold bg-surface p-4 text-xs leading-6 text-muted">저장한 문장 목록은 지금 사용하는 브라우저에만 남아요. 이름, 전화번호, 계좌번호나 건강 정보는 입력받지 않습니다. 브라우저 데이터를 지우면 저장 목록도 함께 사라질 수 있어요.</p>
    </section>
  );
}
