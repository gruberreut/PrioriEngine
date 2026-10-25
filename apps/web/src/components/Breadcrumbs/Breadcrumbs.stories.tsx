import type { Meta, StoryObj } from "@storybook/react-vite";
import { Breadcrumbs } from "./Breadcrumbs";

const defaultArgs = {
  ancestors: [
    { id: "parent-1", title: "Home projects" },
    { id: "parent-2", title: "Garden" },
  ],
};

const meta: Meta<typeof Breadcrumbs> = {
  title: "Atomic/Breadcrumbs",
  component: Breadcrumbs,
};

export default meta;

export const Default: StoryObj<typeof Breadcrumbs> = {
  args: defaultArgs,
};

export const SingleParent: StoryObj<typeof Breadcrumbs> = {
  args: {
    ancestors: [{ id: "parent-1", title: "Learning" }],
  },
};

export const TwoLevels: StoryObj<typeof Breadcrumbs> = {
  args: defaultArgs,
};

export const ThreeLevels: StoryObj<typeof Breadcrumbs> = {
  args: {
    ancestors: [
      { id: "root", title: "Personal" },
      { id: "mid", title: "Health & fitness" },
      { id: "parent", title: "Morning routine" },
    ],
  },
};
