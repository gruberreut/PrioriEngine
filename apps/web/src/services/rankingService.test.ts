import { describe, it, expect, vi, beforeEach } from "vitest";
import { rank } from "./rankingService";
import type { RankParams } from "../features/ranking/ParamsForm/ParamsForm";

const baseParams: RankParams = {
  availableTime: 30,
  energy: "medium",
  explain: false,
  location: undefined,
};

function mockFetch(body: unknown, ok = true) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      json: () => Promise.resolve(body),
    })
  );
}

function capturedBody(): unknown {
  const call = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
  return JSON.parse((call[1] as RequestInit).body as string);
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// Request body construction
// ---------------------------------------------------------------------------

describe("request body construction", () => {
  it("always sends availableTime, energyLevel, and explain", async () => {
    mockFetch({ mode: "recommendations", top: [] });

    await rank({ ...baseParams, availableTime: 20, energy: "high", explain: true }, undefined);

    expect(capturedBody()).toMatchObject({
      availableTime: 20,
      energyLevel: "high",
      explain: true,
    });
  });

  it("renames energy → energyLevel in the request body", async () => {
    mockFetch({ mode: "recommendations", top: [] });

    await rank({ ...baseParams, energy: "low" }, undefined);

    const body = capturedBody() as Record<string, unknown>;
    expect(body.energyLevel).toBe("low");
    expect(body.energy).toBeUndefined();
  });

  it("includes context in the body when provided", async () => {
    mockFetch({ mode: "recommendations", top: [] });

    await rank(baseParams, "learning");

    expect(capturedBody()).toMatchObject({ context: "learning" });
  });

  it("omits context from the body when undefined", async () => {
    mockFetch({ mode: "recommendations", top: [] });

    await rank(baseParams, undefined);

    const body = capturedBody() as Record<string, unknown>;
    expect(body.context).toBeUndefined();
  });

  it("includes location in the body when set", async () => {
    mockFetch({ mode: "recommendations", top: [] });

    await rank({ ...baseParams, location: "home" }, undefined);

    expect(capturedBody()).toMatchObject({ location: "home" });
  });

  it("omits location from the body when undefined", async () => {
    mockFetch({ mode: "recommendations", top: [] });

    await rank({ ...baseParams, location: undefined }, undefined);

    const body = capturedBody() as Record<string, unknown>;
    expect(body.location).toBeUndefined();
  });

  it("POSTs to /api/rank with Content-Type application/json", async () => {
    mockFetch({ mode: "recommendations", top: [] });

    await rank(baseParams, undefined);

    const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/rank");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
  });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

describe("error handling", () => {
  it("throws when the response is not ok", async () => {
    mockFetch({}, false);

    await expect(rank(baseParams, undefined)).rejects.toThrow("Ranking request failed");
  });
});

// ---------------------------------------------------------------------------
// Response mapping — recommendations mode
// ---------------------------------------------------------------------------

describe("recommendations mode", () => {
  it("returns mode recommendations with mapped tasks", async () => {
    const apiTask = {
      id: "t1",
      title: "Write tests",
      duration: 20,
      energyRequired: "low",
      location: "anywhere",
      status: "pending",
      contexts: ["learning"],
      priority: 3,
      priorityUpdatedAt: "2024-01-01T00:00:00Z",
      dueDate: null,
      lastSuggestedAt: null,
    };
    const breakdown = { priority: 0.8, urgency: 0.5, energy: 1, duration: 0.9, flow: 0, recency: 0 };

    mockFetch({ mode: "recommendations", top: [{ task: apiTask, breakdown }] });

    const result = await rank(baseParams, undefined);

    expect(result.mode).toBe("recommendations");
    if (result.mode !== "recommendations") return;

    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].task).toMatchObject({
      id: "t1",
      title: "Write tests",
      duration: 20,
      energyRequired: "low",
      location: "anywhere",
      status: "pending",
      contexts: ["learning"],
      priority: 3,
      dueDate: null,
      lastSuggestedAt: null,
    });
    expect(result.tasks[0].breakdown).toEqual(breakdown);
  });

  it("passes explain and context through to the result", async () => {
    mockFetch({ mode: "recommendations", top: [] });

    const result = await rank({ ...baseParams, explain: true }, "admin");

    if (result.mode !== "recommendations") throw new Error("wrong mode");
    expect(result.explain).toBe(true);
    expect(result.context).toBe("admin");
  });

  it("handles an empty top array", async () => {
    mockFetch({ mode: "recommendations", top: [] });

    const result = await rank(baseParams, undefined);

    if (result.mode !== "recommendations") throw new Error("wrong mode");
    expect(result.tasks).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Response mapping — in_progress_block mode
// ---------------------------------------------------------------------------

describe("in_progress_block mode", () => {
  it("returns mode in_progress_block with the mapped task", async () => {
    const apiTask = {
      id: "ip1",
      title: "In-flight work",
      duration: 60,
      energyRequired: "high",
      location: "home",
      status: "in_progress",
      contexts: [],
      priority: 1,
      priorityUpdatedAt: "2024-06-01T00:00:00Z",
      dueDate: "2024-06-10",
      lastSuggestedAt: null,
    };

    mockFetch({ mode: "in_progress_block", top: [], inProgressTask: apiTask });

    const result = await rank(baseParams, undefined);

    expect(result.mode).toBe("in_progress_block");
    if (result.mode !== "in_progress_block") return;
    expect(result.task).toMatchObject({ id: "ip1", title: "In-flight work", status: "in_progress" });
  });
});

// ---------------------------------------------------------------------------
// toTask — field mapping edge cases (exercised through rank())
// ---------------------------------------------------------------------------

describe("toTask field mapping", () => {
  it("attaches ancestors when present in the API response", async () => {
    const ancestors = [{ id: "parent-1", title: "Parent project" }];
    const apiTask = {
      id: "t2",
      title: "Subtask",
      duration: 15,
      energyRequired: "medium",
      location: "anywhere",
      status: "pending",
      contexts: [],
      priority: 5,
      priorityUpdatedAt: "2024-01-01T00:00:00Z",
      dueDate: null,
      lastSuggestedAt: null,
      ancestors,
    };

    mockFetch({ mode: "recommendations", top: [{ task: apiTask, breakdown: {} }] });

    const result = await rank(baseParams, undefined);

    if (result.mode !== "recommendations") throw new Error("wrong mode");
    expect(result.tasks[0].task.ancestors).toEqual(ancestors);
  });

  it("omits ancestors when not present in the API response", async () => {
    const apiTask = {
      id: "t3",
      title: "Top-level task",
      duration: 30,
      energyRequired: "medium",
      location: "anywhere",
      status: "pending",
      contexts: [],
      priority: 5,
      priorityUpdatedAt: "2024-01-01T00:00:00Z",
      dueDate: null,
      lastSuggestedAt: null,
    };

    mockFetch({ mode: "recommendations", top: [{ task: apiTask, breakdown: {} }] });

    const result = await rank(baseParams, undefined);

    if (result.mode !== "recommendations") throw new Error("wrong mode");
    expect(result.tasks[0].task.ancestors).toBeUndefined();
  });

  it("defaults contexts to empty array when absent from API response", async () => {
    const apiTask = {
      id: "t4",
      title: "No context task",
      duration: 30,
      energyRequired: "medium",
      location: "anywhere",
      status: "pending",
      priority: 5,
      priorityUpdatedAt: "2024-01-01T00:00:00Z",
      dueDate: null,
      lastSuggestedAt: null,
      // contexts intentionally omitted
    };

    mockFetch({ mode: "recommendations", top: [{ task: apiTask, breakdown: {} }] });

    const result = await rank(baseParams, undefined);

    if (result.mode !== "recommendations") throw new Error("wrong mode");
    expect(result.tasks[0].task.contexts).toEqual([]);
  });
});
