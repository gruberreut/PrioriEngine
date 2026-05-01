import type { Meta, StoryObj } from "@storybook/react";
import { ParamsForm } from "./ParamsForm";

const contexts = ["Garden", "Learning", "Home", "Bureaucracy", "Computer"];

const defaultArgs = {
  contexts,
  loading: false,
};

const meta: Meta<typeof ParamsForm> = {
  title: "Features/Ranking/ParamsForm",
  component: ParamsForm,
  argTypes: {
    onSubmit: { action: "onSubmit" },
  },
};

export default meta;

export const Default: StoryObj<typeof ParamsForm> = {
  args: defaultArgs,
};

export const Loading: StoryObj<typeof ParamsForm> = {
  args: { ...defaultArgs, loading: true },
};

export const NoContexts: StoryObj<typeof ParamsForm> = {
  args: { ...defaultArgs, contexts: [] },
};
