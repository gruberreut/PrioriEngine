import type { Meta, StoryObj } from "@storybook/react-vite";
import type { Task } from "../../../types/task";
import { TasksPage } from "./TasksPage";

function makeTask(overrides: Partial<Task> & Pick<Task, "id" | "title">): Task {
  return {
    duration: 20,
    energyRequired: "medium",
    location: "anywhere",
    status: "pending",
    contexts: ["admin"],
    priority: 5,
    priorityUpdatedAt: "2026-01-01T00:00:00Z",
    dueDate: null,
    lastSuggestedAt: null,
    ...overrides,
  };
}

const home = makeTask({ id: "home", title: "Home projects" });
const faucet = makeTask({ id: "faucet", title: "Fix leaky faucet", parentId: "home", location: "home", duration: 30, status: "completed" });
const seedlings = makeTask({ id: "seedlings", title: "Repot tomato seedlings", parentId: "home", location: "home", duration: 20 });

const project = makeTask({ id: "proj", title: "Launch side project" });
const copy = makeTask({ id: "copy", title: "Write landing page copy", parentId: "proj", duration: 30, status: "completed" });
const logo = makeTask({ id: "logo", title: "Design logo", parentId: "proj", duration: 60, status: "completed" });
const readme = makeTask({ id: "readme", title: "Write README", parentId: "proj", duration: 20 });

const solo = makeTask({ id: "solo", title: "Read 10 pages of current book", duration: 15, energyRequired: "low", contexts: ["learning"] });

const allTasks: Task[] = [home, faucet, seedlings, project, copy, logo, readme, solo];

const meta: Meta<typeof TasksPage> = {
  title: "Features/Tasks/TasksPage",
  component: TasksPage,
};

export default meta;

export const Loading: StoryObj<typeof TasksPage> = {
  args: { initialState: { status: "loading" } },
};

export const Error: StoryObj<typeof TasksPage> = {
  args: { initialState: { status: "error", message: "Failed to fetch tasks" } },
};

export const Populated: StoryObj<typeof TasksPage> = {
  args: { initialState: { status: "loaded", tasks: allTasks } },
};
