import type { Meta, StoryObj } from "@storybook/react-vite";
import { LoadingGate } from "./LoadingGate";

const meta: Meta<typeof LoadingGate> = {
  title: "Features/Loading/LoadingGate",
  component: LoadingGate,
};

export default meta;

type Story = StoryObj<typeof LoadingGate>;

/** Shows the real timer: the splash holds for MIN_LOADING_MS, then this
 *  placeholder "app content" appears in its place. */
export const Default: Story = {
  args: {
    children: <p style={{ padding: "var(--space-4)" }}>App content</p>,
  },
};
