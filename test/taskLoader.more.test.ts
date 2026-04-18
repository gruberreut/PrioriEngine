import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadTasksFromJson } from "../src/taskLoader.js";

describe("taskLoader asTaskArray branches", () => {
  it("returns empty list for JSON null", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "priori-tl-"));
    const file = path.join(dir, "null.json");
    await writeFile(file, "null", "utf8");
    const loaded = await loadTasksFromJson(file);
    expect(loaded).toEqual([]);
  });

  it("returns empty list when tasks property is not an array", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "priori-tl-"));
    const file = path.join(dir, "bad-wrap.json");
    await writeFile(file, JSON.stringify({ tasks: null }), "utf8");
    const loaded = await loadTasksFromJson(file);
    expect(loaded).toEqual([]);
  });
});
