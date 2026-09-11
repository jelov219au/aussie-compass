import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { DailyQuiz } from "@/components/play/DailyQuiz";
import { CharacterTest } from "@/components/play/CharacterTest";
import { createPageMetadata } from "@/lib/site";
import styles from "@/components/play/Playground.module.css";

export const metadata = createPageMetadata({ title: "잠깐, 호주 한 판 | 오늘의 퀴즈·생활 캐릭터 테스트", description: "호주식 표현 퀴즈 한 문제와 5문항 생활 캐릭터 테스트. 로그인 없이 가볍게 즐기고 나의 캐릭터 카드를 저장해 보세요.", path: "/play" });

export default function PlayPage() {
  return <><BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "잠깐, 호주 한 판", path: "/play" }]} /><Header />
    <main className={styles.page}><Container>
      <Link href="/" className="inline-flex min-h-11 items-center text-sm text-muted">← 홈으로</Link>
      <header className={styles.intro}>
        <span className={styles.eyebrow}>LITTLE BREAK, AUSSIE STYLE</span>
        <h1>잠깐, 호주 한 판 <span aria-hidden="true">☀️</span></h1>
        <p>호주 말 하나, 나를 닮은 캐릭터 하나.<br />오늘은 가볍게 놀고 가요.</p>
        <nav className={styles.jumpLinks} aria-label="놀이 고르기"><a href="#daily-quiz">오늘의 한 문제</a><a href="#character-test">나의 생활 캐릭터</a></nav>
      </header>
      <div className={styles.gameGrid}><DailyQuiz /><CharacterTest /></div>
      <p className={styles.bottomNote}>오늘 배운 말, 실제 상황에서도 꺼내볼까요?<br /><Link href="/english-phrase-cards">생활 영어 문장 카드 →</Link><Link href="/">홈으로 돌아가기 →</Link></p>
    </Container></main><Footer /></>;
}
