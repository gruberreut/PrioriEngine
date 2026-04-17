import { RankResult } from "./types.js";

function formatScore(value: number): string {
  return Number(value.toFixed(2)).toString();
}

export function formatRankOutput(result: RankResult, explain: boolean): string {
  if (result.top.length === 0) {
    return [
      "No eligible tasks found.",
      "Try adding new tasks or changing context.",
    ].join("\n");
  }

  const lines: string[] = [];

  result.top.forEach((ranked, idx) => {
    lines.push(`${idx + 1}. ${ranked.task.title}`);

    if (explain) {
      const b = ranked.breakdown;
      lines.push(`   score: ${formatScore(b.totalScore)}`);
      lines.push(
        `   components: priority=${formatScore(b.priorityScore)}, urgency=${formatScore(
          b.urgencyScore
        )}, energy=${formatScore(b.energyScore)}, duration=${formatScore(
          b.durationScore
        )}, flow=${formatScore(b.flowBonus)}, suggestion=${formatScore(
          b.suggestionPenalty
        )}`
      );
      lines.push(`   reasons: ${b.reasons.join(", ")}`);
    }
  });

  if (explain && result.exclusions.length > 0) {
    lines.push("");
    lines.push("Exclusions:");
    for (const exclusion of result.exclusions) {
      lines.push(`- ${exclusion.taskId}: ${exclusion.reason} (${exclusion.detail})`);
    }
  }

  return lines.join("\n");
}
