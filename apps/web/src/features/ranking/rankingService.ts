import type { RankParams } from "./ParamsForm/ParamsForm";
import type { RankResultMode } from "./ResultsPanel/ResultsPanel";
import type { TaskData } from "./TaskCard/TaskCard";
import type { ScoreBreakdownData } from "./ScoreBreakdown/ScoreBreakdown";

interface ApiRankedTask {
  task: Record<string, unknown>;
  breakdown: ScoreBreakdownData;
}

interface ApiRankResult {
  mode: "recommendations" | "in_progress_block";
  top: ApiRankedTask[];
  inProgressTask?: Record<string, unknown>;
}

function toTaskData(t: Record<string, unknown>): TaskData {
  return {
    id: t.id as string,
    title: t.title as string,
    duration: t.duration as number,
    energyRequired: t.energyRequired as TaskData["energyRequired"],
    location: t.location as TaskData["location"],
    contexts: t.contexts as string[],
    status: t.status as TaskData["status"],
  };
}

export async function getContexts(): Promise<string[]> {
  const res = await fetch("/api/contexts");
  if (!res.ok) throw new Error("Failed to fetch contexts");
  const data = await res.json() as { name: string }[];
  return data.map((c) => c.name);
}

export async function rank(params: RankParams): Promise<RankResultMode> {
  const body: Record<string, unknown> = {
    availableTime: params.availableTime,
    energyLevel: params.energy,
    explain: params.explain,
  };
  if (params.context) body.context = params.context;
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
      task: toTaskData(data.inProgressTask!),
    };
  }

  return {
    mode: "recommendations",
    tasks: data.top.map((rt) => ({
      task: toTaskData(rt.task),
      breakdown: rt.breakdown,
    })),
    explain: params.explain,
    context: params.context,
  };
}
