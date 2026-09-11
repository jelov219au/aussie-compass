import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { DailyQuiz } from "@/components/play/DailyQuiz";
import { CharacterTest } from "@/components/play/CharacterTest";
import { WordPuzzle } from "@/components/play/WordPuzzle";
import { BalanceGame } from "@/components/play/BalanceGame";
import { PlayLinks } from "@/components/play/PlayLinks";
import { createPageMetadata } from "@/lib/site";
import styles from "@/components/play/Playground.module.css";

export const metadata = createPageMetadata({ title: "잠깐, 호주 한 판 | 퀴즈·캐릭터·단어 퍼즐·밸런스 게임", description: "호주 표현 퀴즈, 생활 캐릭터 테스트, 글자를 맞추는 단어 퍼즐, 친구와 비교하는 밸런스 게임. 로그인 없이 네 가지 놀이를 즐겨보세요.", path: "/play" });

export default function PlayPage() {
  return <><BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "잠깐, 호주 한 판", path: "/play" }]} /><Header />
    <main className={styles.page}><Container>
      <Link href="/" className="inline-flex min-h-11 items-center text-sm text-muted">← 홈으로</Link>
      <header className={styles.intro}>
        <span className={styles.eyebrow}>LITTLE BREAK, AUSSIE STYLE</span>
        <h1>잠깐, 호주 한 판 <span aria-hidden="true">☀️</span></h1>
        <p>맞혀보고, 골라보고, 친구와 비교해 보고.<br />오늘은 네 가지 놀이 중 마음 가는 것부터!</p>
        <PlayLinks />
      </header>
      <div className={styles.gameGrid}><DailyQuiz /><CharacterTest /><WordPuzzle /><BalanceGame /></div>
      <p className={styles.bottomNote}>오늘 배운 말, 실제 상황에서도 꺼내볼까요?<br /><Link href="/english-phrase-cards">생활 영어 문장 카드 →</Link><Link href="/">홈으로 돌아가기 →</Link></p>
    </Container></main><Footer /></>;
}
