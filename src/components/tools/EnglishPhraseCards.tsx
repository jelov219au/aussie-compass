"use client";

import { useEffect, useMemo, useState } from "react";

export type PhraseCategory = "essential" | "bank" | "home" | "work" | "health";

type Phrase = {
  id: string;
  category: PhraseCategory;
  context: string;
  english: string;
  korean: string;
};

const storageKey = "hoju-compass-english-phrase-cards-v1";

const categories: Array<{ id: PhraseCategory | "saved"; label: string }> = [
  { id: "essential", label: "먼저 외울 문장" },
  { id: "bank", label: "은행·휴대폰" },
  { id: "home", label: "집·렌트" },
  { id: "work", label: "직장·급여" },
  { id: "health", label: "병원·약국" },
  { id: "saved", label: "저장한 문장" },
];

const phrases: Phrase[] = [
  { id: "slowly", category: "essential", context: "말이 너무 빠를 때", english: "Sorry, could you say that more slowly?", korean: "죄송하지만 조금 천천히 말씀해 주실 수 있나요?" },
  { id: "different-way", category: "essential", context: "다른 설명이 필요할 때", english: "Could you say that in a different way?", korean: "다른 표현으로 설명해 주실 수 있나요?" },
  { id: "write-down", category: "essential", context: "숫자나 이름을 적어 달라고 할 때", english: "Could you write that down for me?", korean: "그 내용을 적어 주실 수 있나요?" },
  { id: "understood", category: "essential", context: "내가 이해한 내용을 확인할 때", english: "Let me check if I understood correctly.", korean: "제가 제대로 이해했는지 확인해 볼게요." },
  { id: "next-step", category: "essential", context: "다음 행동을 물을 때", english: "What do I need to do next?", korean: "제가 다음으로 무엇을 해야 하나요?" },
  { id: "bank-id", category: "bank", context: "계좌 개설 서류", english: "I’d like to open a transaction account. What ID do I need?", korean: "거래 계좌를 만들고 싶은데 어떤 신분증이 필요한가요?" },
  { id: "bank-fees", category: "bank", context: "계좌 수수료", english: "Are there any monthly, ATM or international transaction fees?", korean: "월 관리비, ATM 또는 해외 결제 수수료가 있나요?" },
  { id: "bank-id-check", category: "bank", context: "신원 확인", english: "Do I need to visit a branch to finish the ID check?", korean: "신원 확인을 끝내려면 지점에 가야 하나요?" },
  { id: "bank-details", category: "bank", context: "계좌 정보", english: "Could you show me where to find my BSB and account number?", korean: "BSB와 계좌번호를 어디에서 확인하는지 보여주실 수 있나요?" },
  { id: "bank-transaction", category: "bank", context: "모르는 거래", english: "I didn’t authorise this transaction. What should I do now?", korean: "제가 승인하지 않은 거래인데 지금 무엇을 해야 하나요?" },
  { id: "rent-inclusions", category: "home", context: "렌트비 포함 항목", english: "Is electricity, gas, water or internet included in the rent?", korean: "전기, 가스, 수도나 인터넷이 렌트비에 포함되나요?" },
  { id: "rent-bond", category: "home", context: "Bond 접수", english: "Who will hold the bond, and how will it be lodged?", korean: "Bond는 누가 보관하고 어떤 방식으로 접수하나요?" },
  { id: "rent-agreement", category: "home", context: "송금 전 계약서", english: "Could you send me the agreement before I pay anything?", korean: "돈을 보내기 전에 계약서를 보내주실 수 있나요?" },
  { id: "rent-condition", category: "home", context: "입주 상태 기록", english: "Could you confirm you received my condition report and photos?", korean: "Condition Report와 사진을 받았는지 확인해 주실 수 있나요?" },
  { id: "rent-notice", category: "home", context: "퇴거 통지", english: "How much notice do I need to give before moving out?", korean: "퇴거 전에 얼마 동안의 통지를 해야 하나요?" },
  { id: "work-rate", category: "work", context: "시급과 등급", english: "Could you confirm my hourly rate and classification in writing?", korean: "시급과 Classification을 글로 확인해 주실 수 있나요?" },
  { id: "work-payslip", category: "work", context: "Payslip 발급", english: "When should I receive my payslip?", korean: "Payslip은 언제 받게 되나요?" },
  { id: "work-hours", category: "work", context: "근무시간과 휴게시간", english: "Which hours and breaks are included here?", korean: "여기에 어떤 근무시간과 휴게시간이 포함됐나요?" },
  { id: "work-difference", category: "work", context: "Roster와 Payslip 차이", english: "I think there may be a difference between my roster and payslip. Could we check it together?", korean: "Roster와 Payslip에 차이가 있는 것 같은데 같이 확인해 볼 수 있을까요?" },
  { id: "work-payroll", category: "work", context: "급여 문의 담당자", english: "Who should I contact if I have a payroll question?", korean: "급여 질문은 누구에게 연락해야 하나요?" },
  { id: "health-interpreter", category: "health", context: "통역 요청", english: "I need a Korean interpreter, please.", korean: "한국어 통역이 필요합니다." },
  { id: "health-form", category: "health", context: "양식 설명", english: "I don’t understand this form. Could you explain this section?", korean: "이 양식을 이해하지 못했는데 이 부분을 설명해 주실 수 있나요?" },
  { id: "health-worse", category: "health", context: "증상이 심해질 때", english: "What should I do if my symptoms get worse?", korean: "증상이 심해지면 어떻게 해야 하나요?" },
  { id: "health-medicine", category: "health", context: "약 이름과 복용법", english: "Could you write down the medicine name and instructions?", korean: "약 이름과 복용 방법을 적어 주실 수 있나요?" },
  { id: "health-avoid", category: "health", context: "복용 중 주의사항", english: "Is there anything I should avoid while taking this medicine?", korean: "이 약을 복용하는 동안 피해야 할 것이 있나요?" },
];

