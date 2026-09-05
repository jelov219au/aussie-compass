import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { VehicleComparison } from "@/components/tools/VehicleComparison";
import { RelatedVideos } from "@/components/media/RelatedVideos";
import { VehicleInspectionProviderPicker } from "@/components/tools/VehicleInspectionProviderPicker";
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
  ["동행과 독립 검사 구분", "차량을 잘 아는 지인은 현장 1차 확인에 동행하고, 기계 상태 판단은 판매자와 이해관계가 없는 검사자에게 pre-purchase inspection을 의뢰합니다."],
  ["PPSR·Rego 확인", "구매 직전 VIN으로 공식 PPSR을 발급하고 거주 주의 등록기관에서 Rego와 이전 절차를 확인합니다."],
  ["비용 비교 후 결제", "차값에 이전비, 인지세, 보험, 즉시 필요한 정비비를 더한 뒤 명의 이전과 결제를 진행합니다."],
];

const beforeBookingChecks = [
  "판매자가 제3자 검사와 road test를 허락했고, 검사자가 판매자에게 직접 일정·접근을 확인할 수 있는가",
  "출장이라면 차량 주변에 안전하고 평평하며 조명이 충분한 작업 공간이 있는가",
  "검사자가 판매자·딜러·수리업체와 독립적인지, 추천·수리 수익 등 이해상충을 서면으로 밝혔는가",
  "정비 자격, 자동차협회 승인 여부 또는 ABN·사업자명·연락처를 확인했는가",
  "서면 검사 범위와 제외 항목을 받고, visual only인지 부품 탈거·내부 진단이 가능한지 구분했는가",
  "리프트를 이용한 하부 확인, 진단 스캔, road test가 포함되는지와 불가능할 때 보고서 표시 방식을 확인했는가",
  "사진이 포함된 보고서와 결함별 수리 우선순위·예상 수리비 또는 견적 연계가 제공되는가",
  "총가격·차종/연식 할증, 재검 비용, 판매 전 취소·환불·일정 변경 조건을 확인했는가",
  "EV·하이브리드 배터리, 4WD, 수입·고성능·개조·클래식 차량 등 해당 차종을 검사할 장비와 경험이 있는가",
];

