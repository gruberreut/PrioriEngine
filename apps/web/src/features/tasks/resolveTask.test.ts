import { describe, it, expect } from "vitest";
import { resolveTask } from "./resolveTask";
import type { Task } from "../../types/task";

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: "default-id",
    title: "Default title",
    duration: 30,
    energyRequired: "medium",
    location: "anywhere",
    status: "pending",
    contexts: [],
    priority: 5,
    priorityUpdatedAt: "2024-01-01T00:00:00Z",
    dueDate: null,
    lastSuggestedAt: null,
    ...overrides,
  };
}

describe("resolveTask", () => {
  describe("when the task has all fields set", () => {
    it("returns the task's own values", () => {
      const task = makeTask({
        id: "t1",
        title: "My task",
        duration: 20,
        energyRequired: "low",
        location: "home",
        status: "in_progress",
        contexts: ["learning"],
      });

      const result = resolveTask(task, []);

      expect(result).toEqual({
        id: "t1",
        title: "My task",
        duration: 20,
        energyRequired: "low",
        location: "home",
        status: "in_progress",
        contexts: ["learning"],
      });
    });
  });

  describe("field inheritance from ancestors", () => {
    it("inherits duration from immediate parent when task omits it", () => {
      const parent = makeTask({ id: "p1", duration: 60 });
      const task = makeTask({ id: "t1", duration: undefined as unknown as number });

      const result = resolveTask(task, [parent]);

      expect(result.duration).toBe(60);
    });

    it("inherits energyRequired from grandparent when parent also omits it", () => {
      const grandparent = makeTask({ id: "gp", energyRequired: "high" });
      const parent = makeTask({ id: "p", energyRequired: undefined as unknown as "low" });
      const task = makeTask({ id: "t", energyRequired: undefined as unknown as "low" });

      const result = resolveTask(task, [grandparent, parent]);

      expect(result.energyRequired).toBe("high");
    });

    it("prefers the immediate parent over a more distant ancestor", () => {
      const grandparent = makeTask({ id: "gp", location: "home" });
      const parent = makeTask({ id: "p", location: "in-person" });
      const task = makeTask({ id: "t", location: undefined as unknown as "anywhere" });

      const result = resolveTask(task, [grandparent, parent]);

      expect(result.location).toBe("in-person");
    });

    it("inherits contexts from ancestor", () => {
      const parent = makeTask({ id: "p", contexts: ["admin", "creativity"] });
      const task = makeTask({ id: "t", contexts: undefined as unknown as string[] });

      const result = resolveTask(task, [parent]);

      expect(result.contexts).toEqual(["admin", "creativity"]);
    });

    it("prefers the task's own contexts over ancestor contexts", () => {
      const parent = makeTask({ id: "p", contexts: ["admin"] });
      const task = makeTask({ id: "t", contexts: ["learning"] });

      const result = resolveTask(task, [parent]);

      expect(result.contexts).toEqual(["learning"]);
    });
  });

  describe("defaults when no value exists in the chain", () => {
    it("defaults duration to 30", () => {
      const task = makeTask({ id: "t", duration: undefined as unknown as number });
      expect(resolveTask(task, []).duration).toBe(30);
    });

    it("defaults energyRequired to medium", () => {
      const task = makeTask({ id: "t", energyRequired: undefined as unknown as "low" });
      expect(resolveTask(task, []).energyRequired).toBe("medium");
    });

    it("defaults location to anywhere", () => {
      const task = makeTask({ id: "t", location: undefined as unknown as "home" });
      expect(resolveTask(task, []).location).toBe("anywhere");
    });

    it("defaults status to pending", () => {
      const task = makeTask({ id: "t", status: undefined as unknown as "pending" });
      expect(resolveTask(task, []).status).toBe("pending");
    });

    it("defaults title to empty string", () => {
      const task = makeTask({ id: "t", title: undefined as unknown as string });
      expect(resolveTask(task, []).title).toBe("");
    });

    it("defaults contexts to empty array", () => {
      const task = makeTask({ id: "t", contexts: undefined as unknown as string[] });
      expect(resolveTask(task, []).contexts).toEqual([]);
    });
  });

  it("always uses the task's own id regardless of ancestors", () => {
    const parent = makeTask({ id: "parent-id" });
    const task = makeTask({ id: "task-id" });

    const result = resolveTask(task, [parent]);

    expect(result.id).toBe("task-id");
  });

  it("works with an empty ancestor list", () => {
    const task = makeTask({ id: "t1", title: "Solo task", duration: 10 });
    const result = resolveTask(task, []);
    expect(result.title).toBe("Solo task");
    expect(result.duration).toBe(10);
  });
});
