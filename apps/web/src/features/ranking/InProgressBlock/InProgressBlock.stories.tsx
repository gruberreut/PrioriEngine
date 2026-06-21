import type { Meta, StoryObj } from "@storybook/react";
import { InProgressBlock } from "./InProgressBlock";

const task = {
  id: "task-3",
  title: "Repot the tomato seedlings",
  duration: 30,
  energyRequired: "medium" as const,
  location: "home" as const,
  contexts: ["Garden"],
  status: "pending" as const,
  priority: 3,
  priorityUpdatedAt: "2026-06-01T00:00:00.000Z",
  dueDate: null,
  lastSuggestedAt: null,
};

const defaultArgs = {
  task,
};

const meta: Meta<typeof InProgressBlock> = {
  title: "Features/Ranking/InProgressBlock",
  component: InProgressBlock,
  argTypes: {
    onAction: { action: "onAction" },
  },
};

export default meta;

export const Default: StoryObj<typeof InProgressBlock> = {
  args: defaultArgs,
};
