export interface ContextItem {
  id: string;
  name: string;
  slideIndex: number;
}

export async function getContexts(): Promise<string[]> {
  const res = await fetch("/api/contexts");
  if (!res.ok) throw new Error("Failed to fetch contexts");
  const data = (await res.json()) as ContextItem[];
  return data.map((c) => c.name);
}

export async function getContextItems(): Promise<ContextItem[]> {
  const res = await fetch("/api/contexts");
  if (!res.ok) throw new Error("Failed to fetch contexts");
  const data = (await res.json()) as ContextItem[];
  return data.map((c) => ({ id: c.id, name: c.name, slideIndex: c.slideIndex }));
}
