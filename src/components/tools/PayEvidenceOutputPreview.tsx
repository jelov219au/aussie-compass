import { payEvidenceSample, payEvidenceBlankSample } from "@/lib/payEvidenceSample";
import { createPayEvidenceSummary, difference, netDifference, periodExpectedGross, periodHours } from "@/lib/payEvidenceOutput";

export function PayEvidenceOutputPreview() {
  const period = payEvidenceSample.periods[0];
  const shift = period.shifts[0];
  const summary = createPayEvidenceSummary(payEvidenceSample);
  const blankLine = createPayEvidenceSummary(payEvidenceBlankSample).split("\r\n").find(line => line.startsWith("- 1–7 September"));
  const comparisons = [
    { title: "Gross끼리 비교", before: `입력 기준 계산 A$${periodExpectedGross(period).toFixed(2)}`, after: `Payslip Gross A$${period.payslipGross}`, amount: difference(period).toFixed(2), note: "시간·요율·수당 적용을 확인할 차이입니다. 법적 미지급액이 아닙니다." },
    { title: "Net끼리 대조", before: `Payslip Net A$${period.payslipNet}`, after: `실제 입금 Net A$${period.bankNet}`, amount: netDifference(period).toFixed(2), note: "명세서와 입금 기록의 차이입니다. Gross 차이와 합산하지 않습니다." },
  ];

  return <section id="pay-output-preview" data-pay-preview aria-labelledby="pay-output-preview-heading" className="scroll-mt-24 py-8 sm:py-12">
    <p className="text-xs font-semibold text-[#80621a]">가상 사례 · 실제 급여자료·개인정보 없음</p>
    <h2 id="pay-output-preview-heading" className="mt-2 text-2xl font-semibold text-navy sm:text-3xl">같은 기간, 같은 종류의 금액끼리 비교합니다.</h2>
    <p className="mt-3 text-sm leading-7 text-muted">한 번의 근무를 기록한 가상 예시입니다. 날짜·시급·금액·증빙 상태는 모두 설명용이며, 아래 시급은 최저임금이나 적용 시급 안내가 아닙니다.</p>
    <div className="mt-6 grid overflow-hidden rounded-2xl border border-navy/15 lg:grid-cols-[1fr_2fr]">
      <div className="bg-navy p-5 text-white sm:p-6">
        <h3 className="font-semibold">입력한 근무 기록</h3>
        <p className="mt-3 text-sm leading-7">가상 카페 A · 1–7 September<br />{shift.date} · {shift.start}–{shift.end}<br />무급 휴게 {shift.breakMinutes}분 · 시급 A${shift.hourlyRate}<br />추가 수당 A$0.00</p>
        <p className="mt-4 border-t border-white/20 pt-4 text-sm leading-7">계산된 시간 <strong>{periodHours(period).toFixed(2)}시간</strong><br />입력 기준 기대 Gross <strong>A${periodExpectedGross(period).toFixed(2)}</strong></p>
      </div>
      <div className="grid bg-white sm:grid-cols-2">{comparisons.map(item => <div key={item.title} className="border-t border-border p-5 sm:border-t-0 sm:last:border-l sm:p-6">
        <h3 className="font-semibold text-navy">{item.title}</h3>
        <p className="mt-3 text-sm leading-7 text-muted">{item.before}<br />{item.after}</p>
        <p className="mt-4 text-2xl font-semibold text-navy">차이 A${item.amount}</p>
        <p className="mt-3 text-xs leading-6 text-muted">{item.note}</p>
      </div>)}</div>
    </div>
    <p className="mt-4 border-l-2 border-gold pl-4 text-sm leading-6 text-navy"><strong>적용 기준은 아직 확인 전입니다.</strong> 실제 출력에도 <span lang="en">NOT READY</span>가 표시됩니다. 문의문은 차이를 확정된 금액으로 제시하지 않고 근무시간과 적용 요율의 확인을 요청합니다.</p>
    <div className="mt-5 flex flex-wrap gap-3">
      <a href="/pay-evidence-pro/sample.txt" download className="inline-flex min-h-12 items-center rounded-lg border border-navy px-5 text-sm font-semibold text-navy focus-visible:outline-2 focus-visible:outline-offset-2">가상 사례 전체 TXT ↓</a>
      <a href="/pay-evidence-pro/sample.csv" download className="inline-flex min-h-12 items-center rounded-lg border border-navy px-5 text-sm font-semibold text-navy focus-visible:outline-2 focus-visible:outline-offset-2">가상 사례 Shift CSV ↓</a>
    </div>
    <p className="mt-2 text-xs leading-6 text-muted">실제 작업 공간과 같은 내보내기 함수를 사용합니다. TXT·CSV는 확인·전달용이며 기록 복원에는 별도의 JSON 백업을 사용합니다.</p>
    <div className="mt-4 space-y-3">
      {[
        { title: "이 사례의 영문 문의문 펼쳐 보기", content: payEvidenceSample.requestDraft, label: "가상 사례 영문 문의문" },
        { title: "전체 TXT 내용 펼쳐 보기", content: summary, label: "가상 사례 전체 TXT" },
        { title: "금액이 비어 있다면 어떻게 표시되나요?", content: blankLine, label: "가상 빈 기록 TXT 예시" },
      ].map(item => <details key={item.title} className="rounded-lg border border-border bg-white">
        <summary className="flex min-h-12 cursor-pointer items-center px-5 py-3 text-sm font-semibold text-navy focus-visible:outline-2 focus-visible:outline-offset-2">{item.title}</summary>
        <pre tabIndex={0} aria-label={item.label} lang="en" className="max-h-80 overflow-y-auto whitespace-pre-wrap break-words border-t border-border p-5 text-xs leading-6 text-navy focus-visible:outline-2 focus-visible:outline-offset-2">{item.content}</pre>
        {item.content === blankLine ? <p className="px-5 pb-4 text-xs leading-6 text-muted">가상 빈 기록의 TXT 예시입니다. 미입력은 <span lang="en">Not recorded</span>, 비교할 값이 없으면 <span lang="en">Not comparable</span>로 남습니다. 0을 입력했다는 뜻이 아닙니다.</p> : null}
      </details>)}
    </div>
  </section>;
}
