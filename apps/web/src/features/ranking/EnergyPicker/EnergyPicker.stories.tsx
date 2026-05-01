import { useArgs } from "storybook/preview-api";
import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { EnergyPicker, type EnergyLevel } from "./EnergyPicker";

const defaultArgs = {
  value: "medium" as EnergyLevel,
  label: "Energy",
  disabled: false,
};

const meta: Meta<typeof EnergyPicker> = {
  title: "Features/Ranking/EnergyPicker",
  component: EnergyPicker,
  args: {
    onChange: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof EnergyPicker>;

const render: Story["render"] = (args) => {
  const [{ value }, updateArgs] = useArgs<{ value: EnergyLevel }>();
  return (
    <EnergyPicker
      {...args}
      value={value}
      onChange={(next) => {
        args.onChange(next);
        updateArgs({ value: next });
      }}
    />
  );
};

export const Default: Story = {
  args: defaultArgs,
  render,
};

export const LowSelected: Story = {
  args: { ...defaultArgs, value: "low" },
  render,
};

export const HighSelected: Story = {
  args: { ...defaultArgs, value: "high" },
  render,
};

export const Disabled: Story = {
  args: { ...defaultArgs, disabled: true },
  render,
};
