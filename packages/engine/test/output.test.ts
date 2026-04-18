import { describe, expect, it } from "vitest";
import { formatRankOutput } from "../src/output.js";
import type { NormalizedTask, RankResult, RankedTask, ScoreBreakdown } from "../src/types.js";

function task(partial: Partial<NormalizedTask> & Pick<NormalizedTask, "id" | "title">): NormalizedTask {
  return {
    priority: 5,
    priorityUpdatedAt: "2026-04-01T00:00:00Z",
    dueDate: null,
    recurrence: null,
    duration: 15,
    energyRequired: "medium",
    contexts: ["home"],
    projectId: null,
    parentId: null,
    status: "pending",
    createdAt: null,
    lastSuggestedAt: null,
    depth: 0,
    ...partial,
  };
}

function breakdown(partial: Partial<ScoreBreakdown> & Pick<ScoreBreakdown, "totalScore">): ScoreBreakdown {
  return {
    priorityScore: 1,
    urgencyScore: 0,
    energyScore: 1,
    durationScore: 1,
    flowBonus: 0,
    suggestionPenalty: 0,
    reasons: ["priority weighting"],
    ...partial,
  };
}

describe("formatRankOutput", () => {
  it("formats empty recommendations", () => {
    const r: RankResult = { mode: "recommendations", top: [], exclusions: [] };
    expect(formatRankOutput(r, false)).toContain("No eligible tasks found.");
  });

  it("formats ranked list without explain", () => {
    const ranked: RankedTask = {
      task: task({ id: "1", title: "Do thing" }),
      breakdown: breakdown({ totalScore: 5 }),
    };
    const r: RankResult = { mode: "recommendations", top: [ranked], exclusions: [] };
    expect(formatRankOutput(r, false)).toBe("1. Do thing");
  });

  it("formats explain mode with exclusions", () => {
    const ranked: RankedTask = {
      task: task({ id: "1", title: "A" }),
      breakdown: breakdown({
        totalScore: 3.5,
        priorityScore: 1,
        urgencyScore: 0.5,
        energyScore: 1,
        durationScore: 1,
        flowBonus: 0,
        suggestionPenalty: 0,
        reasons: ["a", "b"],
      }),
    };
    const r: RankResult = {
      mode: "recommendations",
      top: [ranked],
      exclusions: [{ taskId: "x", reason: "context_mismatch", detail: "no match" }],
    };
    const out = formatRankOutput(r, true);
    expect(out).toContain("1. A");
    expect(out).toContain("score:");
    expect(out).toContain("components:");
    expect(out).toContain("Exclusions:");
    expect(out).toContain("context_mismatch");
  });

  it("formats in_progress_block with task and optional explain exclusions", () => {
    const t = task({ id: "ip", title: "Active" });
    const r1: RankResult = {
      mode: "in_progress_block",
      top: [],
      inProgressTask: t,
      exclusions: [
        {
          taskId: "ip",
          reason: "in_progress_blocked",
          detail: "blocked",
        },
      ],
    };
    expect(formatRankOutput(r1, false)).toContain("Task in progress: Active");
    const withExplain = formatRankOutput(r1, true);
    expect(withExplain).toContain("Exclusions:");

    const r2: RankResult = {
      mode: "in_progress_block",
      top: [],
      inProgressTask: t,
      exclusions: [],
    };
    expect(formatRankOutput(r2, true)).not.toContain("Exclusions:");
  });

  it("falls through to empty message when in_progress_block without inProgressTask", () => {
    const r: RankResult = {
      mode: "in_progress_block",
      top: [],
      exclusions: [],
    };
    expect(formatRankOutput(r, false)).toContain("No eligible tasks found.");
  });
});
