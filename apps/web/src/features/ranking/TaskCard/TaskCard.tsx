import { ScoreBreakdown, type ScoreBreakdownData } from "../ScoreBreakdown/ScoreBreakdown";
import styles from "./TaskCard.module.css";

export interface TaskData {
  id: string;
  title: string;
  duration: number;
  energyRequired: "low" | "medium" | "high";
  contexts: string[];
}

export interface TaskCardProps {
  task: TaskData;
  breakdown?: ScoreBreakdownData;
  explain?: boolean;
  flavor?: "flat" | "outlined";
}

export function TaskCard({ task, breakdown, explain = false, flavor = "outlined" }: TaskCardProps) {
  return (
    <div className={`${styles.container} ${flavor === "outlined" ? styles.outlined : styles.flat}`}>
      <div className={styles.title}>{task.title}</div>
      <div className={styles.meta}>
        <span>{task.duration} min</span>
        <span className={styles.context}>{task.energyRequired} energy</span>
        {task.contexts.length > 0 && <span>{task.contexts.join(", ")}</span>}
      </div>
      {explain && breakdown && <ScoreBreakdown breakdown={breakdown} />}
    </div>
  );
}
