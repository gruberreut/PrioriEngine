import { apiFetch } from "./apiFetch";

export interface ContextItem {
  id: string;
  name: string;
  slideIndex: number;
}

export async function getContexts(signal?: AbortSignal): Promise<string[]> {
  const data = await apiFetch<ContextItem[]>("/api/contexts", { signal });
  return data.map((c) => c.name);
}

export async function getContextItems(signal?: AbortSignal): Promise<ContextItem[]> {
  const data = await apiFetch<ContextItem[]>("/api/contexts", { signal });
  return data.map((c) => ({ id: c.id, name: c.name, slideIndex: c.slideIndex }));
}
