import { useArgs } from "storybook/preview-api";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { SplitGroup } from "./SplitGroup";
import { Icon } from "../Icon/Icon";
import { FlameLow } from "../../assets/icons/FlameLow";
import { FlameMedium } from "../../assets/icons/FlameMedium";
import { FlameHigh } from "../../assets/icons/FlameHigh";

const threeWayOptions = [
  { label: "Today", value: "today" },
  { label: "This week", value: "week" },
  { label: "Someday", value: "someday" },
];

const withIconsOptions = [
  { label: "low", value: "low", icon: <Icon asset={FlameLow} label="Low" size={20} /> },
  { label: "medium", value: "medium", icon: <Icon asset={FlameMedium} label="Medium" size={20} /> },
  { label: "high", value: "high", icon: <Icon asset={FlameHigh} label="High" size={20} /> },
];

const twoWayOptions = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
];

const defaultArgs = {
  options: threeWayOptions,
  value: "week",
  label: "Due",
  disabled: false,
};

const meta: Meta<typeof SplitGroup> = {
  title: "Atomic/SplitGroup",
  component: SplitGroup,
  argTypes: {
    onChange: { action: "onChange" },
  },
};

export default meta;

type Story = StoryObj<typeof SplitGroup>;

const render: Story["render"] = (args) => {
  const [{ value }, updateArgs] = useArgs<{ value: string }>();
  return (
    <SplitGroup
      {...args}
      value={value}
      onChange={(val) => {
        updateArgs({ value: val });
        args.onChange?.(val);
      }}
    />
  );
};

export const ThreeWay: Story = {
  args: defaultArgs,
  render,
};

export const TwoWay: Story = {
  args: { ...defaultArgs, options: twoWayOptions, value: "light", label: "Theme" },
  render,
};

export const Disabled: Story = {
  args: { ...defaultArgs, disabled: true },
  render,
};

export const WithIcons: Story = {
  args: { ...defaultArgs, options: withIconsOptions, value: "medium", label: "Energy" },
  render,
};
