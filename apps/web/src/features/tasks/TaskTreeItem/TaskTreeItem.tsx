import { useState } from "react";
import type { Task } from "../../../types/task";
import { resolveTask, getDescendants } from "../resolveTask";
import { TaskCard, type TaskAction } from "../../../entity/TaskCard/TaskCard";
import { ActionButton } from "../../../components/ActionButton/ActionButton";
import { Icon } from "../../../components/Icon/Icon";
import { Trash } from "../../../assets/icons/Trash";
import styles from "./TaskTreeItem.module.css";

export interface TaskTreeItemProps {
  task: Task;
  ancestors: Task[];
  depth: number;
  allTasks: Task[];
  defaultExpanded?: boolean;
  onDelete?: (task: Task) => void;
}

const LEAF_ACTIONS: TaskAction[] = [
  { id: "delete", icon: <Icon asset={Trash} label="Delete" size={20} />, label: "Delete", color: "#fee2e2" },
];

export function TaskTreeItem({ task, ancestors, depth, allTasks, defaultExpanded = false, onDelete }: TaskTreeItemProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const children = allTasks.filter((t) => t.parentId === task.id);
  const isLeaf = children.length === 0;

  const cardTask: Task = { ...task, ...resolveTask(task, ancestors) };

  if (isLeaf) {
    return (
      <div
        className={styles.leaf}
        style={{ paddingLeft: `calc(${depth} * 24px + var(--space-2))` }}
      >
        <TaskCard
          task={cardTask}
          flavor="outlined"
          actions={LEAF_ACTIONS}
          onAction={(actionId) => { if (actionId === "delete") onDelete?.(task); }}
        />
      </div>
    );
  }

  const descendants = getDescendants(task.id, allTasks);
  const totalMinutes = descendants.reduce((sum, t) => sum + (t.duration ?? 0), 0);
  const completedMinutes = descendants
    .filter((t) => t.status === "completed")
    .reduce((sum, t) => sum + (t.duration ?? 0), 0);

  return (
    <div className={styles.item}>
      <div
        className={styles.rowWrapper}
        style={{ paddingLeft: `calc(${depth} * 24px + var(--space-2))` }}
      >
        <div
          className={styles.row}
          onClick={() => setExpanded((v) => !v)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setExpanded((v) => !v); }}
        >
          <span className={styles.indicator}>{expanded ? "▾" : "▸"}</span>
          <span className={styles.title}>{task.title}</span>
          <span className={styles.progress}>{completedMinutes} / {totalMinutes} min</span>
          <ActionButton
            icon={<Icon asset={Trash} label="Delete" size={20} />}
            color="#fee2e2"
            onClick={() => onDelete?.(task)}
          />
        </div>
      </div>
      {expanded && children.map((child) => (
        <TaskTreeItem
          key={child.id}
          task={child}
          ancestors={[...ancestors, task]}
          depth={depth + 1}
          allTasks={allTasks}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
