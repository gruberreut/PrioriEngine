import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router-dom";
import type { Task } from "../../../types/task";
import { TaskDetailPage } from "./TaskDetailPage";

function makeTask(overrides: Partial<Task> & Pick<Task, "id" | "title">): Task {
  return {
    duration: 20,
    energyRequired: "medium",
    location: "anywhere",
    status: "pending",
    contexts: [],
    priority: 3,
    priorityUpdatedAt: "2026-01-01T00:00:00Z",
    dueDate: null,
    lastSuggestedAt: null,
    ...overrides,
  };
}

const task = makeTask({ id: "task-1", title: "Write release notes", duration: 30, energyRequired: "medium" });
const other = makeTask({ id: "task-2", title: "Update changelog", duration: 20 });
const inProgressTask = makeTask({ id: "task-3", title: "Deploy to staging", status: "in_progress", duration: 60 });

const meta: Meta<typeof TaskDetailPage> = {
  title: "Features/Tasks/TaskDetailPage",
  component: TaskDetailPage,
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
};

export default meta;

const defaultArgs = {
  taskId: task.id,
  initialState: { status: "loaded" as const, task, tasks: [task, other] },
};

export const Default: StoryObj<typeof TaskDetailPage> = {
  args: defaultArgs,
};

export const StartDisabled: StoryObj<typeof TaskDetailPage> = {
  args: {
    ...defaultArgs,
    initialState: { status: "loaded", task, tasks: [task, inProgressTask] },
  },
};

export const Loading: StoryObj<typeof TaskDetailPage> = {
  args: {
    taskId: task.id,
    initialState: { status: "loading" },
  },
};

export const Error: StoryObj<typeof TaskDetailPage> = {
  args: {
    taskId: task.id,
    initialState: { status: "error", message: "Task not found" },
  },
};
