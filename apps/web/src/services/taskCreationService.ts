import type { Task } from "../types/task";
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

export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  const res = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create task");
  return res.json() as Promise<Task>;
}

export async function createContext(name: string): Promise<ContextItem> {
  const res = await fetch("/api/contexts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error("Failed to create context");
  const data = (await res.json()) as { id: string; name: string; slideIndex: number };
  return { id: data.id, name: data.name, slideIndex: data.slideIndex };
}
