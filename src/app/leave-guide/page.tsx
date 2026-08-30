import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "호주 휴가·병가·공휴일 가이드 | Hoju Compass",
  description: "호주의 Annual Leave, Sick and Carer's Leave, Public Holiday 기본 권리를 고용 형태별로 확인하세요.",
  path: "/leave-guide",
});

const leaveTypes = [
  {
    title: "연차 (Annual Leave)",
    permanent: "Full-time과 Part-time은 일반적으로 ordinary hours 기준 연 4주를 적립합니다. Part-time은 근무시간에 비례합니다.",
    casual: "Casual은 NES상 유급 Annual Leave가 없습니다.",
  },
  {
    title: "병가·간병휴가 (Sick and Carer's Leave)",
    permanent: "Full-time은 연 10일, Part-time은 근무시간에 비례해 유급 휴가를 적립하며 남은 잔액은 다음 해로 넘어갑니다.",
    casual: "유급 휴가는 없지만, 필요한 경우마다 2일의 unpaid carer's leave를 사용할 수 있습니다.",
  },
  {
    title: "공휴일 (Public Holiday)",
    permanent: "평소 근무일에 해당하는 공휴일에 쉬면 일반적으로 ordinary hours의 base rate를 받습니다.",
    casual: "근무하지 않은 공휴일에 대한 유급 권리는 일반적으로 없으며, 근무 시 Award·Agreement의 penalty rate를 확인해야 합니다.",
  },
  {
    title: "가족·가정폭력 휴가 (Family and Domestic Violence Leave)",
    permanent: "Full-time과 Part-time은 매년 10일의 유급 휴가를 이용할 수 있으며, 다른 유급 휴가와 별도입니다.",
    casual: "Casual도 매년 10일의 유급 휴가를 이용할 수 있습니다. 실제 Roster 시간과 Full pay rate 기준을 공식 안내에서 확인하세요.",
  },
  {
    title: "Compassionate Leave",
    permanent: "Immediate family 또는 Household member의 사망·생명에 위협이 되는 질병·부상 등 허용되는 상황마다 일반적으로 2일의 유급 휴가를 이용할 수 있습니다.",
    casual: "허용되는 상황마다 일반적으로 2일의 무급 Compassionate leave를 이용할 수 있습니다.",
  },
  {
    title: "Community Service Leave",
    permanent: "Jury duty 또는 자격 있는 Voluntary emergency management activity에 필요한 시간과 합리적인 이동·휴식시간을 확인합니다. 지급 규칙은 활동과 기간에 따라 다릅니다.",
    casual: "Casual도 Community service leave를 이용할 수 있습니다. Jury duty 지급은 NES 외 주·준주 법이 더 나은 권리를 줄 수 있어 지역 기준도 확인하세요.",
  },
  {
    title: "Parental Leave",
    permanent: "출산·입양 관련 Unpaid parental leave 자격과 Flexible unpaid parental leave, Notice·Evidence 기한을 근속기간과 고용상태에 따라 확인합니다.",
    casual: "Regular and systematic casual은 합리적으로 계속 고용될 기대 등 조건을 충족하면 자격이 있을 수 있으므로 Casual이라는 이유만으로 제외하지 마세요.",
  },
  {
    title: "Long Service Leave",
    permanent: "대부분 주·준주 법, 일부 Award·Agreement·과도기 산업문서가 기준이므로 근무 지역과 적용 문서를 확인해야 합니다.",
    casual: "일부 주·준주에서는 Regular and systematic casual도 자격이 있을 수 있어 고용형태만 보고 판단하지 마세요.",
  },
];

