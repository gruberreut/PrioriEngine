import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { normalizeTasks } from "../src/normalizer.js";
import { loadTasksFromJson } from "../src/taskLoader.js";

describe("normalizer validation paths", () => {
  it("excludes completed leaf tasks", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "priori-nv-"));
    const file = path.join(dir, "t.json");
    await writeFile(
      file,
      JSON.stringify([
        {
          id: "done",
          title: "Done",
          priority: 5,
          priorityUpdatedAt: "2026-04-01T00:00:00Z",
          duration: 10,
          contexts: ["home"],
          status: "completed",
        },
      ]),
      "utf8"
    );
    const loaded = await loadTasksFromJson(file);
    const { tasks, exclusions } = normalizeTasks(loaded);
    expect(tasks).toHaveLength(0);
    expect(exclusions.some((e) => e.reason === "completed")).toBe(true);
  });

  it("rejects non-integer priority", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "priori-nv-"));
    const file = path.join(dir, "t.json");
    await writeFile(
      file,
      JSON.stringify([
        {
          id: "bad_pri",
          title: "T",
          priority: 5.5,
          priorityUpdatedAt: "2026-04-01T00:00:00Z",
          duration: 10,
          contexts: ["home"],
        },
      ]),
      "utf8"
    );
    const loaded = await loadTasksFromJson(file);
    const { tasks, exclusions } = normalizeTasks(loaded);
    expect(tasks).toHaveLength(0);
    expect(exclusions[0]?.detail).toContain("priority must be integer");
  });

  it("rejects priority=1 without dueDate", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "priori-nv-"));
    const file = path.join(dir, "t.json");
    await writeFile(
      file,
      JSON.stringify([
        {
          id: "p1",
          title: "T",
          priority: 1,
          priorityUpdatedAt: "2026-04-01T00:00:00Z",
          duration: 10,
          contexts: ["home"],
          dueDate: null,
        },
      ]),
      "utf8"
    );
    const loaded = await loadTasksFromJson(file);
    const { tasks, exclusions } = normalizeTasks(loaded);
    expect(tasks).toHaveLength(0);
    expect(exclusions[0]?.detail).toContain("priority=1 requires dueDate");
  });

  it("rejects priority=10 without recurrence", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "priori-nv-"));
    const file = path.join(dir, "t.json");
    await writeFile(
      file,
      JSON.stringify([
        {
          id: "p10",
          title: "T",
          priority: 10,
          priorityUpdatedAt: "2026-04-01T00:00:00Z",
          duration: 10,
          contexts: ["home"],
          recurrence: null,
        },
      ]),
      "utf8"
    );
    const loaded = await loadTasksFromJson(file);
    const { tasks, exclusions } = normalizeTasks(loaded);
    expect(tasks).toHaveLength(0);
    expect(exclusions[0]?.detail).toContain("priority=10 requires recurrence");
  });

  it("rejects invalid priorityUpdatedAt", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "priori-nv-"));
    const file = path.join(dir, "t.json");
    await writeFile(
      file,
      JSON.stringify([
        {
          id: "bad_ts",
          title: "T",
          priority: 5,
          priorityUpdatedAt: "not-iso",
          duration: 10,
          contexts: ["home"],
        },
      ]),
      "utf8"
    );
    const loaded = await loadTasksFromJson(file);
    const { tasks, exclusions } = normalizeTasks(loaded);
    expect(tasks).toHaveLength(0);
    expect(exclusions[0]?.detail).toContain("priorityUpdatedAt must be valid");
  });

  it("rejects non-positive duration", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "priori-nv-"));
    const file = path.join(dir, "t.json");
    await writeFile(
      file,
      JSON.stringify([
        {
          id: "bad_dur",
          title: "T",
          priority: 5,
          priorityUpdatedAt: "2026-04-01T00:00:00Z",
          duration: 0,
          contexts: ["home"],
        },
      ]),
      "utf8"
    );
    const loaded = await loadTasksFromJson(file);
    const { tasks, exclusions } = normalizeTasks(loaded);
    expect(tasks).toHaveLength(0);
    expect(exclusions[0]?.detail).toContain("duration must be positive");
  });

  it("defaults priorityUpdatedAt when missing on leaf", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "priori-nv-"));
    const file = path.join(dir, "t.json");
    await writeFile(
      file,
      JSON.stringify([
        {
          id: "no_ts",
          title: "T",
          priority: 5,
          duration: 10,
          contexts: ["home"],
        },
      ]),
      "utf8"
    );
    const loaded = await loadTasksFromJson(file);
    const { tasks } = normalizeTasks(loaded);
    expect(tasks).toHaveLength(1);
    expect(tasks[0]?.priorityUpdatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
