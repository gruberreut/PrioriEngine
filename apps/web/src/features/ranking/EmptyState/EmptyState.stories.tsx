import type { Meta, StoryObj } from "@storybook/react";
import { EmptyState } from "./EmptyState";

const meta: Meta<typeof EmptyState> = {
  title: "Features/Ranking/EmptyState",
  component: EmptyState,
};

export default meta;

export const WithContext: StoryObj<typeof EmptyState> = {
  args: { context: "Garden" },
};

export const WithoutContext: StoryObj<typeof EmptyState> = {
  args: {},
};
