import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createTasksHandler } from "../../src/routes/tasks.js";
import { tasks as tasksTable } from "../../src/db/schema.js";
import { clearAll, db, seedTask, seedUser } from "../helpers/db.js";
import { mockReq, mockRes } from "../helpers/http.js";

beforeEach(async () => {
  await clearAll();
});

async function handle(
  handler: ReturnType<typeof createTasksHandler>,
  method: string,
  pathname: string,
  body = "",
  url = pathname
) {
  const req = mockReq(body, url);
  const res = mockRes();
  await handler(req, res, pathname, method);
  return res;
}

describe("GET /api/tasks", () => {
  it("returns all tasks for the user", async () => {
    const user = await seedUser();
    await seedTask(user.id, { title: "Task A" });
    await seedTask(user.id, { title: "Task B" });

    const handler = createTasksHandler(db, user.id);
    const res = await handle(handler, "GET", "/api/tasks");

    expect(res.statusCode).toBe(200);
    const body = res.body() as { title: string }[];
    expect(body).toHaveLength(2);
    expect(body.map((t) => t.title).sort()).toEqual(["Task A", "Task B"]);
  });

  it("does not return tasks belonging to another user", async () => {
    const user = await seedUser();
    const other = await seedUser();
    await seedTask(other.id, { title: "Other user task" });

    const handler = createTasksHandler(db, user.id);
    const res = await handle(handler, "GET", "/api/tasks");

    expect(res.statusCode).toBe(200);
    expect(res.body()).toHaveLength(0);
  });

  it("filters by status when a status query param is given", async () => {
    const user = await seedUser();
    await seedTask(user.id, { title: "Pending task", status: "pending" });
    const active = await seedTask(user.id, { title: "Active task", status: "in_progress" });

    const handler = createTasksHandler(db, user.id);
    const res = await handle(handler, "GET", "/api/tasks", "", "/api/tasks?status=in_progress");

    expect(res.statusCode).toBe(200);
    const body = res.body() as { id: string }[];
    expect(body).toHaveLength(1);
    expect(body[0]!.id).toBe(active.id);
  });

  it("rejects an unrecognized status value", async () => {
    const user = await seedUser();
    const handler = createTasksHandler(db, user.id);
    const res = await handle(handler, "GET", "/api/tasks", "", "/api/tasks?status=bogus");

    expect(res.statusCode).toBe(400);
  });
});

describe("POST /api/tasks", () => {
  it("creates a task and returns it with 201", async () => {
    const user = await seedUser();
    const id = randomUUID();
    const payload = JSON.stringify({
      id,
      title: "New task",
      priority: 3,
      duration: 20,
      energyRequired: "low",
      location: "home",
    });

    const handler = createTasksHandler(db, user.id);
    const res = await handle(handler, "POST", "/api/tasks", payload);

    expect(res.statusCode).toBe(201);
    const body = res.body() as { id: string; title: string };
    expect(body.id).toBe(id);
    expect(body.title).toBe("New task");

    const [row] = await db.select().from(tasksTable).where(eq(tasksTable.id, id));
    expect(row).toBeDefined();
    expect(row!.userId).toBe(user.id);
  });

  it("returns 400 on invalid JSON body", async () => {
    const user = await seedUser();
    const handler = createTasksHandler(db, user.id);
    const res = await handle(handler, "POST", "/api/tasks", "not-json");
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 when title is missing", async () => {
    const user = await seedUser();
    const handler = createTasksHandler(db, user.id);
    const res = await handle(handler, "POST", "/api/tasks", JSON.stringify({ id: randomUUID(), priority: 3, duration: 20, energyRequired: "low" }));
    expect(res.statusCode).toBe(400);
    expect((res.body() as { error: string }).error).toBe("Title is required");
  });

  it("returns 400 when title is empty", async () => {
    const user = await seedUser();
    const handler = createTasksHandler(db, user.id);
    const res = await handle(handler, "POST", "/api/tasks", JSON.stringify({ id: randomUUID(), title: "", priority: 3, duration: 20, energyRequired: "low" }));
    expect(res.statusCode).toBe(400);
    expect((res.body() as { error: string }).error).toBe("Title is required");
  });

  it("returns 400 when title is whitespace only", async () => {
    const user = await seedUser();
    const handler = createTasksHandler(db, user.id);
    const res = await handle(handler, "POST", "/api/tasks", JSON.stringify({ id: randomUUID(), title: "   ", priority: 3, duration: 20, energyRequired: "low" }));
    expect(res.statusCode).toBe(400);
    expect((res.body() as { error: string }).error).toBe("Title is required");
  });
});

