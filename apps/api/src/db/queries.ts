import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "./schema.js";
import { tasks } from "./schema.js";

type Db = NodePgDatabase<typeof schema>;

export async function queryTasks(db: Db, userId: string) {
  return db.select().from(tasks).where(eq(tasks.userId, userId));
}

export function groupTasksByParent<T extends { id: string; parentId: string | null }>(
  rows: T[]
): Map<string | null, T[]> {
  const grouped = new Map<string | null, T[]>();

  for (const row of rows) {
    const children = grouped.get(row.parentId);
    if (children) {
      children.push(row);
    } else {
      grouped.set(row.parentId, [row]);
    }
  }

  return grouped;
}