const officialLinks = [
  { href: "https://www.fairwork.gov.au/leave/annual-leave", title: "Annual leave", summary: "적립, 이월, 사용과 NES 최소기준을 확인합니다." },
  { href: "https://www.fairwork.gov.au/leave/sick-and-carers-leave", title: "Sick and carer's leave", summary: "Personal illness·injury, 돌봄과 Unpaid carer's leave를 구분합니다." },
  { href: "https://www.fairwork.gov.au/leave/compassionate-and-bereavement-leave", title: "Compassionate leave", summary: "허용되는 상황, 유급·무급 구분과 사용 단위를 확인합니다." },
  { href: "https://www.fairwork.gov.au/leave/family-and-domestic-violence-leave", title: "Family and domestic violence leave", summary: "Casual을 포함한 10일 유급 권리, Notice·Evidence와 Privacy를 확인합니다." },
  { href: "https://www.fairwork.gov.au/leave/parental-leave", title: "Parental leave", summary: "근속·Casual 자격, Notice, Evidence와 복귀 권리를 확인합니다." },
  { href: "https://www.fairwork.gov.au/leave/community-service-leave", title: "Community service leave", summary: "Jury duty와 자격 있는 Emergency management 활동의 조건을 확인합니다." },
  { href: "https://www.fairwork.gov.au/leave/long-service-leave", title: "Long service leave", summary: "주·준주 기관과 적용되는 산업문서를 찾는 공식 출발점입니다." },
  { href: "https://www.fairwork.gov.au/employment-conditions/public-holidays", title: "Public holidays", summary: "근무 요청·거절, 비근무일 지급과 지역 공휴일을 확인합니다." },
  { href: "https://www.fairwork.gov.au/leave/annual-leave/directing-an-employee-to-take-annual-leave/direction-to-take-annual-leave-during-a-shut-down", title: "Shutdown and annual leave", summary: "사업장 Shutdown, Award·Agreement와 Annual leave 지시 조건을 확인합니다." },
  { href: "https://www.fairwork.gov.au/leave/sick-and-carers-leave/paid-sick-and-carers-leave/notice-and-medical-certificates", title: "Notice and evidence", summary: "Medical certificate·Statutory declaration 등 합리적인 증빙 기준을 확인합니다." },
  { href: "https://www.fairwork.gov.au/ending-employment/final-pay", title: "Final pay", summary: "종료 시 Annual leave와 적용되는 Loading, Sick leave·Long service leave 차이를 확인합니다." },
];

