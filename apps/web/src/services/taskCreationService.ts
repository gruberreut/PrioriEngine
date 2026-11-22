import type { Task } from "../types/task";
import { apiFetch } from "./apiFetch";
import type { ContextItem } from "./contextService";

export type { ContextItem };

export interface CreateTaskPayload {
  id: string;
  parentId?: string | null;
  contextId?: string | null;
  title: string;
  priority: number;
  dueDate?: string | null;
  duration: number;
  energyRequired: "low" | "medium" | "high";
  location: "home" | "in-person" | "anywhere";
}

export function createTask(payload: CreateTaskPayload, signal?: AbortSignal): Promise<Task> {
  return apiFetch<Task>("/api/tasks", { method: "POST", body: payload, signal });
}

export async function createContext(name: string, signal?: AbortSignal): Promise<ContextItem> {
  const data = await apiFetch<ContextItem>("/api/contexts", { method: "POST", body: { name }, signal });
  return { id: data.id, name: data.name, slideIndex: data.slideIndex };
}
