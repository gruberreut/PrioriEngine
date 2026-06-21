import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
import { NavBar } from "./NavBar";

const meta: Meta<typeof NavBar> = {
  title: "Atomic/NavBar",
  component: NavBar,
  argTypes: {
    onNavigate: { action: "onNavigate" },
  },
};

export default meta;

export const Default: StoryObj<typeof NavBar> = {
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/"]}>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export const TasksActive: StoryObj<typeof NavBar> = {
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/tasks"]}>
        <Story />
      </MemoryRouter>
    ),
  ],
};
