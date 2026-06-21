import type { Meta, StoryObj } from "@storybook/react";
import { ResultsSlide } from "./ResultsSlide";
import type { RankResultMode } from "../ResultsPanel/ResultsPanel";

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
      },
    },
  ],
  explain: false,
};

const defaultArgs = {
  label: "All",
  state: "loaded" as const,
  result: mockResult,
};

const meta: Meta<typeof ResultsSlide> = {
  title: "Features/Ranking/ResultsSlide",
  component: ResultsSlide,
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
