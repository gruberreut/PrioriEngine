import type { IncomingMessage, ServerResponse } from "node:http";
import { asc, eq, max } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "../db/schema.js";
import { contexts as contextsTable } from "../db/schema.js";
import { json, readBody } from "../lib/http.js";

type Db = NodePgDatabase<typeof schema>;

// Matches the number of --color-slide-* tints in tokens.css.
const SLIDE_PALETTE_SIZE = 8;

export function createContextsHandler(db: Db, devUserId: string) {
  return async (
    req: IncomingMessage,
    res: ServerResponse,
    pathname: string,
    method: string
  ): Promise<boolean> => {
    if (method === "GET" && pathname === "/api/contexts") {
      try {
        const rows = await db
          .select()
          .from(contextsTable)
          .where(eq(contextsTable.userId, devUserId))
          .orderBy(asc(contextsTable.slideIndex));
        json(res, 200, rows);
      } catch {
        json(res, 500, { error: "Database error" });
      }
      return true;
    }

    if (method === "POST" && pathname === "/api/contexts") {
      try {
        const body = JSON.parse(await readBody(req)) as Record<string, unknown>;
        const created = await db.transaction(async (tx) => {
          // Assigned from a monotonically increasing counter, never by reusing
          // a freed index — see TASKS-DONE.md §14 for why (keeps hue-wheel order
          // matching creation order once contexts can be archived, §42).
          const [{ maxIndex }] = await tx
            .select({ maxIndex: max(contextsTable.slideIndex) })
            .from(contextsTable)
            .where(eq(contextsTable.userId, devUserId));
          const slideIndex = ((maxIndex ?? -1) + 1) % SLIDE_PALETTE_SIZE;

          const [row] = await tx
            .insert(contextsTable)
            .values({ userId: devUserId, name: String(body.name), slideIndex })
            .onConflictDoNothing()
            .returning();
          return row;
        });
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
