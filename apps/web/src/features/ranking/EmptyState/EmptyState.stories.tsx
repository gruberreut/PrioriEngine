import type { Meta, StoryObj } from "@storybook/react";
import { EmptyState } from "./EmptyState";

const defaultArgs = {};

const meta: Meta<typeof EmptyState> = {
  title: "Features/Ranking/EmptyState",
  component: EmptyState,
  argTypes: {
    onBack: { action: "onBack" },
  },
};

export default meta;

export const Default: StoryObj<typeof EmptyState> = {
  args: defaultArgs,
};

export const WithContext: StoryObj<typeof EmptyState> = {
  args: { ...defaultArgs, context: "Garden" },
};
