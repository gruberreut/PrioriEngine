import { isLeafTask } from "./taskLoader.js";
import {
  EnergyLevel,
  ExclusionRecord,
  LoadedTask,
  LocationRequirement,
  NormalizedTask,
  RawTask,
} from "./types.js";

function normalizeContext(value: string): string {
  return value.trim().toLowerCase();
}

function inheritedValue<T>(
  loadedTask: LoadedTask,
  getter: (task: RawTask) => T | undefined
): T | undefined {
  let cursor: LoadedTask | undefined = loadedTask;
  while (cursor) {
    const value = getter(cursor.task);
    if (value !== undefined) {
      return value;
    }
    cursor = cursor.parent;
  }
  return undefined;
}

function validateNormalizedTask(task: NormalizedTask): string[] {
  const errors: string[] = [];

  if (!Number.isInteger(task.priority) || task.priority < 1 || task.priority > 10) {
    errors.push("priority must be integer in range 1..10");
  }
  if (task.priority === 1 && !task.dueDate) {
    errors.push("priority=1 requires dueDate");
  }
  if (task.priority === 10 && !task.recurrence) {
    errors.push("priority=10 requires recurrence");
  }
  if (Number.isNaN(new Date(task.priorityUpdatedAt).getTime())) {
    errors.push("priorityUpdatedAt must be valid ISO date");
  }
  if (!Number.isFinite(task.duration) || task.duration <= 0) {
    errors.push("duration must be positive number");
  }

  return errors;
}

function ensureEnergy(value: unknown): EnergyLevel {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }
  return "medium";
}

function ensureLocation(value: unknown): LocationRequirement {
  if (value === "home" || value === "in-person" || value === "anywhere") {
    return value;
  }
  return "anywhere";
}

function buildNormalizedTask(loadedTask: LoadedTask): NormalizedTask {
  const id = inheritedValue(loadedTask, (task) => task.id) ?? "";
  const title = inheritedValue(loadedTask, (task) => task.title) ?? "";
  const priority = inheritedValue(loadedTask, (task) => task.priority) ?? 5;
  const priorityUpdatedAt =
    inheritedValue(loadedTask, (task) => task.priorityUpdatedAt) ??
    new Date().toISOString();
  const dueDate = inheritedValue(loadedTask, (task) => task.dueDate) ?? null;
  const recurrence = inheritedValue(loadedTask, (task) => task.recurrence) ?? null;
  const duration = inheritedValue(loadedTask, (task) => task.duration) ?? 30;
  const energyRequired = ensureEnergy(
    inheritedValue(loadedTask, (task) => task.energyRequired)
  );
  const location = ensureLocation(
    inheritedValue(loadedTask, (task) => task.location)
  );
  const contextsRaw = inheritedValue(loadedTask, (task) => task.contexts) ?? [];
  const contexts = contextsRaw.map(normalizeContext).filter(Boolean);
  const projectId = inheritedValue(loadedTask, (task) => task.projectId) ?? null;
  const parentId = inheritedValue(loadedTask, (task) => task.parentId) ?? null;
  const status = inheritedValue(loadedTask, (task) => task.status) ?? "pending";
  const createdAt = inheritedValue(loadedTask, (task) => task.createdAt) ?? null;
  const lastSuggestedAt =
    inheritedValue(loadedTask, (task) => task.lastSuggestedAt) ?? null;

  return {
    id,
    title,
    priority,
    priorityUpdatedAt,
    dueDate,
    recurrence,
    duration,
    energyRequired,
    location,
    contexts,
    projectId,
    parentId,
    status,
    createdAt,
    lastSuggestedAt,
    depth: loadedTask.depth,
  };
}

export interface NormalizeResult {
  tasks: NormalizedTask[];
  exclusions: ExclusionRecord[];
}

export function normalizeTasks(loadedTasks: LoadedTask[]): NormalizeResult {
  const tasks: NormalizedTask[] = [];
  const exclusions: ExclusionRecord[] = [];

  for (const loadedTask of loadedTasks) {
    const raw = loadedTask.task;
    const rawId = raw.id ?? "unknown";

    if (!isLeafTask(raw)) {
      exclusions.push({
        taskId: rawId,
        reason: "non_leaf",
        detail: "Only leaf tasks are rankable.",
      });
      continue;
    }

    const normalized = buildNormalizedTask(loadedTask);
    if (normalized.status === "completed") {
      exclusions.push({
        taskId: normalized.id || rawId,
        reason: "completed",
        detail: "Completed tasks are excluded.",
      });
      continue;
    }

    const validationErrors = validateNormalizedTask(normalized);
    if (validationErrors.length > 0) {
      exclusions.push({
        taskId: normalized.id || rawId,
        reason: "invalid",
        detail: validationErrors.join("; "),
      });
      continue;
    }

    tasks.push(normalized);
  }

  return { tasks, exclusions };
}
