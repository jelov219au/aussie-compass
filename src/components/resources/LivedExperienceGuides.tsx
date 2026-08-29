import Link from "next/link";

const livedExperienceGuides = [
  {
    number: "01",
    situation: "말이 막힐 때",
    title: "못 알아들었으면, 아는 척하지 않아도 돼요",
    description: "천천히 다시 말해 달라고 하고 비용·날짜·다음 행동은 글로 받아두는 문장을 정리했어요.",
    href: "/resources/australia-arrival-english-clarifying-phrases",
    linkLabel: "다시 묻는 문장 보기",
  },
  {
    number: "02",
    situation: "열쇠를 받은 첫날",
    title: "짐을 풀기 전에 사진부터 남겨요",
    description: "입주 상태 기록(Condition Report), 사진, 보증금(Bond)을 어떤 순서로 확인하고 남길지 정리했어요.",
    href: "/resources/rental-condition-report-bond-first-week-australia",
    linkLabel: "입주 기록 순서 보기",
  },
  {
    number: "03",
    situation: "첫 은행 계좌를 열 때",
    title: "은행 이름보다 내가 낼 수수료부터 봐요",
    description: "월 관리비, ATM·해외 결제 수수료와 신원 확인, 보안 설정을 순서대로 확인해요.",
    href: "/resources/australia-bank-account-opening-guide",
    linkLabel: "계좌 체크 순서 보기",
  },
  {
    number: "04",
    situation: "첫 급여가 들어왔을 때",
    title: "받고 끝내지 말고 입금액과 맞춰봐요",
    description: "근무 기록의 시간·시급을 급여명세서(Payslip)와 확인하고, 실수령액(Net Pay)이 실제 입금액과 같은지 비교해요.",
    href: "/payslip-guide",
    linkLabel: "Payslip 비교하기",
  },
];

export function LivedExperienceGuides() {
  return (
    <section
      id="lived-experience-guides"
      className="mt-12 scroll-mt-24 border-y border-navy/20 bg-[#f2eee5] px-5 py-8 sm:px-8 sm:py-10"
      aria-labelledby="lived-experience-guides-heading"
    >
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-ink">처음 정착할 때 놓치기 쉬운 것</p>
        <h2 id="lived-experience-guides-heading" className="mt-3 text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
          실제로 살면서 알게 된 것들
        </h2>
        <p className="mt-4 text-sm leading-7 text-muted sm:text-base">
          처음 호주에 왔을 때 남겨둔 기록에서 반복해서 보였던 상황을 골라, 지금 확인할 수 있는 관련 가이드와 함께 묶었어요. 개인적인 이야기는 덜고 처음 온 사람도 바로 써볼 수 있는 질문과 확인 순서로 다시 정리했습니다. 규정과 숫자는 지금의 공식 자료로 다시 확인했어요.
        </p>
      </div>

      <ol className="mt-7 grid gap-px overflow-hidden border border-navy/15 bg-navy/15 sm:grid-cols-2">
        {livedExperienceGuides.map((guide) => (
          <li key={guide.href} className="bg-white">
            <Link
              href={guide.href}
              className="group grid h-full min-h-64 grid-rows-[auto_1fr_auto] p-5 transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-inset sm:p-6"
            >
              <span className="flex items-center justify-between gap-4 text-xs">
                <span className="font-mono text-gold-ink">{guide.number}</span>
                <span className="text-right font-medium text-muted">{guide.situation}</span>
              </span>
              <span className="py-7">
                <strong className="block text-xl leading-8 tracking-tight text-navy">{guide.title}</strong>
                <span className="mt-3 block text-sm leading-6 text-muted">{guide.description}</span>
              </span>
              <span className="flex items-center justify-between gap-3 text-sm font-semibold text-navy">
                <span>{guide.linkLabel}</span>
                <span className="text-lg transition group-hover:translate-x-1" aria-hidden="true">→</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
