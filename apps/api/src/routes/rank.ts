import type { IncomingMessage, ServerResponse } from "node:http";
import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "../db/schema.js";
import { contexts as contextsTable } from "../db/schema.js";
import { rankFromPayload } from "@priori/engine";
import type { RawTask, RuntimeParams } from "@priori/engine";
import { json, readBody } from "../lib/http.js";
import { queryTasks } from "../db/queries.js";

type Db = NodePgDatabase<typeof schema>;

export function createRankHandler(db: Db, userId: string) {
  return async (
    req: IncomingMessage,
    res: ServerResponse,
    pathname: string,
    method: string
  ): Promise<boolean> => {
    if (method === "POST" && pathname === "/api/rank") {
      try {
        const [bodyText, taskRows, contextRows] = await Promise.all([
          readBody(req),
          queryTasks(db, userId),
          db.select().from(contextsTable).where(eq(contextsTable.userId, userId)),
        ]);

        const body = JSON.parse(bodyText) as Record<string, unknown>;
        const contextNameById = new Map(contextRows.map((c) => [c.id, c.name]));

        const rawTasks: RawTask[] = taskRows.map((t) => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
          priorityUpdatedAt: t.priorityUpdatedAt.toISOString(),
          dueDate: t.dueDate?.toISOString() ?? null,
          duration: t.duration,
          energyRequired: t.energyRequired as RawTask["energyRequired"],
          location: t.location,
          contexts: t.contextId ? [contextNameById.get(t.contextId) ?? ""].filter(Boolean) : [],
          parentId: t.parentId,
          status: t.status as RawTask["status"],
          lastSuggestedAt: t.lastSuggestedAt?.toISOString() ?? null,
          createdAt: t.createdAt.toISOString(),
        }));

        const params: RuntimeParams = {
          currentTime: new Date(),
          availableTime: Number(body.availableTime ?? 30),
          energyLevel: (body.energyLevel as RuntimeParams["energyLevel"]) ?? "medium",
          context: body.context as string | undefined,
          location: body.location as string | undefined,
          explain: Boolean(body.explain ?? false),
          limit: Number(body.limit ?? 3),
        };

        json(res, 200, rankFromPayload(rawTasks, params));
      } catch {
        json(res, 400, { error: "Invalid request body" });
      }
      return true;
    }

    return false;
  };
}
