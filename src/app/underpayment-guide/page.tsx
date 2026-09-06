import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/site";
import { CopyTextButton } from "./CopyTextButton";

export const metadata = createPageMetadata({
  title: "급여가 적게 들어왔을 때 확인하는 방법 | Hoju Compass",
  description:
    "호주에서 급여가 맞지 않을 때 근무 기록, Award 시급, Payslip을 비교하고 차액을 요청하는 순서를 한국어로 확인하세요.",
  path: "/underpayment-guide",
});

const steps = [
  {
    title: "급여기간 하나 고정하기",
    description:
      "가장 기록이 분명한 Payslip의 시작일–종료일과 지급일을 먼저 적으세요. Payslip이 없으면 은행 입금만으로 차액을 만들지 말고 해당 기간의 Payslip과 기록을 요청합니다.",
    links: [{ label: "Payslip 공식 안내", href: "https://www.fairwork.gov.au/pay-and-wages/paying-wages/pay-slips" }],
  },
  {
    title: "시급·Award 근거 확인하기",
    description:
      "Agreement 존재 여부, Award·Classification·고용 형태, 적용 날짜와 확인 출처를 적으세요. PACT에는 이 급여기간의 날짜를 넣고 penalty, overtime, allowance까지 확인합니다. 기준을 모르면 unknown으로 두고 계산을 멈춥니다.",
    links: [{ label: "PACT에서 시급 확인", href: "https://calculate.fairwork.gov.au/" }, { label: "Award 찾는 법", href: "/award-guide" }],
  },
  {
    title: "Roster·Timesheet와 실제 근무 맞추기",
    description:
      "최소 한 근무일의 시작·종료, 실제 무급 휴게, ordinary/overtime, penalty·allowance 후보를 출처와 함께 적으세요. Roster와 실제 근무가 다르면 어느 하나를 덮어쓰지 말고 둘 다 보관합니다.",
    links: [{ label: "고용 기록 공식 안내", href: "https://www.fairwork.gov.au/pay-and-wages/paying-wages/record-keeping" }],
  },
  {
    title: "기대 Gross와 Payslip Gross 비교하기",
    description:
      "확인된 시간·시급·수당만 합산한 기대 Gross를 Payslip Gross와 비교하세요. 어느 값이 비어 있거나 기준이 불명확하면 A$0 차이라고 쓰지 말고 ‘비교 불가—자료 요청’으로 남깁니다.",
    links: [],
  },
  {
    title: "Payslip Net과 은행 Net 맞추기",
    description:
      "같은 기간의 Payslip Net과 실제 은행 Net 입금 합계만 비교하세요. 지급일·분할 입금·입금 계좌가 확인되기 전에는 차액을 확정하지 않으며 Gross와 은행 Net을 직접 빼지 않습니다.",
    links: [],
  },
  {
    title: "차이 종류와 다음 연락 하나 정하기",
    description:
      "hours / rate / allowance-or-penalty / deduction / net-transfer / super-status / unknown 중 해당 항목을 표시하고, 자료 요청·첫 문의·재문의·수정 입금 대조·공식 도움 중 다음 행동 하나와 날짜를 적으세요.",
    links: [],
  },
];

const outcomeStates = [
  ["ready_to_ask", "문의 준비 완료", "기간·근거·두 비교·차이 종류와 보낼 문의문, 회신 요청일이 모두 있습니다."],
  ["blocked_with_request", "자료 요청 필요", "Payslip·근무기록·적용 기준 중 하나가 없어 차액을 확정하지 않고 요청할 자료와 상대를 정했습니다."],
  ["resolved_and_verified", "수정 확인 완료", "설명이나 약속만 받은 상태가 아니라 수정 Payslip과 실제 입금을 같은 기간으로 다시 맞췄습니다."],
  ["escalation_ready", "공식 도움 준비", "첫 문의·재문의 날짜, 답변, 보관한 사본과 미해결 항목, 맞는 공식 도움 경로가 정리됐습니다."],
];

const records = [
  "근로계약서 또는 고용 조건 안내",
  "Roster, Timesheet와 직접 적은 근무시간",
  "해당 기간의 모든 Payslip",
  "급여가 입금된 은행 내역",
  "Award·Classification과 적용 시급 자료",
  "고용주와 주고받은 문자·이메일",
];

