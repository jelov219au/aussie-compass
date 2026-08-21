"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "hoju-compass-job-move-interviews-v1";
const participantIds = ["P01", "P02", "P03", "P04", "P05"] as const;
const reactions = ["강함", "보통", "약함", "확인 안 함"] as const;
const recruitmentMessage = `안녕하세요. 호주에서 더 나은 직장으로 옮길 때 필요한 구직 준비 도구를 검토하고 있습니다.

최근 3개월 안에 실제 채용 공고를 보고 지원했거나 지원을 준비한 분을 대상으로 약 5분 동안 경험을 듣고, 가상 결과물 하나에 대한 의견을 받고 싶습니다.

판매나 결제 요청은 없으며 이름, 회사명, 여권, TFN, 주소 같은 개인정보도 받지 않습니다. 영어 실력을 평가하는 인터뷰도 아닙니다.

가능하시다면 편한 시간에 5분 정도 의견 부탁드려요.`;

type ParticipantId = (typeof participantIds)[number];
type Reaction = (typeof reactions)[number];

type InterviewRecord = {
  participantId: ParticipantId;
  role: string;
  currentJobType: string;
  biggestProblem: string;
  currentAlternative: string;
  evidenceReaction: Reaction;
  interviewReaction: Reaction;
  questionReaction: Reaction;
  offerReaction: Reaction;
  priceScore: number;
  paymentBlocker: string;
  realTestAgreement: boolean;
  notes: string;
  updatedAt: string;
};

const emptyRecord = (participantId: ParticipantId): InterviewRecord => ({
  participantId,
  role: "",
  currentJobType: "",
  biggestProblem: "",
  currentAlternative: "",
  evidenceReaction: "확인 안 함",
  interviewReaction: "확인 안 함",
  questionReaction: "확인 안 함",
  offerReaction: "확인 안 함",
  priceScore: 0,
  paymentBlocker: "",
  realTestAgreement: false,
  notes: "",
  updatedAt: "",
});

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-2 block text-sm font-semibold text-navy">{children}</span>;
}