describe("POST /api/tasks/:id/split", () => {
  it("creates parent and sibling, updates original parentId, returns all three", async () => {
    const user = await seedUser();
    const original = await seedTask(user.id, { title: "Original" });

    const handler = createTasksHandler(db, user.id);
    const res = await handle(
      handler,
      "POST",
      `/api/tasks/${original.id}/split`,
      JSON.stringify({ title: "Parent group" })
    );

    expect(res.statusCode).toBe(200);
    const body = res.body() as {
      parent: { id: string; title: string };
      original: { id: string; parentId: string };
      sibling: { id: string; parentId: string };
    };

    expect(body.parent.title).toBe("Parent group");
    expect(body.original.id).toBe(original.id);
    expect(body.original.parentId).toBe(body.parent.id);
    expect(body.sibling.parentId).toBe(body.parent.id);

    const allRows = await db.select().from(tasksTable).where(eq(tasksTable.userId, user.id));
    expect(allRows).toHaveLength(3);
  });

  it("returns 404 for an unknown task id", async () => {
    const user = await seedUser();
    const handler = createTasksHandler(db, user.id);
    const res = await handle(
      handler,
      "POST",
      `/api/tasks/${randomUUID()}/split`,
      JSON.stringify({ title: "Irrelevant" })
    );
    expect(res.statusCode).toBe(404);
  });

  it("returns 400 when split title is empty", async () => {
    const user = await seedUser();
    const original = await seedTask(user.id, { title: "Original" });
    const handler = createTasksHandler(db, user.id);
    const res = await handle(handler, "POST", `/api/tasks/${original.id}/split`, JSON.stringify({ title: "" }));
    expect(res.statusCode).toBe(400);
    expect((res.body() as { error: string }).error).toBe("Title is required");
  });

  it("returns 400 when split title is whitespace only", async () => {
    const user = await seedUser();
    const original = await seedTask(user.id, { title: "Original" });
    const handler = createTasksHandler(db, user.id);
    const res = await handle(handler, "POST", `/api/tasks/${original.id}/split`, JSON.stringify({ title: "   " }));
    expect(res.statusCode).toBe(400);
    expect((res.body() as { error: string }).error).toBe("Title is required");
  });
});

describe("POST /api/tasks/:id/snooze", () => {
  it("sets lastSuggestedAt and returns the updated task", async () => {
    const user = await seedUser();
    const task = await seedTask(user.id, { title: "Water plants" });

    const handler = createTasksHandler(db, user.id);
    const res = await handle(handler, "POST", `/api/tasks/${task.id}/snooze`);

    expect(res.statusCode).toBe(200);
    const body = res.body() as { id: string; lastSuggestedAt: string; priority: number };
    expect(body.id).toBe(task.id);
    expect(body.lastSuggestedAt).not.toBeNull();
    expect(body.priority).toBe(task.priority);
  });

  it("reverts an in-progress task's status to pending", async () => {
    const user = await seedUser();
    const task = await seedTask(user.id, { title: "Ring the bike shop", status: "in_progress" });

    const handler = createTasksHandler(db, user.id);
    const res = await handle(handler, "POST", `/api/tasks/${task.id}/snooze`);

    expect(res.statusCode).toBe(200);
    const body = res.body() as { status: string };
    expect(body.status).toBe("pending");
  });

  it("leaves a pending task's status untouched", async () => {
    const user = await seedUser();
    const task = await seedTask(user.id, { title: "Water plants", status: "pending" });

    const handler = createTasksHandler(db, user.id);
    const res = await handle(handler, "POST", `/api/tasks/${task.id}/snooze`);

    expect(res.statusCode).toBe(200);
    const body = res.body() as { status: string };
    expect(body.status).toBe("pending");
  });

  it("returns 404 for an unknown task id", async () => {
    const user = await seedUser();
    const handler = createTasksHandler(db, user.id);
    const res = await handle(handler, "POST", `/api/tasks/${randomUUID()}/snooze`);
    expect(res.statusCode).toBe(404);
  });
});

