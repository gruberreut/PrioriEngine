import type { Meta, StoryObj } from "@storybook/react";
import { ScoreBreakdown } from "./ScoreBreakdown";

const meta: Meta<typeof ScoreBreakdown> = {
  title: "Features/Ranking/ScoreBreakdown",
  component: ScoreBreakdown,
};

export default meta;

export const AllPositive: StoryObj<typeof ScoreBreakdown> = {
  args: {
    breakdown: {
      priorityScore: 0.80,
      urgencyScore: 0.60,
      energyScore: 0.50,
      durationScore: 0.40,
      flowBonus: 0.20,
      suggestionPenalty: 0,
      totalScore: 2.50,
      reasons: ["High priority", "Due soon"],
    },
  },
};

export const WithPenalties: StoryObj<typeof ScoreBreakdown> = {
  args: {
    breakdown: {
      priorityScore: 0.60,
      urgencyScore: 0.30,
      energyScore: 0.50,
      durationScore: 0.20,
      flowBonus: 0.10,
      suggestionPenalty: -0.50,
      totalScore: 1.20,
      reasons: ["Suggested recently"],
    },
  },
};

export const ZeroFlowBonus: StoryObj<typeof ScoreBreakdown> = {
  args: {
    breakdown: {
      priorityScore: 0.70,
      urgencyScore: 0.40,
      energyScore: 0.50,
      durationScore: 0.30,
      flowBonus: 0,
      suggestionPenalty: 0,
      totalScore: 1.90,
      reasons: [],
    },
  },
};
