import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";
import { Icon } from "../Icon/Icon";
import { Tendril } from "../../assets/icons/Tendril";

const defaultArgs = {
  children: "Continue",
  variant: "primary" as const,
  size: "md" as const,
  block: false,
  disabled: false,
  loading: false,
};

const meta: Meta<typeof Button> = {
  title: "Atomic/Button",
  component: Button,
  argTypes: {
    onClick: { action: "onClick" },
  },
  args: {
    onClick: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: defaultArgs,
};

export const Secondary: Story = {
  args: { ...defaultArgs, variant: "secondary" },
};

export const Ghost: Story = {
  args: { ...defaultArgs, variant: "ghost" },
};

export const Destructive: Story = {
  args: { ...defaultArgs, variant: "destructive", children: "Delete task" },
};

export const Disabled: Story = {
  args: { ...defaultArgs, disabled: true },
};

export const Loading: Story = {
  args: { ...defaultArgs, loading: true },
};

export const Small: Story = {
  args: { ...defaultArgs, size: "sm" },
};

export const SecondarySmall: Story = {
  args: { ...defaultArgs, variant: "secondary", size: "sm" },
};

export const GhostSmall: Story = {
  args: { ...defaultArgs, variant: "ghost", size: "sm" },
};

export const DestructiveSmall: Story = {
  args: { ...defaultArgs, variant: "destructive", size: "sm", children: "Delete task" },
};

export const IconOnly: Story = {
  args: {
    ...defaultArgs,
    size: "icon",
    children: <Icon asset={Tendril} label="Rank" size={24} />,
  },
};

export const Block: Story = {
  args: { ...defaultArgs, block: true },
  decorators: [
    (Story) => (
      <div style={{ width: "320px" }}>
        <Story />
      </div>
    ),
  ],
};
