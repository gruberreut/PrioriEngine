import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { rankFromPayload } from "../src/api.js";
import { RuntimeParams } from "../src/types.js";

const FIXTURE_DIR = path.resolve("test/fixtures");

async function loadFixture(name: string): Promise<unknown> {
  const raw = await readFile(path.join(FIXTURE_DIR, name), "utf8");
  return JSON.parse(raw) as unknown;
}

function defaultParams(overrides: Partial<RuntimeParams> = {}): RuntimeParams {
  return {
    currentTime: new Date("2026-04-17T12:00:00Z"),
    availableTime: 20,
    energyLevel: "medium",
    explain: false,
    limit: 3,
    ...overrides,
  };
}

describe("rankFromPayload", () => {
  it("returns recommendations from a flat array fixture", async () => {
    const input = await loadFixture("base.json");
    const result = rankFromPayload(input, defaultParams());
    expect(result.mode).toBe("recommendations");
    expect(result.top.length).toBeGreaterThan(0);
    expect(result.top[0]?.task.id).toBe("task_utility_bill");
  });

  it("returns in_progress_block when a task is in progress", async () => {
    const input = await loadFixture("in-progress-block.json");
    const result = rankFromPayload(input, defaultParams());
    expect(result.mode).toBe("in_progress_block");
    expect(result.inProgressTask?.id).toBe("task_active_session");
  });

  it("accepts a { tasks: [...] } wrapped input", async () => {
    const input = await loadFixture("wrapped-tasks.json");
    const result = rankFromPayload(input, defaultParams());
    expect(result.mode).toBe("recommendations");
  });

  it("returns empty top array when all tasks are filtered by context", async () => {
    const input = await loadFixture("base.json");
    const result = rankFromPayload(input, defaultParams({ context: "nonexistent" }));
    expect(result.mode).toBe("recommendations");
    expect(result.top).toHaveLength(0);
  });

  it("respects the limit param", async () => {
    const input = await loadFixture("base.json");
    const result = rankFromPayload(input, defaultParams({ limit: 1 }));
    expect(result.top.length).toBe(1);
  });

  it("returns empty results for an empty input", () => {
    const result = rankFromPayload([], defaultParams());
    expect(result.mode).toBe("recommendations");
    expect(result.top).toHaveLength(0);
  });

  it("returns empty results for an unrecognized input shape", () => {
    const result = rankFromPayload({ unrelated: true }, defaultParams());
    expect(result.mode).toBe("recommendations");
    expect(result.top).toHaveLength(0);
  });
});
