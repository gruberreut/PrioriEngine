#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeTasks } from "./normalizer.js";
import { formatRankOutput } from "./output.js";
import { rankTasks } from "./ranker.js";
import { loadTasksFromJson } from "./taskLoader.js";
import { EnergyLevel, RuntimeParams } from "./types.js";

function parseArgValue(args: string[], key: string): string | undefined {
  const idx = args.indexOf(key);
  if (idx < 0 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}

function parseLimit(args: string[]): number {
  const raw = parseArgValue(args, "--limit");
  if (!raw) return 3;
  const parsed = Math.abs(Number(raw));
  if (!Number.isFinite(parsed) || Number.isNaN(parsed) || parsed <= 0) {
    throw new Error("Invalid --limit: value must be a number > 0.");
  }
  return Math.floor(parsed);
}

function parseEnergy(args: string[]): EnergyLevel {
  const raw = parseArgValue(args, "--energy");
  if (raw === "low" || raw === "medium" || raw === "high") return raw;
  return "medium";
}

function parseNow(args: string[]): Date {
  const raw = parseArgValue(args, "--now");
  if (!raw) return new Date();
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid --now: expected ISO date.");
  }
  return parsed;
}

function parseAvailableTime(args: string[]): number {
  const raw = parseArgValue(args, "--available-time");
  if (!raw) return 30;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error("Invalid --available-time: must be a positive number.");
  }
  return n;
}

function resolveTasksPath(args: string[]): string {
  const raw = parseArgValue(args, "--tasks");
  if (raw) return path.resolve(raw);
  const currentFilePath = fileURLToPath(import.meta.url);
  const srcDir = path.dirname(currentFilePath);
  return path.resolve(srcDir, "../test/data/tasks.example.json");
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const explain = args.includes("--explain");

  const params: RuntimeParams = {
    currentTime: parseNow(args),
    context: parseArgValue(args, "--context")?.trim().toLowerCase(),
    availableTime: parseAvailableTime(args),
    energyLevel: parseEnergy(args),
    explain,
    limit: parseLimit(args),
    lastCompletedProject: parseArgValue(args, "--last-completed-project"),
  };

  const taskPath = resolveTasksPath(args);
  const loaded = await loadTasksFromJson(taskPath);
  const normalized = normalizeTasks(loaded);
  const ranked = rankTasks(normalized.tasks, params, normalized.exclusions);

  console.log(formatRankOutput(ranked, explain));
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Priori Engine error: ${message}`);
  process.exitCode = 1;
});
