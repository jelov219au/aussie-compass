import { TrackedLink } from "@/components/analytics/TrackedLink";
import { Container } from "@/components/ui/Container";
import styles from "./HomeInstallBanner.module.css";

export function HomeInstallBanner() {
  return (
    <section className={`${styles.prompt} border-b border-border bg-background py-4`} aria-label="홈 화면에 추가 안내">
      <Container>
        <TrackedLink href="/install" eventName="Home Navigation" properties={{ section: "home_install", destination: "install" }} className="group flex min-h-20 items-center justify-between gap-3 rounded-2xl border border-gold/30 bg-[#f3ecd7] px-4 py-4 text-navy transition hover:border-gold sm:px-6">
          <span className="min-w-0">
            <span className="block text-base font-semibold">홈 화면에 추가하기</span>
            <span className="mt-1 block text-xs leading-5 text-muted sm:text-sm">iPhone · Android 설치 안내</span>
          </span>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-lg text-white transition group-hover:bg-navy-light" aria-hidden="true">＋</span>
        </TrackedLink>
      </Container>
    </section>
  );
}
