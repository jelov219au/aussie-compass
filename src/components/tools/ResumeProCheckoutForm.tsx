"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { track } from "@vercel/analytics";
import type { ResumeProEntry } from "@/lib/resumeProAttribution";
import { getResumeProCheckoutFailure } from "@/lib/resumeProCheckoutFailure";

function getSafeCheckoutUrl(value: unknown) {
  if (typeof value !== "string") return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "checkout.stripe.com" ? url : null;
  } catch {
    return null;
  }
}

export function ResumeProCheckoutForm({ testMode, entry }: { testMode: boolean; entry: ResumeProEntry }) {
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [failureCode, setFailureCode] = useState<string | null>(null);
  const failure = getResumeProCheckoutFailure(failureCode);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accepted || submitting) return;

    const form = event.currentTarget;
    setSubmitting(true);
    setFailureCode(null);

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });
      const payload = await response.json().catch(() => null) as {
        checkoutUrl?: unknown;
        error?: { code?: unknown };
      } | null;

      if (!response.ok) {
        setFailureCode(typeof payload?.error?.code === "string" ? payload.error.code : "checkout_failed");
        return;
      }

      const checkoutUrl = getSafeCheckoutUrl(payload?.checkoutUrl);
      if (!checkoutUrl) {
        setFailureCode("checkout_failed");
        return;
      }

      try {
        track("Checkout Started", { product: "resume_pro", entry });
      } catch {
        // Analytics must never block a verified Checkout redirect.
      }
      window.location.assign(checkoutUrl.toString());
    } catch {
      setFailureCode("checkout_temporarily_unavailable");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form action="/api/checkout/resume-pro" method="post" onSubmit={handleSubmit} className="w-full max-w-xl border border-navy/15 bg-white p-4 sm:p-5">
      <input type="hidden" name="source" value={entry} />
      <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-navy">
        <input
          type="checkbox"
          name="terms_accepted"
          value="yes"
          required
          aria-describedby="resume-pro-checkout-requirement"
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
          className="mt-1 h-5 w-5 shrink-0 accent-[#c6a34b]"
        />
        <span>
          {testMode
            ? "실제 청구가 없는 Stripe 테스트임을 확인했습니다."
            : "A$19.90 1회 결제와 디지털 제공·이용·환불 조건을 확인했습니다."}
        </span>
      </label>
      <p className="ml-8 mt-2 text-xs leading-5 text-muted">
        결제 전에 <Link href="/terms" className="font-semibold text-navy underline decoration-gold underline-offset-4">서비스 이용 조건</Link>,{" "}
        <Link href="/purchase-information" className="font-semibold text-navy underline decoration-gold underline-offset-4">구매·환불 안내</Link>와{" "}
        <Link href="/privacy" className="font-semibold text-navy underline decoration-gold underline-offset-4">결제 데이터 처리 안내</Link>를 확인해 주세요.
      </p>
      {failure && (
        <div className="mt-4 border-l-2 border-amber-600 bg-surface px-4 py-3 text-sm leading-6 text-navy" role="alert">
          {failure.message}
          {failure.retryable && <span className="block text-xs text-muted">이 페이지에서 다시 눌러도 중복 청구되지 않습니다.</span>}
        </div>
      )}
      <p id="resume-pro-checkout-requirement" className="mt-4 text-sm leading-6 text-muted" aria-live="polite">
        {accepted
          ? "확인이 완료됐어요. 아래 결제 버튼을 사용할 수 있습니다."
          : "결제 버튼을 사용하려면 위 확인란을 먼저 선택해 주세요."}
      </p>
      <button
        type="submit"
        disabled={!accepted || submitting}
        aria-busy={submitting}
        aria-describedby="resume-pro-checkout-requirement"
        className="mt-4 inline-flex min-h-12 items-center justify-center bg-gold px-5 py-3 text-sm font-semibold text-navy enabled:hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
      >
        {submitting
          ? "Stripe 결제 페이지 여는 중…"
          : testMode
            ? "테스트 결제 시작"
            : "A$19.90에 이번 지원 준비하기"}
      </button>
    </form>
  );
}
