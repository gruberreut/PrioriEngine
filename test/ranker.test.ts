import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { normalizeTasks } from "../src/normalizer.js";
import { formatRankOutput } from "../src/output.js";
import { rankTasks } from "../src/ranker.js";
import { loadTasksFromJson } from "../src/taskLoader.js";
import { RuntimeParams } from "../src/types.js";

const FIXTURE_DIR = path.resolve("test/fixtures");

function defaultParams(overrides: Partial<RuntimeParams> = {}): RuntimeParams {
  return {
    currentTime: new Date("2026-04-17T12:00:00Z"),
    availableTime: 20,
    energyLevel: "medium",
    explain: true,
    limit: 3,
    ...overrides,
  };
}

describe("Priori Engine ranker", () => {
  it("loads, normalizes, and ranks base fixture deterministically", async () => {
    const loaded = await loadTasksFromJson(path.join(FIXTURE_DIR, "base.json"));
    const normalized = normalizeTasks(loaded);
    const result = rankTasks(normalized.tasks, defaultParams());

    expect(result.top.length).toBe(3);
    expect(result.top[0]?.task.id).toBe("task_utility_bill");
  });

  it("enforces default limit and absolute-value parsing expectations at engine level", async () => {
    const loaded = await loadTasksFromJson(path.join(FIXTURE_DIR, "base.json"));
    const normalized = normalizeTasks(loaded);
    const result = rankTasks(normalized.tasks, defaultParams({ limit: 1 }));
    expect(result.top.length).toBe(1);
  });

  it("skips minimally invalid tasks while keeping valid tasks", async () => {
    const loaded = await loadTasksFromJson(
      path.join(FIXTURE_DIR, "invalid-minimal.json")
    );
    const normalized = normalizeTasks(loaded);
    expect(normalized.tasks.map((t) => t.id)).toEqual(["task_ok"]);
    expect(normalized.exclusions.some((e) => e.taskId === "task_bad_due")).toBe(true);
  });

  it("ignores unknown contexts and allows ranking when context is absent", async () => {
    const loaded = await loadTasksFromJson(
      path.join(FIXTURE_DIR, "unknown-contexts.json")
    );
    const normalized = normalizeTasks(loaded);
    const result = rankTasks(normalized.tasks, defaultParams({ context: undefined }));
    expect(result.top.length).toBe(2);
  });

  it("treats no children and empty children as leaf tasks", async () => {
    const loaded = await loadTasksFromJson(
      path.join(FIXTURE_DIR, "leaf-detection.json")
    );
    const normalized = normalizeTasks(loaded);
    const ids = normalized.tasks.map((t) => t.id).sort();
    expect(ids).toEqual([
      "task_child_leaf",
      "task_empty_children",
      "task_no_children_field",
    ]);
  });

  it("applies recurring and non-recurring suggestion windows correctly", async () => {
    const loaded = await loadTasksFromJson(
      path.join(FIXTURE_DIR, "recurring-window.json")
    );
    const normalized = normalizeTasks(loaded);
    const result = rankTasks(normalized.tasks, defaultParams({ context: "home" }));

    const weekly = result.top.find((t) => t.task.id === "task_weekly_recent");
    const recent = result.top.find((t) => t.task.id === "task_non_recurring_recent");
    const old = result.top.find((t) => t.task.id === "task_non_recurring_old");

    expect(weekly?.breakdown.suggestionPenalty).toBe(-1);
    expect(recent?.breakdown.suggestionPenalty).toBe(-1);
    expect(old?.breakdown.suggestionPenalty).toBe(0);
  });

  it("keeps deterministic lexical ordering at complete ties", async () => {
    const loaded = await loadTasksFromJson(path.join(FIXTURE_DIR, "tie-breaker.json"));
    const normalized = normalizeTasks(loaded);
    const result = rankTasks(normalized.tasks, defaultParams({ context: "home" }));

    expect(result.top.map((t) => t.task.id)).toEqual(["task_a", "task_b", "task_c"]);
  });

  it("prints empty-result helper guidance", async () => {
    const loaded = await loadTasksFromJson(path.join(FIXTURE_DIR, "base.json"));
    const normalized = normalizeTasks(loaded);
    const result = rankTasks(normalized.tasks, defaultParams({ context: "phone" }));
    const output = formatRankOutput(result, false);
    expect(output).toContain("No eligible tasks found.");
    expect(output).toContain("Try adding new tasks or changing context.");
  });

  it("fixture files are valid JSON (best-effort parsing contract)", async () => {
    const fixtures = [
      "base.json",
      "invalid-minimal.json",
      "unknown-contexts.json",
      "leaf-detection.json",
      "recurring-window.json",
      "tie-breaker.json",
    ];

    for (const file of fixtures) {
      const content = await readFile(path.join(FIXTURE_DIR, file), "utf8");
      expect(() => JSON.parse(content)).not.toThrow();
    }
  });
});