describe("PUT /api/tasks/:id", () => {
  it("updates status and returns no auto-completed ancestors for a plain change", async () => {
    const user = await seedUser();
    const task = await seedTask(user.id, { title: "Solo task" });

    const handler = createTasksHandler(db, user.id);
    const res = await handle(
      handler,
      "PUT",
      `/api/tasks/${task.id}`,
      JSON.stringify({ status: "in_progress" })
    );

    expect(res.statusCode).toBe(200);
    const body = res.body() as { task: { id: string; status: string }; autoCompletedAncestors: unknown[] };
    expect(body.task.id).toBe(task.id);
    expect(body.task.status).toBe("in_progress");
    expect(body.autoCompletedAncestors).toEqual([]);
  });

  it("returns 404 for an unknown task id", async () => {
    const user = await seedUser();
    const handler = createTasksHandler(db, user.id);
    const res = await handle(handler, "PUT", `/api/tasks/${randomUUID()}`, JSON.stringify({ status: "completed" }));
    expect(res.statusCode).toBe(404);
  });

  it("returns 400 for an invalid status", async () => {
    const user = await seedUser();
    const task = await seedTask(user.id, { title: "Task" });
    const handler = createTasksHandler(db, user.id);
    const res = await handle(handler, "PUT", `/api/tasks/${task.id}`, JSON.stringify({ status: "bogus" }));
    expect(res.statusCode).toBe(400);
  });

  it("completing the last incomplete child auto-completes the parent", async () => {
    const user = await seedUser();
    const parent = await seedTask(user.id, { title: "Home Renovation" });
    const doneSibling = await seedTask(user.id, { title: "Paint fence", parentId: parent.id, status: "completed" });
    const lastChild = await seedTask(user.id, { title: "Fix gate", parentId: parent.id });

    const handler = createTasksHandler(db, user.id);
    const res = await handle(
      handler,
      "PUT",
      `/api/tasks/${lastChild.id}`,
      JSON.stringify({ status: "completed" })
    );

    expect(res.statusCode).toBe(200);
    const body = res.body() as { task: { id: string }; autoCompletedAncestors: { id: string; status: string }[] };
    expect(body.autoCompletedAncestors).toHaveLength(1);
    expect(body.autoCompletedAncestors[0]!.id).toBe(parent.id);
    expect(body.autoCompletedAncestors[0]!.status).toBe("completed");

    const [parentRow] = await db.select().from(tasksTable).where(eq(tasksTable.id, parent.id));
    expect(parentRow!.status).toBe("completed");
    const [doneSiblingRow] = await db.select().from(tasksTable).where(eq(tasksTable.id, doneSibling.id));
    expect(doneSiblingRow!.status).toBe("completed");
  });

  it("completing the last remaining subproject under a project cascades two levels", async () => {
    const user = await seedUser();
    const project = await seedTask(user.id, { title: "Home Renovation" });
    await seedTask(user.id, { title: "Kitchen", parentId: project.id, status: "completed" });
    const subproject = await seedTask(user.id, { title: "Garden", parentId: project.id });
    const lastLeaf = await seedTask(user.id, { title: "Plant tulips", parentId: subproject.id });

    const handler = createTasksHandler(db, user.id);
    const res = await handle(
      handler,
      "PUT",
      `/api/tasks/${lastLeaf.id}`,
      JSON.stringify({ status: "completed" })
    );

    expect(res.statusCode).toBe(200);
    const body = res.body() as { autoCompletedAncestors: { id: string }[] };
    expect(body.autoCompletedAncestors.map((a) => a.id).sort()).toEqual([project.id, subproject.id].sort());

    const [subprojectRow] = await db.select().from(tasksTable).where(eq(tasksTable.id, subproject.id));
    expect(subprojectRow!.status).toBe("completed");
    const [projectRow] = await db.select().from(tasksTable).where(eq(tasksTable.id, project.id));
    expect(projectRow!.status).toBe("completed");
  });

  it("does not cascade when the parent has an incomplete sibling task", async () => {
    const user = await seedUser();
    const parent = await seedTask(user.id, { title: "Home Renovation" });
    const completingChild = await seedTask(user.id, { title: "Fix gate", parentId: parent.id });
    await seedTask(user.id, { title: "Paint fence", parentId: parent.id, status: "pending" });

    const handler = createTasksHandler(db, user.id);
    const res = await handle(
      handler,
      "PUT",
      `/api/tasks/${completingChild.id}`,
      JSON.stringify({ status: "completed" })
    );

    expect(res.statusCode).toBe(200);
    const body = res.body() as { autoCompletedAncestors: unknown[] };
    expect(body.autoCompletedAncestors).toEqual([]);

    const [parentRow] = await db.select().from(tasksTable).where(eq(tasksTable.id, parent.id));
    expect(parentRow!.status).not.toBe("completed");
  });

  it("auto-completes a priority-10 (ongoing/recurring) parent uniformly, same as any other", async () => {
    const user = await seedUser();
    const parent = await seedTask(user.id, { title: "Ongoing garden upkeep", priority: 10 });
    const lastChild = await seedTask(user.id, { title: "Water plants", parentId: parent.id });

    const handler = createTasksHandler(db, user.id);
    const res = await handle(
      handler,
      "PUT",
      `/api/tasks/${lastChild.id}`,
      JSON.stringify({ status: "completed" })
    );

    expect(res.statusCode).toBe(200);
    const body = res.body() as { autoCompletedAncestors: { id: string }[] };
    expect(body.autoCompletedAncestors).toHaveLength(1);
    expect(body.autoCompletedAncestors[0]!.id).toBe(parent.id);

    const [parentRow] = await db.select().from(tasksTable).where(eq(tasksTable.id, parent.id));
    expect(parentRow!.status).toBe("completed");
  });
});

