import type { Meta, StoryObj } from "@storybook/react";
import { ResultsPanel } from "./ResultsPanel";

const task1 = { id: "t1", title: "Repot the tomato seedlings", duration: 30, energyRequired: "medium" as const, contexts: ["Garden"] };
const task2 = { id: "t2", title: "Write weekly review", duration: 20, energyRequired: "low" as const, contexts: ["Admin"] };
const task3 = { id: "t3", title: "Fix flaky CI test", duration: 15, energyRequired: "high" as const, contexts: ["Dev"] };

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

const defaultArgs = {
  result: {
    mode: "recommendations" as const,
    tasks: [
      { task: task1, breakdown },
      { task: task2, breakdown },
      { task: task3, breakdown },
    ],
    explain: false,
  },
};

const meta: Meta<typeof ResultsPanel> = {
  title: "Features/Ranking/ResultsPanel",
  component: ResultsPanel,
  argTypes: {
    onBack: { action: "onBack" },
    onSelectTask: { action: "onSelectTask" },
    onInProgressAction: { action: "onInProgressAction" },
  },
};

export default meta;

export const Default: StoryObj<typeof ResultsPanel> = {
  args: defaultArgs,
};

export const ExplainOn: StoryObj<typeof ResultsPanel> = {
  args: { result: { ...defaultArgs.result, explain: true } },
};

export const InProgressBlock: StoryObj<typeof ResultsPanel> = {
  args: { result: { mode: "in_progress_block", task: task1 } },
};

export const EmptyWithContext: StoryObj<typeof ResultsPanel> = {
  args: { result: { mode: "recommendations", tasks: [], context: "Garden" } },
};

export const EmptyNoContext: StoryObj<typeof ResultsPanel> = {
  args: { result: { mode: "recommendations", tasks: [] } },
};
