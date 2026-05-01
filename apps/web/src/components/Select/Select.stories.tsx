import type { Meta, StoryObj } from "@storybook/react";
import { Select } from "./Select";

const contextOptions = [
  { label: "Garden", value: "garden" },
  { label: "Learning", value: "learning" },
  { label: "Home", value: "home" },
  { label: "Bureaucracy", value: "bureaucracy" },
  { label: "Computer", value: "computer" },
];

const defaultArgs = {
  label: "Context",
  options: contextOptions,
  value: "garden" as string | undefined,
  disabled: false,
};

const meta: Meta<typeof Select> = {
  title: "Atomic/Select",
  component: Select,
  argTypes: {
    onChange: { action: "onChange" },
  },
};

export default meta;

export const Default: StoryObj<typeof Select> = {
  args: defaultArgs,
};

export const WithPlaceholder: StoryObj<typeof Select> = {
  args: { ...defaultArgs, value: undefined, placeholder: "All" },
};
