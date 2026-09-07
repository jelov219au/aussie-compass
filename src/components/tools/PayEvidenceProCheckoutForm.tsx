"use client";

import Link from "next/link";
import { type FormEvent, useRef, useState } from "react";
import { track } from "@vercel/analytics";

import type { PayEvidenceProEntry } from "@/lib/payEvidenceProAttribution";

const checkoutRequestTimeoutMs = 45_000;

function getSafeCheckoutUrl(value: unknown) {
  if (typeof value !== "string") return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "checkout.stripe.com"
      && !url.port && !url.username && !url.password ? url : null;
  } catch {
    return null;
  }
}

export function PayEvidenceProCheckoutForm({
  testMode,
  entry,
}: {
  testMode: boolean;
  entry: PayEvidenceProEntry;
}) {
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutFailed, setCheckoutFailed] = useState(false);
  const requestInFlight = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accepted || requestInFlight.current) return;
    requestInFlight.current = true;

    const form = event.currentTarget;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), checkoutRequestTimeoutMs);
    setSubmitting(true);
    setCheckoutFailed(false);
    let redirecting = false;

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => null) as { checkoutUrl?: unknown } | null;
      const checkoutUrl = response.ok ? getSafeCheckoutUrl(payload?.checkoutUrl) : null;

      if (!checkoutUrl) {
        setCheckoutFailed(true);
        return;
      }

      try {
        track("Checkout Started", { product: "pay_evidence_pro", entry });
      } catch {
        // Analytics must never block a verified Checkout redirect.
      }
      window.location.assign(checkoutUrl.toString());
      redirecting = true;
    } catch {
      setCheckoutFailed(true);
    } finally {
      window.clearTimeout(timeoutId);
      if (!redirecting) {
        requestInFlight.current = false;
        setSubmitting(false);
      }
    }
  }

  return (
    <form
      action="/api/checkout/pay-evidence-pro"
      method="post"
      onSubmit={handleSubmit}
      className="w-full max-w-xl border border-navy/15 bg-white p-4 sm:p-5"
    >
      <input type="hidden" name="source" value={entry} />
      <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-navy">
        <input
          type="checkbox"
          name="terms_accepted"
          value="yes"
          required
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
          className="mt-1 h-5 w-5 shrink-0 accent-[#c6a34b]"
        />
        <span>
          {testMode
            ? "실제 청구가 없는 Stripe 테스트임을 확인했습니다."
            : "A$9.90 1회 결제와 디지털 제공·이용·환불 조건을 확인했습니다."}
        </span>
      </label>
      <p className="ml-8 mt-2 text-xs leading-5 text-muted">
        결제 전에 <Link href="/terms" className="font-semibold text-navy underline decoration-gold underline-offset-4">서비스 이용 조건</Link>,{" "}
        <Link href="/purchase-information" className="font-semibold text-navy underline decoration-gold underline-offset-4">구매·환불 안내</Link>와{" "}
        <Link href="/privacy" className="font-semibold text-navy underline decoration-gold underline-offset-4">결제 데이터 처리 안내</Link>를 확인해 주세요.
      </p>
      {checkoutFailed ? (
        <p className="mt-4 text-sm leading-6 text-muted" role="status" aria-live="polite">
          결제 페이지를 안전하게 열지 못했습니다. 결제 상태가 불명확하면 다시 결제하지 말고{" "}
          <Link href="/payment-help" className="font-semibold text-navy underline decoration-gold underline-offset-4">
            결제·접근 문제 해결 순서
          </Link>
          를 확인해 주세요.
        </p>
      ) : null}
      <button
        type="submit"
        disabled={!accepted || submitting}
        aria-busy={submitting}
        className="mt-4 inline-flex min-h-12 items-center justify-center bg-gold px-5 py-3 text-sm font-semibold text-navy enabled:hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
      >
        {submitting
          ? "Stripe 결제 페이지 여는 중…"
          : testMode
            ? "A$9.90 테스트 결제 시작"
            : "A$9.90에 급여 증빙 정리하기"}
      </button>
    </form>
  );
}
