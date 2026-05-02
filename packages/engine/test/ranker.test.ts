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

  it("returns in-progress blocking mode when an active task exists", async () => {
    const loaded = await loadTasksFromJson(
      path.join(FIXTURE_DIR, "in-progress-block.json")
    );
    const normalized = normalizeTasks(loaded);
    const result = rankTasks(normalized.tasks, defaultParams({ context: "computer" }));

    expect(result.mode).toBe("in_progress_block");
    expect(result.top).toEqual([]);
    expect(result.inProgressTask?.id).toBe("task_active_session");
    expect(
      result.exclusions.some((e) => e.reason === "in_progress_blocked")
    ).toBe(true);
  });

  it("prints in-progress guidance instead of recommendations", async () => {
    const loaded = await loadTasksFromJson(
      path.join(FIXTURE_DIR, "in-progress-block.json")
    );
    const normalized = normalizeTasks(loaded);
    const result = rankTasks(normalized.tasks, defaultParams());
    const output = formatRankOutput(result, false);

    expect(output).toContain("Task in progress:");
    expect(output).toContain("Choose next action: done | snooze | edit | dismiss");
    expect(output).toContain("Ranking paused until in-progress task is resolved.");
  });

  it("filters tasks by location: home shows home and anywhere tasks", async () => {
    const loaded = await loadTasksFromJson(
      path.join(FIXTURE_DIR, "location-filter.json")
    );
    const normalized = normalizeTasks(loaded);
    const result = rankTasks(normalized.tasks, defaultParams({ location: "home" }));

    const ids = result.top.map((t) => t.task.id);
    expect(ids).toContain("task_home_only");
    expect(ids).toContain("task_anywhere");
    expect(ids).not.toContain("task_in_person");
    expect(result.exclusions.some((e) => e.reason === "location_mismatch")).toBe(true);
  });

  it("filters tasks by location: anywhere shows only anywhere tasks", async () => {
    const loaded = await loadTasksFromJson(
      path.join(FIXTURE_DIR, "location-filter.json")
    );
    const normalized = normalizeTasks(loaded);
    const result = rankTasks(normalized.tasks, defaultParams({ location: "anywhere" }));

    const ids = result.top.map((t) => t.task.id);
    expect(ids).toEqual(["task_anywhere"]);
    expect(result.exclusions.filter((e) => e.reason === "location_mismatch")).toHaveLength(2);
  });

  it("filters tasks by location: in-person shows in-person and anywhere tasks", async () => {
    const loaded = await loadTasksFromJson(
      path.join(FIXTURE_DIR, "location-filter.json")
    );
    const normalized = normalizeTasks(loaded);
    const result = rankTasks(normalized.tasks, defaultParams({ location: "in-person" }));

    const ids = result.top.map((t) => t.task.id);
    expect(ids).toContain("task_in_person");
    expect(ids).toContain("task_anywhere");
    expect(ids).not.toContain("task_home_only");
  });

  it("skips location filter when location param is not set", async () => {
    const loaded = await loadTasksFromJson(
      path.join(FIXTURE_DIR, "location-filter.json")
    );
    const normalized = normalizeTasks(loaded);
    const result = rankTasks(normalized.tasks, defaultParams());

    expect(result.top).toHaveLength(3);
    expect(result.exclusions.some((e) => e.reason === "location_mismatch")).toBe(false);
  });

  it("fixture files are valid JSON (best-effort parsing contract)", async () => {
    const fixtures = [
      "base.json",
      "invalid-minimal.json",
      "unknown-contexts.json",
      "leaf-detection.json",
      "recurring-window.json",
      "tie-breaker.json",
      "in-progress-block.json",
      "location-filter.json",
    ];

    for (const file of fixtures) {
      const content = await readFile(path.join(FIXTURE_DIR, file), "utf8");
      expect(() => JSON.parse(content)).not.toThrow();
    }
  });
});
