import Link from "next/link";
import { eofyExampleDraft, eofyExampleSummary } from "@/lib/eofyProExample";
import { eofyStatusLabels } from "@/lib/eofyProOutput";

export function EofyProOutputPreview() {
  return (
    <section id="eofy-output-preview" className="mt-8 border border-navy/20 bg-white" aria-labelledby="eofy-output-heading">
      <div className="border-b border-navy/15 p-5 sm:p-6">
        <p className="text-xs font-semibold tracking-[0.16em] text-[#806515]">결제 전에 보는 실제 전달 형식</p>
        <h2 id="eofy-output-heading" className="mt-2 text-2xl font-semibold tracking-tight text-navy sm:text-3xl">자료 목록과 질문이 담긴 완성본을 열어보세요.</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">인물·직장·은행·지출·비율·상태는 모두 가상입니다. 아래 기록을 실제 EOFY 작업공간의 출력 함수로 정리했습니다. 신고나 공제 판단에 사용할 자료가 아닙니다.</p>
      </div>
      <div className="grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="border-b border-navy/15 bg-surface p-5 sm:p-6 lg:border-r lg:border-b-0">
          <h3 className="font-semibold text-navy">가상 입력 · {eofyExampleDraft.taxYear}</h3>
          <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
            {[["자료 목록", eofyExampleDraft.documents?.length ?? 0], ["지출 후보", eofyExampleDraft.expenses.length], ["확인 질문", eofyExampleDraft.questions.length]].map(([label, count]) => <div key={label} className="border border-border bg-white p-3"><dt className="text-xs text-muted">{label}</dt><dd className="mt-1 text-xl font-semibold text-navy">{count}건</dd></div>)}
          </dl>
          <ul className="mt-5 divide-y divide-border border-y border-border">
            {eofyExampleDraft.documents?.map((document) => <li key={document.id} className="py-3"><strong className="block text-sm text-navy">{document.label}</strong><p className="mt-1 text-xs leading-5 text-muted">사용자 기록: {eofyStatusLabels[document.status]} · 확인일 {document.checkedOn}</p></li>)}
          </ul>
          <p className="mt-4 text-xs leading-5 text-muted">원본 파일을 올리는 칸은 없습니다. 별칭·준비 상태·확인일·다음 질문을 기록하며, ‘준비 완료’는 사용자가 선택한 상태입니다.</p>
        </div>
        <div className="min-w-0 p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-navy">회계사에게 전달할 TXT 요약</h3>
          <p className="mt-2 text-sm leading-6 text-muted">소득 준비 상태, 개별 자료 목록, 지출 후보와 확인할 질문을 한 파일로 모아요. 미확인 증빙·비용 환급·개인 사용분 메모도 구분됩니다.</p>
          <a href="/downloads/eofy-pro-example-summary.txt" download className="mt-4 inline-flex min-h-12 items-center justify-center bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-navy-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2">가상 전달 요약 TXT 보기·저장</a>
          <details className="mt-4 border border-navy/20 bg-surface">
            <summary className="min-h-12 cursor-pointer px-4 py-3 text-sm font-semibold text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">가상 전달본 전체 내용 보기</summary>
            <pre tabIndex={0} aria-label="가상 EOFY 전달본 전체 TXT" className="max-h-80 overflow-y-auto whitespace-pre-wrap break-words border-t border-navy/15 p-4 font-mono text-xs leading-6 text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">{eofyExampleSummary}</pre>
          </details>
          <a href="/downloads/eofy-pro-example-archive.json" download className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-navy underline decoration-gold underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">같은 가상 기록의 JSON 백업 보기·저장</a>
          <p className="mt-2 text-xs leading-5 text-muted">TXT는 전달용이고 JSON은 작업 복원용입니다. 두 파일 모두 원본 영수증·금융자료·구매 이용권을 포함하지 않습니다.</p>
        </div>
      </div>
      <div className="grid gap-5 border-t border-navy/15 p-5 text-sm leading-6 sm:p-6 md:grid-cols-2">
        <div><h3 className="font-semibold text-navy">이런 준비가 필요할 때</h3><p className="mt-2 text-muted">여러 곳에 보관한 자료의 목록과 확인 질문을 한 번에 정리해 전달할 때 적합해요. 기본 확인 순서만 필요하면 무료 가이드부터 이용하세요.</p><Link href="/tax-return-guide" className="mt-2 inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">무료 택스 리턴 체크리스트 →</Link></div>
        <div><h3 className="font-semibold text-navy">원본은 직접 보관하고, 목록은 따로 백업</h3><p className="mt-2 text-muted">목록과 메모는 현재 브라우저에 저장됩니다. 기기를 바꾸기 전에 작업공간에서 JSON을 내려받고, 구매 이용권은 복구 코드로 별도로 연결하세요. 신고 대행·환급액 계산·공제 판정은 제공하지 않습니다.</p><Link href="/eofy-pro/restore" className="mt-2 inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">이미 구매했다면 이용권 복구 →</Link></div>
      </div>
    </section>
  );
}