const comparisons = [
  ["시간·시급", "근무 기록으로 계산한 예상 Gross ↔ Payslip Gross", "시간, 시급, 수당, Overtime이 어떻게 반영됐는지"],
  ["입금", "Payslip Net ↔ 같은 급여의 은행 입금 합계", "지급일, 분할 입금, 입금 계좌가 맞는지"],
  ["공제", "공제 항목·금액 ↔ 공제 근거", "항목 설명과 동의 또는 법적 근거가 있는지"],
  ["Super", "Payslip 표시 ↔ Super fund 거래 내역", "납부 완료인지 예정인지, 대상 기간과 납부일은 언제인지"],
];

const followUps = [
  ["다음 급여에 수정하겠다는 답변", "어느 지급일에 어떤 항목을 수정하는지", "답변, 수정 Payslip, 실제 입금 내역"],
  ["근무시간이 맞다는 답변", "출퇴근·휴게시간 기록을 내 기록과 대조", "시간 차이의 설명과 근거 기록"],
  ["시급이 맞다는 답변", "Award·Classification·적용 기간을 확인", "적용 기준과 해당 기간의 공식 시급 자료"],
  ["답변이 없거나 해결되지 않음", "요청 내용과 원본 자료를 모아 Fair Work·노조·관련 전문가에게 문의", "연락 날짜, 담당자, 답변과 다음 행동"],
];

const enquiryEmail = `Subject: Please check my pay for [start date–end date]

Hi [name],

Could you check the pay for [period]? My records show [hours] paid hours on [date], while my payslip shows [hours]. I have attached the relevant time record and payslip.

Could you confirm the award or agreement, classification and rates used, and explain the difference? If a correction is needed, please confirm when I will receive the corrected payslip and any back payment.

Please reply by [requested date], or let me know when you can review it.

Thank you,
[name]`;

const recordRequestEmail = `Subject: Request for payslip and employment records

Hi [name],

Please send me my payslip and time and wage records for [start date–end date]. Please also confirm the award or agreement, classification and pay rates used for that period.

Thank you,
[name]`;

