import type { Meta, StoryObj } from "@storybook/react-vite";
import { ResultsSlide } from "./ResultsSlide";
import type { RankResultMode } from "../ResultsPanel/ResultsPanel";

const baseFields = {
  priority: 3,
  priorityUpdatedAt: "2026-06-01T00:00:00.000Z",
  dueDate: null,
  lastSuggestedAt: null,
};

const mockResult: RankResultMode = {
  mode: "recommendations",
  tasks: [
    {
      task: {
        id: "1",
        title: "Water the garden",
        duration: 15,
        energyRequired: "low",
        location: "home",
        contexts: ["physical"],
        status: "pending",
        ...baseFields,
      },
    },
    {
      task: {
        id: "2",
        title: "Read architecture book",
        duration: 30,
        energyRequired: "medium",
        location: "anywhere",
        contexts: ["learning"],
        status: "pending",
        ...baseFields,
      },
    },
  ],
  explain: false,
};

const defaultArgs = {
  label: "All",
  state: "loaded" as const,
  result: mockResult,
  backgroundColor: "var(--color-slide-0)",
};

const meta: Meta<typeof ResultsSlide> = {
  title: "Features/Ranking/ResultsSlide",
  component: ResultsSlide,
  argTypes: {
    onStartTask: { action: "onStartTask" },
    onInProgressAction: { action: "onInProgressAction" },
  },
};

export default meta;

export const Loaded: StoryObj<typeof ResultsSlide> = {
  args: defaultArgs,
};

export const Idle: StoryObj<typeof ResultsSlide> = {
  args: { ...defaultArgs, state: "idle", result: undefined },
};

export const Loading: StoryObj<typeof ResultsSlide> = {
  args: { ...defaultArgs, state: "loading", result: undefined },
};

export const Error: StoryObj<typeof ResultsSlide> = {
  args: { ...defaultArgs, state: "error", result: undefined },
};

export const ContextLabel: StoryObj<typeof ResultsSlide> = {
  args: { ...defaultArgs, label: "Creativity" },
};
