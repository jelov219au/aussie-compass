import { TrackedLink } from "@/components/analytics/TrackedLink";
import { Container } from "@/components/ui/Container";
import { HomeSearch } from "@/components/sections/HomeSearch";

export function Hero() {
  return (
    <section className="home-hero border-b border-border bg-white py-9 sm:py-14 lg:py-16">
      <Container>
        <div className="grid items-center gap-7 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-semibold text-[#874b32]">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden="true" /> 호주 생활의 다음 한 걸음
            </p>
            <h1 className="mt-4 text-[2.25rem] font-semibold tracking-[-0.04em] text-navy sm:text-5xl lg:text-[3.5rem]">
              호주 생활,<br />필요한 것부터.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-7 text-muted sm:text-base">집, 일자리, 생활비. 지금 필요한 정보와 도구를 찾아보세요.</p>
            <div className="mt-4 flex flex-wrap gap-x-5 text-sm font-semibold text-navy">
              <TrackedLink href="#route-finder" eventName="Home Navigation" properties={{ section: "hero", destination: "route_finder" }} className="inline-flex min-h-11 items-center rounded-sm hover:underline">내 상황에 맞춰보기 <span className="ml-2" aria-hidden="true">↓</span></TrackedLink>
              <TrackedLink href="/tools" eventName="Home Navigation" properties={{ section: "hero", destination: "tools" }} className="inline-flex min-h-11 items-center rounded-sm hover:underline">전체 도구 <span className="ml-2" aria-hidden="true">→</span></TrackedLink>
            </div>
            <p className="mt-1 text-xs leading-5 text-muted">공식 원문 연결 · 로그인 없이 바로 사용</p>
          </div>
          <div className="min-w-0 rounded-2xl border border-border bg-background p-5 sm:p-7">
            <p className="text-base font-semibold text-navy">무엇부터 확인할까요?</p>
            <HomeSearch />
          </div>
        </div>
      </Container>
    </section>
  );
}
