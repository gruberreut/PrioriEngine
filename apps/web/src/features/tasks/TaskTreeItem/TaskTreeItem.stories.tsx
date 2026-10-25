import type { Meta, StoryObj } from "@storybook/react-vite";
import type { Task } from "../../../types/task";
import { TaskTreeItem } from "./TaskTreeItem";

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

const leaf = makeTask({ id: "leaf-1", title: "Write weekly review" });
const completedLeaf = makeTask({ id: "leaf-2", title: "Water the seedlings", status: "completed" });

const parent = makeTask({ id: "parent-1", title: "Home projects", duration: 30, energyRequired: "low" });
const child1 = makeTask({ id: "child-1", title: "Fix leaky faucet", parentId: "parent-1", location: "home", status: "completed" });
const child2 = makeTask({ id: "child-2", title: "Repot tomato seedlings", parentId: "parent-1", location: "home" });

const completedParent = makeTask({ id: "parent-2", title: "Home projects", duration: 30, energyRequired: "low", status: "completed" });
const completedChild1 = makeTask({ id: "child-3", title: "Fix leaky faucet", parentId: "parent-2", location: "home", status: "completed" });
const completedChild2 = makeTask({ id: "child-4", title: "Repot tomato seedlings", parentId: "parent-2", location: "home", status: "completed" });

const root = makeTask({ id: "root-1", title: "Health & fitness" });
const mid = makeTask({ id: "mid-1", title: "Morning routine", parentId: "root-1" });
const deep = makeTask({ id: "deep-1", title: "10-min jog", parentId: "mid-1", duration: 10, energyRequired: "high", location: "anywhere" });

const project = makeTask({ id: "proj-1", title: "Launch side project" });
const p1 = makeTask({ id: "p-1", title: "Write landing page copy", parentId: "proj-1", duration: 30, status: "completed" });
const p2 = makeTask({ id: "p-2", title: "Design logo", parentId: "proj-1", duration: 60, status: "completed" });
const p3 = makeTask({ id: "p-3", title: "Set up domain and hosting", parentId: "proj-1", duration: 20, status: "completed" });
const p4 = makeTask({ id: "p-4", title: "Write README", parentId: "proj-1", duration: 20 });
const p5 = makeTask({ id: "p-5", title: "Announce on social media", parentId: "proj-1", duration: 10 });
const projectTasks = [project, p1, p2, p3, p4, p5];

const defaultArgs = {
  task: leaf,
  ancestors: [] as Task[],
  depth: 0,
  allTasks: [leaf],
  defaultExpanded: false,
};

const meta: Meta<typeof TaskTreeItem> = {
  title: "Features/Tasks/TaskTreeItem",
  component: TaskTreeItem,
  argTypes: {
    onDelete: { action: "onDelete" },
  },
};

export default meta;

export const Leaf: StoryObj<typeof TaskTreeItem> = {
  args: defaultArgs,
};

export const CompletedLeaf: StoryObj<typeof TaskTreeItem> = {
  args: { ...defaultArgs, task: completedLeaf, allTasks: [completedLeaf] },
};

export const ParentCollapsed: StoryObj<typeof TaskTreeItem> = {
  args: {
    ...defaultArgs,
    task: parent,
    allTasks: [parent, child1, child2],
    defaultExpanded: false,
  },
};

export const ParentExpanded: StoryObj<typeof TaskTreeItem> = {
  args: {
    ...defaultArgs,
    task: parent,
    allTasks: [parent, child1, child2],
    defaultExpanded: true,
  },
};

export const CompletedParentExpanded: StoryObj<typeof TaskTreeItem> = {
  args: {
    ...defaultArgs,
    task: completedParent,
    allTasks: [completedParent, completedChild1, completedChild2],
    defaultExpanded: true,
  },
};

export const WithProgress: StoryObj<typeof TaskTreeItem> = {
  args: {
    ...defaultArgs,
    task: project,
    allTasks: projectTasks,
    defaultExpanded: true,
  },
};

export const DeepNesting: StoryObj<typeof TaskTreeItem> = {
  args: {
    ...defaultArgs,
    task: root,
    allTasks: [root, mid, deep],
    defaultExpanded: true,
  },
};
