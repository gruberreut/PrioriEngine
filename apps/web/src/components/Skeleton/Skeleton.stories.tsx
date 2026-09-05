import type { Meta, StoryObj } from "@storybook/react-vite";
import { Skeleton } from "./Skeleton";
import { Card } from "../Card/Card";

const defaultArgs = {};

const meta: Meta<typeof Skeleton> = {
  title: "Atomic/Skeleton",
  component: Skeleton,
};

export default meta;

type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {
  args: defaultArgs,
};

export const Narrow: Story = {
  args: { ...defaultArgs, width: "45%" },
};

export const CustomHeight: Story = {
  args: { ...defaultArgs, height: "1.5rem" },
};

export const ComposedLines: Story = {
  args: {},
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      {[0, 1, 2].map((i) => (
        <Card key={i}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <Skeleton width="70%" />
            <Skeleton width="45%" height="0.75rem" />
          </div>
        </Card>
      ))}
    </div>
  ),
};