export function JobMoveResearchRecorder() {
  const [records, setRecords] = useState<InterviewRecord[]>([]);
  const [form, setForm] = useState<InterviewRecord>(() => emptyRecord("P01"));
  const [status, setStatus] = useState<"idle" | "saved" | "copied" | "error">("idle");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setRecords(JSON.parse(saved) as InterviewRecord[]);
    } catch {
      setStatus("error");
    }
  }, []);

  const completedCount = records.length;
  const strongEvidenceCount = records.filter((record) => record.evidenceReaction === "강함").length;
  const highPriceCount = records.filter((record) => record.priceScore >= 7).length;
  const testAgreementCount = records.filter((record) => record.realTestAgreement).length;
  const preliminaryDecision = useMemo(() => {
    if (completedCount < 3) return "인터뷰가 3건 이상 모이면 1차 판단을 시작하세요.";
    if (strongEvidenceCount >= 3 && highPriceCount >= 2 && testAgreementCount >= 2) return "현재 기록은 Go 기준에 가까워요. 실제 공고 테스트를 진행하세요.";
    if (highPriceCount <= 1) return "현재는 구매 근거가 약해요. 결제를 막는 이유를 먼저 수정하세요.";
    return "일부 가치가 확인됐어요. 강한 반응이 나온 기능을 중심으로 범위를 줄이세요.";
  }, [completedCount, strongEvidenceCount, highPriceCount, testAgreementCount]);

  function update<K extends keyof InterviewRecord>(key: K, value: InterviewRecord[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setStatus("idle");
  }

  function selectParticipant(participantId: ParticipantId) {
    const saved = records.find((record) => record.participantId === participantId);
    setForm(saved ?? emptyRecord(participantId));
    setStatus("idle");
  }

  function saveRecord() {
    try {
      const updated = { ...form, updatedAt: new Date().toISOString() };
      const next = [...records.filter((record) => record.participantId !== updated.participantId), updated].sort((a, b) =>
        a.participantId.localeCompare(b.participantId),
      );
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setRecords(next);
      setForm(updated);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  function deleteRecord(participantId: ParticipantId) {
    const next = records.filter((record) => record.participantId !== participantId);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setRecords(next);
    if (form.participantId === participantId) setForm(emptyRecord(participantId));
    setStatus("idle");
  }

  async function copyRecruitmentMessage() {
    try {
      await navigator.clipboard.writeText(recruitmentMessage);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
  }

  function downloadBackup() {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), records }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `job-move-interviews-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-7">
      <section className="rounded-2xl border border-border bg-white p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">참가자 모집</p>
            <h2 className="mt-2 text-xl font-semibold text-navy">그대로 복사해서 보낼 수 있는 메시지</h2>
          </div>
          <button type="button" onClick={copyRecruitmentMessage} className="min-h-11 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
            {status === "copied" ? "복사 완료" : "메시지 복사"}
          </button>
        </div>
        <p className="mt-4 whitespace-pre-line rounded-xl bg-surface p-4 text-sm leading-6 text-muted">{recruitmentMessage}</p>
      </section>

      <section className="rounded-2xl border border-border bg-white p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">인터뷰 기록</p>
        <h2 className="mt-2 text-xl font-semibold text-navy">이름 대신 참가자 번호만 사용하세요.</h2>
        <p className="mt-2 text-sm leading-6 text-muted">TFN, 여권, 생년월일, 주소, 회사 실명과 연락처는 입력하지 마세요. 기록은 이 브라우저에만 저장됩니다.</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {participantIds.map((id) => (
            <button key={id} type="button" onClick={() => selectParticipant(id)} className={`min-h-11 rounded-lg border px-4 text-sm font-semibold ${form.participantId === id ? "border-navy bg-navy text-white" : "border-border bg-white text-navy"}`}>
              {id}{records.some((record) => record.participantId === id) ? " ✓" : ""}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label>
            <FieldLabel>최근 지원 직무</FieldLabel>
            <input value={form.role} onChange={(event) => update("role", event.target.value)} placeholder="예: Operations Coordinator" className="w-full rounded-lg border border-border bg-background px-4 py-3 text-navy" />
          </label>
          <label>
            <FieldLabel>현재 직장 유형</FieldLabel>
            <select value={form.currentJobType} onChange={(event) => update("currentJobType", event.target.value)} className="w-full rounded-lg border border-border bg-background px-4 py-3 text-navy">
              <option value="">선택</option>
              <option>한인잡</option>
              <option>현지 소규모 직장</option>
              <option>정식 채용 회사</option>
              <option>현재 무직·구직 중</option>
              <option>기타</option>
            </select>
          </label>
        </div>

        <label className="mt-5 block">
          <FieldLabel>가장 큰 문제</FieldLabel>
          <textarea value={form.biggestProblem} onChange={(event) => update("biggestProblem", event.target.value)} rows={3} placeholder="참가자의 표현을 짧게 기록" className="w-full rounded-lg border border-border bg-background px-4 py-3 text-navy" />
        </label>

        <label className="mt-5 block">
          <FieldLabel>현재 사용한 대체 방법</FieldLabel>
          <textarea value={form.currentAlternative} onChange={(event) => update("currentAlternative", event.target.value)} rows={2} placeholder="예: ChatGPT, 번역기, 지인, 직접 작성" className="w-full rounded-lg border border-border bg-background px-4 py-3 text-navy" />
        </label>

        <fieldset className="mt-6">
          <legend className="text-sm font-semibold text-navy">샘플 기능별 반응</legend>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {([
              ["evidenceReaction", "Evidence mapping"],
              ["interviewReaction", "면접 사례 정리"],
              ["questionReaction", "맞춤 면접 질문"],
              ["offerReaction", "Offer 비교"],
            ] as const).map(([key, label]) => (
              <label key={key}>
                <FieldLabel>{label}</FieldLabel>
                <select value={form[key]} onChange={(event) => update(key, event.target.value as Reaction)} className="w-full rounded-lg border border-border bg-background px-4 py-3 text-navy">
                  {reactions.map((reaction) => <option key={reaction}>{reaction}</option>)}
                </select>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="mt-6 block">
          <div className="flex items-center justify-between gap-4">
            <FieldLabel>A$19.90 지불 가능성</FieldLabel>
            <strong className="text-xl text-navy">{form.priceScore}/10</strong>
          </div>
          <input type="range" min="0" max="10" step="1" value={form.priceScore} onChange={(event) => update("priceScore", Number(event.target.value))} className="w-full accent-navy" />
          <span className="mt-1 block text-xs text-muted">“지원 마감이 3일 남았다면”이라는 구체적인 상황을 제시한 뒤 기록하세요.</span>
        </label>

        <label className="mt-5 block">
          <FieldLabel>결제를 막는 가장 큰 이유</FieldLabel>
          <textarea value={form.paymentBlocker} onChange={(event) => update("paymentBlocker", event.target.value)} rows={2} className="w-full rounded-lg border border-border bg-background px-4 py-3 text-navy" />
        </label>

        <label className="mt-5 flex items-start gap-3 rounded-xl border border-border bg-surface p-4">
          <input type="checkbox" checked={form.realTestAgreement} onChange={(event) => update("realTestAgreement", event.target.checked)} className="mt-1 h-4 w-4 accent-navy" />
          <span><strong className="block text-sm text-navy">실제 공고 무료 테스트 참여 의향</strong><span className="mt-1 block text-xs leading-5 text-muted">연락처는 이 화면에 적지 말고 별도 동의를 받은 안전한 연락수단으로 관리하세요.</span></span>
        </label>

        <label className="mt-5 block">
          <FieldLabel>추가 메모</FieldLabel>
          <textarea value={form.notes} onChange={(event) => update("notes", event.target.value)} rows={3} className="w-full rounded-lg border border-border bg-background px-4 py-3 text-navy" />
        </label>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button type="button" onClick={saveRecord} className="min-h-12 rounded-lg bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-navy-light">이 기기에 저장</button>
          {records.some((record) => record.participantId === form.participantId) && (
            <button type="button" onClick={() => deleteRecord(form.participantId)} className="min-h-12 rounded-lg border border-red-200 px-5 py-3 text-sm font-semibold text-red-700">이 기록 삭제</button>
          )}
          {status === "saved" && <span className="text-sm font-semibold text-emerald-700">저장했습니다.</span>}
          {status === "error" && <span role="alert" className="text-sm font-semibold text-red-700">저장 또는 복사에 실패했습니다.</span>}
        </div>
      </section>

      <section className="rounded-2xl bg-navy p-5 text-white sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">현재 결과</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="bg-white/10 p-4"><strong className="text-2xl">{completedCount}</strong><span className="mt-1 block text-xs text-white/60">완료</span></div>
          <div className="bg-white/10 p-4"><strong className="text-2xl">{strongEvidenceCount}</strong><span className="mt-1 block text-xs text-white/60">Evidence 강함</span></div>
          <div className="bg-white/10 p-4"><strong className="text-2xl">{highPriceCount}</strong><span className="mt-1 block text-xs text-white/60">가격 7점+</span></div>
          <div className="bg-white/10 p-4"><strong className="text-2xl">{testAgreementCount}</strong><span className="mt-1 block text-xs text-white/60">실제 테스트</span></div>
        </div>
        <p className="mt-5 border-l-2 border-gold pl-4 text-sm leading-6 text-white/75">{preliminaryDecision}</p>
        <button type="button" onClick={downloadBackup} disabled={records.length === 0} className="mt-5 min-h-11 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy disabled:cursor-not-allowed disabled:opacity-50">JSON 백업 저장</button>
      </section>
    </div>
  );
}
