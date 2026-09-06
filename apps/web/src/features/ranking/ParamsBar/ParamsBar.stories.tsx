import { useArgs } from "storybook/preview-api";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ParamsBar } from "./ParamsBar";

const defaultArgs = {
  location: "home" as const,
  availableTime: 30,
  energy: "medium" as const,
  visible: true,
};

const meta: Meta<typeof ParamsBar> = {
  title: "Features/Ranking/ParamsBar",
  component: ParamsBar,
  argTypes: {
    location: { control: "select", options: ["home", "in-person", "anywhere"] },
    energy: { control: "select", options: ["low", "medium", "high"] },
    onLocationChange: { action: "onLocationChange" },
    onAvailableTimeChange: { action: "onAvailableTimeChange" },
    onEnergyChange: { action: "onEnergyChange" },
  },
};

export default meta;

type Story = StoryObj<typeof ParamsBar>;

// Tapping a column opens a Sheet to change that value, so the story needs to
// stay controlled (via useArgs) for the picked value to show up in the bar
// and for the controls panel to follow along - see CLAUDE.md "Controls
// interactivity".
const render: Story["render"] = (args) => {
  const [{ location, availableTime, energy }, updateArgs] = useArgs<{
    location: typeof args.location;
    availableTime: number;
    energy: typeof args.energy;
  }>();
  return (
    <ParamsBar
      {...args}
      location={location}
      availableTime={availableTime}
      energy={energy}
      onLocationChange={(value) => {
        updateArgs({ location: value });
        args.onLocationChange?.(value);
      }}
      onAvailableTimeChange={(value) => {
        updateArgs({ availableTime: value });
        args.onAvailableTimeChange?.(value);
      }}
      onEnergyChange={(value) => {
        updateArgs({ energy: value });
        args.onEnergyChange?.(value);
      }}
    />
  );
};

export const Default: Story = {
  args: defaultArgs,
  render,
};

export const Anywhere: Story = {
  args: { ...defaultArgs, location: "anywhere" },
  render,
};

export const ShortTime: Story = {
  args: { ...defaultArgs, availableTime: 10 },
  render,
};

export const HighEnergy: Story = {
  args: { ...defaultArgs, energy: "high" },
  render,
};

export const Hidden: Story = {
  name: "Hidden (reserved space)",
  args: { ...defaultArgs, visible: false },
  render,
};