describe("DELETE /api/tasks/:id", () => {
  it("deletes a leaf task with no children", async () => {
    const user = await seedUser();
    const task = await seedTask(user.id, { title: "Solo task" });

    const handler = createTasksHandler(db, user.id);
    const res = await handle(handler, "DELETE", `/api/tasks/${task.id}`);

    expect(res.statusCode).toBe(204);
    const rows = await db.select().from(tasksTable).where(eq(tasksTable.id, task.id));
    expect(rows).toHaveLength(0);
  });

  it("returns 404 for an unknown task id", async () => {
    const user = await seedUser();
    const handler = createTasksHandler(db, user.id);
    const res = await handle(handler, "DELETE", `/api/tasks/${randomUUID()}`);
    expect(res.statusCode).toBe(404);
  });

  it("reparents direct children to null when childAction is reparent", async () => {
    const user = await seedUser();
    const parent = await seedTask(user.id, { title: "Parent" });
    const child = await seedTask(user.id, { title: "Child", parentId: parent.id });
    const grandchild = await seedTask(user.id, { title: "Grandchild", parentId: child.id });

    const handler = createTasksHandler(db, user.id);
    const res = await handle(
      handler,
      "DELETE",
      `/api/tasks/${parent.id}`,
      JSON.stringify({ childAction: "reparent" })
    );

    expect(res.statusCode).toBe(204);
    const [parentRow] = await db.select().from(tasksTable).where(eq(tasksTable.id, parent.id));
    expect(parentRow).toBeUndefined();

    const [childRow] = await db.select().from(tasksTable).where(eq(tasksTable.id, child.id));
    expect(childRow!.parentId).toBeNull();

    const [grandchildRow] = await db.select().from(tasksTable).where(eq(tasksTable.id, grandchild.id));
    expect(grandchildRow!.parentId).toBe(child.id);
  });

  it("defaults to reparent when the task has children and no childAction is supplied", async () => {
    const user = await seedUser();
    const parent = await seedTask(user.id, { title: "Parent" });
    const child = await seedTask(user.id, { title: "Child", parentId: parent.id });

    const handler = createTasksHandler(db, user.id);
    const res = await handle(handler, "DELETE", `/api/tasks/${parent.id}`);

    expect(res.statusCode).toBe(204);
    const [childRow] = await db.select().from(tasksTable).where(eq(tasksTable.id, child.id));
    expect(childRow!.parentId).toBeNull();
  });

  it("recursively deletes all descendants when childAction is delete", async () => {
    const user = await seedUser();
    const parent = await seedTask(user.id, { title: "Parent" });
    const child = await seedTask(user.id, { title: "Child", parentId: parent.id });
    const grandchild = await seedTask(user.id, { title: "Grandchild", parentId: child.id });

    const handler = createTasksHandler(db, user.id);
    const res = await handle(
      handler,
      "DELETE",
      `/api/tasks/${parent.id}`,
      JSON.stringify({ childAction: "delete" })
    );

    expect(res.statusCode).toBe(204);
    const remaining = await db.select().from(tasksTable).where(eq(tasksTable.userId, user.id));
    expect(remaining).toHaveLength(0);
    expect(remaining.map((r) => r.id)).not.toContain(child.id);
    expect(remaining.map((r) => r.id)).not.toContain(grandchild.id);
  });

  it("returns 400 for an invalid childAction", async () => {
    const user = await seedUser();
    const task = await seedTask(user.id, { title: "Task" });
    const handler = createTasksHandler(db, user.id);
    const res = await handle(handler, "DELETE", `/api/tasks/${task.id}`, JSON.stringify({ childAction: "bogus" }));
    expect(res.statusCode).toBe(400);
  });
});
