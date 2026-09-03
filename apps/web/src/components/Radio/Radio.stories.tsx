import { useState } from "react";
import { useArgs } from "storybook/preview-api";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Radio } from "./Radio";
import { Icon } from "../Icon/Icon";
import { FlameMedium } from "../../assets/icons/FlameMedium";

const defaultArgs = {
  checked: false,
  label: "One at a time",
  disabled: false,
};

const meta: Meta<typeof Radio> = {
  title: "Atomic/Radio",
  component: Radio,
  argTypes: {
    onChange: { action: "onChange" },
  },
};

export default meta;

type Story = StoryObj<typeof Radio>;

const render: Story["render"] = (args) => {
  const [{ checked }, updateArgs] = useArgs<{ checked: boolean }>();
  return (
    <Radio
      {...args}
      checked={checked}
      onChange={(val) => {
        updateArgs({ checked: val });
        args.onChange?.(val);
      }}
    />
  );
};

export const Unchecked: Story = {
  args: defaultArgs,
  render,
};

export const Checked: Story = {
  args: { ...defaultArgs, checked: true },
  render,
};

export const Disabled: Story = {
  args: { ...defaultArgs, disabled: true, label: "Show everything" },
  render,
};

export const DisabledChecked: Story = {
  args: { ...defaultArgs, checked: true, disabled: true, label: "Show everything" },
  render,
};

export const WithIcon: Story = {
  args: { ...defaultArgs, icon: <Icon asset={FlameMedium} label="Medium" size={20} /> },
  render,
};

export const Group: Story = {
  args: {},
  render: () => {
    const [selected, setSelected] = useState<"three" | "everything">("three");
    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <Radio
          name="show-count"
          label="Show me three"
          checked={selected === "three"}
          onChange={() => setSelected("three")}
        />
        <Radio
          name="show-count"
          label="Show everything"
          checked={selected === "everything"}
          onChange={() => setSelected("everything")}
        />
      </div>
    );
  },
};
