import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Sheet } from "./Sheet";

const defaultArgs = {
  open: true,
  title: "Choose a context",
  children: <p>Sheet content goes here.</p>,
};

const meta: Meta<typeof Sheet> = {
  title: "Atomic/Sheet",
  component: Sheet,
  argTypes: {
    onClose: { action: "onClose" },
  },
  args: {
    onClose: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof Sheet>;

export const Default: Story = {
  args: defaultArgs,
};

export const Closed: Story = {
  args: { ...defaultArgs, open: false },
};

export const NoTitle: Story = {
  args: { ...defaultArgs, title: undefined },
};

export const ScrollableContent: Story = {
  args: {
    ...defaultArgs,
    title: "Pick a task",
    children: (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i}>Row {i + 1}</div>
        ))}
      </div>
    ),
  },
};
