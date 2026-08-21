import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Job Move Pro 검증 샘플 | Hoju Compass",
  description: "제품 인터뷰를 위한 가상 Job Application Evidence Pack 샘플입니다.",
  robots: { index: false, follow: false },
};

const matches = [
  ["주문·배송 일정 조정", "근거 있음", "한국 직장에서 창고팀·택배사·납품처 일정을 조정했어요."],
  ["Inventory record", "근거 있음", "Excel 주문 기록과 월말 재고 차이를 확인했어요."],
  ["ERP 경험", "확인 필요", "사용한 시스템 이름과 실제 작업 범위를 먼저 확인해야 해요."],
] as const;

export default function JobMoveProResearchPreviewPage() {
  return (
    <>
      <Header />
      <main className="bg-surface py-10 sm:py-14">
        <Container className="max-w-3xl">
          <div className="rounded-full border border-gold/40 bg-white px-4 py-2 text-center text-xs font-semibold text-navy">
            제품 인터뷰용 가상 샘플 · 실제 사용자 데이터 아님
          </div>

          <section className="mt-5 overflow-hidden border border-navy/15 bg-white shadow-sm">
            <div className="border-b border-navy/15 bg-navy p-5 text-white sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">Job Application Evidence Pack</p>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Operations Coordinator 지원 준비</h1>
              <p className="mt-2 text-sm leading-6 text-white/65">Mina Kim · South Harbour Supplies (가상 회사)</p>
              <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-white/10 p-3"><strong className="block text-lg text-white">3</strong><span className="text-white/65">연결된 근거</span></div>
                <div className="bg-white/10 p-3"><strong className="block text-lg text-gold">1</strong><span className="text-white/65">추가 확인</span></div>
                <div className="bg-white/10 p-3"><strong className="block text-lg text-red-200">1</strong><span className="text-white/65">추가 금지</span></div>
              </div>
            </div>

            <div className="space-y-7 p-5 sm:p-7">
              <section aria-labelledby="match-heading">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">01 · 공고와 실제 경력 연결</p>
                <h2 id="match-heading" className="mt-2 text-xl font-semibold text-navy">공고 문구를 복사하지 않고 근거를 확인해요.</h2>
                <div className="mt-4 space-y-3">
                  {matches.map(([requirement, status, evidence]) => (
                    <article key={requirement} className="border border-border bg-surface p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-semibold text-navy">{requirement}</h3>
                        <span className={`px-2 py-1 text-xs font-semibold ${status === "근거 있음" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{status}</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted">{evidence}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="border-t border-border pt-7" aria-labelledby="bullet-heading">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">02 · Evidence bullet</p>
                <h2 id="bullet-heading" className="mt-2 text-xl font-semibold text-navy">확인된 경험만 Resume 문장으로 바꿔요.</h2>
                <blockquote className="mt-4 border-l-2 border-gold bg-surface p-4 text-sm leading-6 text-navy">
                  Coordinated order and delivery schedules with warehouse staff, couriers and customers to support on-time dispatch.
                </blockquote>
                <div className="mt-3 border-l-2 border-red-400 bg-red-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-red-700">추가하지 않음</p>
                  <p className="mt-2 text-sm leading-6 text-red-900">“Managed a warehouse team” — 공식 관리 경험이 확인되지 않았어요.</p>
                </div>
              </section>

              <section className="border-t border-border pt-7" aria-labelledby="question-heading">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">03 · 경력에 연결된 면접 질문</p>
                <h2 id="question-heading" className="mt-2 text-xl font-semibold text-navy">질문 뒤에 내 경험을 설명할 기회를 만들어요.</h2>
                <article className="mt-4 border border-navy/15 p-4">
                  <p className="text-sm font-medium leading-6 text-navy">“You mentioned that inventory accuracy is important. How does the team currently investigate stock discrepancies, and which records would I work with?”</p>
                  <p className="mt-3 text-xs font-semibold text-gold">연결되는 실제 경력</p>
                  <p className="mt-1 text-sm leading-6 text-muted">월말 재고 차이 확인과 Excel 주문·출고 기록 대조 경험</p>
                </article>
                <article className="mt-3 border border-navy/15 p-4">
                  <p className="text-sm font-medium leading-6 text-navy">“Is this a newly created role, or am I replacing someone? What would you most like the new person to improve?”</p>
                  <p className="mt-3 text-xs font-semibold text-gold">확인하려는 직장 신호</p>
                  <p className="mt-1 text-sm leading-6 text-muted">실제 채용 이유, 역할의 우선과제와 반복 이직 가능성을 확인해요.</p>
                </article>
              </section>

              <section className="border-t border-border pt-7" aria-labelledby="reaction-heading">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">인터뷰 진행자용</p>
                <h2 id="reaction-heading" className="mt-2 text-xl font-semibold text-navy">이 화면을 본 뒤 세 가지만 물어보세요.</h2>
                <ol className="mt-4 space-y-3 text-sm leading-6 text-muted">
                  <li className="flex gap-3"><span className="font-semibold text-gold">1</span><span>최근 실제 지원에서 어느 부분을 사용했을 것 같나요?</span></li>
                  <li className="flex gap-3"><span className="font-semibold text-gold">2</span><span>무료 ChatGPT 결과와 비교해 부족하거나 다른 점은 무엇인가요?</span></li>
                  <li className="flex gap-3"><span className="font-semibold text-gold">3</span><span>지원 마감이 3일 남았다면 A$19.90 지불 가능성은 0–10 중 몇 점인가요?</span></li>
                </ol>
              </section>
            </div>
          </section>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
            <p className="text-muted">결제·개인정보 입력이 없는 제품 연구 화면입니다.</p>
            <Link href="/resume-builder" className="font-semibold text-navy underline decoration-gold underline-offset-4">현재 무료 이력서 빌더 보기</Link>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
