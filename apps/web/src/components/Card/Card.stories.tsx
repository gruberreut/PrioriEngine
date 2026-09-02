import type { Meta, StoryObj } from "@storybook/react-vite";
import { Card } from "./Card";
import { Button } from "../Button/Button";

const defaultArgs = {
  title: "Book the dentist",
  meta: "Two minutes on the phone.",
  active: false,
};

const meta: Meta<typeof Card> = {
  title: "Atomic/Card",
  component: Card,
};

export default meta;

type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: defaultArgs,
};

export const WithKicker: Story = {
  args: {
    ...defaultArgs,
    kicker: "Next",
    title: "Ring the bike shop about the wheel",
    meta: "Ten minutes. Unblocks the weekend ride.",
  },
};

export const Active: Story = {
  args: {
    ...defaultArgs,
    active: true,
    kicker: "Next",
    title: "Ring the bike shop about the wheel",
    meta: "Ten minutes. Unblocks the weekend ride.",
  },
  render: (args) => (
    <Card {...args}>
      <div style={{ display: "flex", gap: "var(--space-2)" }}>
        <Button size="sm" onClick={() => {}}>Done</Button>
        <Button variant="secondary" size="sm" onClick={() => {}}>Later</Button>
      </div>
    </Card>
  ),
};

export const ChromeOnly: Story = {
  args: {},
  render: () => (
    <Card>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        <strong>Custom content</strong>
        <span>No title/kicker/meta - Card supplies only the surface/border/radius/shadow chrome, for wrapping a component that renders its own content (e.g. TaskCard).</span>
      </div>
    </Card>
  ),
};

export const Skeleton: Story = {
  args: {},
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      {[0, 1, 2].map((i) => (
        <Card key={i}>
          <div style={{ height: "1rem", width: "70%", borderRadius: "var(--radius-sm)", background: "var(--color-border)" }} />
          <div style={{ height: "0.75rem", width: "45%", borderRadius: "var(--radius-sm)", background: "var(--color-border)" }} />
        </Card>
      ))}
    </div>
  ),
};
