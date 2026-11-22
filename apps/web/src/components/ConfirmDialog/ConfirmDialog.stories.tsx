import type { Meta, StoryObj } from "@storybook/react-vite";
import { ConfirmDialog } from "./ConfirmDialog";

const defaultArgs = {
  open: true,
  kicker: "Next",
  title: "This task has subtasks",
  description: "What should happen to them?",
  options: [
    { label: "Keep", value: "reparent", variant: "primary" as const },
    { label: "Delete", value: "delete", variant: "secondary" as const },
  ],
};

const meta: Meta<typeof ConfirmDialog> = {
  title: "Atomic/Dialogs/ConfirmDialog",
  component: ConfirmDialog,
  argTypes: {
    onSelect: { action: "onSelect" },
    onCancel: { action: "onCancel" },
  },
};

export default meta;

type Story = StoryObj<typeof ConfirmDialog>;

export const Default: Story = {
  args: defaultArgs,
};

export const NoKicker: Story = {
  args: { ...defaultArgs, kicker: undefined },
};

export const NoDescription: Story = {
  args: { ...defaultArgs, description: undefined },
};

export const SingleOption: Story = {
  args: {
    ...defaultArgs,
    kicker: undefined,
    title: "Delete this task?",
    description: undefined,
    options: [{ label: "Delete", value: "delete", variant: "destructive" as const }],
  },
};

export const ThreeOptions: Story = {
  args: {
    ...defaultArgs,
    options: [
      { label: "Cancel", value: "cancel", variant: "ghost" as const },
      { label: "Keep subtasks", value: "reparent", variant: "secondary" as const },
      { label: "Delete subtasks too", value: "delete", variant: "destructive" as const },
    ],
  },
};

export const Closed: Story = {
  args: { ...defaultArgs, open: false },
};
