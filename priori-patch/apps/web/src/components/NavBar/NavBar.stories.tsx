import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
import { NavBar } from "./NavBar";

const defaultArgs = {
  linksHidden: false,
};

/** The bar is fixed to the viewport bottom, so stories need a tall-enough
 *  frame to show it in place rather than floating over the docs canvas. */
const frame = (initialPath: string) => (Story: () => JSX.Element) => (
  <MemoryRouter initialEntries={[initialPath]}>
    <div style={{ position: "relative", height: 320, background: "var(--color-bg-page)" }}>
      <Story />
    </div>
  </MemoryRouter>
);

const meta: Meta<typeof NavBar> = {
  title: "Atomic/NavBar",
  component: NavBar,
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
  argTypes: {
    onNavigate: { action: "onNavigate" },
  },
};

export default meta;

export const Default: StoryObj<typeof NavBar> = {
  args: defaultArgs,
  decorators: [frame("/")],
};

export const TasksActive: StoryObj<typeof NavBar> = {
  args: defaultArgs,
  decorators: [frame("/tasks")],
};

/** Blocking routes (e.g. /in-progress) suppress navigation. */
export const LinksHidden: StoryObj<typeof NavBar> = {
  args: { ...defaultArgs, linksHidden: true },
  decorators: [frame("/in-progress")],
};

/** Below 360px the labels drop and the icons carry the meaning. */
export const NarrowViewport: StoryObj<typeof NavBar> = {
  args: defaultArgs,
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/"]}>
        <div style={{ position: "relative", width: 320, height: 320, background: "var(--color-bg-page)" }}>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
};
