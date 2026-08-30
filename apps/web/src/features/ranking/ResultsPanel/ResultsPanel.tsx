import { useState } from "react";
import type { Task } from "../../../types/task";
import { TaskCard, type TaskAction } from "../../../entity/TaskCard/TaskCard";
import { InProgressBlock } from "../InProgressBlock/InProgressBlock";
import { EmptyState } from "../EmptyState/EmptyState";
import type { ScoreBreakdownData } from "../ScoreBreakdown/ScoreBreakdown";
import { Icon } from "../../../components/Icon/Icon";
import { Play } from "../../../assets/icons/Play";
import styles from "./ResultsPanel.module.css";

const START_ACTIONS: TaskAction[] = [
  { id: "start", icon: <Icon asset={Play} label="Start" size={20} /> },
];

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
  onStartTask?: (taskId: string) => void;
}

export function ResultsPanel({ result, onBack, onSelectTask, onInProgressAction, onStartTask }: ResultsPanelProps) {
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
          actions={START_ACTIONS}
          onAction={(actionId) => { if (actionId === "start") onStartTask?.(task.id); }}
          onSelect={() => handleSelect(task.id)}
        />
      ))}
    </div>
  );
}
