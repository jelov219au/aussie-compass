import Link from "next/link";
import { Container } from "@/components/ui/Container";
import styles from "@/components/play/Playground.module.css";

export function HomePlaySection() {
  return <section className={styles.teaserSection} aria-labelledby="home-play-heading"><Container>
    <div className={styles.teaser}>
      <div>
        <span className={styles.eyebrow}>LITTLE BREAK, AUSSIE STYLE</span>
        <h2 id="home-play-heading">잠깐, 호주 한 판</h2>
        <p>퀴즈부터 단어 퍼즐, 캐릭터와 밸런스 게임까지.<br />준비할 일 사이에, 웃을 시간도 조금.</p>
        <div className={styles.teaserActions}>
          <Link href="/play#daily-quiz" className={styles.primaryButton}>오늘의 한 문제 →</Link>
          <Link href="/play#character-test" className={styles.smallButton}>나는 어떤 캐릭터?</Link>
          <Link href="/play#word-puzzle" className={styles.smallButton}>글자 맞추기 →</Link>
          <Link href="/play#balance-game" className={styles.smallButton}>둘 중 하나 고르기 →</Link>
        </div>
      </div>
      <div className={styles.stickerTray} aria-hidden="true"><span>🦘</span><span>🐨</span></div>
    </div>
  </Container></section>;
}
