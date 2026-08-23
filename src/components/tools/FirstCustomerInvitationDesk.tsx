"use client";

import { useMemo, useState } from "react";

import type { FirstCustomerLaunchDecision } from "@/lib/firstCustomerLaunchDecision";

const OFFICIAL_RESUME_PRO_URL = "https://hojucompass.com/resume-pro";
const INVITATION_SUBJECT = "[Hoju Compass] Resume Pro 판매 시작 1회 안내";
const INVITATION_BODY = `Resume Pro 판매가 시작되어 요청하신 1회 안내를 드립니다.

결제 전 가격, 제공 범위와 환불 안내를 확인한 뒤 공식 Resume Pro 페이지에서 진행해 주세요.
${OFFICIAL_RESUME_PRO_URL}

이 메일에는 이력서 원문이나 민감정보를 보내지 마세요. 이번 안내 뒤 추가 홍보 메일은 보내지 않습니다.`;

const checks = [
  {
    id: "opt-in-fit",
    title: "고객이 먼저 요청했고 기본 적합성을 확인했습니다.",
    detail: "판매 시작 안내 요청, 목표 직무, 7일 이내 지원 마감, 개인 초대·추적 정보가 없는 공개 채용 공고 링크와 무료 Builder 초안 여부만 확인했습니다. 이 화면에는 개인정보나 문서 원문을 남기지 않습니다.",
  },
  {
    id: "pre-payment-pass",
    title: "사전 결제 점검이 모두 PASS입니다.",
    detail: "체크리스트 1–4절, live 미결제 Checkout 0건, 대상 환경 strict audit와 데이터베이스 named-result matrix를 방금 다시 확인했습니다.",
  },
  {
    id: "single-window",
    title: "한 고객만을 위한 결제 창이 준비됐습니다.",
    detail: "공식 상품 페이지를 검토했고 운영자가 한 고객 결제 창에 한해 Checkout을 의도적으로 활성화했습니다. 원본 Stripe Checkout 링크는 안내하지 않습니다.",
  },
  {
    id: "owner-approval",
    title: "단일 고객 안내 승인이 기록됐습니다.",
    detail: "사업자 승인을 기록했고 다른 요청자에게 안내하거나 두 번째 알림을 보내지 않기로 확인했습니다.",
  },
] as const;

