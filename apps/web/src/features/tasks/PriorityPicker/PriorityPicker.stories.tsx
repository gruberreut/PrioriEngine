import { useArgs } from "storybook/preview-api";
import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { PriorityPicker } from "./PriorityPicker";

const defaultArgs = {
  value: 3,
  label: "Priority",
  disabled: false,
};

const meta: Meta<typeof PriorityPicker> = {
  title: "Features/Tasks/PriorityPicker",
  component: PriorityPicker,
  argTypes: {
    onChange: { action: "onChange" },
    onDueDateChange: { action: "onDueDateChange" },
  },
  args: {
    onChange: fn(),
    onDueDateChange: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof PriorityPicker>;

const render: Story["render"] = (args) => {
  const [{ value, dueDate }, updateArgs] = useArgs<{ value: number; dueDate?: string }>();
  return (
    <PriorityPicker
      {...args}
      value={value}
      dueDate={dueDate}
      onChange={(next) => {
        args.onChange(next);
        updateArgs({ value: next });
      }}
      onDueDateChange={(date) => {
        args.onDueDateChange?.(date);
        updateArgs({ dueDate: date });
      }}
    />
  );
};

export const Default: Story = {
  args: defaultArgs,
  render,
};

export const UrgentSelected: Story = {
  args: { ...defaultArgs, value: 1 },
  render,
};

export const MediumSelected: Story = {
  args: { ...defaultArgs, value: 6 },
  render,
};

export const LaterSelected: Story = {
  args: { ...defaultArgs, value: 8 },
  render,
};

export const OngoingSelected: Story = {
  args: { ...defaultArgs, value: 10 },
  render,
};

export const Disabled: Story = {
  args: { ...defaultArgs, disabled: true },
  render,
};
