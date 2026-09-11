import Link from "next/link";
import { Container } from "@/components/ui/Container";
import styles from "@/components/play/Playground.module.css";

export function HomePlaySection() {
  return <section className={styles.teaserSection} aria-labelledby="home-play-heading"><Container>
    <div className={styles.teaser}>
      <div>
        <span className={styles.eyebrow}>LITTLE BREAK, AUSSIE STYLE</span>
        <h2 id="home-play-heading">잠깐, 호주 한 판</h2>
        <p>매일 새 퀴즈 하나, 단어 하나, 상상 하나.<br />지난 문제와 생활 캐릭터도 함께 즐겨요.</p>
        <div className={styles.teaserActions}>
          <Link href="/play#daily-quiz" className={styles.primaryButton}>오늘의 새 세트 →</Link>
          <Link href="/play#character-test" className={styles.smallButton}>나는 어떤 캐릭터?</Link>
          <Link href="/play#word-puzzle" className={styles.smallButton}>글자 맞추기 →</Link>
          <Link href="/play#balance-game" className={styles.smallButton}>둘 중 하나 고르기 →</Link>
        </div>
      </div>
      <div className={styles.stickerTray} aria-hidden="true"><span>🦘</span><span>🐨</span></div>
    </div>
  </Container></section>;
}
