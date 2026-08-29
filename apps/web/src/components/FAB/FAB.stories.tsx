import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FAB } from "./FAB";

const defaultArgs = {};

const meta: Meta<typeof FAB> = {
  title: "Atomic/FAB",
  component: FAB,
  argTypes: {
    onClick: { action: "onClick" },
  },
  args: {
    onClick: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ position: "relative", height: "200px" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof FAB>;

export const Default: Story = {
  args: defaultArgs,
};
