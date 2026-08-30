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
