export type RentalContactStatus = "not-contacted" | "drafting" | "sent" | "follow-up" | "closed";

export type RentalApplicationPackSummary = {
  id: string;
  label: string;
  progress: number;
  reviewCount: number;
  contactStatus: RentalContactStatus;
  followUpDate: string;
};

export const rentalContactStatusLabels: Record<RentalContactStatus, string> = {
  "not-contacted": "연락 전",
  drafting: "신청 준비 중",
  sent: "신청·연락 완료",
  "follow-up": "후속 확인 필요",
  closed: "결과 확인 완료",
};

function displayFollowUp(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "날짜 없음";
  return new Date(`${value}T12:00:00`).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

export function RentalApplicationPortfolio({
  packs,
  activeId,
  onSelect,
  onCreate,
  onReuse,
  onRemove,
  atLimit,
  canRemove,
  firstCandidateSaved,
  firstCandidateLabel,
  firstCandidateMessage,
  onFirstCandidateLabelChange,
  onSaveFirstCandidate,
}: {
  packs: RentalApplicationPackSummary[];
  activeId: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onReuse: () => void;
  onRemove: () => void;
  atLimit: boolean;
  canRemove: boolean;
  firstCandidateSaved: boolean;
  firstCandidateLabel: string;
  firstCandidateMessage: string;
  onFirstCandidateLabelChange: (label: string) => void;
  onSaveFirstCandidate: () => void;
}) {
  return (
    <section className="border-y border-navy/20 py-7" aria-labelledby="rental-portfolio-heading">
      {!firstCandidateSaved ? (
        <form className="mb-7 border-l-4 border-gold bg-gold/10 p-5 sm:p-6" onSubmit={(event) => { event.preventDefault(); onSaveFirstCandidate(); }} aria-labelledby="rental-first-candidate-heading">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">구매 후 첫 1분</p>
          <h2 id="rental-first-candidate-heading" className="mt-2 text-xl font-semibold text-navy">첫 집 후보 하나를 먼저 저장하세요.</h2>
          <p className="mt-2 text-sm leading-6 text-muted">정확한 주소는 적지 말고 “Carlton 후보 1”처럼 나만 알아볼 별칭을 사용하세요. 저장하면 이 집의 8개 증빙 상태와 후속일을 따로 관리할 수 있어요.</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1 text-sm font-semibold text-navy">첫 집 후보 별칭<input autoComplete="off" maxLength={80} value={firstCandidateLabel} onChange={(event) => onFirstCandidateLabelChange(event.target.value)} className="mt-2 min-h-12 w-full border border-border bg-white px-3 text-sm font-normal text-navy outline-none focus:border-navy focus:ring-2 focus:ring-navy/15" /></label>
            <button type="submit" className="inline-flex min-h-12 items-center justify-center bg-navy px-5 text-sm font-semibold text-white hover:bg-navy-light">첫 후보 저장</button>
          </div>
          <p className="mt-3 min-h-5 text-sm leading-5 text-red-800" role="status" aria-live="polite">{firstCandidateMessage}</p>
        </form>
      ) : (
        <div className="mb-7 border-l-4 border-emerald-600 bg-emerald-50 p-5 sm:flex sm:items-center sm:justify-between sm:gap-5 sm:p-6" role="status" aria-live="polite">
          <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">첫 후보 저장 완료</p><h2 className="mt-2 text-xl font-semibold text-navy">{firstCandidateMessage || "첫 집 후보가 이 브라우저에 저장되어 있어요."}</h2><p className="mt-2 text-sm leading-6 text-muted">무료 프로젝트의 전체 할 일과 달리, 이 후보에는 증빙 8종·개인정보 확인·후속일을 따로 기록하고 다음 집에는 공통 준비만 재사용할 수 있어요.</p></div>
          <a href="#rental-document-readiness" className="mt-4 inline-flex min-h-12 shrink-0 items-center justify-center bg-navy px-5 text-sm font-semibold text-white sm:mt-0">8개 증빙 상태 시작</a>
        </div>
      )}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Property application board</p>
          <h2 id="rental-portfolio-heading" className="mt-2 text-2xl font-semibold text-navy">집마다 따로 준비하고, 한눈에 비교하세요.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">정확한 주소나 에이전트 연락처 없이 별칭만 사용합니다. 최대 6개 집의 서류 준비율과 후속 날짜를 이 브라우저에 따로 저장해요.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" disabled={atLimit} onClick={onCreate} className="inline-flex min-h-11 items-center justify-center bg-navy px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">빈 집 후보 추가</button>
          <button type="button" disabled={atLimit} onClick={onReuse} className="inline-flex min-h-11 items-center justify-center border border-navy px-4 text-sm font-semibold text-navy disabled:cursor-not-allowed disabled:opacity-40">현재 준비사항 재사용</button>
          <button type="button" disabled={!canRemove} onClick={onRemove} className="inline-flex min-h-11 items-center justify-center border border-red-300 px-4 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-40">현재 후보 삭제</button>
        </div>
      </div>

      <ol className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-label="저장된 집 후보 비교">
        {packs.map((pack, index) => {
          const active = pack.id === activeId;
          return (
            <li key={pack.id}>
              <button type="button" aria-pressed={active} onClick={() => onSelect(pack.id)} className={`h-full min-h-44 w-full border p-4 text-left transition ${active ? "border-gold bg-gold/10" : "border-border bg-white hover:border-navy/35"}`}>
                <span className="flex items-center justify-between gap-3"><span className="font-mono text-xs text-gold">{String(index + 1).padStart(2, "0")}</span><span className="text-xs font-semibold text-muted">{active ? "현재 편집 중" : "열기"}</span></span>
                <strong className="mt-4 block truncate text-lg text-navy">{pack.label || `집 후보 ${index + 1}`}</strong>
                <span className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted"><span>준비율 <b className="text-navy">{pack.progress}%</b></span><span>확인 필요 <b className="text-navy">{pack.reviewCount}개</b></span><span className="col-span-2">{rentalContactStatusLabels[pack.contactStatus]} · 후속 {displayFollowUp(pack.followUpDate)}</span></span>
                <span className="mt-4 block h-1.5 overflow-hidden bg-surface"><span className="block h-full bg-gold" style={{ width: `${pack.progress}%` }} /></span>
              </button>
            </li>
          );
        })}
      </ol>
      {atLimit && <p className="mt-3 text-xs leading-5 text-muted">비교가 복잡해지지 않도록 집 후보는 최대 6개까지 관리할 수 있어요.</p>}
    </section>
  );
}
