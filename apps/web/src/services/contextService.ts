export async function getContexts(): Promise<string[]> {
  const res = await fetch("/api/contexts");
  if (!res.ok) throw new Error("Failed to fetch contexts");
  const data = (await res.json()) as { name: string }[];
  return data.map((c) => c.name);
}
