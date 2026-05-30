import { normalizeTasks } from "./normalizer.js";
import { rankTasks } from "./ranker.js";
import { asTaskArray, flattenTaskTree } from "./treeUtils.js";
import { RankResult, RuntimeParams } from "./types.js";

export function rankFromPayload(rawInput: unknown, params: RuntimeParams): RankResult {
  const tasks = asTaskArray(rawInput);
  const loaded = flattenTaskTree(tasks);
  const { tasks: normalized, exclusions } = normalizeTasks(loaded);
  return rankTasks(normalized, params, exclusions);
}
