import { describe, expect, it } from "vitest";
import { rankTasks, DEFAULT_WEIGHTS } from "../src/ranker.js";
import type { ExclusionRecord, NormalizedTask, RuntimeParams } from "../src/types.js";

function baseTask(partial: Partial<NormalizedTask> & Pick<NormalizedTask, "id">): NormalizedTask {
  return {
    title: "t",
    priority: 5,
    priorityUpdatedAt: "2026-04-17T10:00:00Z",
    dueDate: null,
    recurrence: null,
    duration: 15,
    energyRequired: "medium",
    location: "anywhere",
    contexts: ["home"],
    projectId: "p1",
    parentId: null,
    status: "pending",
    createdAt: null,
    lastSuggestedAt: null,
    depth: 0,
    ...partial,
  };
}

const params: RuntimeParams = {
  currentTime: new Date("2026-04-17T12:00:00Z"),
  availableTime: 60,
  energyLevel: "low",
  explain: false,
  limit: 10,
};

describe("rankTasks edge cases", () => {
  it("applies flow bonus when lastCompletedProject matches", () => {
    const tasks = [
      baseTask({ id: "a", projectId: "flow_proj", contexts: ["home"] }),
    ];
    const result = rankTasks(tasks, {
      ...params,
      lastCompletedProject: "flow_proj",
    });
    expect(result.top[0]?.breakdown.flowBonus).toBeGreaterThan(0);
    expect(result.top[0]?.breakdown.reasons.some((r) => r.includes("flow"))).toBe(true);
  });

  it("uses custom weights", () => {
    const tasks = [baseTask({ id: "a", priority: 5 })];
    const w = { ...DEFAULT_WEIGHTS, wPriority: 2 };
    const r1 = rankTasks(tasks, params, [], w);
    const r2 = rankTasks(tasks, params, [], DEFAULT_WEIGHTS);
    expect(r1.top[0]?.breakdown.priorityScore).not.toBe(r2.top[0]?.breakdown.priorityScore);
  });

  it("penalizes large energy mismatch (delta 2)", () => {
    const tasks = [baseTask({ id: "a", energyRequired: "high" })];
    const r = rankTasks(tasks, { ...params, energyLevel: "low" });
    expect(r.top[0]?.breakdown.energyScore).toBe(0);
  });

  it("ranks by priority when scores tie", () => {
    const tasks = [
      baseTask({
        id: "z",
        priority: 3,
        priorityUpdatedAt: "2026-04-17T10:00:00Z",
        duration: 10,
        contexts: ["home"],
      }),
      baseTask({
        id: "y",
        priority: 4,
        priorityUpdatedAt: "2026-04-17T10:00:00Z",
        duration: 10,
        contexts: ["home"],
      }),
    ];
    const result = rankTasks(tasks, { ...params, limit: 2 });
    expect(result.top[0]?.task.priority).toBeLessThan(result.top[1]?.task.priority ?? 99);
  });

  it("uses month recurrence window for suggestion penalty", () => {
    const tasks = [
      baseTask({
        id: "m",
        recurrence: "monthly",
        lastSuggestedAt: "2026-04-17T11:00:00Z",
        contexts: ["home"],
      }),
    ];
    const result = rankTasks(tasks, params);
    expect(result.top[0]?.breakdown.suggestionPenalty).toBeLessThan(0);
  });

  it("handles invalid priorityUpdatedAt in urgency (daysBetween fallback)", () => {
    const tasks = [
      baseTask({
        id: "bad_date",
        priorityUpdatedAt: "not-iso",
        contexts: ["home"],
      }) as NormalizedTask,
    ];
    const result = rankTasks(tasks, params);
    expect(result.top[0]?.breakdown.urgencyScore).toBe(0);
  });

  it("merges prior exclusions from normalizer", () => {
    const tasks: NormalizedTask[] = [];
    const exclusions: ExclusionRecord[] = [
      { taskId: "gone", reason: "completed", detail: "x" },
    ];
    const result = rankTasks(tasks, params, exclusions);
    expect(result.exclusions.some((e) => e.taskId === "gone")).toBe(true);
  });

  it("tie-breaks by priority when total scores match (zero priority weight)", () => {
    const tasks = [
      baseTask({
        id: "later_pri",
        priority: 6,
        priorityUpdatedAt: "2026-04-17T10:00:00Z",
        duration: 10,
        contexts: ["home"],
      }),
      baseTask({
        id: "earlier_pri",
        priority: 5,
        priorityUpdatedAt: "2026-04-17T10:00:00Z",
        duration: 10,
        contexts: ["home"],
      }),
    ];
    const w = { ...DEFAULT_WEIGHTS, wPriority: 0 };
    const result = rankTasks(tasks, params, [], w);
    expect(result.top[0]?.task.id).toBe("earlier_pri");
  });

  it("tie-breaks by priorityUpdatedAt when scores match (zero priority and urgency weight)", () => {
    const tasks = [
      baseTask({
        id: "newer",
        priority: 5,
        priorityUpdatedAt: "2026-04-17T12:00:00Z",
        duration: 10,
        contexts: ["home"],
      }),
      baseTask({
        id: "older",
        priority: 5,
        priorityUpdatedAt: "2026-04-17T10:00:00Z",
        duration: 10,
        contexts: ["home"],
      }),
    ];
    const w = { ...DEFAULT_WEIGHTS, wPriority: 0, wUrgency: 0 };
    const result = rankTasks(tasks, params, [], w);
    expect(result.top[0]?.task.id).toBe("older");
  });

  it("tie-breaks by duration when scores match (zero priority, urgency, duration weight)", () => {
    const tasks = [
      baseTask({
        id: "longer",
        priority: 5,
        priorityUpdatedAt: "2026-04-17T10:00:00Z",
        duration: 20,
        contexts: ["home"],
      }),
      baseTask({
        id: "shorter",
        priority: 5,
        priorityUpdatedAt: "2026-04-17T10:00:00Z",
        duration: 10,
        contexts: ["home"],
      }),
    ];
    const w = { ...DEFAULT_WEIGHTS, wPriority: 0, wUrgency: 0, wDuration: 0 };
    const result = rankTasks(tasks, params, [], w);
    expect(result.top[0]?.task.id).toBe("shorter");
  });

  it("tie-breaks by id when all other comparisons match", () => {
    const tasks = [
      baseTask({
        id: "z_id",
        title: "Z",
        priority: 5,
        priorityUpdatedAt: "2026-04-17T10:00:00Z",
        duration: 10,
        contexts: ["home"],
      }),
      baseTask({
        id: "a_id",
        title: "A",
        priority: 5,
        priorityUpdatedAt: "2026-04-17T10:00:00Z",
        duration: 10,
        contexts: ["home"],
      }),
    ];
    const w = {
      ...DEFAULT_WEIGHTS,
      wPriority: 0,
      wUrgency: 0,
      wDuration: 0,
      wEnergy: 0,
      wFlow: 0,
      wSuggestion: 0,
    };
    const result = rankTasks(tasks, params, [], w);
    expect(result.top.map((t) => t.task.id)).toEqual(["a_id", "z_id"]);
  });

  it("uses weekly recurrence window for suggestion penalty (word week, not day)", () => {
    const tasks = [
      baseTask({
        id: "w",
        recurrence: "every_week",
        lastSuggestedAt: "2026-04-17T11:00:00Z",
        contexts: ["home"],
      }),
    ];
    const result = rankTasks(tasks, params);
    expect(result.top[0]?.breakdown.suggestionPenalty).toBeLessThan(0);
  });

  it("uses daily recurrence window when recurrence includes day", () => {
    const tasks = [
      baseTask({
        id: "d",
        recurrence: "daily",
        lastSuggestedAt: "2026-04-17T11:00:00Z",
        contexts: ["home"],
      }),
    ];
    const result = rankTasks(tasks, params);
    expect(result.top[0]?.breakdown.suggestionPenalty).toBeLessThan(0);
  });

  it("ignores invalid lastSuggestedAt for suggestion penalty", () => {
    const tasks = [
      baseTask({
        id: "bad_sug",
        lastSuggestedAt: "not-a-date",
        contexts: ["home"],
      }),
    ];
    const result = rankTasks(tasks, params);
    expect(result.top[0]?.breakdown.suggestionPenalty).toBe(0);
  });

  it("uses default recurrence window when recurrence text has no day/week/month", () => {
    const tasks = [
      baseTask({
        id: "custom_rec",
        recurrence: "yearly",
        lastSuggestedAt: "2026-04-17T11:00:00Z",
        contexts: ["home"],
      }),
    ];
    const result = rankTasks(tasks, params);
    expect(result.top[0]?.breakdown.suggestionPenalty).toBeLessThan(0);
  });
});
