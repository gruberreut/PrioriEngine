import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { isLeafTask, loadTasksFromJson } from "../src/taskLoader.js";
import type { RawTask } from "../src/types.js";

describe("taskLoader", () => {
  it("loadTasksFromJson parses top-level array", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "priori-"));
    const p = path.join(dir, "t.json");
    await writeFile(p, '[{"id":"a","title":"t","priority":5,"priorityUpdatedAt":"2026-04-01T00:00:00Z","duration":10,"contexts":["x"]}]', "utf8");
    const loaded = await loadTasksFromJson(p);
    expect(loaded.length).toBe(1);
    expect(loaded[0]?.task.id).toBe("a");
  });

  it("loadTasksFromJson parses { tasks: [...] } wrapper", async () => {
    const loaded = await loadTasksFromJson(
      path.resolve("test/fixtures/wrapped-tasks.json")
    );
    expect(loaded.some((l) => l.task.id === "task_wrapped_leaf")).toBe(true);
  });

  it("isLeafTask treats missing or empty children as leaf", () => {
    expect(isLeafTask({} as RawTask)).toBe(true);
    expect(isLeafTask({ children: [] } as RawTask)).toBe(true);
    expect(isLeafTask({ children: [{} as RawTask] } as RawTask)).toBe(false);
  });
});
