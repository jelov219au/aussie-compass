import Link from "next/link";
import { actionClass } from "@/components/ui/actionStyles";

export function FinancialHardshipRoutes() {
  return (
    <section className="mt-8 rounded-2xl border-2 border-navy/10 bg-white p-6 sm:p-8" aria-labelledby="hardship-routes-heading">
      <p className="text-xs font-semibold text-gold-ink">지금 필요한 도움부터 · 확인 2026-08-31</p>
      <h2 id="hardship-routes-heading" className="mt-2 text-2xl font-semibold leading-9 text-navy">어디에 먼저 연락할까요?</h2>
      <p className="mt-3 text-sm leading-7 text-muted">긴급구호, 요금 지원과 민원은 서로 다른 절차예요. 법원·퇴거·서비스 중단 통지의 기한은 별도로 확인하세요.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <article className="flex flex-col rounded-xl border border-border bg-surface p-5">
          <h3 className="text-lg font-semibold leading-7 text-navy">오늘 식비·약·교통비가 없어요</h3>
          <p className="mb-5 mt-3 flex-1 text-sm leading-7 text-muted">DSS의 무료 Emergency Relief는 시민권·거주자 요건이 없어요. 실제 지원 항목과 이용 가능 여부는 지역 제공자에게 확인하세요.</p>
          <a href="https://www.dss.gov.au/emergency-support/emergency-relief" target="_blank" rel="noreferrer" className={actionClass("primary")}>지역 긴급구호 찾는 법 ↗</a>
        </article>
        <article className="flex flex-col rounded-xl border border-border bg-surface p-5">
          <h3 className="text-lg font-semibold leading-7 text-navy">전화·인터넷 요금이 어려워요</h3>
          <p className="mb-5 mt-3 flex-1 text-sm leading-7 text-muted">통신사에 Payment assistance를 요청하세요. ACMA에서 신청 심사·통지기한과 연결 유지 지원을 확인할 수 있어요.</p>
          <a href="https://www.acma.gov.au/help-if-you-cant-pay-your-bill" target="_blank" rel="noreferrer" className={actionClass("secondary")}>통신요금 지원 기준 확인 ↗</a>
        </article>
        <article className="flex flex-col rounded-xl border border-border bg-surface p-5">
          <h3 className="text-lg font-semibold leading-7 text-navy">전기·가스가 끊길까 걱정돼요</h3>
          <p className="mb-5 mt-3 flex-1 text-sm leading-7 text-muted">청구서의 Retailer에 먼저 연락하세요. 주소가 있는 주·준주에 맞는 지원과 민원기관을 골라볼 수 있어요.</p>
          <Link href="/resources/australia-energy-plan-moving-home-guide#energy-help" className={actionClass("secondary")}>우리 지역 에너지 도움 선택 →</Link>
        </article>
        <article className="flex flex-col rounded-xl border border-border bg-surface p-5">
          <h3 className="text-lg font-semibold leading-7 text-navy">대출 지원 요청에 답이 없어요</h3>
          <p className="mb-5 mt-3 flex-1 text-sm leading-7 text-muted">여러 빚은 무료 National Debt Helpline 1800 007 007에 상담할 수 있어요. 금융회사에 요청해도 답이 없거나 해결에 불만이면 AFCA 범위를 확인하세요.</p>
          <a href="https://www.afca.org.au/make-a-complaint/financial-hardship-complaints" target="_blank" rel="noreferrer" className={actionClass("secondary")}>금융회사 지원 분쟁 안내 ↗</a>
        </article>
      </div>
      <p className="mt-4 text-xs leading-6 text-muted">Hoju Compass는 신청·상담 내용을 수집하지 않아요. 외부 기관 페이지는 인터넷 연결이 필요하고 개인정보는 해당 기관의 공식 절차에만 제출하세요. 지급·감면·추심 중지를 보장하는 안내가 아닙니다.</p>
    </section>
  );
}
