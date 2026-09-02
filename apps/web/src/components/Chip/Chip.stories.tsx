import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Chip } from "./Chip";

const defaultArgs = {
  label: "Errand",
  selected: false,
  disabled: false,
};

const meta: Meta<typeof Chip> = {
  title: "Atomic/Chip",
  component: Chip,
  argTypes: {
    onClick: { action: "onClick" },
  },
  args: {
    onClick: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof Chip>;

export const Unselected: Story = {
  args: defaultArgs,
};

export const Selected: Story = {
  args: { ...defaultArgs, selected: true },
};

export const Disabled: Story = {
  args: { ...defaultArgs, disabled: true },
};
