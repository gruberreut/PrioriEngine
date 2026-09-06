import type { Meta, StoryObj } from "@storybook/react-vite";
import { ParamsBar } from "./ParamsBar";

const defaultArgs = {
  location: "home" as const,
  availableTime: 30,
  energy: "medium" as const,
};

const meta: Meta<typeof ParamsBar> = {
  title: "Features/Ranking/ParamsBar",
  component: ParamsBar,
  argTypes: {
    location: { control: "select", options: ["home", "in-person", "anywhere"] },
    energy: { control: "select", options: ["low", "medium", "high"] },
  },
};

export default meta;

export const Default: StoryObj<typeof ParamsBar> = {
  args: defaultArgs,
};

export const Anywhere: StoryObj<typeof ParamsBar> = {
  args: { ...defaultArgs, location: "anywhere" },
};

export const ShortTime: StoryObj<typeof ParamsBar> = {
  args: { ...defaultArgs, availableTime: 10 },
};

export const HighEnergy: StoryObj<typeof ParamsBar> = {
  args: { ...defaultArgs, energy: "high" },
};
