import type { Meta, StoryObj } from "@storybook/react-vite";
import { InlineMessage } from "./InlineMessage";

const meta: Meta<typeof InlineMessage> = {
  title: "Atomic/InlineMessage",
  component: InlineMessage,
};

export default meta;

type Story = StoryObj<typeof InlineMessage>;

export const Success: Story = {
  args: {
    status: "success",
    children: "Saved. Nothing else needs you today.",
  },
};

export const Error: Story = {
  args: {
    status: "error",
    children: "That date did not parse. Try “next Tuesday”.",
  },
};

export const Info: Story = {
  args: {
    status: "info",
    children: "Adding as subtask of Ring the bike shop",
  },
};
