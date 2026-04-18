import { normalizeTasks } from "./normalizer.js";
import { formatRankOutput } from "./output.js";
import { rankTasks } from "./ranker.js";
import { loadTasksFromJson } from "./taskLoader.js";
import { buildRuntimeParams, resolveTasksPath } from "./cliParse.js";

export async function runRankCli(
  args: string[],
  options?: { fixedNow?: Date }
): Promise<void> {
  const params = buildRuntimeParams(args, options);
  const taskPath = resolveTasksPath(args);
  const loaded = await loadTasksFromJson(taskPath);
  const normalized = normalizeTasks(loaded);
  const ranked = rankTasks(normalized.tasks, params, normalized.exclusions);
  console.log(formatRankOutput(ranked, params.explain));
}

export function reportCliError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Priori Engine error: ${message}`);
  process.exitCode = 1;
}
