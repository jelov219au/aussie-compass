import Link from "next/link";
import { Container } from "@/components/ui/Container";

const popularSearches = [
  "TFN",
  "세후 급여",
  "집 구하기",
  "영문 이력서",
  "택스 리턴",
  "Super 환급",
];

export function HomeSearch() {
  return (
    <section className="border-b border-border bg-white" aria-labelledby="home-search-heading">
      <Container className="py-7 sm:py-8">
        <form action="/search" method="get" className="grid gap-4 lg:grid-cols-[minmax(14rem,0.55fr)_minmax(0,1.45fr)] lg:items-end lg:gap-8">
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-gold">바로 찾아보기</p>
            <h2 id="home-search-heading" className="mt-2 text-xl font-semibold tracking-tight text-navy sm:text-2xl">
              지금 궁금한 말을 그대로 입력하세요.
            </h2>
          </div>
          <div>
            <label htmlFor="home-search" className="sr-only">호주 생활 정보 검색</label>
            <div className="flex min-h-14 items-center rounded-2xl border border-navy/20 bg-background px-4 transition focus-within:border-navy focus-within:ring-2 focus-within:ring-navy/10 sm:px-5">
              <span className="mr-3 text-xl text-gold" aria-hidden="true">⌕</span>
              <input
                id="home-search"
                name="q"
                type="search"
                autoComplete="off"
                placeholder="예: Bond를 돌려받지 못했어요"
                className="min-w-0 flex-1 bg-transparent py-3 text-base text-navy outline-none placeholder:text-muted/60"
              />
              <button type="submit" className="ml-3 inline-flex min-h-10 shrink-0 items-center rounded-full bg-navy px-4 text-sm font-semibold text-white transition hover:bg-navy-light">
                검색
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="text-xs text-muted">많이 찾는 주제</span>
              {popularSearches.map((query) => (
                <Link
                  key={query}
                  href={`/search?q=${encodeURIComponent(query)}`}
                  className="inline-flex min-h-8 items-center border-b border-border text-xs font-semibold text-navy transition hover:border-gold"
                >
                  {query}
                </Link>
              ))}
            </div>
          </div>
        </form>
      </Container>
    </section>
  );
}
