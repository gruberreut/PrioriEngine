import type { Meta, StoryObj } from "@storybook/react";
import { ParamsForm } from "./ParamsForm";

const defaultArgs = {
  disabled: false,
};

const meta: Meta<typeof ParamsForm> = {
  title: "Features/Ranking/ParamsForm",
  component: ParamsForm,
  argTypes: {
    onParamsChange: { action: "onParamsChange" },
  },
};

export default meta;

export const Default: StoryObj<typeof ParamsForm> = {
  args: defaultArgs,
};

export const Disabled: StoryObj<typeof ParamsForm> = {
  args: { ...defaultArgs, disabled: true },
};
