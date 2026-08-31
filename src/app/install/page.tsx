import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({ title: "Hoju Compass 앱으로 사용하기", description: "별도 앱스토어 다운로드 없이 Hoju Compass를 iPhone과 Android 홈 화면에 추가하고 빠르게 이용하세요.", path: "/install" });

export default function InstallPage() {
  return <>
    <BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "앱으로 사용하기", path: "/install" }]} />
    <Header />
    <main className="py-12 sm:py-16">
      <Container>
        <Link href="/" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 홈으로 돌아가기</Link>
        <section className="mt-7 rounded-3xl bg-navy p-5 text-white sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">내 휴대폰에 Hoju Compass</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">홈 화면에서<br />바로 열어요.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">앱스토어 다운로드나 Hoju Compass 계정 없이 추가할 수 있어요. 설치하지 않아도 같은 도구를 쓸 수 있습니다.</p>
          <InstallAppButton />
        </section>

        <section id="manual-install" tabIndex={-1} aria-labelledby="manual-install-title" className="mt-12 scroll-mt-24 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-ink">Manual install</p>
          <h2 id="manual-install-title" className="mt-2 text-2xl font-semibold text-navy sm:text-3xl">기기별 설치 방법</h2>
          <p className="mt-3 text-sm leading-6 text-muted">기기·브라우저 버전에 따라 메뉴 이름이 다릅니다. 다른 앱 안에서 열었다면 Safari나 Chrome으로 이 주소를 다시 열어 주세요. 설치 항목이 없으면 웹사이트로 계속 이용해도 됩니다.</p>
          <div className="mt-7 grid gap-6 lg:grid-cols-2">
            <article className="rounded-2xl border border-border bg-white p-5 sm:p-6">
              <p className="font-mono text-xs text-gold-ink">IPHONE · IPAD</p>
              <h3 className="mt-2 text-xl font-semibold text-navy">Safari에서 홈 화면에 추가</h3>
              <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-7 text-muted">
                <li>Safari에서 Hoju Compass를 엽니다.</li>
                <li>공유 버튼을 누릅니다. iPhone의 화면 구성에 따라 더 보기 메뉴 안에 공유가 있습니다.</li>
                <li>‘홈 화면에 추가’를 선택합니다. iPad에서는 공유 뒤 더 보기 메뉴도 확인하세요.</li>
                <li>‘웹 앱으로 열기’가 보이면 켜고 ‘추가’를 누릅니다.</li>
              </ol>
              <div className="mt-5 flex flex-wrap gap-3">
                <a href="https://support.apple.com/guide/iphone/iphea86e5236/ios" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm font-semibold text-navy hover:bg-surface">iPhone 공식 안내 ↗<span className="sr-only"> (새 창)</span></a>
                <a href="https://support.apple.com/guide/ipad/open-as-web-app-ipad8f1f7a29/ipados" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm font-semibold text-navy hover:bg-surface">iPad 공식 안내 ↗<span className="sr-only"> (새 창)</span></a>
              </div>
            </article>
            <article className="rounded-2xl border border-border bg-white p-5 sm:p-6">
              <p className="font-mono text-xs text-gold-ink">ANDROID · CHROME</p>
              <h3 className="mt-2 text-xl font-semibold text-navy">Chrome 메뉴에서 설치</h3>
              <p className="mt-3 text-sm leading-6 text-muted">Android는 Chrome에서 이 주소를 직접 열어 진행하세요.</p>
              <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-7 text-muted">
                <li>Chrome에서 Hoju Compass를 엽니다.</li>
                <li>주소 표시줄 옆 더 보기 메뉴를 누릅니다.</li>
                <li>‘설치 및 바로가기 만들기’ → ‘설치’를 선택합니다. 버전에 따라 ‘앱 설치’ 또는 ‘홈 화면에 추가’로 표시될 수 있습니다.</li>
                <li>화면의 설치 안내를 확인한 뒤 홈 화면에서 아이콘을 찾아보세요.</li>
              </ol>
              <details className="group mt-5 rounded-xl border border-border bg-surface p-4">
                <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-navy"><span>‘출처를 알 수 없는 앱’ 경고가 뜨나요?</span><span className="shrink-0 text-lg group-open:rotate-45" aria-hidden="true">＋</span></summary>
                <p className="mt-3 text-sm leading-7 text-muted">삼성 인터넷 등에서 설치 출처 경고가 나오면 설치를 멈추세요. 보안 차단을 끄거나 알 수 없는 앱 설치를 허용하도록 안내하지 않습니다. Chrome에서 설치 안내를 확인하거나 설치 없이 웹으로 이용하세요.</p>
                <p className="mt-3 text-xs leading-6 text-muted">경고 문구만으로 악성 앱 판정 여부나 안전성을 단정할 수 없습니다. Chrome에서도 경고가 나오면 진행하지 말고 기기·브라우저 정보와 경고 문구를 확인해 주세요.</p>
              </details>
              <a href="https://support.google.com/chrome/answer/9658361?hl=en&co=GENIE.Platform%3DAndroid" target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm font-semibold text-navy hover:bg-surface">Chrome 공식 안내 ↗<span className="sr-only"> (새 창)</span></a>
            </article>
          </div>
          <p className="mt-4 text-xs leading-6 text-muted">공식 안내 확인: 2026-08-31. 출처는 인터넷 연결이 필요한 외부 사이트이며 새 창에서 열립니다.</p>
        </section>

        <section className="mt-12" aria-labelledby="install-boundaries">
          <h2 id="install-boundaries" className="text-2xl font-semibold text-navy">설치 전, 이것만 확인하세요</h2>
          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            <article className="rounded-2xl bg-surface p-5">
              <h3 className="font-semibold text-navy">기록은 자동 동기화되지 않아요</h3>
              <p className="mt-3 text-sm leading-7 text-muted">도구에 저장한 기록은 기기·브라우저·설치본별로 다를 수 있습니다. 기존 기록이 보이지 않으면 처음 작성한 브라우저에서 먼저 확인하세요. 앱 삭제나 브라우저 데이터 정리 전에 필요한 내용을 백업하세요.</p>
              <Link href="/data-transfer" className="mt-4 inline-flex min-h-12 items-center rounded-lg bg-navy px-4 py-3 text-sm font-semibold text-white hover:bg-navy-light">백업·복원 안내 보기 →</Link>
              <p className="mt-3 text-xs leading-6 text-muted">지원되는 항목만 수동으로 옮길 수 있습니다. 백업 파일에 민감한 기록이 포함될 수 있으니 안전하게 보관하세요. 구매 권한은 백업으로 이전되지 않으며 제품별 복원 안내를 따릅니다.</p>
            </article>
            <article className="rounded-2xl bg-surface p-5">
              <h3 className="font-semibold text-navy">외부 사이트를 보고 돌아올 때</h3>
              <p className="mt-3 text-sm leading-7 text-muted">공식 기관·예약 링크는 새 탭이나 외부 브라우저로 열릴 수 있습니다. 확인한 뒤 원래 탭 또는 Hoju Compass 아이콘으로 돌아오세요. 이동 전 입력 내용의 저장 여부를 확인하고, 돌아온 뒤 선택 상태도 확인하세요.</p>
              <p className="mt-3 text-sm leading-7 text-muted">공유받은 주소가 항상 설치형 앱으로 열리는 것은 아닙니다. 기기 설정에 따라 일반 브라우저에서 같은 페이지가 열릴 수 있습니다.</p>
            </article>
            <article className="rounded-2xl bg-surface p-5">
              <h3 className="font-semibold text-navy">인터넷 연결이 필요해요</h3>
              <p className="mt-3 text-sm leading-7 text-muted">설치한다고 모든 페이지가 오프라인에 저장되지는 않습니다. 연결이 끊기면 열어둔 화면을 닫지 말고 연결 복구 후 다시 시도하세요. 오프라인 재실행이나 도구 작동을 보장하지 않습니다.</p>
              <p className="mt-3 text-sm leading-7 text-muted">공식 정보 확인, 외부 예약, 결제·구매 복원은 온라인에서 진행하세요.</p>
            </article>
          </div>
        </section>
      </Container>
    </main>
    <Footer />
  </>;
}
