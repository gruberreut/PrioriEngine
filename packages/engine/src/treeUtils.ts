import { LoadedTask, RawTask } from "./types.js";

export function asTaskArray(parsed: unknown): RawTask[] {
  if (Array.isArray(parsed)) {
    return parsed as RawTask[];
  }

  if (
    parsed &&
    typeof parsed === "object" &&
    "tasks" in parsed &&
    Array.isArray((parsed as { tasks?: unknown }).tasks)
  ) {
    return (parsed as { tasks: RawTask[] }).tasks;
  }

  return [];
}

export function flattenTaskTree(
  tasks: RawTask[],
  depth = 0,
  parent?: LoadedTask
): LoadedTask[] {
  const result: LoadedTask[] = [];

  for (const task of tasks) {
    const loaded: LoadedTask = { task, parent, depth };
    result.push(loaded);

    if (Array.isArray(task.children) && task.children.length > 0) {
      result.push(...flattenTaskTree(task.children, depth + 1, loaded));
    }
  }

  return result;
}

export function isLeafTask(task: RawTask): boolean {
  return !Array.isArray(task.children) || task.children.length === 0;
}
