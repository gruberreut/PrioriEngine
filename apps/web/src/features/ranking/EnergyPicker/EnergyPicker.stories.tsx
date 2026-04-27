import { useArgs } from "storybook/preview-api";
import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { EnergyPicker } from "./EnergyPicker";
import type { EnergyLevel } from "./EnergyPicker";

const meta: Meta<typeof EnergyPicker> = {
  title: "Features/Ranking/EnergyPicker",
  component: EnergyPicker,
  args: {
    label: "Energy",
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
  args: { value: "medium" },
  render,
};

export const LowSelected: Story = {
  args: { value: "low" },
  render,
};

export const HighSelected: Story = {
  args: { value: "high" },
  render,
};

export const Disabled: Story = {
  args: { value: "medium", disabled: true },
  render,
};
