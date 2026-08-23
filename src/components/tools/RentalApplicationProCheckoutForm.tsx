"use client";

import Link from "next/link";
import { useState } from "react";
import { track } from "@vercel/analytics";

import type { RentalApplicationProEntry } from "@/lib/rentalApplicationProAttribution";

export function RentalApplicationProCheckoutForm({
  testMode,
  entry,
}: {
  testMode: boolean;
  entry: RentalApplicationProEntry;
}) {
  const [accepted, setAccepted] = useState(false);

  return (
    <form
      action="/api/checkout/rental-application-pro"
      method="post"
      onSubmit={() => track("Checkout Started", { product: "rental_application_pro", entry })}
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
            : "A$14.90 1회 결제와 디지털 제공·이용·환불 조건을 확인했습니다."}
        </span>
      </label>
      <p className="ml-8 mt-2 text-xs leading-5 text-muted">
        결제 전에 <Link href="/terms" className="font-semibold text-navy underline decoration-gold underline-offset-4">서비스 이용 조건</Link>,{" "}
        <Link href="/purchase-information" className="font-semibold text-navy underline decoration-gold underline-offset-4">구매·환불 안내</Link>와{" "}
        <Link href="/privacy" className="font-semibold text-navy underline decoration-gold underline-offset-4">결제 데이터 처리 안내</Link>를 확인해 주세요.
      </p>
      <button
        type="submit"
        disabled={!accepted}
        className="mt-4 inline-flex min-h-12 items-center justify-center bg-gold px-5 py-3 text-sm font-semibold text-navy enabled:hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
      >
        {testMode ? "A$14.90 테스트 결제 시작" : "A$14.90에 렌트 신청 준비하기"}
      </button>
    </form>
  );
}
