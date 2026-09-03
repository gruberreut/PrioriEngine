import type { ReactNode } from "react";
import type { Task } from "../../types/task";
import { ScoreBreakdown, type ScoreBreakdownData } from "../../features/ranking/ScoreBreakdown/ScoreBreakdown";
import { LocationIcon } from "../../features/ranking/LocationIcon/LocationIcon";
import { Icon } from "../../components/Icon/Icon";
import { SpinnerArc } from "../../assets/icons/SpinnerArc";
import { Breadcrumbs } from "../../components/Breadcrumbs/Breadcrumbs";
import { ActionButton } from "../../components/ActionButton/ActionButton";
import styles from "./TaskCard.module.css";

export interface TaskAction {
  id: string;
  icon: ReactNode;
  label?: string;
  color?: string;
}

export interface TaskCardProps {
  task: Task;
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
  const inProgress = task.status === "in_progress";
  return (
    <div
      className={`${styles.container} ${flavor === "outlined" ? styles.outlined : styles.flat} ${selected ? styles.selected : ""} ${inProgress ? styles.withSpinner : ""}`}
      onClick={onSelect}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={onSelect ? (e) => { if (e.key === "Enter" || e.key === " ") onSelect(); } : undefined}
    >
      {inProgress && <Icon asset={SpinnerArc} label="In progress" size={36} />}
      <div className={styles.content}>
        {task.ancestors && task.ancestors.length > 0 && (
          <Breadcrumbs ancestors={task.ancestors} />
        )}
        <div className={styles.title}>{task.title}</div>
        <div className={styles.meta}>
          <span>{task.duration} min</span>
          <span className={styles.context}>{task.energyRequired} energy</span>
          {task.contexts.length > 0 && <span>{task.contexts.join(", ")}</span>}
          {task.location && (
            <span className={styles.locationMeta}>
              <LocationIcon location={task.location} size={18} />
            </span>
          )}
        </div>
        {explain && breakdown && <ScoreBreakdown breakdown={breakdown} />}
      </div>
      {actions && actions.length > 0 && (
        <div className={styles.actions}>
          {actions.map((action) => (
            <ActionButton
              key={action.id}
              icon={action.icon}
              label={action.label}
              color={action.color}
              showLabel={showActionLabels}
              onClick={() => onAction?.(action.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
