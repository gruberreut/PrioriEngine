import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "./schema.js";
import { tasks } from "./schema.js";

type Db = NodePgDatabase<typeof schema>;

export async function queryTasks(db: Db, userId: string) {
  return db.select().from(tasks).where(eq(tasks.userId, userId));
}
