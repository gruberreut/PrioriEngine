import { useState } from "react";
import type { Task } from "../../../types/task";
import { TaskCard } from "../../../entity/TaskCard/TaskCard";
import { InProgressBlock } from "../InProgressBlock/InProgressBlock";
import { EmptyState } from "../EmptyState/EmptyState";
import type { ScoreBreakdownData } from "../ScoreBreakdown/ScoreBreakdown";
import styles from "./ResultsPanel.module.css";

export interface RankedTask {
  task: Task;
  breakdown?: ScoreBreakdownData;
}

export type RankResultMode =
  | { mode: "recommendations"; tasks: RankedTask[]; explain?: boolean; context?: string }
  | { mode: "in_progress_block"; task: Task };

export interface ResultsPanelProps {
  result?: RankResultMode;
  onBack?: () => void;
  onSelectTask?: (taskId: string | null) => void;
  onInProgressAction?: (actionId: string) => void;
}

export function ResultsPanel({ result, onBack, onSelectTask, onInProgressAction }: ResultsPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!result) return null;

  if (result.mode === "in_progress_block") {
    return <InProgressBlock task={result.task} onAction={onInProgressAction} />;
  }

  if (result.tasks.length === 0) {
    return <EmptyState context={result.context} onBack={onBack} />;
  }

  function handleSelect(taskId: string) {
    const next = taskId === selectedId ? null : taskId;
    setSelectedId(next);
    onSelectTask?.(next);
  }

  return (
    <div className={styles.list}>
      {result.tasks.map(({ task, breakdown }) => (
        <TaskCard
          key={task.id}
          task={task}
          breakdown={breakdown}
          explain={result.explain}
          selected={selectedId === task.id}
          onSelect={() => handleSelect(task.id)}
        />
      ))}
    </div>
  );
}
