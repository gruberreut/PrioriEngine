import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "./index.js";
import { users, contexts, tasks } from "./schema.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TASKS_PATH = resolve(__dirname, "../../../../packages/engine/test/data/tasks.example.json");
const DEV_USER_EMAIL = "dev@priori.local";

// Maps JSON context strings to DB context names
const CONTEXT_MAP: Record<string, string> = {
  physical: "Physical",
  creativity: "Creativity",
  learning: "Learning",
  admin: "Projects",
};

type RawTask = {
  id: string;
  title: string;
  priority?: number;
  priorityUpdatedAt?: string;
  dueDate?: string | null;
  duration?: number;
  energyRequired?: string;
  contexts?: string[];
  location?: string;
  status?: string;
  lastSuggestedAt?: string | null;
  createdAt?: string;
  children?: RawTask[];
};

type FlatTask = Omit<RawTask, "children"> & { parentStringId: string | null };

function flatten(items: RawTask[], parentStringId: string | null): FlatTask[] {
  return items.flatMap((t) => {
    const { children, ...rest } = t;
    return [
      { ...rest, parentStringId },
      ...(children ? flatten(children, t.id) : []),
    ];
  });
}

function resolveUp(
  field: keyof Omit<FlatTask, "id" | "title" | "parentStringId">,
  task: FlatTask,
  byStringId: Map<string, FlatTask>
): unknown {
  let current: FlatTask | undefined = task;
  while (current) {
    const val = current[field];
    if (val !== undefined && val !== null) return val;
    current = current.parentStringId ? byStringId.get(current.parentStringId) : undefined;
  }
  return undefined;
}

async function run() {
  const [devUser] = await db.select().from(users).where(eq(users.email, DEV_USER_EMAIL));
  if (!devUser) throw new Error(`Dev user not found — run db:seed first.`);

  const dbContextRows = await db.select().from(contexts).where(eq(contexts.userId, devUser.id));
  const contextByName = new Map(dbContextRows.map((c) => [c.name.toLowerCase(), c]));

  const raw = JSON.parse(readFileSync(TASKS_PATH, "utf-8"));
  const taskArray: RawTask[] = Array.isArray(raw) ? raw : raw.tasks;
  const flat = flatten(taskArray, null);
  const byStringId = new Map(flat.map((t) => [t.id, t]));

  const idMap = new Map<string, string>();
  for (const t of flat) idMap.set(t.id, randomUUID());

  // Clear existing tasks for dev user so this script is safe to re-run
  await db.delete(tasks).where(eq(tasks.userId, devUser.id));

  // Insert in flattened order — parents always appear before their children
  for (const t of flat) {
    const resolvedContexts = resolveUp("contexts", t, byStringId) as string[] | undefined;
    const mappedName = resolvedContexts?.[0] ? (CONTEXT_MAP[resolvedContexts[0]] ?? resolvedContexts[0]) : null;
    const contextRow = mappedName ? contextByName.get(mappedName.toLowerCase()) : null;

    await db.insert(tasks).values({
      id: idMap.get(t.id)!,
      userId: devUser.id,
      parentId: t.parentStringId ? (idMap.get(t.parentStringId) ?? null) : null,
      contextId: contextRow?.id ?? null,
      title: t.title,
      priority: (resolveUp("priority", t, byStringId) as number | undefined) ?? 5,
      priorityUpdatedAt: t.priorityUpdatedAt ? new Date(t.priorityUpdatedAt) : new Date(),
      dueDate: t.dueDate ? new Date(t.dueDate) : null,
      duration: (resolveUp("duration", t, byStringId) as number | undefined) ?? 0,
      energyRequired: (resolveUp("energyRequired", t, byStringId) as string | undefined) ?? "medium",
      location: (resolveUp("location", t, byStringId) as string | undefined) ?? "anywhere",
      status: t.status ?? "pending",
      lastSuggestedAt: t.lastSuggestedAt ? new Date(t.lastSuggestedAt) : null,
      createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
      updatedAt: new Date(),
    });
  }

  console.log(`Migrated ${flat.length} tasks for ${DEV_USER_EMAIL}.`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
