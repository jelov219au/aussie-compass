import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { DailyQuiz } from "@/components/play/DailyQuiz";
import { DailyPlay } from "@/components/play/DailyPlay";
import { CharacterTest } from "@/components/play/CharacterTest";
import { WordPuzzle } from "@/components/play/WordPuzzle";
import { BalanceGame } from "@/components/play/BalanceGame";
import { PlayLinks } from "@/components/play/PlayLinks";
import { createPageMetadata } from "@/lib/site";
import styles from "@/components/play/Playground.module.css";

export const metadata = createPageMetadata({ title: "잠깐, 호주 한 판 | 매일 새 퀴즈·단어·상상 선택", description: "시드니 날짜에 맞춰 열리는 새 퀴즈, 단어 퍼즐, 상상 선택. 지난 문제와 호주 생활 캐릭터 테스트도 로그인 없이 즐겨보세요.", path: "/play" });

export default function PlayPage() {
  return <><BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "잠깐, 호주 한 판", path: "/play" }]} /><Header />
    <main className={styles.page}><Container>
      <Link href="/" className="inline-flex min-h-11 items-center text-sm text-muted">← 홈으로</Link>
      <header className={styles.intro}>
        <span className={styles.eyebrow}>LITTLE BREAK, AUSSIE STYLE</span>
        <h1>잠깐, 호주 한 판 <span aria-hidden="true">☀️</span></h1>
        <p>맞혀보고, 모아보고, 상상해 보고.<br />하루에 새 퀴즈·단어·선택 하나씩, 잠깐의 호주 여행.</p>
        <PlayLinks />
      </header>
      <DailyPlay />
      <h2 id="practice" className={styles.practiceHeading}>더 놀고 싶다면 · 연습과 캐릭터</h2>
      <p className={styles.subtitle}>처음 공개한 문제와 게임은 여기 그대로 있어요. 새 일일 세트와 별개로 언제든 다시 즐겨요.</p>
      <div className={styles.gameGrid}><DailyQuiz /><CharacterTest /><WordPuzzle /><BalanceGame /></div>
      <p className={styles.bottomNote}>오늘 배운 말, 실제 상황에서도 꺼내볼까요?<br /><Link href="/english-phrase-cards">생활 영어 문장 카드 →</Link><Link href="/">홈으로 돌아가기 →</Link></p>
    </Container></main><Footer /></>;
}
