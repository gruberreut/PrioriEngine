import type { IncomingMessage, ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "../db/schema.js";
import { tasks as tasksTable } from "../db/schema.js";
import { json, readBody } from "../lib/http.js";
import { queryTasks } from "../db/queries.js";

type Db = NodePgDatabase<typeof schema>;

export function createTasksHandler(db: Db, devUserId: string) {
  return async (
    req: IncomingMessage,
    res: ServerResponse,
    pathname: string,
    method: string
  ): Promise<boolean> => {
    const splitMatch = pathname.match(/^\/api\/tasks\/([^/]+)\/split$/);

    if (method === "POST" && splitMatch) {
      try {
        const taskId = splitMatch[1];
        const body = JSON.parse(await readBody(req)) as Record<string, unknown>;
        const result = await db.transaction(async (tx) => {
          const [original] = await tx.select().from(tasksTable).where(eq(tasksTable.id, taskId));
          if (!original) throw Object.assign(new Error("Task not found"), { code: "NOT_FOUND" });

          const newParentId = randomUUID();
          const siblingId = randomUUID();

          const [parent] = await tx.insert(tasksTable).values({
            id: newParentId,
            userId: devUserId,
            parentId: original.parentId,
            contextId: original.contextId,
            title: String(body.title),
            priority: original.priority,
            priorityUpdatedAt: new Date(),
            dueDate: original.dueDate,
            duration: original.duration,
            energyRequired: original.energyRequired,
            location: original.location,
          }).returning();

          const [updatedOriginal] = await tx
            .update(tasksTable)
            .set({ parentId: newParentId, updatedAt: new Date() })
            .where(eq(tasksTable.id, taskId))
            .returning();

          const [sibling] = await tx.insert(tasksTable).values({
            id: siblingId,
            userId: devUserId,
            parentId: newParentId,
            contextId: original.contextId,
            title: "",
            priority: original.priority,
            priorityUpdatedAt: new Date(),
            duration: original.duration,
            energyRequired: original.energyRequired,
            location: original.location,
          }).returning();

          return { parent, original: updatedOriginal, sibling };
        });
        json(res, 200, result);
      } catch (err: unknown) {
        if ((err as { code?: string }).code === "NOT_FOUND") {
          json(res, 404, { error: "Task not found" });
        } else {
          json(res, 400, { error: "Bad request" });
        }
      }
      return true;
    }

    if (method === "GET" && pathname === "/api/tasks") {
      try {
        const rows = await queryTasks(db, devUserId);
        json(res, 200, rows);
      } catch {
        json(res, 500, { error: "Database error" });
      }
      return true;
    }

    if (method === "POST" && pathname === "/api/tasks") {
      try {
        const body = JSON.parse(await readBody(req)) as Record<string, unknown>;
        const [created] = await db.insert(tasksTable).values({
          id: String(body.id),
          userId: devUserId,
          parentId: (body.parentId as string | undefined) ?? null,
          contextId: (body.contextId as string | undefined) ?? null,
          title: String(body.title),
          priority: Number(body.priority),
          dueDate: body.dueDate ? new Date(String(body.dueDate)) : null,
          duration: Number(body.duration),
          energyRequired: String(body.energyRequired),
          location: String(body.location ?? "anywhere"),
        }).returning();
        json(res, 201, created);
      } catch {
        json(res, 400, { error: "Bad request" });
      }
      return true;
    }

    return false;
  };
}
