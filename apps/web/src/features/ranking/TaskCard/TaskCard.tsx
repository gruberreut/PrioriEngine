import type { ReactNode } from "react";
import { ScoreBreakdown, type ScoreBreakdownData } from "../ScoreBreakdown/ScoreBreakdown";
import styles from "./TaskCard.module.css";

export interface TaskData {
  id: string;
  title: string;
  duration: number;
  energyRequired: "low" | "medium" | "high";
  contexts: string[];
}

export interface TaskAction {
  id: string;
  icon: ReactNode;
  label?: string;
  color?: string;
}

export interface TaskCardProps {
  task: TaskData;
  breakdown?: ScoreBreakdownData;
  explain?: boolean;
  flavor?: "flat" | "outlined";
  selected?: boolean;
  actions?: TaskAction[];
  showActionLabels?: boolean;
  onSelect?: () => void;
  onAction?: (actionId: string) => void;
}

export function TaskCard({ task, breakdown, explain = false, flavor = "outlined", selected = false, actions, showActionLabels = false, onSelect, onAction }: TaskCardProps) {
  return (
    <div
      className={`${styles.container} ${flavor === "outlined" ? styles.outlined : styles.flat} ${selected ? styles.selected : ""}`}
      onClick={onSelect}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={onSelect ? (e) => { if (e.key === "Enter" || e.key === " ") onSelect(); } : undefined}
    >
      <div className={styles.content}>
        <div className={styles.title}>{task.title}</div>
        <div className={styles.meta}>
          <span>{task.duration} min</span>
          <span className={styles.context}>{task.energyRequired} energy</span>
          {task.contexts.length > 0 && <span>{task.contexts.join(", ")}</span>}
        </div>
        {explain && breakdown && <ScoreBreakdown breakdown={breakdown} />}
      </div>
      {actions && actions.length > 0 && (
        <div className={styles.actions}>
          {actions.map((action) => (
            <button
              key={action.id}
              className={styles.actionButton}
              style={action.color ? { backgroundColor: action.color, borderColor: action.color } : undefined}
              onClick={(e) => { e.stopPropagation(); onAction?.(action.id); }}
            >
              <span className={styles.actionIcon}>{action.icon}</span>
              {showActionLabels && action.label && <span className={styles.actionLabel}>{action.label}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
