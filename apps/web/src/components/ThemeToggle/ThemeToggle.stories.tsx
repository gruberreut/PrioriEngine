import { useArgs } from "storybook/preview-api";
import type { Meta, StoryObj } from "@storybook/react";
import { ThemeToggle } from "./ThemeToggle";
import type { Theme } from "../../features/theme/useTheme";

const defaultArgs = {
  theme: "auto" as Theme,
};

const meta: Meta<typeof ThemeToggle> = {
  title: "Atomic/ThemeToggle",
  component: ThemeToggle,
  argTypes: {
    onChange: { action: "onChange" },
  },
};

export default meta;

type Story = StoryObj<typeof ThemeToggle>;

const render: Story["render"] = (args) => {
  const [{ theme }, updateArgs] = useArgs<{ theme: Theme }>();
  return (
    <ThemeToggle
      {...args}
      theme={theme}
      onChange={(val) => {
        updateArgs({ theme: val });
        args.onChange?.(val);
      }}
    />
  );
};

export const Default: Story = {
  args: defaultArgs,
  render,
};

export const Light: Story = {
  args: { ...defaultArgs, theme: "light" },
  render,
};

export const Dark: Story = {
  args: { ...defaultArgs, theme: "dark" },
  render,
};
