import { useEffect, useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Select } from "./Select";
import type { SelectOption } from "./Select";

const listOptions: SelectOption[] = [
  { label: "Today", value: "today" },
  { label: "This week", value: "this-week" },
  { label: "This month", value: "this-month" },
  { label: "Someday", value: "someday" },
];

const longListOptions: SelectOption[] = [
  { label: "Bike", value: "bike" },
  { label: "Dentist", value: "dentist" },
  { label: "Errands", value: "errands" },
  { label: "Garden", value: "garden" },
  { label: "House", value: "house" },
  { label: "Money", value: "money" },
  { label: "Work", value: "work" },
];

const defaultArgs = {
  label: "List",
  options: listOptions,
  value: "this-week" as string | undefined,
  disabled: false,
  loading: false,
};

const meta: Meta<typeof Select> = {
  title: "Atomic/Select",
  component: Select,
  argTypes: {
    onChange: { action: "onChange" },
  },
};

export default meta;

type Story = StoryObj<typeof Select>;

export const Default: Story = {
  args: defaultArgs,
};

export const WithPlaceholder: Story = {
  args: { ...defaultArgs, value: undefined, placeholder: "Choose a list" },
};

export const Focused: Story = {
  args: defaultArgs,
  render: (args) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [value, setValue] = useState(args.value);
    useEffect(() => {
      containerRef.current?.querySelector("button")?.focus();
    }, []);
    return (
      <div ref={containerRef}>
        <Select {...args} value={value} onChange={setValue} />
      </div>
    );
  },
};

export const Open: Story = {
  args: defaultArgs,
  render: (args) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [value, setValue] = useState(args.value);
    useEffect(() => {
      containerRef.current?.querySelector("button")?.click();
    }, []);
    return (
      <div ref={containerRef} style={{ paddingBottom: "220px" }}>
        <Select {...args} value={value} onChange={setValue} />
      </div>
    );
  },
};

export const LongList: Story = {
  args: {
    ...defaultArgs,
    label: "List",
    options: longListOptions,
    value: "bike",
  },
  render: (args) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [value, setValue] = useState(args.value);
    useEffect(() => {
      containerRef.current?.querySelector("button")?.click();
    }, []);
    return (
      <div ref={containerRef} style={{ paddingBottom: "260px" }}>
        <Select {...args} value={value} onChange={setValue} />
      </div>
    );
  },
};

export const Empty: Story = {
  args: {
    ...defaultArgs,
    options: [],
    value: undefined,
    placeholder: undefined,
    emptyTitle: "No lists yet",
    emptyDescription: "Make one from the Lists screen and it will show up here.",
  },
  render: (args) => {
    const containerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
      containerRef.current?.querySelector("button")?.click();
    }, []);
    return (
      <div ref={containerRef} style={{ paddingBottom: "160px" }}>
        <Select {...args} />
      </div>
    );
  },
};

export const Loading: Story = {
  args: { ...defaultArgs, loading: true },
  render: (args) => {
    const containerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
      containerRef.current?.querySelector("button")?.click();
    }, []);
    return (
      <div ref={containerRef} style={{ paddingBottom: "160px" }}>
        <Select {...args} />
      </div>
    );
  },
};

export const Disabled: Story = {
  args: { ...defaultArgs, disabled: true },
};

// The desktop/sheet switch tracks Select's own rendered width via
// ResizeObserver, not the browser viewport - this story proves that by
// pinning a narrow (320px) wrapper inside the full-width Storybook canvas.
// The Default story above renders the desktop menu on any normal-width
// canvas; this one renders the sheet regardless of how wide the canvas is.
export const NarrowContainer: Story = {
  args: defaultArgs,
  render: (args) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [value, setValue] = useState(args.value);
    useEffect(() => {
      wrapperRef.current?.querySelector("button")?.click();
    }, []);
    return (
      <div ref={wrapperRef} style={{ width: "320px" }}>
        <Select {...args} value={value} onChange={setValue} />
      </div>
    );
  },
};
