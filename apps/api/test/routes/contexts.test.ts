import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { contexts } from "../../src/db/schema.js";
import { createContextsHandler } from "../../src/routes/contexts.js";
import { clearAll, db, seedContext, seedUser } from "../helpers/db.js";
import { mockReq, mockRes } from "../helpers/http.js";

beforeEach(async () => {
  await clearAll();
});

async function handle(
  handler: ReturnType<typeof createContextsHandler>,
  method: string,
  pathname: string,
  body = ""
) {
  const req = mockReq(body);
  const res = mockRes();
  await handler(req, res, pathname, method);
  return res;
}

function post(handler: ReturnType<typeof createContextsHandler>, body: unknown) {
  return handle(handler, "POST", "/api/contexts", JSON.stringify(body));
}

function userContexts(userId: string) {
  return db.select().from(contexts).where(eq(contexts.userId, userId));
}

describe("GET /api/contexts", () => {
  it("returns context rows ordered by slideIndex", async () => {
    const user = await seedUser();
    await seedContext(user.id, "Sage", 2);
    await seedContext(user.id, "Sand", 0);
    await seedContext(user.id, "Olive", 1);

    const handler = createContextsHandler(db, user.id);
    const res = await handle(handler, "GET", "/api/contexts");

    expect(res.statusCode).toBe(200);
    const body = res.body() as { name: string; slideIndex: number }[];
    expect(body.map((c) => c.name)).toEqual(["Sand", "Olive", "Sage"]);
  });

  it("does not return contexts belonging to another user", async () => {
    const user = await seedUser();
    const other = await seedUser();
    await seedContext(other.id, "Other user context", 0);

    const handler = createContextsHandler(db, user.id);
    const res = await handle(handler, "GET", "/api/contexts");

    expect(res.statusCode).toBe(200);
    expect(res.body()).toHaveLength(0);
  });
});

describe("POST /api/contexts", () => {
  it("assigns slideIndex 0 to a user's first context", async () => {
    const user = await seedUser();
    const handler = createContextsHandler(db, user.id);
    const res = await handle(handler, "POST", "/api/contexts", JSON.stringify({ name: "Home" }));

    expect(res.statusCode).toBe(201);
    const body = res.body() as { name: string; slideIndex: number };
    expect(body.name).toBe("Home");
    expect(body.slideIndex).toBe(0);
  });

  it("assigns each subsequent context the next slideIndex", async () => {
    const user = await seedUser();
    await seedContext(user.id, "Existing", 0);

    const handler = createContextsHandler(db, user.id);
    const res = await handle(handler, "POST", "/api/contexts", JSON.stringify({ name: "Home" }));

    expect(res.statusCode).toBe(201);
    expect((res.body() as { slideIndex: number }).slideIndex).toBe(1);
  });

  it("wraps slideIndex back to 0 after 8 contexts, without reusing a freed index", async () => {
    const user = await seedUser();
    for (let i = 0; i < 8; i++) {
      await seedContext(user.id, `Context ${i}`, i);
    }

    const handler = createContextsHandler(db, user.id);
    const res = await handle(handler, "POST", "/api/contexts", JSON.stringify({ name: "Ninth" }));

    expect(res.statusCode).toBe(201);
    expect((res.body() as { slideIndex: number }).slideIndex).toBe(0);
  });

  it("does not reuse a freed slideIndex left by an earlier (now-missing) context", async () => {
    const user = await seedUser();
    // Simulates a gap: contexts 0 and 2 exist, 1 does not (e.g. removed).
    await seedContext(user.id, "First", 0);
    await seedContext(user.id, "Third", 2);

    const handler = createContextsHandler(db, user.id);
    const res = await handle(handler, "POST", "/api/contexts", JSON.stringify({ name: "Fourth" }));

    expect(res.statusCode).toBe(201);
    expect((res.body() as { slideIndex: number }).slideIndex).toBe(3);
  });

  it("gives each user an independent slideIndex counter", async () => {
    const userA = await seedUser();
    const userB = await seedUser();
    await seedContext(userA.id, "A's context", 0);

    const handler = createContextsHandler(db, userB.id);
    const res = await handle(handler, "POST", "/api/contexts", JSON.stringify({ name: "B's context" }));

    expect(res.statusCode).toBe(201);
    expect((res.body() as { slideIndex: number }).slideIndex).toBe(0);
  });

  it("returns 409 name_taken with the existing row when the name is taken", async () => {
    const user = await seedUser();
    const existing = await seedContext(user.id, "Work", 0);

    const handler = createContextsHandler(db, user.id);
    const res = await post(handler, { id: randomUUID(), name: "Work" });

    expect(res.statusCode).toBe(409);
    const body = res.body() as { code: string; context: { id: string; name: string } };
    expect(body.code).toBe("name_taken");
    expect(body.context.id).toBe(existing.id);
    expect(body.context.name).toBe("Work");
  });

  it("returns 409 name_taken when no id is sent", async () => {
    const user = await seedUser();
    await seedContext(user.id, "Work", 0);

    const handler = createContextsHandler(db, user.id);
    const res = await post(handler, { name: "Work" });

    expect(res.statusCode).toBe(409);
    expect((res.body() as { code: string }).code).toBe("name_taken");
  });

  it("detects a taken name after trimming", async () => {
    const user = await seedUser();
    await seedContext(user.id, "Work", 0);

    const handler = createContextsHandler(db, user.id);
    const res = await post(handler, { name: "  Work " });

    expect(res.statusCode).toBe(409);
    expect((res.body() as { code: string }).code).toBe("name_taken");
  });
});

