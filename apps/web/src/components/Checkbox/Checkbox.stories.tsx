import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox } from "./Checkbox";

const defaultArgs = {
  checked: false,
  label: "Show score breakdown",
  disabled: false,
};

const meta: Meta<typeof Checkbox> = {
  title: "Atomic/Checkbox",
  component: Checkbox,
  argTypes: {
    onChange: { action: "onChange" },
  },
};

export default meta;

type Story = StoryObj<typeof Checkbox>;

const render: Story["render"] = (args) => {
  const [checked, setChecked] = useState(args.checked);
  return <Checkbox {...args} checked={checked} onChange={(val) => { setChecked(val); args.onChange?.(val); }} />;
};

export const Default: Story = {
  args: defaultArgs,
  render,
};

export const Checked: Story = {
  args: { ...defaultArgs, checked: true },
  render,
};

export const NoLabel: Story = {
  args: { ...defaultArgs, label: undefined },
  render,
};

export const Disabled: Story = {
  args: { ...defaultArgs, disabled: true },
  render,
};
