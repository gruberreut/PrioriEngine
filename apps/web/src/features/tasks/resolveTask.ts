import type { Task } from "../../types/task";

export interface ResolvedTask {
  id: string;
  title: string;
  duration: number;
  energyRequired: "low" | "medium" | "high";
  location: "home" | "in-person" | "anywhere";
  contexts: string[];
  status: "pending" | "in_progress" | "completed";
}

function inheritedValue<K extends keyof Task>(
  task: Task,
  ancestors: Task[],
  key: K
): Task[K] | undefined {
  if (task[key] !== undefined && task[key] !== null) return task[key];
  // ancestors is root-first; walk from immediate parent (last) to root
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const val = ancestors[i][key];
    if (val !== undefined && val !== null) return val;
  }
  return undefined;
}

export function getAncestors(task: Task, allTasks: Task[]): Task[] {
  const ancestors: Task[] = [];
  let current: Task | undefined = task;
  while (current?.parentId) {
    const parent = allTasks.find((t) => t.id === current!.parentId);
    if (!parent) break;
    ancestors.unshift(parent);
    current = parent;
  }
  return ancestors;
}

export function resolveTask(task: Task, ancestors: Task[]): ResolvedTask {
  return {
    id: task.id,
    title: inheritedValue(task, ancestors, "title") ?? "",
    duration: inheritedValue(task, ancestors, "duration") ?? 30,
    energyRequired: inheritedValue(task, ancestors, "energyRequired") ?? "medium",
    location: inheritedValue(task, ancestors, "location") ?? "anywhere",
    contexts: inheritedValue(task, ancestors, "contexts") ?? [],
    status: inheritedValue(task, ancestors, "status") ?? "pending",
  };
}
