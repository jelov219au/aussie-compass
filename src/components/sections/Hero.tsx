import { TrackedLink } from "@/components/analytics/TrackedLink";
import { Container } from "@/components/ui/Container";
import { AustralianSky } from "@/components/brand/AustralianSky";
import { AustralianFlagBackdrop } from "@/components/brand/AustralianFlagBackdrop";
import { HomeSearch } from "@/components/sections/HomeSearch";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-[#edf3f2] py-7 sm:py-12 lg:py-16">
      <AustralianFlagBackdrop />
      <Container>
        <div className="relative grid items-center gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(17rem,0.7fr)] lg:gap-16">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-semibold text-[#874b32]">
              <span aria-hidden="true">✦</span> 낯선 호주 생활, 든든한 길잡이
            </p>
            <h1 className="mt-4 text-[2rem] font-semibold tracking-[-0.035em] text-navy sm:text-5xl lg:text-6xl">
              호주 생활,<br />필요한 것부터.
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-muted sm:mt-5 sm:text-base">
              집, 일자리, 생활비.<br className="sm:hidden" /> 지금 필요한 정보와 도구를 찾아보세요.
            </p>
            <HomeSearch />
            <div className="mt-2 flex flex-wrap gap-x-5 text-sm font-semibold text-navy">
              <TrackedLink href="#route-finder" eventName="Home Navigation" properties={{ section: "hero", destination: "route_finder" }} className="inline-flex min-h-11 items-center rounded-sm hover:underline">내 상황에 맞춰보기 <span className="ml-2" aria-hidden="true">↓</span></TrackedLink>
              <TrackedLink href="/tools" eventName="Home Navigation" properties={{ section: "hero", destination: "tools" }} className="inline-flex min-h-11 items-center rounded-sm hover:underline">전체 도구 <span className="ml-2" aria-hidden="true">→</span></TrackedLink>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted">공식 원문 연결 · 로그인 없이 바로 사용</p>
          </div>

          <div className="hidden lg:block"><AustralianSky /></div>
        </div>
      </Container>
    </section>
  );
}
