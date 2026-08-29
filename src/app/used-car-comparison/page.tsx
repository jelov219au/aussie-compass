import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { VehicleComparison } from "@/components/tools/VehicleComparison";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "호주 중고차 어디서 사나요? 구매처·체크리스트 | Hoju Compass",
  description: "Facebook Marketplace, Gumtree, Carsales에서 호주 중고차를 찾는 방법과 연락·사기 예방·PPSR·차량 검사 순서를 확인한 뒤 후보 차량을 비교하세요.",
  path: "/used-car-comparison",
});

const marketplaces = [
  {
    href: "https://www.facebook.com/marketplace/category/vehicles",
    name: "Facebook Marketplace",
    fit: "동네 개인 매물을 넓게 볼 때",
    description: "호주에서는 개인 판매자가 지역 기반으로 차량을 올리는 경우가 많아요. Facebook을 오래 쓰지 않았다면 계정과 Messenger 접근부터 확인해야 합니다.",
    caution: "새 계정·짧은 활동 이력, 시세보다 지나치게 싼 매물, 차량을 보기 전 보증금 요구를 특히 조심하세요.",
  },
  {
    href: "https://www.gumtree.com.au/s-cars-vans-utes/c18320",
    name: "Gumtree",
    fit: "개인 매물과 저가 차량을 함께 찾을 때",
    description: "지역과 가격 범위를 좁혀 개인·딜러 매물을 살펴볼 수 있는 호주 생활형 중고 거래 사이트예요.",
    caution: "광고 내용만 믿지 말고 판매자 이름, 연락처, 차량 위치와 VIN이 실제 차량과 일치하는지 확인하세요.",
  },
  {
    href: "https://www.carsales.com.au/cars/used/",
    name: "Carsales",
    fit: "조건을 세밀하게 비교하고 싶을 때",
    description: "차종, 연식, 주행거리, 지역과 판매자 유형을 자세히 걸러 개인·딜러 매물을 비교하기 좋아요.",
    caution: "가격 배지나 플랫폼 정보는 출발점일 뿐 차량 상태와 최종 가치를 보증하지 않으므로 별도 검사를 진행하세요.",
  },
];

const buyingSteps = [
  ["후보 찾기", "세 플랫폼에서 같은 차종·연식·주행거리의 가격대를 먼저 봅니다."],
  ["판매자에게 질문", "Rego 만료일, VIN, 정비 기록, 사고·침수·수리 이력, 판매 이유를 서면으로 확인합니다."],
  ["직접 보기", "낮 시간의 안전한 장소에서 차량과 신분·소유 관계를 확인하고 혼자 가지 않는 편이 좋습니다."],
  ["독립 검사", "판매자와 이해관계가 없는 정비사에게 pre-purchase inspection을 의뢰합니다."],
  ["PPSR·Rego 확인", "구매 직전 VIN으로 공식 PPSR을 발급하고 거주 주의 등록기관에서 Rego와 이전 절차를 확인합니다."],
  ["비용 비교 후 결제", "차값에 이전비, 인지세, 보험, 즉시 필요한 정비비를 더한 뒤 명의 이전과 결제를 진행합니다."],
];

