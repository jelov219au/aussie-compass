import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { JobMoveResearchRecorder } from "@/components/tools/JobMoveResearchRecorder";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Job Move Pro 인터뷰 기록 | Hoju Compass",
  description: "Job Move Pro 제품 검증을 위한 로컬 전용 인터뷰 기록 화면입니다.",
  robots: { index: false, follow: false },
};

export default function JobMoveResearchPage() {
  return (
    <>
      <Header />
      <main className="bg-surface py-10 sm:py-14">
        <Container className="max-w-4xl">
          <Link href="/job-move-pro-research-preview" className="inline-flex min-h-11 items-center text-sm font-semibold text-navy underline decoration-gold underline-offset-4">← 인터뷰용 Evidence Pack 샘플 보기</Link>
          <div className="mb-7 mt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">Local research workspace</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">Job Move Pro 인터뷰 기록</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">참가자 모집부터 5건의 결과 비교까지 한 기기에서 진행하세요. 서버로 전송하지 않으므로 브라우저 데이터를 지우기 전에 JSON 백업을 저장하세요.</p>
          </div>
          <JobMoveResearchRecorder />
        </Container>
      </main>
      <Footer />
    </>
  );
}