export function EnglishPhraseCards({ initialCategory = "essential", focusPhraseId }: { initialCategory?: PhraseCategory; focusPhraseId?: string }) {
  const [category, setCategory] = useState<PhraseCategory | "saved">(initialCategory);
  const [query, setQuery] = useState("");
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [focusedPhraseId, setFocusedPhraseId] = useState(focusPhraseId);
  const [hydrated, setHydrated] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]");
      if (Array.isArray(stored)) setSavedIds(stored.filter((id): id is string => typeof id === "string"));
    } catch {
      // 저장값을 읽을 수 없으면 빈 목록으로 안전하게 시작합니다.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(storageKey, JSON.stringify(savedIds));
  }, [hydrated, savedIds]);

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

  const visiblePhrases = useMemo(() => {
    const normalisedQuery = query.trim().toLocaleLowerCase();
    return phrases.filter((phrase) => {
      const matchesCategory = category === "saved" ? savedIds.includes(phrase.id) : phrase.category === category;
      const matchesQuery = !normalisedQuery || `${phrase.context} ${phrase.english} ${phrase.korean}`.toLocaleLowerCase().includes(normalisedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [category, query, savedIds]);

  function toggleSaved(phrase: Phrase) {
    const isSaved = savedIds.includes(phrase.id);
    setSavedIds((current) => isSaved ? current.filter((id) => id !== phrase.id) : [...current, phrase.id]);
    setStatus(isSaved ? `‘${phrase.context}’ 문장을 저장 목록에서 뺐어요.` : `‘${phrase.context}’ 문장을 이 기기에 저장했어요.`);
  }

  async function copyText(text: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(text);
      setStatus(successMessage);
    } catch {
      setStatus("자동 복사가 되지 않았어요. 문장을 길게 눌러 직접 복사해 주세요.");
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
          <input id="phrase-search" type="search" value={query} onChange={(event) => setQuery(event.target.value.slice(0, 80))} placeholder="예: 수수료, bond, payslip" className="mt-2 min-h-12 w-full border border-border bg-white px-3 text-sm font-normal text-navy outline-none placeholder:text-muted focus:border-gold" />
        </label>
      </div>

      <div className="mt-6 flex gap-x-6 gap-y-2 overflow-x-auto border-b border-border pb-2" role="group" aria-label="상황별 문장 필터">
        {categories.map((item) => (
          <button key={item.id} type="button" aria-pressed={category === item.id} onClick={() => { setCategory(item.id); setFocusedPhraseId(undefined); }} className={`min-h-11 shrink-0 border-b-2 px-0 text-sm font-semibold transition ${category === item.id ? "border-gold text-navy" : "border-transparent text-muted hover:border-border hover:text-navy"}`}>
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
                  <button type="button" aria-pressed={isSaved} onClick={() => toggleSaved(phrase)} className={`inline-flex min-h-10 items-center border px-3 text-xs font-semibold transition ${isSaved ? "border-gold bg-gold text-navy" : "border-border text-muted hover:border-gold hover:text-navy"}`}>{isSaved ? "저장됨" : "저장"}</button>
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
          <p className="mt-2 text-sm leading-6 text-muted">검색어를 지우거나 다른 상황을 선택해 보세요.</p>
        </div>
      )}

      <p className="mt-4 min-h-6 text-sm leading-6 text-muted" role="status" aria-live="polite">{status}</p>
      <p className="mt-2 border-l-2 border-gold bg-surface p-4 text-xs leading-6 text-muted">저장한 문장 목록은 지금 사용하는 브라우저에만 남아요. 이름, 전화번호, 계좌번호나 건강 정보는 입력받지 않습니다. 브라우저 데이터를 지우면 저장 목록도 함께 사라질 수 있어요.</p>
    </section>
  );
}