export default function UnderpaymentGuidePage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "급여 가이드", path: "/guides" }, { name: "미지급 급여 확인", path: "/underpayment-guide" }]} />
      <Header />
      <main className="py-12 sm:py-16">
        <Container>
          <Link
            href="/guides"
            className="inline-flex min-h-11 items-center text-sm font-medium text-muted transition-colors hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
          >
            &larr; 급여 가이드 목록으로 돌아가기
          </Link>

          <div className="mb-10 mt-6 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">급여 문제 해결 가이드</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
              급여가 적게 들어왔을 때 확인하는 방법
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
              급여가 예상보다 적다면 바로 금액만 따지기보다 기록과 적용 기준부터 맞춰 보세요. 아래 순서대로 확인하면 무엇이 다른지 설명하기 쉬워집니다.
            </p>
          </div>

          <section className="rounded-2xl bg-navy p-6 text-white shadow-sm sm:p-8" aria-labelledby="quick-check-heading">
            <p className="text-sm font-semibold text-gold">먼저 확인할 네 가지</p>
            <h2 id="quick-check-heading" className="mt-2 text-2xl font-semibold">
              근무시간 · 적용 시급 · 수당 · 실제 지급액
            </h2>
            <p className="mt-4 max-w-4xl leading-7 text-white/70">
              세후 입금액만으로는 미지급 여부를 판단하기 어렵습니다. 먼저 받아야 할 세전 급여와 Payslip의 세전 급여를 같은 급여 기간 기준으로 비교하세요.
            </p>
            <p className="mt-5 border-l-2 border-gold pl-4 font-semibold leading-7 text-white">지금 할 일: 가장 기록이 분명한 급여기간 하나를 고르고, 아래 6단계 끝에서 다음 연락 하나를 정하세요.</p>
          </section>

          <section className="mt-8 rounded-2xl border border-border bg-white p-6 sm:p-8" aria-labelledby="comparison-heading">
            <h2 id="comparison-heading" className="text-2xl font-semibold text-navy">같은 기간, 같은 종류의 금액을 비교하세요</h2>
            <p className="mt-3 leading-7 text-muted">Gross는 공제 전, Net은 공제 후 금액입니다. Gross에서 은행 입금액을 바로 빼면 세금 등 공제까지 미지급으로 오해할 수 있습니다.</p>
            <p id="comparison-scroll-help" className="mt-4 text-xs font-semibold text-navy sm:hidden">표를 좌우로 밀어 비교할 자료와 질문까지 확인하세요.</p>
            <div className="mt-2 overflow-x-auto rounded-xl border border-border sm:mt-5" role="region" aria-label="급여 비교 기준 표" aria-describedby="comparison-scroll-help" tabIndex={0}>
              <table className="w-full min-w-[34rem] text-left text-sm leading-6">
                <thead className="bg-surface text-navy"><tr>{["확인 항목", "비교할 자료", "확인 질문"].map((heading) => <th key={heading} scope="col" className="p-4">{heading}</th>)}</tr></thead>
                <tbody>{comparisons.map(([item, basis, question]) => <tr key={item} className="border-t border-border"><th scope="row" className="p-4 align-top text-navy">{item}</th><td className="p-4 align-top text-muted">{basis}</td><td className="p-4 align-top text-muted">{question}</td></tr>)}</tbody>
              </table>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted">Payslip의 Super는 이미 납부한 금액 또는 납부 예정 금액일 수 있습니다. 표시만으로 fund 입금 완료를 판단하지 마세요. <a href="https://www.fairwork.gov.au/pay-and-wages/paying-wages/pay-slips" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-semibold text-navy underline">Fair Work Payslip 안내</a></p>
          </section>

          <section className="mt-8 rounded-2xl border border-gold/40 bg-gold/10 p-6 sm:p-8" aria-labelledby="example-heading">
            <h2 id="example-heading" className="text-2xl font-semibold text-navy">예시: 입금은 맞지만 근무시간이 다른 경우</h2>
            <p className="mt-3 text-sm leading-6 text-muted">아래 시급 A$30과 PAYG 공제 A$70은 설명을 위한 가상 숫자입니다. 법정 시급이나 올바른 세금 계산을 뜻하지 않습니다.</p>
            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              {[["내 근무 기록의 예상 Gross", "20시간 × A$30 = A$600"], ["Payslip Gross", "19시간 × A$30 = A$570"], ["Payslip Net", "A$570 − PAYG A$70 − 기타 공제 A$0 = A$500"], ["은행 입금", "A$500 → Payslip Net과 일치"]].map(([label, value]) => <div key={label} className="rounded-xl bg-white p-4"><dt className="text-sm text-muted">{label}</dt><dd className="mt-2 font-semibold text-navy">{value}</dd></div>)}
            </dl>
            <p className="mt-5 leading-7 text-muted">확인할 항목은 근무 기록과 Payslip의 <strong className="text-navy">1시간·세전 A$30 차이</strong>입니다. 예상 Gross A$600에서 입금 A$500을 뺀 A$100을 미지급액으로 적지 마세요. 기록과 적용 시급이 맞는지 먼저 확인하며, 추가 지급 시 세후 입금액은 A$30과 다를 수 있습니다.</p>
          </section>

          <section className="mt-8 rounded-2xl border border-border bg-white p-6 sm:p-8" aria-labelledby="steps-heading">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">one_pay_period_next_contact</p>
            <h2 id="steps-heading" className="mt-2 text-2xl font-semibold tracking-tight text-navy">한 급여기간을 끝내는 6단계</h2>
            <ol className="mt-7 space-y-5">
              {steps.map((step, index) => (
                <li key={step.title} className="flex gap-4 rounded-xl bg-surface p-5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/20 font-semibold text-navy">{index + 1}</span>
                  <div>
                    <h3 className="font-semibold text-navy">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted">{step.description}</p>
                    {step.links.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{step.links.map((link) => link.href.startsWith("/") ? <Link key={link.href} href={link.href} className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">{link.label} →</Link> : <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">{link.label} ↗</a>)}</div>}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-8 rounded-2xl border border-gold/50 bg-gold/10 p-6 sm:p-8" aria-labelledby="outcome-heading">
            <h2 id="outcome-heading" className="text-2xl font-semibold text-navy">첫 결과: 현재 상태와 다음 연락 한 가지</h2>
            <p className="mt-3 max-w-4xl leading-7 text-muted">종이에 급여기간·고용 형태, 적용 기준과 확인일, 근무 기록 출처, 기대 Gross↔Payslip Gross, Payslip Net↔은행 Net, 차이 종류, 다음 행동과 날짜를 한 장에 적으세요. 비어 있거나 비교할 수 없는 값은 <strong className="text-navy">unknown / 비교 불가</strong>로 두며 A$0 차이로 바꾸지 않습니다.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {outcomeStates.map(([status, title, description]) => <article key={status} className="rounded-xl border border-gold/40 bg-white p-5"><p className="font-mono text-xs font-semibold text-gold-dark">{status}</p><h3 className="mt-2 font-semibold text-navy">{title}</h3><p className="mt-2 text-sm leading-6 text-muted">{description}</p></article>)}
            </div>
          </section>

          <section className="mt-8 rounded-2xl border border-border bg-surface p-6 sm:p-8" aria-labelledby="records-heading">
            <h2 id="records-heading" className="text-2xl font-semibold tracking-tight text-navy">미리 모아둘 자료</h2>
            <p className="mt-3 leading-7 text-muted">자료는 급여 기간별로 묶어 두면 차액을 계산하고 문의할 때 훨씬 편합니다.</p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {records.map((record) => (
                <li key={record} className="flex gap-3 rounded-xl border border-border bg-white p-4 text-sm leading-6 text-muted">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gold" />
                  <span>{record}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-8 rounded-2xl border border-border bg-white p-6 sm:p-8" aria-labelledby="missing-records-heading">
            <h2 id="missing-records-heading" className="text-2xl font-semibold text-navy">자료가 부족하면 확인된 것부터 남기세요</h2>
            <ul className="mt-5 list-disc space-y-3 pl-5 text-sm leading-7 text-muted">
              <li>대상 급여 기간, 근무 날짜, 시작·종료 시각, 실제 무급 휴게시간, 기록 출처와 Payslip을 함께 정리하세요. 모르는 값은 미확인으로 표시합니다.</li>
              <li>Roster는 예정 근무이며 실제 근무와 다를 수 있습니다. 기억으로 적은 내용은 그렇게 표시하고 원본을 수정하지 마세요. 다른 사람의 비공개 기록을 가져오지 않습니다.</li>
              <li>Payslip이 없다면 해당 기간의 급여 내역을 요청하세요. Award·Level이 불명확하면 이름·분류·적용 기간을 묻고, 가장 높은 시급을 임의로 넣지 마세요.</li>
              <li>휴게시간이 자동 차감됐다면 실제 쉰 시간과 대조하세요. 여러 주가 섞였다면 기록이 가장 분명한 한 기간부터 정리합니다.</li>
            </ul>
          </section>

          <section className="mt-8 rounded-2xl border border-border bg-white p-6 sm:p-8" aria-labelledby="email-heading">
            <h2 id="email-heading" className="text-2xl font-semibold text-navy">복사해서 다듬는 Payroll 문의 이메일</h2>
            <p className="mt-3 leading-7 text-muted">이 페이지에는 이름·금액·Payslip을 입력하거나 올리지 않습니다. 아래 문장을 복사해 브라우저 밖에서 대괄호를 바꾸고, 고용주나 Payroll의 확인된 연락처로 보내세요. 필요한 기간의 사본만 보내고 TFN·계좌번호·주소·전체 은행내역 같은 무관한 정보는 가리며 원본은 본인이 보관합니다.</p>
            <h3 className="mt-6 font-semibold text-navy">Payslip·근무 기록이 없을 때 먼저 요청</h3>
            <pre className="mt-3 whitespace-pre-wrap break-words rounded-xl bg-surface p-5 font-sans text-sm leading-7 text-navy" lang="en">{recordRequestEmail}</pre>
            <div className="mt-3"><CopyTextButton text={recordRequestEmail} label="자료 요청문 복사" /></div>
            <h3 className="mt-8 font-semibold text-navy">비교할 근거가 모였을 때 급여 확인 요청</h3>
            <pre className="mt-5 whitespace-pre-wrap break-words rounded-xl bg-surface p-5 font-sans text-sm leading-7 text-navy" lang="en">{enquiryEmail}</pre>
            <div className="mt-3"><CopyTextButton text={enquiryEmail} label="급여 문의문 복사" /></div>
            <p className="mt-4 text-sm leading-6 text-muted">보낸 날짜, 사용자가 정한 회신 요청일, 첨부한 사본을 함께 적으세요. 요청 답변일은 내가 제안하는 날짜이며 법정 답변 기한이 아닙니다.</p>
          </section>

          <section className="mt-8 rounded-2xl border border-border bg-white p-6 sm:p-8" aria-labelledby="follow-up-heading">
            <h2 id="follow-up-heading" className="text-2xl font-semibold text-navy">답변을 받으면 다음 행동까지 기록하세요</h2>
            <p id="follow-up-scroll-help" className="mt-4 text-xs font-semibold text-navy sm:hidden">표를 좌우로 밀어 다음 확인과 남길 자료까지 확인하세요.</p>
            <div className="mt-2 overflow-x-auto rounded-xl border border-border sm:mt-5" role="region" aria-label="급여 문의 답변별 다음 행동 표" aria-describedby="follow-up-scroll-help" tabIndex={0}>
              <table className="w-full min-w-[34rem] text-left text-sm leading-6">
                <thead className="bg-surface text-navy"><tr>{["받은 답변", "다음 확인", "남길 자료"].map((heading) => <th key={heading} scope="col" className="p-4">{heading}</th>)}</tr></thead>
                <tbody>{followUps.map(([reply, action, evidence]) => <tr key={reply} className="border-t border-border"><th scope="row" className="p-4 align-top text-navy">{reply}</th><td className="p-4 align-top text-muted">{action}</td><td className="p-4 align-top text-muted">{evidence}</td></tr>)}</tbody>
              </table>
            </div>
            <p className="mt-4 leading-7 text-muted">원래 Payslip과 수정본을 함께 보관하고 실제 입금과 다음 급여 항목을 다시 확인하세요. ‘설명 받음’, ‘수정 지급 예정’, ‘입금 확인’을 구분해 기록하면 약속만 받은 상태를 완료로 오해하지 않습니다.</p>
          </section>

          <section className="mt-8 grid gap-5 md:grid-cols-2" aria-label="중요한 급여 확인 사항">
            <article className="rounded-2xl border border-border bg-white p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-navy">Payslip이 없어도 기록하세요</h2>
              <p className="mt-3 leading-7 text-muted">
                고용주는 급여 지급 후 1 working day 안에 Payslip을 제공해야 합니다. 받지 못했다면 요청하고, 그동안 본인이 근무시간과 입금 내역을 계속 기록하세요.
              </p>
            </article>
            <article className="rounded-2xl border border-border bg-white p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-navy">고용 기록을 요청할 수 있어요</h2>
              <p className="mt-3 leading-7 text-muted">
                고용주는 시간과 급여 관련 기록을 7년 동안 보관해야 하며, 직원이나 퇴사한 직원이 자신의 기록을 요청하면 열람할 수 있도록 해야 합니다.
              </p>
            </article>
          </section>

          <section className="mt-8 rounded-2xl border border-border bg-white p-6 sm:p-8" aria-labelledby="official-help-heading">
            <h2 id="official-help-heading" className="text-2xl font-semibold tracking-tight text-navy">공식 도구와 도움</h2>
            <p className="mt-3 leading-7 text-muted">시급·Award·근무시간·Payslip·고용 기록 문제는 Fair Work 경로를 사용하세요. 위협·보복 우려, 비자 취약성, 여러 기간이나 복잡한 Agreement가 얽히면 같은 이메일만 반복하지 말고 공식 도움이나 노조·관련 전문가로 일찍 이동하세요.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <a href="https://www.fairwork.gov.au/workplace-problems/common-workplace-problems/my-pay-doesnt-seem-right" target="_blank" rel="noreferrer" className="min-h-11 rounded-xl border border-border bg-surface p-5 transition hover:border-gold/60">
                <h3 className="font-semibold text-navy">My pay doesn&apos;t seem right</h3>
                <p className="mt-2 text-sm leading-6 text-muted">Fair Work의 급여 문제 확인 절차를 봅니다.</p>
              </a>
              <a href="https://calculate.fairwork.gov.au/" target="_blank" rel="noreferrer" className="min-h-11 rounded-xl border border-border bg-surface p-5 transition hover:border-gold/60">
                <h3 className="font-semibold text-navy">Pay and Conditions Tool</h3>
                <p className="mt-2 text-sm leading-6 text-muted">공식 시급, 수당과 근무 조건을 확인합니다.</p>
              </a>
              <a href="https://www.fairwork.gov.au/workplace-problems/fixing-a-workplace-problem/get-our-help-with-a-workplace-problem" target="_blank" rel="noreferrer" className="min-h-11 rounded-xl border border-border bg-surface p-5 transition hover:border-gold/60">
                <h3 className="font-semibold text-navy">Get our help</h3>
                <p className="mt-2 text-sm leading-6 text-muted">첫 문의와 재문의 뒤에도 해결되지 않은 급여·기록 문제의 도움 경로입니다.</p>
              </a>
              <a href="https://www.fairwork.gov.au/tools-and-resources/language-help/korean" target="_blank" rel="noreferrer" className="min-h-11 rounded-xl border border-border bg-surface p-5 transition hover:border-gold/60">
                <h3 className="font-semibold text-navy">Fair Work 한국어 자료</h3>
                <p className="mt-2 text-sm leading-6 text-muted">영어가 어려우면 한국어로 번역된 기본 권리 안내부터 확인합니다.</p>
              </a>
              <a href="tel:131450" className="min-h-11 rounded-xl border border-border bg-surface p-5 transition hover:border-gold/60">
                <h3 className="font-semibold text-navy">TIS 13 14 50</h3>
                <p className="mt-2 text-sm leading-6 text-muted">통역 서비스에 전화해 Fair Work Infoline 13 13 94 연결을 요청하세요.</p>
              </a>
              <a href="https://www.fairwork.gov.au/find-help-for/visa-holders-migrants" target="_blank" rel="noreferrer" className="min-h-11 rounded-xl border border-border bg-surface p-5 transition hover:border-gold/60">
                <h3 className="font-semibold text-navy">Visa holders and migrants</h3>
                <p className="mt-2 text-sm leading-6 text-muted">비자 상태가 걱정될 때 이주 노동자 대상 공식 안내를 확인합니다.</p>
              </a>
            </div>
            <div className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
              <article className="rounded-xl bg-surface p-5"><h3 className="font-semibold text-navy">Tax 공제 차이</h3><p className="mt-2 text-sm leading-6 text-muted">급여·Award 차이와 분리해 고용주에게 공제 근거를 묻고, 세금 자체의 계산·신고 문제는 <a href="https://www.ato.gov.au/calculators-and-tools/tax-withheld-calculator" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-semibold text-navy underline">ATO Tax withheld calculator ↗</a>에서 확인하세요.</p></article>
              <article className="rounded-xl bg-surface p-5"><h3 className="font-semibold text-navy">Super 실제 납부 차이</h3><p className="mt-2 text-sm leading-6 text-muted">Payslip 표시만 보지 말고 먼저 본인 Super fund의 거래와 납부일을 확인하세요. 미납·지연이 확인되면 <a href="https://www.ato.gov.au/calculators-and-tools/super-report-unpaid-super-contributions-from-my-employer" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-semibold text-navy underline">ATO unpaid super 경로 ↗</a>를 사용합니다.</p></article>
            </div>
          </section>

          <section className="mt-8 rounded-2xl border border-gold/40 bg-gold/10 p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-navy">먼저 내 Award와 급여 항목을 확인하세요</h2>
            <p className="mt-2 max-w-3xl leading-7 text-muted">차액을 계산하기 전에 적용 Award와 Classification을 찾고, Payslip에서 Gross Pay, 수당과 공제 항목을 확인하면 좋습니다.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/award-guide" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-light">Award 확인하기</Link>
              <Link href="/payslip-guide" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-navy bg-white px-5 py-2.5 text-sm font-semibold text-navy transition hover:bg-surface">Payslip 읽는 법</Link>
              <Link href="/resources/first-payslip-checklist-australia" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-navy bg-white px-5 py-2.5 text-sm font-semibold text-navy transition hover:bg-surface">첫 Payslip 체크리스트</Link>
            </div>
          </section>

          <section className="mt-8 border border-navy/20 bg-white p-5 sm:p-6" aria-labelledby="pay-evidence-pro-cta">
            <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
              <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">선택 사항 · Pay Evidence Pack Pro</p><h2 id="pay-evidence-pro-cta" className="mt-2 text-xl font-semibold text-navy">여러 급여기간을 반복해서 정리할 때</h2><p className="mt-2 text-sm leading-6 text-muted">한 급여기간의 비교·자료 요청·첫 문의와 공식 도움은 이 무료 가이드로 끝낼 수 있습니다. 여러 기간의 차이·증빙 상태를 반복 저장하고 전달용 파일로 묶어야 할 때만 Pro 구성을 확인하세요.</p></div>
              <Link href="/pay-evidence-pro" className="inline-flex min-h-12 items-center justify-center bg-navy px-5 text-sm font-semibold text-white">Pro 구성 보기 →</Link>
            </div>
          </section>

          <aside className="mt-8 rounded-xl border border-border bg-white p-5 text-sm leading-6 text-muted">
            이 페이지는 일반적인 확인 절차를 안내하며 법률 자문이 아닙니다. 적용 Award, Agreement, 근무 기록과 청구 가능 기간은 개인 상황에 따라 달라질 수 있습니다. 긴급하거나 복잡한 분쟁은 Fair Work Ombudsman 또는 관련 전문가에게 확인하세요.
          </aside>
        </Container>
      </main>
      <Footer />
    </>
  );
}
