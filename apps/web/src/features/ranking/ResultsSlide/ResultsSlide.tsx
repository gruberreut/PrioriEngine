import { ResultsPanel, type RankResultMode } from "../ResultsPanel/ResultsPanel";
import { Card } from "../../../components/Card/Card";
import { InlineMessage } from "../../../components/InlineMessage/InlineMessage";
import type { Task } from "../../../types/task";
import styles from "./ResultsSlide.module.css";

export type SlideState = "idle" | "loading" | "loaded" | "error";

export interface ResultsSlideProps {
  label: string;
  state: SlideState;
  result?: RankResultMode;
  backgroundColor?: string;
  onStartTask?: (taskId: string) => void;
  onInProgressAction?: (actionId: string, task: Task) => void;
}

export function ResultsSlide({ label, state, result, backgroundColor, onStartTask, onInProgressAction }: ResultsSlideProps) {
  return (
    <div className={styles.slide} style={backgroundColor ? { backgroundColor } : undefined}>
      <h2 className={styles.heading}>{label}</h2>
      {(state === "idle" || state === "loading") && (
        <div className={styles.skeletonList}>
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <div className={`${styles.skeletonLine} ${styles.skeletonTitle}`} />
              <div className={`${styles.skeletonLine} ${styles.skeletonMeta}`} />
            </Card>
          ))}
        </div>
      )}
      {state === "error" && <InlineMessage status="error">Failed to load results</InlineMessage>}
      {state === "loaded" && <ResultsPanel result={result} onStartTask={onStartTask} onInProgressAction={onInProgressAction} />}
    </div>
  );
}
