import { describe, expect, it, vi } from "vitest";
import { createContextsHandler } from "../../src/routes/contexts.js";
import { mockReq, mockRes } from "../helpers/http.js";

const USER_ID = "user-123";

function makeDb(overrides: Record<string, unknown> = {}) {
  const chainable = {
    from: () => chainable,
    where: () => chainable,
    values: () => chainable,
    onConflictDoNothing: () => chainable,
    returning: vi.fn(),
    ...overrides,
  };
  return {
    select: () => chainable,
    insert: () => chainable,
  };
}

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
  it("returns context rows with 200", async () => {
    const rows = [{ id: "ctx-1", name: "Work", userId: USER_ID, createdAt: new Date() }];
    const db = makeDb({ returning: vi.fn().mockResolvedValue(rows) });

    // GET uses select().from().where() — make the chain resolve to rows
    const chainable = {
      from: () => chainable,
      where: vi.fn().mockResolvedValue(rows),
    };
    const mockDb = { select: () => chainable } as ReturnType<typeof makeDb>;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = createContextsHandler(mockDb as any, USER_ID);
    const res = await handle(handler, "GET", "/api/contexts");

    expect(res.statusCode).toBe(200);
    expect(res.body()).toEqual([
      expect.objectContaining({ id: "ctx-1", name: "Work", userId: USER_ID }),
    ]);
  });
});

describe("POST /api/contexts", () => {
  it("inserts and returns new context with 201", async () => {
    const created = { id: "ctx-2", name: "Home", userId: USER_ID, createdAt: new Date() };
    const chain = {
      from: () => chain,
      where: () => chain,
      values: () => chain,
      onConflictDoNothing: () => chain,
      returning: vi.fn().mockResolvedValue([created]),
    };
    const mockDb = { select: () => chain, insert: () => chain };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = createContextsHandler(mockDb as any, USER_ID);
    const res = await handle(handler, "POST", "/api/contexts", JSON.stringify({ name: "Home" }));

    expect(res.statusCode).toBe(201);
    expect(res.body()).toEqual(
      expect.objectContaining({ id: "ctx-2", name: "Home", userId: USER_ID })
    );
  });

  it("returns 409 when context already exists", async () => {
    const chain = {
      from: () => chain,
      where: () => chain,
      values: () => chain,
      onConflictDoNothing: () => chain,
      returning: vi.fn().mockResolvedValue([]), // onConflictDoNothing returns empty
    };
    const mockDb = { select: () => chain, insert: () => chain };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = createContextsHandler(mockDb as any, USER_ID);
    const res = await handle(handler, "POST", "/api/contexts", JSON.stringify({ name: "Work" }));

    expect(res.statusCode).toBe(409);
    expect((res.body() as { error: string }).error).toBe("Context already exists");
  });
});
