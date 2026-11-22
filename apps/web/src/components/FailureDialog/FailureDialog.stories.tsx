import type { Meta, StoryObj } from "@storybook/react-vite";
import { FailureDialog } from "./FailureDialog";

const defaultArgs = {
  open: true,
};

const meta: Meta<typeof FailureDialog> = {
  title: "Atomic/Dialogs/FailureDialog",
  component: FailureDialog,
  parameters: {
    // The dialog is position: fixed over the whole viewport. Inline on a docs
    // page it takes no height, so render it in its own iframe instead.
    docs: { story: { inline: false, iframeHeight: "320px" } },
  },
  argTypes: {
    onConfirm: { action: "onConfirm" },
  },
};

export default meta;

type Story = StoryObj<typeof FailureDialog>;

export const Default: Story = {
  args: defaultArgs,
};

export const Closed: Story = {
  args: { ...defaultArgs, open: false },
};
