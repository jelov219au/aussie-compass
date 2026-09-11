import type { PlayWordExplanation } from "@/lib/playWordExplanation";
import styles from "./Playground.module.css";

export function WordExplanation({ explanation, usage, example }: PlayWordExplanation) {
  return <div className={styles.wordExplanation}>
    <p>{explanation}</p>
    <p>{usage}</p>
    <div className={styles.wordExample}>
      <span className={styles.exampleLabel}>사용 예시</span>
      <p>{example.ko}</p>
      <p lang="en" className={styles.englishExample}>{example.en}</p>
    </div>
  </div>;
}
