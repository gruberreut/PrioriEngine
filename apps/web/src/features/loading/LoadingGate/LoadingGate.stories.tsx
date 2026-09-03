import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router-dom";
import { LoadingGate } from "./LoadingGate";

const meta: Meta<typeof LoadingGate> = {
  title: "Features/Loading/LoadingGate",
  component: LoadingGate,
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
};

export default meta;

type Story = StoryObj<typeof LoadingGate>;

/** Shows the real timer: the splash holds for MIN_LOADING_MS, then this
 *  placeholder "app content" appears in its place. The in-progress check
 *  has no backend to call here, so it fails open (as it does in the app). */
export const Default: Story = {
  args: {
    children: <p style={{ padding: "var(--space-4)" }}>App content</p>,
  },
};
