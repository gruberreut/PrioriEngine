import {
  ExclusionRecord,
  NormalizedTask,
  RankResult,
  RankedTask,
  RuntimeParams,
  ScoreBreakdown,
  ScoreWeights,
} from "./types.js";

export const DEFAULT_WEIGHTS: ScoreWeights = {
  wPriority: 1.0,
  wUrgency: 0.25,
  wEnergy: 1.0,
  wDuration: 1.0,
  wFlow: 1.0,
  wSuggestion: 1.0,
};

const energyIndex: Record<string, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

function daysBetween(now: Date, iso: string): number {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return 0;
  return Math.max(0, (now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
}

function recurrenceWindowHours(recurrence: string | null): number {
  if (!recurrence) return 24;
  const r = recurrence.toLowerCase();
  if (r.includes("day")) return 24;
  if (r.includes("week")) return 24 * 7;
  if (r.includes("month")) return 24 * 30;
  return 24;
}

function isRecentlySuggested(task: NormalizedTask, now: Date): boolean {
  if (!task.lastSuggestedAt) return false;
  const suggestedAt = new Date(task.lastSuggestedAt);
  if (Number.isNaN(suggestedAt.getTime())) return false;
  const diffHours = (now.getTime() - suggestedAt.getTime()) / (1000 * 60 * 60);
  return diffHours <= recurrenceWindowHours(task.recurrence);
}

function computeBreakdown(
  task: NormalizedTask,
  params: RuntimeParams,
  weights: ScoreWeights
): ScoreBreakdown {
  const reasons: string[] = [];
  const priorityScore = (11 - task.priority) * weights.wPriority;
  reasons.push("priority weighting");

  const urgencyScore =
    daysBetween(params.currentTime, task.priorityUpdatedAt) * weights.wUrgency;
  reasons.push("urgency aging");

  const userEnergy = energyIndex[params.energyLevel];
  const taskEnergy = energyIndex[task.energyRequired];
  const delta = Math.abs(userEnergy - taskEnergy);
  const energyBase = delta === 0 ? 2 : delta === 1 ? 1 : 0;
  const energyScore = energyBase * weights.wEnergy;
  reasons.push("energy fit");

  const durationBase = task.duration <= params.availableTime ? 2 : -2;
  const durationScore = durationBase * weights.wDuration;
  reasons.push("duration fit");

  const flowBonus =
    params.lastCompletedProject && task.projectId === params.lastCompletedProject
      ? 1.5 * weights.wFlow
      : 0;
  if (flowBonus > 0) reasons.push("project flow bonus");

  const suggestionPenalty = isRecentlySuggested(task, params.currentTime)
    ? -1 * weights.wSuggestion
    : 0;
  if (suggestionPenalty < 0) reasons.push("recent suggestion penalty");

  const totalScore =
    priorityScore +
    urgencyScore +
    energyScore +
    durationScore +
    flowBonus +
    suggestionPenalty;

  return {
    priorityScore,
    urgencyScore,
    energyScore,
    durationScore,
    flowBonus,
    suggestionPenalty,
    totalScore,
    reasons,
  };
}

function compareRankedTasks(a: RankedTask, b: RankedTask): number {
  if (b.breakdown.totalScore !== a.breakdown.totalScore) {
    return b.breakdown.totalScore - a.breakdown.totalScore;
  }
  if (a.task.priority !== b.task.priority) {
    return a.task.priority - b.task.priority;
  }
  const aUpdated = new Date(a.task.priorityUpdatedAt).getTime();
  const bUpdated = new Date(b.task.priorityUpdatedAt).getTime();
  if (aUpdated !== bUpdated) {
    return aUpdated - bUpdated;
  }
  if (a.task.duration !== b.task.duration) {
    return a.task.duration - b.task.duration;
  }
  return a.task.id.localeCompare(b.task.id);
}

export function rankTasks(
  tasks: NormalizedTask[],
  params: RuntimeParams,
  exclusions: ExclusionRecord[] = [],
  weights: ScoreWeights = DEFAULT_WEIGHTS
): RankResult {
  const runtimeContext = params.context?.trim().toLowerCase();
  const allExclusions = [...exclusions];
  const inProgressTask = tasks.find((task) => task.status === "in_progress");

  if (inProgressTask) {
    allExclusions.push({
      taskId: inProgressTask.id,
      reason: "in_progress_blocked",
      detail:
        "An in-progress task is active. Resolve it before requesting new recommendations.",
    });
    return {
      mode: "in_progress_block",
      top: [],
      exclusions: allExclusions,
      inProgressTask,
    };
  }

  const filtered = tasks.filter((task) => {
    if (!runtimeContext) return true;
    if (task.contexts.includes(runtimeContext)) return true;
    allExclusions.push({
      taskId: task.id,
      reason: "context_mismatch",
      detail: `Task does not match runtime context '${runtimeContext}'.`,
    });
    return false;
  });

  const ranked = filtered
    .map((task) => ({
      task,
      breakdown: computeBreakdown(task, params, weights),
    }))
    .sort(compareRankedTasks)
    .slice(0, params.limit);

  return { mode: "recommendations", top: ranked, exclusions: allExclusions };
}
