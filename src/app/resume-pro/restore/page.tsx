import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ResumeProRestoreForm } from "@/components/tools/ResumeProRestoreForm";
import { Container } from "@/components/ui/Container";
import { getActiveResumeProEntitlement } from "@/lib/resumeProAccess";

export const metadata: Metadata = {
  title: "Resume Pro 이용권 복구 | Hoju Compass",
  description: "저장해 둔 1회용 복구 코드로 Resume Pro 접근을 복구합니다.",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ status?: string }> };

export default async function ResumeProRestorePage({ searchParams }: Props) {
  const { status } = await searchParams;
  const hasActiveEntitlement = Boolean(await getActiveResumeProEntitlement());
  return (
    <>
      <Header />
      <main className="py-14 sm:py-20">
        <Container className="max-w-2xl">
          {hasActiveEntitlement ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">이용권 확인 완료</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">복구 코드를 다시 입력할 필요가 없습니다.</h1>
              <p className="mt-5 text-sm leading-7 text-muted">이 기기의 Resume Pro 이용권이 이미 연결되어 있습니다. 새 결제나 복구를 진행하지 말고 작업공간에서 저장한 지원서를 계속하세요.</p>
              <section className="mt-6 border-l-2 border-emerald-600 bg-white p-5 sm:p-6" aria-labelledby="resume-pro-restored-access-heading">
                <h2 id="resume-pro-restored-access-heading" className="text-xl font-semibold text-navy">바로 작업공간에서 계속하세요.</h2>
                <p className="mt-2 text-sm leading-6 text-muted">작업공간에서도 이용권을 다시 확인합니다. 이 화면에서는 복구 코드나 구매 정보를 입력하지 않습니다.</p>
                <Link href="/resume-pro/workspace#resume-pro-workspace" className="mt-5 inline-flex min-h-12 items-center justify-center bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-navy-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2">
                  작업공간에서 지원서 계속하기
                </Link>
              </section>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">구매 내역 다시 찾기</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">Resume Pro 이용권 복구</h1>
              <p className="mt-5 text-sm leading-7 text-muted">이미 구매했다면 다시 결제하지 마세요. 이전에 Resume Pro 작업 공간에서 만든 1회용 복구 코드를 입력하면 이용권을 다시 연결할 수 있어요. 원문 코드는 서버에 저장되지 않으며 사용 후 즉시 무효화됩니다.</p>
              <ResumeProRestoreForm initialStatus={status} />
              <p className="mt-5 text-xs leading-5 text-muted">복구 코드를 분실했다면 결제 이메일만으로 자동 복구하지 않습니다. 구매 정보 확인 절차가 마련될 때까지 지원 채널을 이용해야 합니다.</p>
              <Link href="/payment-help" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-navy underline decoration-gold underline-offset-4">복구 코드가 없다면 문제 해결 순서 보기 →</Link>
              <Link href="/resume-builder" className="mt-7 inline-flex min-h-11 items-center text-sm font-semibold text-navy">&larr; 무료 이력서 빌더 이용하기</Link>
            </>
          )}
        </Container>
      </main>
      <Footer />
    </>
  );
}