export default function LeaveGuidePage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "급여 가이드", path: "/guides" }, { name: "휴가·병가·공휴일", path: "/leave-guide" }]} />
      <Header />
      <main className="py-12 sm:py-16">
        <Container>
          <Link href="/guides" className="inline-flex text-sm font-medium text-muted transition-colors hover:text-navy">&larr; 전체 가이드로 돌아가기</Link>
          <div className="mb-10 mt-6 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">Leave Guide</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">호주 휴가·병가·공휴일 기본 가이드</h1>
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">고용 형태에 따라 유급 휴가 권리가 달라집니다. Full-time·Part-time과 Casual의 기본 차이부터 확인하세요.</p>
          </div>

          <section className="rounded-2xl bg-navy p-6 text-white shadow-sm sm:p-8" aria-labelledby="leave-summary-heading">
            <p className="text-sm font-semibold text-gold">빠른 요약</p>
            <h2 id="leave-summary-heading" className="mt-2 text-2xl font-semibold">Casual이라고 모든 휴가가 없는 것은 아닙니다</h2>
            <p className="mt-4 max-w-4xl leading-7 text-white/70">Casual loading은 Annual Leave와 paid sick leave 같은 일부 유급 권리가 없는 점을 반영합니다. 하지만 Paid family and domestic violence leave, Unpaid carer&apos;s·Compassionate leave, Community service leave와 조건을 충족한 Parental·Long service leave는 따로 확인해야 합니다.</p>
          </section>

          <section className="mt-8 space-y-5" aria-labelledby="leave-types-heading">
            <h2 id="leave-types-heading" className="text-2xl font-semibold tracking-tight text-navy">고용 형태별 기본 차이</h2>
            {leaveTypes.map((leave) => (
              <article key={leave.title} className="overflow-hidden rounded-2xl border border-border bg-white">
                <h3 className="border-b border-border bg-surface px-6 py-4 text-lg font-semibold text-navy">{leave.title}</h3>
                <div className="grid md:grid-cols-2">
                  <div className="p-6 md:border-r md:border-border"><p className="text-sm font-semibold text-navy">Full-time / Part-time</p><p className="mt-2 text-sm leading-6 text-muted">{leave.permanent}</p></div>
                  <div className="border-t border-border p-6 md:border-t-0"><p className="text-sm font-semibold text-navy">Casual</p><p className="mt-2 text-sm leading-6 text-muted">{leave.casual}</p></div>
                </div>
              </article>
            ))}
          </section>

          <section className="mt-8 grid gap-5 md:grid-cols-2">
            <article className="rounded-2xl border border-border bg-white p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-navy">휴가 신청과 증빙</h2>
              <p className="mt-3 leading-7 text-muted">휴가가 필요한 사실과 예상 기간을 가능한 한 빨리 알리세요. 병가나 간병휴가에는 고용주가 medical certificate 또는 statutory declaration 같은 합리적인 증빙을 요청할 수 있습니다.</p>
            </article>
            <article className="rounded-2xl border border-border bg-white p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-navy">연차 중 공휴일이 있다면</h2>
              <p className="mt-3 leading-7 text-muted">Annual Leave 기간 중 평소 근무일에 Public Holiday가 포함되면 그날은 일반적으로 Annual Leave 잔액에서 차감되지 않습니다.</p>
            </article>
          </section>

          <section className="mt-8 rounded-2xl border border-gold/40 bg-gold/10 p-6 sm:p-8" aria-labelledby="holiday-heading">
            <h2 id="holiday-heading" className="text-xl font-semibold text-navy">공휴일 근무 요청은 합리적이어야 합니다</h2>
            <p className="mt-3 max-w-4xl leading-7 text-muted">직원에게는 Public Holiday에 쉬는 기본 권리가 있습니다. 고용주는 합리적인 근무 요청을 할 수 있고, 직원은 합리적인 사유가 있거나 요청 자체가 불합리하면 거절할 수 있습니다. 업무 성격, 개인 사정, 고용 형태, 추가 수당과 사전 통지 등이 함께 고려됩니다.</p>
          </section>

          <section className="mt-8 grid gap-5 lg:grid-cols-2" aria-label="휴가 신청과 계산에서 자주 놓치는 부분">
            <article className="rounded-2xl border border-border bg-white p-6 sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">Annual leave</p><h2 className="mt-2 text-xl font-semibold text-navy">승인, 지시, Cash out은 서로 다른 절차예요</h2><p className="mt-3 text-sm leading-7 text-muted">Annual leave 요청은 고용주가 부당하게 거절해서는 안 되지만 자동 승인도 아닙니다. Shutdown 또는 Excessive balance 때문에 휴가 사용을 지시할 수 있는지는 Award·Enterprise agreement를 확인하세요. Cash out은 허용 문서, 매번 별도 Written agreement, 지급액과 사용 후 최소 잔액 같은 조건이 적용되며 압박받아 동의할 사안이 아닙니다.</p></article>
            <article className="rounded-2xl border border-border bg-white p-6 sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">Leave balance</p><h2 className="mt-2 text-xl font-semibold text-navy">Payslip 숫자만 보지 말고 Ordinary hours를 확인하세요</h2><p className="mt-3 text-sm leading-7 text-muted">Annual leave와 Paid sick·carer&apos;s leave는 근무 첫날부터 Ordinary hours를 기준으로 점진적으로 적립됩니다. Part-time은 단순히 ‘몇 일’이 아니라 실제 Ordinary hours를 기준으로 확인하고, 유급·무급 휴가 중 적립이 계속되는지 구분하세요. 회사 Portal과 Payslip 잔액이 다르면 Payroll에 계산 기간과 단위를 글로 요청하세요.</p></article>
            <article className="rounded-2xl border border-border bg-white p-6 sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">Notice and evidence</p><h2 className="mt-2 text-xl font-semibold text-navy">상세 진단보다 휴가 사유를 뒷받침하는 합리적 증빙</h2><p className="mt-3 text-sm leading-7 text-muted">Sick·Carer&apos;s leave는 가능한 한 빨리 예상 기간을 알리고, 요청받으면 합리적인 사람이 휴가 자격을 납득할 Evidence를 제공해야 합니다. Medical certificate나 Statutory declaration이 예가 될 수 있지만 Award·Agreement가 더 구체적인 기준을 둘 수 있어요. 고용주가 Doctor 진료에 동행하거나 직접 연락하는 것이 당연하다고 생각하지 말고 Privacy 범위를 확인하세요.</p></article>
            <article className="rounded-2xl border border-border bg-white p-6 sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">Final pay</p><h2 className="mt-2 text-xl font-semibold text-navy">퇴사할 때 Annual leave와 Sick leave 처리는 달라요</h2><p className="mt-3 text-sm leading-7 text-muted">미사용 Annual leave는 고용 종료 시 지급 대상이며, 적용되는 Annual leave loading 등도 확인해야 합니다. Sick and carer&apos;s leave는 일반적으로 종료 시 지급되지 않습니다. Long service leave의 Pro-rata 지급은 지역법과 종료 사유에 따라 달라질 수 있으니 Final pay 항목을 한꺼번에 판단하지 마세요.</p></article>
          </section>

          <section className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-6 sm:p-8" aria-labelledby="fdv-leave-heading">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-700">Privacy and safety</p><h2 id="fdv-leave-heading" className="mt-2 text-xl font-semibold text-navy">가족·가정폭력 휴가는 Casual도 유급이며 안전하게 기록돼야 해요</h2><p className="mt-3 max-w-4xl text-sm leading-7 text-muted">모든 직원은 매년 10일의 Paid family and domestic violence leave를 이용할 수 있고, 잔액은 근무 시작일부터 즉시 주어지며 이월되지 않고 Work anniversary에 갱신됩니다. Payslip에는 이 Leave를 알아볼 수 있게 표시해서는 안 되는 Privacy 규칙이 있습니다. 안전 위험이 있으면 회사 이메일·공용기기 대신 안전한 연락수단을 사용하고 1800RESPECT 1800 737 732 또는 위급 시 000을 이용하세요.</p>
          </section>

          <section className="mt-8 rounded-2xl border border-border bg-white p-6 sm:p-8" aria-labelledby="copy-leave-heading">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">Copy-ready questions</p><h2 id="copy-leave-heading" className="mt-2 text-xl font-semibold text-navy">휴가 문의에 복사해 보낼 핵심 문장</h2><ul className="mt-5 border-l-2 border-gold pl-5 text-sm leading-7 text-muted"><li className="border-b border-border py-3 first:pt-0">Could you confirm my current leave balance in hours and the period used to calculate it? — 현재 Leave balance를 시간 단위로, 계산에 사용한 기간과 함께 확인해 주실 수 있나요?</li><li className="border-b border-border py-3">Please confirm whether my leave request has been approved and how it will appear on my payslip. — 제 Leave request가 승인됐는지, Payslip에는 어떻게 표시되는지 확인해 주세요.</li><li className="border-b border-border py-3">What evidence is required under my award, agreement or workplace policy? — 제 Award, Agreement 또는 Workplace policy에서 어떤 Evidence가 필요한가요?</li><li className="border-b border-border py-3">Please provide the award or agreement clause that allows this shutdown leave direction. — 이 Shutdown leave 지시를 허용하는 Award 또는 Agreement 조항을 보내 주세요.</li><li className="py-3 last:pb-0">Could you itemise the annual leave and any applicable leave loading included in my final pay? — Final pay에 포함된 Annual leave와 적용되는 Leave loading을 항목별로 알려 주실 수 있나요?</li></ul>
          </section>

          <section className="mt-8 rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm leading-7 text-amber-950"><h2 className="font-semibold">직장 Injury와 Sick leave는 같은 판단이 아니에요</h2><p className="mt-1">업무 때문에 다치거나 아픈 경우 Sick leave를 쓸 수 있는지와 Workers compensation Claim·Weekly payments·Treatment 지원은 별도 절차입니다. Incident를 고용주에게 알리고 적용 Scheme을 확인하세요.</p><Link href="/resources/australia-workplace-injury-workers-compensation-guide" className="mt-3 inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">직장 부상·산재 Claim 가이드 →</Link></section>

          <section className="mt-8 rounded-2xl border border-border bg-white p-6 sm:p-8" aria-labelledby="official-leave-heading">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">공식 자료 기준 · 마지막 확인 2026.08.31</p><h2 id="official-leave-heading" className="mt-2 text-2xl font-semibold tracking-tight text-navy">Fair Work에서 내 Leave 종류와 적용 문서를 최종 확인하세요</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-muted">NES는 최저 기준이고 Award·Enterprise agreement·Contract 또는 주·준주 법이 더 나은 권리를 줄 수 있습니다. 아래 원문에서 현재 Form·기한과 내 고용형태를 다시 확인하세요.</p>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{officialLinks.map((link) => <li key={link.href}><a href={link.href} target="_blank" rel="noreferrer" className="flex h-full min-h-40 flex-col rounded-xl border border-border bg-surface p-5 transition hover:border-gold/60"><h3 className="font-semibold text-navy">{link.title}</h3><p className="mt-2 flex-1 text-sm leading-6 text-muted">{link.summary}</p><span className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-navy underline decoration-gold underline-offset-4">공식 원문 ↗</span></a></li>)}</ul>
          </section>

          <aside className="mt-8 rounded-xl border border-border bg-white p-5 text-sm leading-6 text-muted">이 페이지는 National Employment Standards의 일반적인 최소 기준을 설명합니다. Award, Enterprise Agreement, 주·준주 법률 또는 근로계약에서 더 나은 권리를 제공할 수 있으므로 본인에게 적용되는 조건을 함께 확인하세요.</aside>
        </Container>
      </main>
      <Footer />
    </>
  );
}
