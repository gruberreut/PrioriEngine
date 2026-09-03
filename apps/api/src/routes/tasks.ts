import type { IncomingMessage, ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { eq, inArray, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "../db/schema.js";
import { tasks as tasksTable } from "../db/schema.js";
import { json, readBody, setCorsHeaders } from "../lib/http.js";
import { groupTasksByParent, queryTasks } from "../db/queries.js";

type Db = NodePgDatabase<typeof schema>;

function collectDescendantIds(
  rootId: string,
  grouped: Map<string | null, { id: string }[]>
): string[] {
  const ids: string[] = [rootId];
  const queue = [rootId];
  while (queue.length) {
    const current = queue.pop()!;
    for (const child of grouped.get(current) ?? []) {
      ids.push(child.id);
      queue.push(child.id);
    }
  }
  return ids;
}

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
        const splitTitle = String(body.title ?? "").trim();
        if (!splitTitle) {
          json(res, 400, { error: "Title is required" });
          return true;
        }
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
            title: splitTitle,
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

    const snoozeMatch = pathname.match(/^\/api\/tasks\/([^/]+)\/snooze$/);

    if (method === "POST" && snoozeMatch) {
      const taskId = snoozeMatch[1];
      try {
        const [updated] = await db
          .update(tasksTable)
          .set({
            // Snoozing an in-progress task un-blocks ranking by returning
            // it to the normal candidate pool; any other status is left
            // untouched (a pending task snoozed directly stays pending).
            status: sql`CASE WHEN ${tasksTable.status} = 'in_progress' THEN 'pending' ELSE ${tasksTable.status} END`,
            lastSuggestedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(tasksTable.id, taskId))
          .returning();
        if (!updated) {
          json(res, 404, { error: "Task not found" });
        } else {
          json(res, 200, updated);
        }
      } catch {
        json(res, 400, { error: "Bad request" });
      }
      return true;
    }

    const updateMatch = pathname.match(/^\/api\/tasks\/([^/]+)$/);

    if (method === "DELETE" && updateMatch) {
      const taskId = updateMatch[1];
      try {
        const bodyText = await readBody(req);
        const body = bodyText ? (JSON.parse(bodyText) as Record<string, unknown>) : {};
        const requestedAction = body.childAction;
        if (requestedAction !== undefined && requestedAction !== "delete" && requestedAction !== "reparent") {
          json(res, 400, { error: "Invalid childAction" });
          return true;
        }

        const found = await db.transaction(async (tx) => {
          const [target] = await tx.select().from(tasksTable).where(eq(tasksTable.id, taskId));
          if (!target) return false;

          const rows = await tx.select().from(tasksTable).where(eq(tasksTable.userId, target.userId));
          const grouped = groupTasksByParent(rows);
          const directChildren = grouped.get(taskId) ?? [];

          if (directChildren.length > 0) {
            const childAction = (requestedAction as "delete" | "reparent" | undefined) ?? "reparent";
            if (childAction === "delete") {
              const idsToDelete = collectDescendantIds(taskId, grouped);
              await tx.delete(tasksTable).where(inArray(tasksTable.id, idsToDelete));
              return true;
            }
            await tx
              .update(tasksTable)
              .set({ parentId: null, updatedAt: new Date() })
              .where(eq(tasksTable.parentId, taskId));
          }

          await tx.delete(tasksTable).where(eq(tasksTable.id, taskId));
          return true;
        });

        if (!found) {
          json(res, 404, { error: "Task not found" });
        } else {
          setCorsHeaders(res);
          res.writeHead(204);
          res.end();
        }
      } catch {
        json(res, 400, { error: "Bad request" });
      }
      return true;
    }

    if (method === "PUT" && updateMatch) {
      const taskId = updateMatch[1];
      try {
        const body = JSON.parse(await readBody(req)) as Record<string, unknown>;
        const status = String(body.status ?? "");
        if (!["pending", "in_progress", "completed"].includes(status)) {
          json(res, 400, { error: "Invalid status" });
          return true;
        }
        const [updated] = await db
          .update(tasksTable)
          .set({ status, updatedAt: new Date() })
          .where(eq(tasksTable.id, taskId))
          .returning();
        if (!updated) {
          json(res, 404, { error: "Task not found" });
        } else {
          json(res, 200, updated);
        }
      } catch {
        json(res, 400, { error: "Bad request" });
      }
      return true;
    }

    if (method === "GET" && pathname === "/api/tasks") {
      try {
        const { searchParams } = new URL(req.url ?? "/", "http://localhost");
        const status = searchParams.get("status") ?? undefined;
        if (status && !["pending", "in_progress", "completed"].includes(status)) {
          json(res, 400, { error: "Invalid status" });
          return true;
        }
        const rows = await queryTasks(db, devUserId, { status });
        json(res, 200, rows);
      } catch {
        json(res, 500, { error: "Database error" });
      }
      return true;
    }

    if (method === "POST" && pathname === "/api/tasks") {
      try {
        const body = JSON.parse(await readBody(req)) as Record<string, unknown>;
        const title = String(body.title ?? "").trim();
        if (!title) {
          json(res, 400, { error: "Title is required" });
          return true;
        }
        const [created] = await db.insert(tasksTable).values({
          id: String(body.id),
          userId: devUserId,
          parentId: (body.parentId as string | undefined) ?? null,
          contextId: (body.contextId as string | undefined) ?? null,
          title,
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
