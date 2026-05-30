import { useArgs } from "storybook/preview-api";
import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { DurationPicker } from "./DurationPicker";

const defaultArgs = {
  value: 20,
  label: "Duration",
  disabled: false,
};

const meta: Meta<typeof DurationPicker> = {
  title: "Features/Tasks/DurationPicker",
  component: DurationPicker,
  argTypes: {
    onChange: { action: "onChange" },
  },
  args: {
    onChange: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof DurationPicker>;

const render: Story["render"] = (args) => {
  const [{ value }, updateArgs] = useArgs<{ value: number }>();
  return (
    <DurationPicker
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

export const TenSelected: Story = {
  args: { ...defaultArgs, value: 10 },
  render,
};

export const ThirtySelected: Story = {
  args: { ...defaultArgs, value: 30 },
  render,
};

export const SixtySelected: Story = {
  args: { ...defaultArgs, value: 60 },
  render,
};

export const Disabled: Story = {
  args: { ...defaultArgs, disabled: true },
  render,
};
