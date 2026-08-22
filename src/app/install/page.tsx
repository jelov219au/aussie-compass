import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Hoju Compass 앱으로 사용하기",
  description: "앱스토어를 거치지 않고 Hoju Compass를 iPhone, Android와 컴퓨터에 설치해 필요한 도구를 빠르게 이용하세요.",
  path: "/install",
});

const quickLinks = [
  { href: "/pay-calculator", eyebrow: "PAY", title: "급여 계산기", description: "시급과 근무시간으로 예상 급여를 빠르게 확인해요." },
  { href: "/arrival-checklist", eyebrow: "ARRIVAL", title: "도착 체크리스트", description: "호주에 도착한 뒤 해야 할 일을 순서대로 챙겨요." },
  { href: "/my-compass", eyebrow: "MY COMPASS", title: "나의 진행", description: "이 기기에 남은 체크리스트와 읽은 자료를 다시 열어요." },
];

export default function InstallPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "앱으로 사용하기", path: "/install" }]} />
      <Header />
      <main className="py-12 sm:py-16">
        <Container>
          <Link href="/" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">
            &larr; 홈으로 돌아가기
          </Link>

          <section className="mt-7 overflow-hidden rounded-3xl bg-navy p-7 text-white sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Keep it within reach</p>
            <h1 className="mt-3 max-w-3xl text-[2rem] font-semibold leading-[1.18] tracking-tight [word-break:keep-all] sm:text-5xl">
              <span className="block">필요할 때 바로 여는</span><span className="block">나의 호주 생활 앱.</span>
            </h1>
            <p className="mt-5 max-w-2xl leading-7 text-white/75">
              앱스토어에서 따로 검색하지 않아도 현재 사이트를 휴대폰이나 컴퓨터에 설치할 수 있어요.
              설치한 뒤에는 Hoju Compass 아이콘으로 바로 열고, 자주 쓰는 도구로 더 빠르게 이동할 수 있습니다.
            </p>
            <InstallAppButton />
          </section>

          <section className="mt-12" aria-labelledby="installed-benefits-heading">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">What changes</p>
            <h2 id="installed-benefits-heading" className="mt-2 text-3xl font-semibold text-navy">설치하면 이렇게 달라져요</h2>
            <div className="mt-7 grid gap-px border border-border bg-border sm:grid-cols-3">
              <article className="bg-white p-5 sm:p-6"><span className="font-mono text-xs text-gold">01</span><h3 className="mt-3 font-semibold text-navy">홈 화면에서 바로 열기</h3><p className="mt-2 text-sm leading-6 text-muted">매번 검색하거나 주소를 입력하지 않고 일반 앱처럼 아이콘을 눌러 시작해요.</p></article>
              <article className="bg-white p-5 sm:p-6"><span className="font-mono text-xs text-gold">02</span><h3 className="mt-3 font-semibold text-navy">더 집중되는 앱 화면</h3><p className="mt-2 text-sm leading-6 text-muted">지원되는 기기에서는 브라우저 주소창이 없는 독립된 화면으로 열립니다.</p></article>
              <article className="bg-white p-5 sm:p-6"><span className="font-mono text-xs text-gold">03</span><h3 className="mt-3 font-semibold text-navy">열어본 핵심 화면 다시 보기</h3><p className="mt-2 text-sm leading-6 text-muted">연결이 불안정할 때도 미리 열어둔 일부 핵심 화면과 오프라인 안내를 이용할 수 있어요.</p></article>
            </div>
            <p className="mt-4 border-l-2 border-gold pl-4 text-sm leading-6 text-muted">
              현재 버전은 웹앱(PWA)입니다. App Store·Google Play에서 검색해 받는 네이티브 앱은 아니지만,
              설치 후 홈 화면에서 사용하는 방식은 일반 앱과 비슷해요.
            </p>
          </section>

          <section id="manual-install" className="mt-12 scroll-mt-24" aria-labelledby="manual-install-heading">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Install by device</p>
            <h2 id="manual-install-heading" className="mt-2 text-3xl font-semibold text-navy">기기별 설치 방법</h2>
            <div className="mt-7 grid gap-6 lg:grid-cols-3">
              <article id="ios-install" className="scroll-mt-24 border-t-2 border-navy pt-5">
                <p className="font-mono text-xs text-gold">IPHONE · IPAD</p>
                <h3 className="mt-2 text-xl font-semibold text-navy">Safari 공유 메뉴에서 추가</h3>
                <ol className="mt-4 space-y-3 text-sm leading-7 text-muted">
                  <li><strong className="text-navy">01</strong> Safari에서 hojucompass.com을 엽니다.</li>
                  <li><strong className="text-navy">02</strong> 화면 아래나 위의 공유 버튼을 누릅니다.</li>
                  <li><strong className="text-navy">03</strong> ‘홈 화면에 추가’를 선택합니다.</li>
                  <li><strong className="text-navy">04</strong> 이름을 확인하고 ‘추가’를 누릅니다.</li>
                </ol>
                <a href="https://support.apple.com/guide/iphone/turn-a-website-into-an-app-iph42ab2f3a7/ios" target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">Apple 공식 설명 &nearr;</a>
              </article>

              <article id="android-install" className="scroll-mt-24 border-t-2 border-navy pt-5">
                <p className="font-mono text-xs text-gold">ANDROID · CHROME</p>
                <h3 className="mt-2 text-xl font-semibold text-navy">설치 안내 또는 메뉴 사용</h3>
                <ol className="mt-4 space-y-3 text-sm leading-7 text-muted">
                  <li><strong className="text-navy">01</strong> Chrome에서 hojucompass.com을 엽니다.</li>
                  <li><strong className="text-navy">02</strong> 이 페이지의 ‘앱 설치’ 버튼을 누릅니다.</li>
                  <li><strong className="text-navy">03</strong> 버튼이 보이지 않으면 오른쪽 위 메뉴를 엽니다.</li>
                  <li><strong className="text-navy">04</strong> ‘앱 설치’ 또는 ‘홈 화면에 추가’를 선택합니다.</li>
                </ol>
              </article>

              <article id="desktop-install" className="scroll-mt-24 border-t-2 border-navy pt-5">
                <p className="font-mono text-xs text-gold">WINDOWS · MAC</p>
                <h3 className="mt-2 text-xl font-semibold text-navy">컴퓨터에도 독립된 앱으로</h3>
                <ol className="mt-4 space-y-3 text-sm leading-7 text-muted">
                  <li><strong className="text-navy">01</strong> Chrome 또는 Edge에서 사이트를 엽니다.</li>
                  <li><strong className="text-navy">02</strong> 주소창의 설치 아이콘이나 브라우저 메뉴를 엽니다.</li>
                  <li><strong className="text-navy">03</strong> ‘Hoju Compass 설치’를 선택합니다.</li>
                  <li><strong className="text-navy">04</strong> 작업 표시줄이나 Dock에 고정할 수 있어요.</li>
                </ol>
              </article>
            </div>
          </section>

          <section className="mt-12" aria-labelledby="app-shortcuts-heading">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Quick start</p>
            <h2 id="app-shortcuts-heading" className="mt-2 text-3xl font-semibold text-navy">설치 후 자주 열게 될 화면</h2>
            <div className="mt-7 grid gap-4 md:grid-cols-3">
              {quickLinks.map((item) => <Link key={item.href} href={item.href} className="group border border-border bg-white p-5 transition hover:-translate-y-0.5 hover:border-navy hover:shadow-sm"><span className="font-mono text-xs text-gold">{item.eyebrow}</span><h3 className="mt-3 text-lg font-semibold text-navy">{item.title} <span aria-hidden="true">→</span></h3><p className="mt-2 text-sm leading-6 text-muted">{item.description}</p></Link>)}
            </div>
          </section>

          <section className="mt-12 grid gap-5 border-y border-border py-8 sm:grid-cols-3">
            <div><strong className="text-navy">로그인 불필요</strong><p className="mt-2 text-sm leading-6 text-muted">설치와 무료 도구 사용에 별도 계정이 필요하지 않아요.</p></div>
            <div><strong className="text-navy">웹과 같은 주소</strong><p className="mt-2 text-sm leading-6 text-muted">공유받은 Hoju Compass 링크가 앱 안의 해당 화면으로 바로 열립니다.</p></div>
            <div><strong className="text-navy">언제든 제거 가능</strong><p className="mt-2 text-sm leading-6 text-muted">홈 화면이나 기기의 앱 관리 메뉴에서 직접 제거할 수 있어요.</p></div>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}
