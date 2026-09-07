"use client";

import { useState } from "react";
import { leavingSampleCases, leavingSampleDraft } from "@/lib/leavingAustraliaSample";
import { settlementLabels } from "@/lib/leavingAustraliaSummary";
import { describeLeavingAmount } from "@/lib/leavingAustraliaProAmounts";

export function LeavingAustraliaProSample({ summary }: { summary: string }) {
  const [selected, setSelected] = useState(0);
  const example = leavingSampleCases[selected];
  const settlement = leavingSampleDraft.settlements.find(item => item.id === example.settlementId)!;
  const note = leavingSampleDraft.taskNotes![example.taskId];

  return <div data-leaving-sample>
    <div className="mt-6 grid overflow-hidden rounded-2xl border border-navy/15 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <div className="flex flex-col gap-2 bg-navy p-3" role="group" aria-label="가상 정산 사례 선택">
        {leavingSampleCases.map((item, index) => <button key={item.taskId} type="button" aria-pressed={selected === index} aria-controls="leaving-sample-panel" onClick={() => setSelected(index)} className={`flex min-h-14 items-center justify-between gap-3 rounded-lg border-l-4 px-4 py-3 text-left text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${selected === index ? "border-gold bg-white text-navy" : "border-transparent text-white hover:bg-white/10"}`}>
          <span>{item.title}</span><span className="shrink-0 text-xs">{selected === index ? "선택됨" : "보기 →"}</span>
        </button>)}
      </div>
      <div id="leaving-sample-panel" aria-live="polite" aria-atomic="true" className="min-w-0 bg-white p-5 sm:p-7">
        <p className="text-xs font-semibold text-navy-light">가상 기록 · {settlementLabels[settlement.status]}</p>
        <h3 className="mt-2 text-xl font-semibold text-navy">{settlement.label}</h3>
        <p className="mt-2 text-sm text-muted">{settlement.amount ? describeLeavingAmount(settlement.amount) : "금액 미입력 · 합계 미포함"} · 실제 지급액 미확정</p>
        <dl className="mt-5 grid gap-4 text-sm leading-6 sm:grid-cols-2">
          {[["다음 행동", note.nextAction], ["연락할 곳", note.contact], ["다시 확인할 날", note.followUpOn], ["외부에 보관한 근거·현재 결과", note.completionNote]].map(([label, value]) => <div key={label}><dt className="font-semibold text-navy">{label}</dt><dd className="mt-1 text-muted">{value}</dd></div>)}
        </dl>
      </div>
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
      <a href="/leaving-australia-pro/sample.txt" download className="inline-flex min-h-12 items-center justify-center rounded-lg border border-navy px-5 text-sm font-semibold text-navy focus-visible:outline-2 focus-visible:outline-offset-2">가상 예시 TXT 다운로드 ↓</a>
      <p className="text-xs leading-5 text-muted">세 사례가 한 파일에 담깁니다. TXT는 읽기용이며 복원용 JSON 백업과 다릅니다.</p>
    </div>
    <details className="mt-3 rounded-lg border border-border bg-white">
      <summary className="flex min-h-12 cursor-pointer items-center px-5 py-3 text-sm font-semibold text-navy focus-visible:outline-2 focus-visible:outline-offset-2">TXT 전체 내용 펼쳐 보기</summary>
      <pre tabIndex={0} aria-label="가상 예시 TXT 전체 내용" className="max-h-80 overflow-y-auto whitespace-pre-wrap break-words border-t border-border p-5 text-xs leading-6 text-navy focus-visible:outline-2 focus-visible:outline-offset-2">{summary}</pre>
    </details>
  </div>;
}
