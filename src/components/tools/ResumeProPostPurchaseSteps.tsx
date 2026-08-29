export type ResumeProPostPurchaseNotice =
  | "ready"
  | "pending"
  | "unavailable"
  | "used"
  | "released"
  | "refunded"
  | "review";

type StepState = "complete" | "current" | "waiting" | "attention";

const stateLabels: Record<StepState, string> = {
  complete: "확인 완료",
  current: "지금 할 일",
  waiting: "다음 단계",
  attention: "확인 필요",
};

function getAccessState(notice: ResumeProPostPurchaseNotice, paymentConfirmed: boolean): StepState {
  if (!paymentConfirmed && (notice === "pending" || notice === "unavailable")) return "waiting";
  if (notice === "ready" || notice === "pending" || notice === "unavailable") return "current";
  if (notice === "used" || notice === "released" || notice === "review") return "attention";
  return "waiting";
}

export function ResumeProPostPurchaseSteps({
  notice,
  paymentConfirmed,
}: {
  notice: ResumeProPostPurchaseNotice;
  paymentConfirmed: boolean;
}) {
  const purchaseState: StepState = paymentConfirmed || notice === "ready" || notice === "used" || notice === "released"
    ? "complete"
    : notice === "refunded" || notice === "review"
      ? "attention"
      : "current";
  const accessState = getAccessState(notice, paymentConfirmed);
  const workspaceState: StepState = "waiting";
  const steps: Array<{ number: string; title: string; detail: string; state: StepState }> = [
    {
      number: "01",
      title: "결제 결과 확인",
      detail: purchaseState === "complete" ? "이 결제의 Resume Pro 구매 내역을 확인했어요." : "구매 내역과 이용권 발급 상태를 안전하게 확인해요.",
      state: purchaseState,
    },
    {
      number: "02",
      title: "이 기기에 이용권 연결",
      detail: notice === "used" || notice === "released"
        ? "이전에 만든 1회용 복구 코드가 있다면 이 기기에 다시 연결해요."
        : "아래 버튼으로 이용권을 연결한 뒤 작업공간을 바로 열어요.",
      state: accessState,
    },
    {
      number: "03",
      title: "작업공간에서 첫 지원서 저장",
      detail: "첫 10분 빠른 시작에서 회사별 지원서를 저장하고 저장본을 다시 열어 확인해요.",
      state: workspaceState,
    },
  ];

  return (
    <ol className="grid gap-px bg-border sm:grid-cols-3" aria-label="Resume Pro 구매 후 진행 순서">
      {steps.map((step) => (
        <li key={step.number} className="bg-surface p-4 sm:min-h-40">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-xs text-gold">{step.number}</span>
            <span className={`text-xs font-semibold ${step.state === "current" ? "text-navy" : step.state === "attention" ? "text-amber-800" : "text-muted"}`}>
              {stateLabels[step.state]}
            </span>
          </div>
          <h2 className="mt-5 text-base font-semibold text-navy">{step.title}</h2>
          <p className="mt-2 text-xs leading-5 text-muted">{step.detail}</p>
        </li>
      ))}
    </ol>
  );
}
