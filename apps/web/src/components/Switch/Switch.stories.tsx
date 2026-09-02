import { useArgs } from "storybook/preview-api";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Switch } from "./Switch";

const defaultArgs = {
  checked: false,
  label: "Evening nudge",
  disabled: false,
};

const meta: Meta<typeof Switch> = {
  title: "Atomic/Switch",
  component: Switch,
  argTypes: {
    onChange: { action: "onChange" },
  },
};

export default meta;

type Story = StoryObj<typeof Switch>;

const render: Story["render"] = (args) => {
  const [{ checked }, updateArgs] = useArgs<{ checked: boolean }>();
  return (
    <Switch
      {...args}
      checked={checked}
      onChange={(val) => {
        updateArgs({ checked: val });
        args.onChange?.(val);
      }}
    />
  );
};

export const Off: Story = {
  args: defaultArgs,
  render,
};

export const On: Story = {
  args: { ...defaultArgs, checked: true },
  render,
};

export const Disabled: Story = {
  args: { ...defaultArgs, disabled: true, label: "Weekend nudge" },
  render,
};

export const DisabledOn: Story = {
  args: { ...defaultArgs, checked: true, disabled: true, label: "Weekend nudge" },
  render,
};
