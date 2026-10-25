import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router-dom";
import type { Task } from "../../../types/task";
import { InProgressPage } from "./InProgressPage";

function makeTask(overrides: Partial<Task> & Pick<Task, "id" | "title">): Task {
  return {
    duration: 20,
    energyRequired: "medium",
    location: "anywhere",
    status: "in_progress",
    contexts: [],
    priority: 3,
    priorityUpdatedAt: "2026-01-01T00:00:00Z",
    dueDate: null,
    lastSuggestedAt: null,
    ...overrides,
  };
}

const task = makeTask({ id: "task-1", title: "Deploy to staging", duration: 60, contexts: ["projects"] });

const meta: Meta<typeof InProgressPage> = {
  title: "Features/Ranking/InProgressPage",
  component: InProgressPage,
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
};

export default meta;

export const Default: StoryObj<typeof InProgressPage> = {
  args: {
    initialState: { status: "loaded", task },
  },
};

export const Loading: StoryObj<typeof InProgressPage> = {
  args: {
    initialState: { status: "loading" },
  },
};

export const Error: StoryObj<typeof InProgressPage> = {
  args: {
    initialState: { status: "error", message: "Failed to load task" },
  },
};
