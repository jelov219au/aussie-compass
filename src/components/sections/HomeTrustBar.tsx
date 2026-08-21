import Link from "next/link";
import { Container } from "@/components/ui/Container";

const principles = [
  {
    number: "01",
    title: "공식 자료부터 찾아봐요",
    description: "ATO, Fair Work, 주정부 자료를 먼저 확인하고 원문 링크를 함께 남겨요.",
    href: "/editorial-policy",
    linkLabel: "작성 원칙",
  },
  {
    number: "02",
    title: "개인정보는 꼭 필요한 만큼만",
    description: "대부분의 계산과 기록은 로그인 없이 쓸 수 있고, 입력한 내용은 사용 중인 기기에만 남아요.",
    href: "/privacy",
    linkLabel: "개인정보 안내",
  },
  {
    number: "03",
    title: "전문가의 판단이 필요한 부분은 구분해요",
    description: "일반적인 안내와 개인별 세무·법률 판단이 필요한 부분을 섞지 않아요.",
    href: "/disclaimer",
    linkLabel: "이용 전 확인",
  },
];

export function HomeTrustBar() {
  return (
    <section className="border-b border-border bg-surface py-8 sm:py-10" aria-labelledby="home-trust-heading">
      <Container>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-gold">정보를 고르는 기준</p>
            <h2 id="home-trust-heading" className="mt-2 text-2xl font-semibold tracking-tight text-navy">어떻게 확인한 정보인지 숨기지 않아요.</h2>
          </div>
          <Link href="/editorial-policy" className="inline-flex min-h-10 items-center text-sm font-semibold text-navy">
            전체 운영 원칙 보기 →
          </Link>
        </div>

        <ol className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-border bg-border lg:grid-cols-3">
          {principles.map((item) => (
            <li key={item.number} className="bg-white p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <span className="font-mono text-xs text-gold">{item.number}</span>
                <Link href={item.href} className="text-xs font-semibold text-muted transition hover:text-navy">
                  {item.linkLabel} →
                </Link>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-navy">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
