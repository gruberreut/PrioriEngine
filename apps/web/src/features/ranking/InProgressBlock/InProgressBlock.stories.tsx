import type { Meta, StoryObj } from "@storybook/react";
import { InProgressBlock } from "./InProgressBlock";

const task = {
  id: "task-3",
  title: "Repot the tomato seedlings",
  duration: 30,
  energyRequired: "medium" as const,
  contexts: ["Garden"],
};

const meta: Meta<typeof InProgressBlock> = {
  title: "Features/Ranking/InProgressBlock",
  component: InProgressBlock,
};

export default meta;

export const Default: StoryObj<typeof InProgressBlock> = {
  args: { task },
};
