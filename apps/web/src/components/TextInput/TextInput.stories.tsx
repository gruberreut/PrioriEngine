import { useEffect, useRef, useState } from "react";
import { useArgs } from "storybook/preview-api";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { TextInput, Textarea } from "./TextInput";

const defaultArgs = {
  label: "Task title",
  value: "",
  placeholder: "What needs to be done?",
  disabled: false,
  hideLabel: false,
};

const meta: Meta<typeof TextInput> = {
  title: "Atomic/TextInput",
  component: TextInput,
  argTypes: {
    onChange: { action: "onChange" },
  },
};

export default meta;

type Story = StoryObj<typeof TextInput>;

const render: Story["render"] = (args) => {
  const [{ value }, updateArgs] = useArgs<{ value: string }>();
  return (
    <TextInput
      {...args}
      value={value}
      onChange={(val) => {
        updateArgs({ value: val });
        args.onChange?.(val);
      }}
    />
  );
};

export const Default: Story = {
  args: defaultArgs,
  render,
};

export const Focused: Story = {
  args: defaultArgs,
  render: (args) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [value, setValue] = useState(args.value);
    useEffect(() => {
      containerRef.current?.querySelector("input")?.focus();
    }, []);
    return (
      <div ref={containerRef}>
        <TextInput {...args} value={value} onChange={setValue} />
      </div>
    );
  },
};

export const Disabled: Story = {
  args: { ...defaultArgs, value: "Buy groceries", disabled: true },
  render,
};

export const WithHelp: Story = {
  args: { ...defaultArgs, help: "Keep it short - you can add detail later" },
  render,
};

export const Error: Story = {
  args: { ...defaultArgs, error: "Title is required" },
  render,
};

export const TextareaAtMinHeight: Story = {
  args: { ...defaultArgs, label: "Notes", placeholder: "Add any extra detail…" },
  render: (args) => {
    const [{ value }, updateArgs] = useArgs<{ value: string }>();
    return (
      <Textarea
        label={args.label}
        value={value}
        placeholder={args.placeholder}
        onChange={(val) => updateArgs({ value: val })}
      />
    );
  },
};
