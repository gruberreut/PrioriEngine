import { useState } from "react";
import type { Task } from "../../../types/task";
import { resolveTask } from "../resolveTask";
import { TaskCard } from "../../../entity/TaskCard/TaskCard";
import styles from "./TaskTreeItem.module.css";

export interface TaskTreeItemProps {
  task: Task;
  ancestors: Task[];
  depth: number;
  allTasks: Task[];
  defaultExpanded?: boolean;
}

function getDescendants(taskId: string, allTasks: Task[]): Task[] {
  const result: Task[] = [];
  const queue = allTasks.filter((t) => t.parentId === taskId);
  while (queue.length > 0) {
    const t = queue.shift()!;
    result.push(t);
    queue.push(...allTasks.filter((c) => c.parentId === t.id));
  }
  return result;
}

export function TaskTreeItem({ task, ancestors, depth, allTasks, defaultExpanded = false }: TaskTreeItemProps) {
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
        <TaskCard task={cardTask} flavor="dense" />
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
        </div>
      </div>
      {expanded && children.map((child) => (
        <TaskTreeItem
          key={child.id}
          task={child}
          ancestors={[...ancestors, task]}
          depth={depth + 1}
          allTasks={allTasks}
        />
      ))}
    </div>
  );
}
