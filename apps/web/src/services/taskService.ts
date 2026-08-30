import type { Task } from "../types/task";

export async function getTasks(): Promise<Task[]> {
  const res = await fetch("/api/tasks");
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json() as Promise<Task[]>;
}

export async function updateTask(id: string, updates: { status: Task["status"] }): Promise<Task> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update task");
  return res.json() as Promise<Task>;
}

export async function splitTask(id: string, title: string): Promise<{ parent: Task; original: Task; sibling: Task }> {
  const res = await fetch(`/api/tasks/${id}/split`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to split task");
  return res.json() as Promise<{ parent: Task; original: Task; sibling: Task }>;
}