export function FirstCustomerInvitationDesk({ decision }: { decision: FirstCustomerLaunchDecision }) {
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState("");
  const allConfirmed = useMemo(() => checks.every((check) => confirmed[check.id]), [confirmed]);
  const releaseGateOpen = decision.status === "go";
  const copyAllowed = releaseGateOpen && allConfirmed;
  const invitation = `제목: ${INVITATION_SUBJECT}\n\n${INVITATION_BODY}`;

  const toggle = (id: string, value: boolean) => {
    setConfirmed((current) => ({ ...current, [id]: value }));
    setMessage("");
  };

  const copyInvitation = async () => {
    if (!releaseGateOpen) {
      setMessage("현재 Production 판정은 NO-GO입니다. blocker를 모두 해소하고 새 감사를 기록하기 전에는 안내할 수 없습니다.");
      return;
    }
    if (!copyAllowed) {
      setMessage("모든 승인 조건을 먼저 확인하세요.");
      return;
    }

    try {
      await navigator.clipboard.writeText(invitation);
      setMessage("1회 안내문을 복사했습니다. 수신자와 발송은 메일함에서 직접 확인하세요.");
    } catch {
      setMessage("복사할 수 없습니다. 아래 안내문을 직접 선택해 복사하세요.");
    }
  };

  const reset = () => {
    setConfirmed({});
    setMessage("확인 상태를 모두 지웠습니다.");
  };

  return (
    <div>
      <section className={`border-l-4 p-5 sm:p-6 ${releaseGateOpen ? "border-emerald-600 bg-emerald-50" : "border-red-600 bg-red-50"}`} aria-labelledby="current-launch-decision-heading">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Audited {decision.auditedAt}</p>
        <h2 id="current-launch-decision-heading" className="mt-2 text-2xl font-semibold text-navy">현재 첫 고객 판정 · {releaseGateOpen ? "GO" : "NO-GO"}</h2>
        <p className="mt-2 text-sm leading-6 text-muted">{releaseGateOpen ? "새 감사에서 모든 사전 결제 gate가 PASS로 확인됐습니다. 아래 네 조건도 지금 다시 확인하세요." : "알려진 blocker가 남아 있어 확인란과 안내문 복사를 잠갔습니다. 체크 표시만으로 이 판정을 덮어쓸 수 없습니다."}</p>
        {!releaseGateOpen && (
          <ul className="mt-4 grid gap-2 text-sm leading-6 text-red-950 sm:grid-cols-2">
            {decision.blockers.map((blocker) => <li key={blocker} className="border-l-2 border-red-300 pl-3">{blocker}</li>)}
          </ul>
        )}
      </section>

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.08fr)_minmax(25rem,0.92fr)]">
      <section className="border border-border bg-white p-5 shadow-sm sm:p-7" aria-labelledby="invitation-gate-heading">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Four required confirmations</p>
        <h2 id="invitation-gate-heading" className="mt-2 text-2xl font-semibold text-navy">복사 버튼을 열기 전 확인</h2>
        <p className="mt-3 text-sm leading-6 text-muted">각 항목은 지금 확인한 사실만 표시하세요. 하나라도 불명확하면 결제를 닫아 둔 채 안내를 보류합니다.</p>

        <fieldset className="mt-6 space-y-3">
          <legend className="sr-only">첫 고객 안내 필수 확인</legend>
          {checks.map((check, index) => (
            <label key={check.id} className="flex cursor-pointer gap-4 border border-border p-4 transition-colors has-checked:border-emerald-600 has-checked:bg-emerald-50">
              <input
                type="checkbox"
                disabled={!releaseGateOpen}
                checked={Boolean(confirmed[check.id])}
                onChange={(event) => toggle(check.id, event.target.checked)}
                className="mt-1 size-5 shrink-0 accent-navy disabled:cursor-not-allowed disabled:opacity-45"
              />
              <span>
                <strong className="block text-sm leading-6 text-navy">{index + 1}. {check.title}</strong>
                <span className="mt-1 block text-xs leading-5 text-muted">{check.detail}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={copyInvitation} disabled={!copyAllowed} className="min-h-11 bg-navy px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-navy/30">승인된 1회 안내문 복사</button>
          <button type="button" onClick={reset} disabled={!releaseGateOpen} className="min-h-11 border border-navy/25 px-4 text-sm font-semibold text-navy disabled:cursor-not-allowed disabled:opacity-45">확인 상태 초기화</button>
        </div>
        <p className="mt-4 min-h-5 text-sm leading-5 text-muted" aria-live="polite">{message}</p>
      </section>

      <div className="space-y-6">
        <section className="bg-navy p-5 text-white sm:p-7" aria-labelledby="invitation-preview-heading">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Fixed safe reply</p>
              <h2 id="invitation-preview-heading" className="mt-2 text-xl font-semibold">복사될 안내문</h2>
            </div>
            <span className={`border px-3 py-1 text-xs font-semibold ${copyAllowed ? "border-emerald-300 text-emerald-200" : "border-white/20 text-white/55"}`}>{copyAllowed ? "복사 가능" : releaseGateOpen ? "승인 대기" : "NO-GO 잠금"}</span>
          </div>
          <dl className="mt-5 space-y-4 text-sm leading-6">
            <div><dt className="font-semibold text-gold">제목</dt><dd className="mt-1 text-white/80">{INVITATION_SUBJECT}</dd></div>
            <div><dt className="font-semibold text-gold">본문</dt><dd className="mt-1 whitespace-pre-line border border-white/15 bg-white/5 p-4 text-white/80">{INVITATION_BODY}</dd></div>
          </dl>
        </section>

        <section className="border-l-2 border-red-600 bg-red-50 p-5 text-sm leading-6 text-red-950" aria-labelledby="invitation-stop-heading">
          <h2 id="invitation-stop-heading" className="font-semibold">첫 결제 또는 거절 뒤의 중단선</h2>
          <ul className="mt-2 space-y-2">
            <li>• 결제가 완료되면 다른 초대를 즉시 중단하고 15분·24시간·첫 정산 증거 확인을 실행합니다.</li>
            <li>• 명시적 거절이면 Checkout이 만료·미결제이고 PaymentIntent가 없음을 확인하기 전에는 다른 요청자에게 안내하지 않습니다.</li>
            <li>• 이메일 시각이 아니라 데이터베이스 gate를 동시성 판단 기준으로 사용합니다.</li>
          </ul>
        </section>
      </div>
      </div>
    </div>
  );
}
