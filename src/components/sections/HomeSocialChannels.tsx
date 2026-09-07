import { Container } from "@/components/ui/Container";

const channels = [
  {
    name: "Instagram",
    handle: "@hojucompass",
    description: "핵심 내용을 카드로 빠르게 확인하세요.",
    href: "https://www.instagram.com/hojucompass/",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="17.4" cy="6.7" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: "YouTube",
    handle: "Hoju Compass | 호주 컴패스",
    description: "실제 상황을 따라 확인 순서와 판단 기준을 살펴보세요.",
    href: "https://www.youtube.com/channel/UChn-PJcHHVz2XPVhHUkbFkQ",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
        <rect x="2.5" y="5.5" width="19" height="13" rx="4" stroke="currentColor" strokeWidth="1.8" />
        <path d="m10 9 5 3-5 3V9Z" fill="currentColor" />
      </svg>
    ),
  },
] as const;

export function HomeSocialChannels() {
  return (
    <section className="border-b border-border bg-background py-8 sm:py-10" aria-labelledby="home-social-heading">
      <Container>
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.14em] text-gold-ink">공식 채널</p>
          <h2 id="home-social-heading" className="mt-2 text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
            Hoju Compass 소식 이어보기
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted sm:text-base">
            PPSR·보험처럼 글로만 보기 어려운 내용은 카드와 영상으로 이어서 확인할 수 있어요.
          </p>
        </div>

        <ul className="mt-7 grid gap-4 sm:grid-cols-2">
          {channels.map(channel => (
            <li key={channel.name}>
              <a
                href={channel.href}
                target="_blank"
                rel="noopener noreferrer"
                className="site-card group flex h-full items-center gap-4 p-5 text-navy"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-navy text-white transition group-hover:bg-navy-light">
                  {channel.icon}
                </span>
                <span className="min-w-0">
                  <strong className="block text-lg">{channel.name}</strong>
                  <span className="mt-1 block break-words text-xs font-semibold text-gold-ink">{channel.handle}</span>
                  <span className="mt-2 block text-sm leading-6 text-muted">{channel.description}</span>
                  <span className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-navy">
                    공식 채널 열기 (새 창) <span className="ml-1" aria-hidden="true">↗</span>
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
