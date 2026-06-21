import { ResultsPanel, type RankResultMode } from "../ResultsPanel/ResultsPanel";
import styles from "./ResultsSlide.module.css";

export type SlideState = "idle" | "loading" | "loaded" | "error";

export interface ResultsSlideProps {
  label: string;
  state: SlideState;
  result?: RankResultMode;
  backgroundColor?: string;
}

export function ResultsSlide({ label, state, result, backgroundColor }: ResultsSlideProps) {
  return (
    <div className={styles.slide} style={backgroundColor ? { backgroundColor } : undefined}>
      <h2 className={styles.heading}>{label}</h2>
      {state === "idle" && <p className={styles.hint}>Swipe here to load results</p>}
      {state === "loading" && <p className={styles.loading}>Loading…</p>}
      {state === "error" && <p className={styles.error}>Failed to load results</p>}
      {state === "loaded" && <ResultsPanel result={result} />}
    </div>
  );
}
