import type { Task } from "../types/task";
import { apiFetch } from "./apiFetch";

export function getTasks(signal?: AbortSignal): Promise<Task[]> {
  return apiFetch<Task[]>("/api/tasks", { signal });
}

export function getTasksByStatus(status: Task["status"], signal?: AbortSignal): Promise<Task[]> {
  return apiFetch<Task[]>(`/api/tasks?status=${status}`, { signal });
}

export interface TaskUpdateResult {
  task: Task;
  autoCompletedAncestors: Task[];
}

export function updateTask(
  id: string,
  updates: { status: Task["status"] },
  signal?: AbortSignal
): Promise<TaskUpdateResult> {
  return apiFetch<TaskUpdateResult>(`/api/tasks/${id}`, { method: "PUT", body: updates, signal });
}

export function snoozeTask(id: string, signal?: AbortSignal): Promise<Task> {
  return apiFetch<Task>(`/api/tasks/${id}/snooze`, { method: "POST", signal });
}

export function deleteTask(
  id: string,
  childAction?: "delete" | "reparent",
  signal?: AbortSignal
): Promise<void> {
  return apiFetch<void>(`/api/tasks/${id}`, {
    method: "DELETE",
    body: childAction ? { childAction } : undefined,
    signal,
  });
}

export function splitTask(
  id: string,
  title: string,
  signal?: AbortSignal
): Promise<{ parent: Task; original: Task; sibling: Task }> {
  return apiFetch<{ parent: Task; original: Task; sibling: Task }>(`/api/tasks/${id}/split`, {
    method: "POST",
    body: { title },
    signal,
  });
}
