import { beforeEach, describe, expect, it } from "vitest";
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

  it("returns 409 when context already exists", async () => {
    const user = await seedUser();
    await seedContext(user.id, "Work", 0);

    const handler = createContextsHandler(db, user.id);
    const res = await handle(handler, "POST", "/api/contexts", JSON.stringify({ name: "Work" }));

    expect(res.statusCode).toBe(409);
    expect((res.body() as { error: string }).error).toBe("Context already exists");
  });
});
