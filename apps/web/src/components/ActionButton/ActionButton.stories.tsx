import type { Meta, StoryObj } from "@storybook/react-vite";
import { Icon } from "../Icon/Icon";
import { Trash } from "../../assets/icons/Trash";
import { ActionButton } from "./ActionButton";

const defaultArgs = {
  icon: <Icon asset={Trash} label="Delete" size={20} />,
  label: "Delete",
  showLabel: false,
};

const meta: Meta<typeof ActionButton> = {
  title: "Atomic/ActionButton",
  component: ActionButton,
  argTypes: {
    onClick: { action: "onClick" },
  },
};

export default meta;

export const Default: StoryObj<typeof ActionButton> = {
  args: defaultArgs,
};

export const WithLabel: StoryObj<typeof ActionButton> = {
  args: { ...defaultArgs, showLabel: true },
};

export const Colored: StoryObj<typeof ActionButton> = {
  args: { ...defaultArgs, showLabel: true, color: "#fee2e2" },
};

export const LongLabel: StoryObj<typeof ActionButton> = {
  args: { ...defaultArgs, showLabel: true, label: "Delete subtasks too" },
};
