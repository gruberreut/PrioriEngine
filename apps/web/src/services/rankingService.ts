import type { Task } from "../types/task";
import type { RankParams } from "../features/ranking/ParamsForm/ParamsForm";
import type { RankResultMode } from "../features/ranking/ResultsPanel/ResultsPanel";
import type { ScoreBreakdownData } from "../features/ranking/ScoreBreakdown/ScoreBreakdown";

interface ApiRankedTask {
  task: Record<string, unknown>;
  breakdown: ScoreBreakdownData;
}

interface ApiRankResult {
  mode: "recommendations" | "in_progress_block";
  top: ApiRankedTask[];
  inProgressTask?: Record<string, unknown>;
}

function toTask(t: Record<string, unknown>): Task {
  const task: Task = {
    id: t.id as string,
    title: t.title as string,
    duration: t.duration as number,
    energyRequired: t.energyRequired as Task["energyRequired"],
    location: t.location as Task["location"],
    status: t.status as Task["status"],
    contexts: (t.contexts as string[]) ?? [],
    priority: t.priority as number,
    priorityUpdatedAt: t.priorityUpdatedAt as string,
    dueDate: (t.dueDate as string) ?? null,
    lastSuggestedAt: (t.lastSuggestedAt as string) ?? null,
  };
  if (Array.isArray(t.ancestors)) {
    task.ancestors = t.ancestors as { id: string; title: string }[];
  }
  if (typeof t.hasChildren === "boolean") {
    task.hasChildren = t.hasChildren;
  }
  return task;
}

export async function rank(params: RankParams, context: string | undefined): Promise<RankResultMode> {
  const body: Record<string, unknown> = {
    availableTime: params.availableTime,
    energyLevel: params.energy,
    explain: params.explain,
  };
  if (context) body.context = context;
  if (params.location) body.location = params.location;

  const res = await fetch("/api/rank", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Ranking request failed");

  const data = await res.json() as ApiRankResult;

  if (data.mode === "in_progress_block") {
    return {
      mode: "in_progress_block",
      task: toTask(data.inProgressTask!),
    };
  }

  return {
    mode: "recommendations",
    tasks: data.top.map((rt) => ({
      task: toTask(rt.task),
      breakdown: rt.breakdown,
    })),
    explain: params.explain,
    context,
  };
}
