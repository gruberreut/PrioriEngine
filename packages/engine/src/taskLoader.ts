import { readFile } from "node:fs/promises";
import { LoadedTask, RawTask } from "./types.js";
import { asTaskArray, flattenTaskTree, isLeafTask } from "./treeUtils.js";

export { isLeafTask };

export async function loadTasksFromJson(path: string): Promise<LoadedTask[]> {
  const raw = await readFile(path, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  return flattenTaskTree(asTaskArray(parsed));
}