export default function UsedCarComparisonPage() {
  return <>
    <BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "중고차 구매", path: "/used-car-comparison" }]} />
    <Header />
    <main className="py-12 sm:py-16">
      <Container>
        <Link href="/tools" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 도구 목록으로 돌아가기</Link>
        <div className="mt-5 max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">호주 첫 차 프로젝트</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-5xl">어디서 찾고, 무엇을 확인한 뒤 사야 할까요?</h1>
          <p className="mt-4 text-base leading-7 text-muted sm:text-lg">차량 가격을 기록하기 전에 먼저 매물을 찾을 곳과 안전한 구매 순서를 알아야 합니다. 대표 구매처에서 후보를 찾고, 연락·검사·PPSR 확인을 마친 차량만 비교표에 넣어보세요.</p>
        </div>

        <section className="mt-10" aria-labelledby="used-car-marketplaces-heading">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">01 · 매물 찾기</p>
          <h2 id="used-car-marketplaces-heading" className="mt-2 text-2xl font-semibold text-navy sm:text-3xl">호주 중고차는 보통 여기서 찾습니다</h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {marketplaces.map((marketplace) => <article key={marketplace.name} className="flex h-full flex-col rounded-2xl border border-border bg-white p-6">
              <p className="text-xs font-semibold text-gold-ink">{marketplace.fit}</p>
              <h3 className="mt-2 text-xl font-semibold text-navy">{marketplace.name}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">{marketplace.description}</p>
              <p className="mt-4 border-l-2 border-gold pl-3 text-xs leading-5 text-muted"><strong className="text-navy">확인할 점:</strong> {marketplace.caution}</p>
              <a href={marketplace.href} target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">공식 매물 페이지 열기 ↗</a>
            </article>)}
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]" aria-labelledby="used-car-contact-heading">
          <div className="rounded-2xl bg-navy p-6 text-white sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">02 · 연락하기</p>
            <h2 id="used-car-contact-heading" className="mt-2 text-2xl font-semibold">Messenger나 WhatsApp으로 옮기자고 한다면</h2>
            <p className="mt-4 text-sm leading-7 text-white/75">Facebook Marketplace에서는 Messenger가 자연스러운 연락 수단이고, 대화 중 WhatsApp이나 문자로 이동하는 경우도 있습니다. 하지만 플랫폼 밖으로 이동하면 계정·광고 기록을 다시 확인하기 어려워질 수 있어요.</p>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-white/75">
              <li>• 광고 링크와 판매자 프로필을 먼저 저장하세요.</li>
              <li>• VIN, 차량 위치와 약속 내용을 글로 남기세요.</li>
              <li>• 차량을 보기 전 송금·보증금 요구에는 응하지 마세요.</li>
              <li>• 결제 계좌명과 실제 판매자가 다르면 중단하세요.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-ink">처음 보낼 영문 메시지</p>
            <p className="mt-3 border-l-2 border-gold bg-white p-4 text-sm leading-7 text-navy" lang="en">Hi, is the car still available? Could you please confirm the VIN, current rego expiry, service history, any accident or repair history, and whether I can arrange an independent pre-purchase inspection?</p>
            <p className="mt-4 text-sm leading-6 text-muted">“아직 판매 중인지, VIN·Rego 만료일·정비와 사고 이력, 독립 차량 검사가 가능한지”를 한 번에 묻는 문장입니다. 답변을 피하거나 검사를 거절한다면 서두르지 마세요.</p>
          </div>
        </section>

        <section className="mt-10" aria-labelledby="used-car-buying-order-heading">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">03 · 구매 전 순서</p>
          <h2 id="used-car-buying-order-heading" className="mt-2 text-2xl font-semibold text-navy sm:text-3xl">싼 차를 찾는 것보다, 이 순서를 지키는 것이 먼저입니다</h2>
          <ol className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2">
            {buyingSteps.map(([title, description], index) => <li key={title} className="bg-white p-5 sm:p-6"><span className="font-mono text-xs text-gold-ink">{String(index + 1).padStart(2, "0")}</span><h3 className="mt-2 font-semibold text-navy">{title}</h3><p className="mt-2 text-sm leading-6 text-muted">{description}</p></li>)}
          </ol>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <a href="https://www.ppsr.gov.au/carcheck" target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-navy px-5 text-sm font-semibold text-white">공식 PPSR Car Check ↗</a>
            <a href="https://www.scamwatch.gov.au/types-of-scams/buying-and-selling-scams" target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-navy px-5 text-sm font-semibold text-navy">Scamwatch 거래 사기 안내 ↗</a>
          </div>
        </section>

        <section className="mt-14 border-t border-navy/20 pt-10" aria-labelledby="vehicle-comparison-heading">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">04 · 후보 비교</p>
          <h2 id="vehicle-comparison-heading" className="mt-2 text-2xl font-semibold text-navy sm:text-3xl">확인한 차량만 비교표에 기록하세요</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">매물을 찾고 판매자에게 기본 질문을 한 다음, 최대 3대의 구매가·Rego·보험·정비·연료비를 같은 기준으로 비교합니다.</p>
          <div className="mt-8"><VehicleComparison /></div>
        </section>

        <section className="mt-10 rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm leading-7 text-amber-950">
          <h2 className="font-semibold">중요 안내</h2>
          <p className="mt-1">이 페이지는 차량 가치 평가나 기계 검사, 법률 자문을 대신하지 않습니다. PPSR과 Rego 확인, 독립 정비사 검사, 보험 견적과 거주 주의 명의 이전 절차를 직접 완료한 뒤 결정하세요.</p>
        </section>
      </Container>
    </main>
    <Footer />
  </>;
}
