import { beforeEach, describe, expect, it } from "vitest";
import { createRankHandler } from "../../src/routes/rank.js";
import { clearAll, db, seedContext, seedTask, seedUser } from "../helpers/db.js";
import { mockReq, mockRes } from "../helpers/http.js";

beforeEach(async () => {
  await clearAll();
});

async function rank(
  handler: ReturnType<typeof createRankHandler>,
  body: Record<string, unknown>
) {
  const req = mockReq(JSON.stringify(body));
  const res = mockRes();
  await handler(req, res, "/api/rank", "POST");
  return res;
}

describe("POST /api/rank", () => {
  it("ranks tasks and returns recommendations", async () => {
    const user = await seedUser();
    // priority 2 = more urgent (scores higher) than priority 8 in this engine
    await seedTask(user.id, { title: "Urgent task", priority: 2, duration: 20, energyRequired: "medium" });
    await seedTask(user.id, { title: "Low urgency task", priority: 8, duration: 20, energyRequired: "medium" });

    const handler = createRankHandler(db, user.id);
    const res = await rank(handler, { availableTime: 30, energyLevel: "medium", limit: 3 });

    expect(res.statusCode).toBe(200);
    const body = res.body() as { mode: string; top: { task: { title: string } }[] };
    expect(body.mode).toBe("recommendations");
    expect(body.top[0]!.task.title).toBe("Urgent task");
  });

  it("filters tasks by context", async () => {
    const user = await seedUser();
    const ctx = await seedContext(user.id, "Work");
    await seedTask(user.id, { title: "Work task", contextId: ctx.id, priority: 5, duration: 20, energyRequired: "medium" });
    await seedTask(user.id, { title: "No context task", priority: 8, duration: 20, energyRequired: "medium" });

    const handler = createRankHandler(db, user.id);
    const res = await rank(handler, { availableTime: 60, energyLevel: "medium", context: "work", limit: 5 });

    expect(res.statusCode).toBe(200);
    const body = res.body() as { top: { task: { title: string } }[] };
    expect(body.top).toHaveLength(1);
    expect(body.top[0]!.task.title).toBe("Work task");
  });

  it("returns in_progress_block when a task is in progress", async () => {
    const user = await seedUser();
    await seedTask(user.id, { title: "Active task", status: "in_progress", priority: 5, duration: 30, energyRequired: "medium" });
    await seedTask(user.id, { title: "Pending task", priority: 8, duration: 20, energyRequired: "medium" });

    const handler = createRankHandler(db, user.id);
    const res = await rank(handler, { availableTime: 60, energyLevel: "medium", limit: 3 });

    expect(res.statusCode).toBe(200);
    const body = res.body() as { mode: string; inProgressTask: { title: string; hasChildren: boolean } };
    expect(body.mode).toBe("in_progress_block");
    expect(body.inProgressTask.title).toBe("Active task");
    expect(body.inProgressTask.hasChildren).toBe(false);
  });

  it("reconstructs hierarchy from parentId: excludes the in_progress parent and ranks the child with populated ancestors", async () => {
    const user = await seedUser();
    const parent = await seedTask(user.id, {
      title: "Parent project",
      priority: 3,
      duration: 60,
      energyRequired: "medium",
      status: "in_progress",
    });
    await seedTask(user.id, {
      title: "Child task",
      parentId: parent.id,
      priority: 2,
      duration: 20,
      energyRequired: "medium",
    });

    const handler = createRankHandler(db, user.id);
    const res = await rank(handler, { availableTime: 60, energyLevel: "medium", limit: 5 });

    expect(res.statusCode).toBe(200);
    const body = res.body() as {
      mode: string;
      top: {
        task: { title: string; ancestors?: { id: string; title: string }[] };
      }[];
    };
    // The parent has a child, so normalizer.ts's leaf filter must drop it —
    // without the fix, the flat parentId-only rows never form a tree, the
    // parent looks like a leaf, and its in_progress status blocks ranking
    // entirely instead of surfacing the child.
    expect(body.mode).toBe("recommendations");
    expect(body.top).toHaveLength(1);
    const child = body.top[0]!.task;
    expect(child.title).toBe("Child task");
    expect(child.ancestors).toEqual([{ id: parent.id, title: "Parent project" }]);
  });

  it("resolves context name from DB for engine context matching", async () => {
    const user = await seedUser();
    const ctx = await seedContext(user.id, "Physical");
    await seedTask(user.id, { title: "Physical task", contextId: ctx.id, priority: 5, duration: 20, energyRequired: "low" });

    const handler = createRankHandler(db, user.id);
    // Engine normalizes context names to lowercase — "Physical" → "physical"
    const res = await rank(handler, { availableTime: 60, energyLevel: "low", context: "physical", limit: 3 });

    expect(res.statusCode).toBe(200);
    const body = res.body() as { top: { task: { title: string } }[] };
    expect(body.top).toHaveLength(1);
    expect(body.top[0]!.task.title).toBe("Physical task");
  });
});
