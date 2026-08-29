import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { normalizeTasks } from "../src/normalizer.js";
import { loadTasksFromJson } from "../src/taskLoader.js";

describe("normalizer", () => {
  it("inherits projectId and contexts from parent for leaf child", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "priori-norm-"));
    const file = path.join(dir, "tasks.json");
    const json = JSON.stringify([
      {
        id: "parent",
        title: "Parent",
        projectId: "proj_inherit",
        contexts: ["home"],
        children: [
          {
            id: "child_leaf",
            title: "Child",
            priority: 5,
            priorityUpdatedAt: "2026-04-01T00:00:00Z",
            duration: 10
          },
        ],
      },
    ]);
    await writeFile(file, json, "utf8");
    const loaded = await loadTasksFromJson(file);
    const { tasks } = normalizeTasks(loaded);
    const child = tasks.find((t) => t.id === "child_leaf");
    expect(child?.projectId).toBe("proj_inherit");
    expect(child?.contexts).toEqual(["home"]);
  });

  it("populates ancestors in root-first order for nested leaf", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "priori-norm-"));
    const file = path.join(dir, "tasks.json");
    const json = JSON.stringify([
      {
        id: "grandparent",
        title: "Grandparent",
        contexts: ["admin"],
        children: [
          {
            id: "parent",
            title: "Parent",
            children: [
              {
                id: "leaf",
                title: "Leaf",
                priority: 5,
                priorityUpdatedAt: "2026-04-01T00:00:00Z",
                duration: 10,
              },
            ],
          },
        ],
      },
    ]);
    await writeFile(file, json, "utf8");
    const loaded = await loadTasksFromJson(file);
    const { tasks } = normalizeTasks(loaded);
    const leaf = tasks.find((t) => t.id === "leaf");
    expect(leaf?.ancestors).toEqual([
      { id: "grandparent", title: "Grandparent" },
      { id: "parent", title: "Parent" },
    ]);
  });

  it("omits ancestors for root-level leaf tasks", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "priori-norm-"));
    const file = path.join(dir, "tasks.json");
    const json = JSON.stringify([
      {
        id: "root_leaf",
        title: "Root leaf",
        priority: 5,
        priorityUpdatedAt: "2026-04-01T00:00:00Z",
        duration: 10,
        contexts: ["admin"],
      },
    ]);
    await writeFile(file, json, "utf8");
    const loaded = await loadTasksFromJson(file);
    const { tasks } = normalizeTasks(loaded);
    expect(tasks[0]?.ancestors).toBeUndefined();
  });

  it("maps invalid energyRequired to medium", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "priori-norm-"));
    const file = path.join(dir, "tasks.json");
    const json = JSON.stringify([
      {
        id: "bad_energy",
        title: "T",
        priority: 5,
        priorityUpdatedAt: "2026-04-01T00:00:00Z",
        duration: 10,
        energyRequired: "not-a-level",
        contexts: ["home"],
      },
    ]);
    await writeFile(file, json, "utf8");
    const loaded = await loadTasksFromJson(file);
    const { tasks } = normalizeTasks(loaded);
    expect(tasks[0]?.energyRequired).toBe("medium");
  });
});
