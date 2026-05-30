import type { IncomingMessage, ServerResponse } from "node:http";
import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "../db/schema.js";
import { contexts as contextsTable } from "../db/schema.js";
import { json, readBody } from "../lib/http.js";

type Db = NodePgDatabase<typeof schema>;

export function createContextsHandler(db: Db, devUserId: string) {
  return async (
    req: IncomingMessage,
    res: ServerResponse,
    pathname: string,
    method: string
  ): Promise<boolean> => {
    if (method === "GET" && pathname === "/api/contexts") {
      try {
        const rows = await db.select().from(contextsTable).where(eq(contextsTable.userId, devUserId));
        json(res, 200, rows);
      } catch {
        json(res, 500, { error: "Database error" });
      }
      return true;
    }

    if (method === "POST" && pathname === "/api/contexts") {
      try {
        const body = JSON.parse(await readBody(req)) as Record<string, unknown>;
        const [created] = await db
          .insert(contextsTable)
          .values({ userId: devUserId, name: String(body.name) })
          .onConflictDoNothing()
          .returning();
        if (!created) {
          json(res, 409, { error: "Context already exists" });
          return true;
        }
        json(res, 201, created);
      } catch {
        json(res, 400, { error: "Bad request" });
      }
      return true;
    }

    return false;
  };
}
