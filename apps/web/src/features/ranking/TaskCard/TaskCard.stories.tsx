import type { Meta, StoryObj } from "@storybook/react";
import { TaskCard } from "./TaskCard";

const task = {
  id: "task-1",
  title: "Repot the tomato seedlings",
  duration: 30,
  energyRequired: "medium" as const,
  contexts: ["Garden"],
};

const breakdown = {
  priorityScore: 0.80,
  urgencyScore: 0.60,
  energyScore: 0.50,
  durationScore: 0.40,
  flowBonus: 0.20,
  suggestionPenalty: 0,
  totalScore: 2.50,
  reasons: ["High priority", "Due soon"],
};

const meta: Meta<typeof TaskCard> = {
  title: "Features/Ranking/TaskCard",
  component: TaskCard,
};

export default meta;

export const ExplainOff: StoryObj<typeof TaskCard> = {
  args: { task, breakdown },
};

export const ExplainOn: StoryObj<typeof TaskCard> = {
  args: { task, breakdown, explain: true },
};

export const LongTitle: StoryObj<typeof TaskCard> = {
  args: {
    task: { ...task, title: "Research and compare three different composting methods suitable for a small urban balcony garden" },
    breakdown,
  },
};
