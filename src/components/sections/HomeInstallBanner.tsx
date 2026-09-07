import { TrackedLink } from "@/components/analytics/TrackedLink";
import { Container } from "@/components/ui/Container";
import styles from "./HomeInstallBanner.module.css";

export function HomeInstallBanner() {
  return (
    <section className={`${styles.prompt} bg-background pb-3`} aria-label="홈 화면에 추가 안내">
      <Container>
        <TrackedLink href="/install" eventName="Home Navigation" properties={{ section: "home_install", destination: "install" }} className="group flex min-h-14 flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3 text-navy transition hover:border-gold sm:px-6">
          <span className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
            <span className="block text-sm font-semibold">홈 화면에 추가하기</span>
            <span className="block text-xs leading-5 text-muted sm:text-sm">iPhone · Android 설치 안내</span>
          </span>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-lg text-white transition group-hover:bg-navy-light" aria-hidden="true">＋</span>
        </TrackedLink>
      </Container>
    </section>
  );
}
