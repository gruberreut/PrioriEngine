import { ResultsPanel, type RankResultMode } from "../ResultsPanel/ResultsPanel";
import styles from "./ResultsSlide.module.css";

export type SlideState = "idle" | "loading" | "loaded" | "error";

export interface ResultsSlideProps {
  label: string;
  state: SlideState;
  result?: RankResultMode;
  backgroundColor?: string;
  onStartTask?: (taskId: string) => void;
}

export function ResultsSlide({ label, state, result, backgroundColor, onStartTask }: ResultsSlideProps) {
  return (
    <div className={styles.slide} style={backgroundColor ? { backgroundColor } : undefined}>
      <h2 className={styles.heading}>{label}</h2>
      {(state === "idle" || state === "loading") && (
        <div className={styles.skeletonList}>
          {[0, 1, 2].map((i) => (
            <div key={i} className={styles.skeletonCard}>
              <div className={`${styles.skeletonLine} ${styles.skeletonTitle}`} />
              <div className={`${styles.skeletonLine} ${styles.skeletonMeta}`} />
            </div>
          ))}
        </div>
      )}
      {state === "error" && <p className={styles.error}>Failed to load results</p>}
      {state === "loaded" && <ResultsPanel result={result} onStartTask={onStartTask} />}
    </div>
  );
}