const afterReportChecks = [
  "결함을 즉시 수리, 조기 수리, 관찰 항목으로 나누고 안전 관련 결함을 먼저 표시한다.",
  "부품·공임을 포함한 예상 수리비를 확인하고, 불확실한 진단에는 추가 정밀검사 비용도 더한다.",
  "즉시·조기 수리비와 불확실성을 근거로 판매가를 재협상하거나, 감당하기 어렵다면 계약·보증금 전에 철회한다.",
  "판매자가 고치기로 했다면 수리 완료 증빙과 독립 재검 조건을 서면 합의한다.",
  "PPSR, VIN 일치, 주·준주 Rego 조회는 기계·상태 검사와 별도다. 검사 보고서에 이력이 포함돼도 구매 직전 공식 조회를 다시 확인한다.",
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
          <p className="mt-5 border-l-4 border-gold bg-surface p-5 text-sm leading-7 text-muted">PPSR 확인: 2026-08-31 · 구매 당일 또는 하루 전에 차체와 대조한 VIN으로 검색하고 인증서를 보관하세요. 도난·Write-off 등 NEVDIS 정보는 누락되거나 늦게 반영될 수 있습니다. 특히 TAS 도난 정보는 PPSR에 제공되지 않으므로 Tasmania 등록 차량은 Transport Tasmania의 별도 조회도 확인해야 합니다. 아래 공식 Car Check의 NEVDIS 안내를 따르고, “기록 없음”을 기계 상태·소유권 보증으로 해석하지 마세요.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <a href="https://www.ppsr.gov.au/carcheck" target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-navy px-5 text-sm font-semibold text-white">공식 PPSR Car Check ↗</a>
            <a href="https://www.scamwatch.gov.au/types-of-scams/buying-and-selling-scams" target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-navy px-5 text-sm font-semibold text-navy">Scamwatch 거래 사기 안내 ↗</a>
          </div>
        </section>

        <RelatedVideos context={{ kind: "page", path: "/used-car-comparison", slot: "buying-order" }} heading="영상으로 보는 중고차 구매 사례" id="used-car-buying-video" />

        <section className="mt-14 border-t border-navy/20 pt-10" aria-labelledby="inspection-choice-heading">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">04 · 검사 방법 선택</p>
          <h2 id="inspection-choice-heading" className="mt-2 text-2xl font-semibold text-navy sm:text-3xl">지인 동행과 독립 사전검사는 역할이 다릅니다</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">둘 중 하나만 무조건 고르는 순위가 아닙니다. 차량을 잘 아는 지인은 약속 장소의 안전과 기본 상태 확인을 돕고, 독립 검사자는 서면 범위에 따라 상태를 기록합니다. 가능하면 지인과 함께 1차로 보고, 구매 후보가 남으면 계약·보증금 전에 전문 검사를 예약하세요.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-border bg-white p-6">
              <p className="text-xs font-semibold text-gold-ink">현장 1차 확인</p>
              <h3 className="mt-2 text-xl font-semibold text-navy">차량을 잘 아는 지인과 동행</h3>
              <p className="mt-3 text-sm leading-6 text-muted">광고와 실차 비교, 시동·경고등·타이어·누유 흔적, 시승 중 소음 같은 기본 이상을 함께 살핍니다. 혼자 낯선 판매자를 만나는 위험도 줄일 수 있습니다.</p>
              <p className="mt-4 border-l-2 border-gold pl-3 text-xs leading-5 text-muted">지인의 경험은 유용하지만 리프트 검사, 진단 스캔, 서면 책임 범위가 있는 전문 검사를 자동으로 대신하지는 않습니다.</p>
            </article>
            <article className="rounded-2xl border border-navy bg-navy p-6 text-white">
              <p className="text-xs font-semibold text-gold">계약 전 전문 확인</p>
              <h3 className="mt-2 text-xl font-semibold">독립 정비사 또는 출장 사전검사 예약</h3>
              <p className="mt-3 text-sm leading-6 text-white/75">판매자·딜러와 이해관계가 없는 검사자를 직접 선택하고, 범위·제외·보고서·비용을 서면으로 확인합니다. 출장 검사는 편리하지만 리프트나 분해 점검이 제한될 수 있습니다.</p>
              <a href="#inspection-providers" className="mt-5 inline-flex min-h-11 items-center font-semibold text-white underline decoration-gold decoration-2 underline-offset-4">내 지역 예약 출발점 보기 ↓</a>
            </article>
          </div>
        </section>

        <section id="inspection-providers" className="mt-14 scroll-mt-24" aria-labelledby="inspection-providers-heading">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">05 · 주·준주별 예약 출발점</p>
          <h2 id="inspection-providers-heading" className="mt-2 text-2xl font-semibold text-navy sm:text-3xl">자동차협회·공식 성격의 안내에서 시작하세요</h2>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-muted">아래는 2026년 8월 30일 각 제공자의 공식 페이지에서 다시 확인한 출발점입니다. 검사할 주·준주를 고르면 해당 지역 안내만 표시됩니다. Hoju Compass의 유료 추천이나 품질 순위가 아니고, 예약 수수료를 받는 링크도 아닙니다. 서비스 지역·출장/워크숍 가능 여부·검사 범위·가격은 차량과 위치에 따라 달라질 수 있으니 결제 전에 제공자에게 다시 확인하세요.</p>
          <VehicleInspectionProviderPicker />
        </section>

        <section className="mt-14" aria-labelledby="before-booking-heading">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">06 · 예약 전 체크</p>
          <h2 id="before-booking-heading" className="mt-2 text-2xl font-semibold text-navy sm:text-3xl">“검사 예약”이라는 이름보다 서면 범위를 비교하세요</h2>
          <ul className="mt-6 grid gap-3 md:grid-cols-2">
            {beforeBookingChecks.map((item) => <li key={item} className="flex gap-3 rounded-xl border border-border bg-white p-4 text-sm leading-6 text-muted"><span aria-hidden="true" className="font-semibold text-gold-ink">□</span><span>{item}</span></li>)}
          </ul>
          <div className="mt-5 rounded-2xl bg-surface p-5 sm:p-6">
            <h3 className="font-semibold text-navy">예약할 때 복사해 물어볼 핵심 문장</h3>
            <p className="mt-3 border-l-2 border-gold bg-white p-4 text-sm leading-7 text-navy" lang="en">Before I book, could you confirm your independence from the seller, the written inclusions and exclusions, and whether the inspection includes a hoist/underbody check, diagnostic scan and road test? Please also confirm the total price, cancellation or reinspection terms, and your experience with this vehicle type.</p>
            <p className="mt-3 text-sm leading-7 text-muted">(예약하기 전에 판매자와 독립적인 관계인지, 서면 검사 포함·제외 항목이 무엇인지, 리프트·하부 점검·진단 스캔·시운전이 포함되는지 확인해 주실 수 있을까요? 총가격과 취소·재검 조건, 그리고 이 차종의 검사 경험도 함께 알려주세요.)</p>
          </div>
        </section>

        <section className="mt-14" aria-labelledby="after-report-heading">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">07 · 보고서 받은 뒤 판단</p>
          <h2 id="after-report-heading" className="mt-2 text-2xl font-semibold text-navy sm:text-3xl">결함을 비용과 결정으로 연결하세요</h2>
          <ol className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2">
            {afterReportChecks.map((item, index) => <li key={item} className="bg-white p-5 sm:p-6"><span className="font-mono text-xs text-gold-ink">{String(index + 1).padStart(2, "0")}</span><p className="mt-2 text-sm leading-6 text-muted">{item}</p></li>)}
          </ol>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href="https://www.ppsr.gov.au/carcheck" target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-navy px-5 text-sm font-semibold text-white">구매 직전 공식 PPSR 확인 ↗</a>
            <a href="#vehicle-comparison-heading" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-navy px-5 text-sm font-semibold text-navy">검사비·수리 예산 비교표에 반영 ↓</a>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-gold/50 bg-[#f6f3e9] p-6" aria-labelledby="inspection-next-step-heading">
          <h2 id="inspection-next-step-heading" className="text-xl font-semibold text-navy">보고서는 받았는데, 다음에 무엇을 해야 할까요?</h2>
          <p className="mt-3 text-sm leading-7 text-muted">판매자가 고쳐주겠다고 답한 뒤 받을 증빙과, 견적이 없는 항목을 비용 비교에 남기는 방법을 확인하세요.</p>
          <div className="mt-4 flex flex-wrap gap-4">
            <Link href="/resources/used-car-inspection-report-next-steps" className="inline-flex min-h-11 items-center text-sm font-semibold text-navy underline underline-offset-4">검사 후 다음 행동 가이드 →</Link>
            <Link href="/car-purchase-pro" className="inline-flex min-h-11 items-center text-sm font-semibold text-navy underline underline-offset-4">중고차 거래노트 Pro 준비 내용 →</Link>
          </div>
        </section>

        <section className="mt-14 border-t border-navy/20 pt-10" aria-labelledby="vehicle-comparison-heading">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">08 · 후보 비교</p>
          <h2 id="vehicle-comparison-heading" className="mt-2 text-2xl font-semibold text-navy sm:text-3xl">확인한 차량만 비교표에 기록하세요</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">매물을 찾고 판매자에게 기본 질문을 한 다음, 최대 3대의 구매가·Rego·보험·정비·연료비를 같은 기준으로 비교합니다.</p>
          <div className="mt-8"><VehicleComparison /></div>
        </section>

        <RelatedVideos context={{ kind: "page", path: "/used-car-comparison", slot: "after-comparison" }} heading="보험료를 비교할 때 함께 볼 영상" id="used-car-insurance-video" />

        <section className="mt-10 rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm leading-7 text-amber-950">
          <h2 className="font-semibold">중요 안내</h2>
          <p className="mt-1">이 페이지는 차량 가치 평가나 기계 검사, 법률 자문을 대신하지 않습니다. PPSR과 Rego 확인, 독립 정비사 검사, 보험 견적과 거주 주의 명의 이전 절차를 직접 완료한 뒤 결정하세요.</p>
        </section>
      </Container>
    </main>
    <Footer />
  </>;
}
