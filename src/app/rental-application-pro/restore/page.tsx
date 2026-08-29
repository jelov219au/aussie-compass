import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { RentalApplicationProRestoreForm } from "@/components/tools/RentalApplicationProRestoreForm";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Rental Application Pack Pro 이용권 복구 | Hoju Compass",
  description: "저장해 둔 1회용 복구 코드로 Rental Application Pack Pro 접근을 복구합니다.",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ status?: string }> };

export default async function RentalApplicationProRestorePage({ searchParams }: Props) {
  const { status } = await searchParams;
  return (
    <>
      <Header />
      <main className="py-14 sm:py-20">
        <Container className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">구매 내역 다시 찾기</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">Rental Pack Pro 이용권 복구</h1>
          <p className="mt-5 text-sm leading-7 text-muted">이전에 작업 공간에서 만든 1회용 복구 코드를 입력하세요. 원문 코드는 서버에 저장되지 않으며 사용 후 즉시 무효화됩니다.</p>
          <RentalApplicationProRestoreForm initialStatus={status} />
          <p className="mt-5 text-xs leading-5 text-muted">복구 코드를 분실했다면 결제 이메일만으로 자동 복구하지 않습니다. 지원 채널에서 구매 확인 절차를 진행해 주세요.</p>
          <Link href="/payment-help" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-navy underline decoration-gold underline-offset-4">복구 코드가 없다면 문제 해결 순서 보기 →</Link>
          <Link href="/rental-application-pro" className="mt-7 inline-flex min-h-11 items-center text-sm font-semibold text-navy">&larr; 제품 소개로 돌아가기</Link>
        </Container>
      </main>
      <Footer />
    </>
  );
}
