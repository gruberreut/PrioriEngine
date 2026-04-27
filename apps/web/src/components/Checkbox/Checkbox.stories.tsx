import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox } from "./Checkbox";

const meta: Meta<typeof Checkbox> = {
  title: "Atomic/Checkbox",
  component: Checkbox,
  argTypes: {
    onChange: { action: "onChange" },
  },
};

export default meta;

export const Off: StoryObj<typeof Checkbox> = {
  render: (args) => {
    const [checked, setChecked] = useState(false);
    return <Checkbox {...args} checked={checked} onChange={(val) => { setChecked(val); args.onChange?.(val); }} />;
  },
  args: { label: "Show score breakdown" },
};

export const On: StoryObj<typeof Checkbox> = {
  render: (args) => {
    const [checked, setChecked] = useState(true);
    return <Checkbox {...args} checked={checked} onChange={(val) => { setChecked(val); args.onChange?.(val); }} />;
  },
  args: { label: "Show score breakdown" },
};

export const NoLabel: StoryObj<typeof Checkbox> = {
  render: (args) => {
    const [checked, setChecked] = useState(false);
    return <Checkbox {...args} checked={checked} onChange={(val) => { setChecked(val); args.onChange?.(val); }} />;
  },
};

export const Disabled: StoryObj<typeof Checkbox> = {
  args: { label: "Show score breakdown", checked: false, disabled: true },
};
