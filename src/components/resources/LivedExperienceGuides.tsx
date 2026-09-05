import Link from "next/link";

const livedExperienceGuides = [
  {
    number: "01",
    situation: "말이 막힐 때",
    title: "천천히 다시 말해 달라고 먼저 요청해요",
    description: "이해한 내용을 확인한 뒤 비용·날짜·다음 행동은 문자나 이메일로 받아두는 문장을 정리했어요.",
    href: "/resources/australia-arrival-english-clarifying-phrases",
    linkLabel: "다시 묻는 문장 보기",
  },
  {
    number: "02",
    situation: "열쇠를 받은 첫날",
    title: "짐을 풀거나 수리하기 전에 사진부터 남겨요",
    description: "입주 상태를 사진과 Condition Report에 남기고 Bond의 공식 처리 경로를 확인하는 순서를 정리했어요.",
    href: "/resources/rental-condition-report-bond-first-week-australia",
    linkLabel: "입주 기록 순서 보기",
  },
  {
    number: "03",
    situation: "첫 은행 계좌를 열 때",
    title: "수수료와 신원 확인 조건부터 비교해요",
    description: "월 관리비·ATM·해외 결제 수수료, 신원 확인과 보안 설정을 살핀 뒤 첫 Statement에서 실제 부과 내역을 확인해요.",
    href: "/resources/australia-bank-account-opening-guide",
    linkLabel: "계좌 체크 순서 보기",
  },
  {
    number: "04",
    situation: "첫 급여가 들어왔을 때",
    title: "근무시간과 시급으로 Gross부터 맞춰봐요",
    description: "근무 기록으로 Gross Pay를 확인하고 Payslip의 Net Pay가 실제 은행 입금액과 같은지 비교해요.",
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
          처음 정착할 때 자주 막히는 네 장면
        </h2>
        <p className="mt-4 text-sm leading-7 text-muted sm:text-base">
          이 사이트의 체크리스트와 연결 가이드에서 반복되는 첫 행동을 네 상황으로 묶었어요. 먼저 할 일을 고른 뒤, 적용 지역과 업데이트일, 공식 출처는 연결된 글에서 함께 확인할 수 있어요.
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
