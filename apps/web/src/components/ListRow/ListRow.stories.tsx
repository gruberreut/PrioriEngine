import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ListRow } from "./ListRow";

const defaultArgs = {
  title: "Ring the bike shop",
  meta: "Today",
  selected: false,
  disabled: false,
};

const meta: Meta<typeof ListRow> = {
  title: "Atomic/ListRow",
  component: ListRow,
  argTypes: {
    onClick: { action: "onClick" },
  },
  args: {
    onClick: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof ListRow>;

export const Default: Story = {
  args: defaultArgs,
};

export const Selected: Story = {
  args: { ...defaultArgs, selected: true },
};

export const NoMeta: Story = {
  args: { ...defaultArgs, meta: undefined },
};

export const Disabled: Story = {
  args: { ...defaultArgs, disabled: true },
};
