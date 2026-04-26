import type { Meta, StoryObj } from "@storybook/react";
import { ParamsForm } from "./ParamsForm";

const contexts = ["Garden", "Learning", "Home", "Bureaucracy", "Computer"];

const meta: Meta<typeof ParamsForm> = {
  title: "Features/Ranking/ParamsForm",
  component: ParamsForm,
  argTypes: {
    onSubmit: { action: "onSubmit" },
  },
};

export default meta;

export const Default: StoryObj<typeof ParamsForm> = {
  args: { contexts },
};

export const Loading: StoryObj<typeof ParamsForm> = {
  args: { contexts, loading: true },
};

export const NoContexts: StoryObj<typeof ParamsForm> = {
  args: { contexts: [] },
};
