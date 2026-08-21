import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { JobMoveSurveyForm } from "@/components/tools/JobMoveSurveyForm";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "호주 구직 준비 경험 2분 조사 | Hoju Compass",
  description: "호주 구직 준비 과정에서 실제로 필요한 도움을 확인하기 위한 2분 선택형 조사입니다.",
  robots: { index: false, follow: false },
};

export default function JobMoveSurveyPage() {
  return (
    <>
      <Header />
      <main className="bg-surface py-10 sm:py-14">
        <Container className="max-w-3xl">
          <header className="mb-8 border-b border-navy/15 pb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">2-minute research survey</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-5xl">호주 구직 준비 경험 조사</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">호주에서 새로운 일자리를 준비할 때 실제로 필요한 도움을 확인하는 선택형 조사입니다. 판매나 결제 요청은 없으며 약 2분이 걸립니다.</p>
            <Link href="/privacy" className="mt-3 inline-flex min-h-10 items-center text-xs font-semibold text-navy underline decoration-gold underline-offset-4">설문 데이터 처리 방식 보기</Link>
          </header>
          <JobMoveSurveyForm />
        </Container>
      </main>
      <Footer />
    </>
  );
}