describe("POST /api/contexts — client-supplied id", () => {
  it("creates the context with the given id", async () => {
    const user = await seedUser();
    const id = randomUUID();

    const handler = createContextsHandler(db, user.id);
    const res = await post(handler, { id, name: "Home" });

    expect(res.statusCode).toBe(201);
    expect((res.body() as { id: string }).id).toBe(id);
    expect(await userContexts(user.id)).toHaveLength(1);
  });

  it("generates an id when none is sent", async () => {
    const user = await seedUser();

    const handler = createContextsHandler(db, user.id);
    const res = await post(handler, { name: "Home" });

    expect(res.statusCode).toBe(201);
    expect((res.body() as { id: string }).id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("returns 200 with the same row for a retry, without creating a second row", async () => {
    const user = await seedUser();
    const id = randomUUID();
    const handler = createContextsHandler(db, user.id);

    const first = await post(handler, { id, name: "Home" });
    const retry = await post(handler, { id, name: "Home" });

    expect(first.statusCode).toBe(201);
    expect(retry.statusCode).toBe(200);
    expect(retry.body()).toEqual(first.body());
    expect(await userContexts(user.id)).toHaveLength(1);
  });

  it("returns 409 id_conflict for the same id with a different name", async () => {
    const user = await seedUser();
    const id = randomUUID();
    const handler = createContextsHandler(db, user.id);
    await post(handler, { id, name: "Home" });

    const res = await post(handler, { id, name: "Garden" });

    expect(res.statusCode).toBe(409);
    expect(res.body()).toEqual({ error: "Conflict", code: "id_conflict" });
    expect(await userContexts(user.id)).toHaveLength(1);
  });

  it("returns 409 id_conflict for another user's id, revealing nothing about that row", async () => {
    const user = await seedUser();
    const other = await seedUser();
    const otherContext = await seedContext(other.id, "Private", 0);

    const handler = createContextsHandler(db, user.id);
    const res = await post(handler, { id: otherContext.id, name: "Private" });

    expect(res.statusCode).toBe(409);
    expect(res.body()).toEqual({ error: "Conflict", code: "id_conflict" });
    expect(await userContexts(user.id)).toHaveLength(0);
  });
});

describe("POST /api/contexts — validation", () => {
  it("stores the name trimmed", async () => {
    const user = await seedUser();

    const handler = createContextsHandler(db, user.id);
    const res = await post(handler, { name: "  Home  " });

    expect(res.statusCode).toBe(201);
    expect((res.body() as { name: string }).name).toBe("Home");
    expect((await userContexts(user.id))[0]!.name).toBe("Home");
  });

  it.each([
    ["missing", {}],
    ["empty", { name: "" }],
    ["whitespace-only", { name: "   " }],
    ["not a string", { name: 42 }],
  ])("returns 400 for a %s name", async (_label, body) => {
    const user = await seedUser();

    const handler = createContextsHandler(db, user.id);
    const res = await post(handler, body);

    expect(res.statusCode).toBe(400);
    expect(res.body()).toEqual({ error: "Bad request" });
    expect(await userContexts(user.id)).toHaveLength(0);
  });

  it.each([
    ["a non-UUID string", "not-a-uuid"],
    ["a number", 7],
  ])("returns 400 for an id that is %s", async (_label, id) => {
    const user = await seedUser();

    const handler = createContextsHandler(db, user.id);
    const res = await post(handler, { id, name: "Home" });

    expect(res.statusCode).toBe(400);
  });

  it.each([
    ["invalid JSON", "{not json"],
    ["a JSON array", "[]"],
    ["JSON null", "null"],
  ])("returns 400 for %s", async (_label, raw) => {
    const user = await seedUser();

    const handler = createContextsHandler(db, user.id);
    const res = await handle(handler, "POST", "/api/contexts", raw);

    expect(res.statusCode).toBe(400);
  });
});
