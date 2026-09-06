import { useArgs } from "storybook/preview-api";
import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { LocationPicker, type LocationRequirement } from "./LocationPicker";

const defaultArgs = {
  value: "home" as LocationRequirement,
  label: "Location",
  disabled: false,
};

const meta: Meta<typeof LocationPicker> = {
  title: "Features/Ranking/LocationPicker",
  component: LocationPicker,
  args: {
    onChange: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof LocationPicker>;

const render: Story["render"] = (args) => {
  const [{ value }, updateArgs] = useArgs<{ value: LocationRequirement }>();
  return (
    <LocationPicker
      {...args}
      value={value}
      onChange={(next) => {
        args.onChange(next);
        updateArgs({ value: next });
      }}
    />
  );
};

export const Default: Story = {
  args: defaultArgs,
  render,
};

export const InPersonSelected: Story = {
  args: { ...defaultArgs, value: "in-person" },
  render,
};

export const FlexibleSelected: Story = {
  args: { ...defaultArgs, value: "anywhere" },
  render,
};

export const Disabled: Story = {
  args: { ...defaultArgs, disabled: true },
  render,
};
