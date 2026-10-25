import type { Meta, StoryObj } from "@storybook/react-vite";
import { Icon } from "../../components/Icon/Icon";
import { Play } from "../../assets/icons/Play";
import { Pencil } from "../../assets/icons/Pencil";
import { Moon } from "../../assets/icons/Moon";
import { CheckCircle } from "../../assets/icons/CheckCircle";
import { Trash } from "../../assets/icons/Trash";
import { TaskCard, type TaskAction } from "./TaskCard";

const task = {
  id: "task-1",
  title: "Repot the tomato seedlings",
  duration: 30,
  energyRequired: "medium" as const,
  location: "home" as const,
  contexts: ["physical"],
  status: "pending" as const,
  priority: 3,
  priorityUpdatedAt: "2026-06-01T00:00:00.000Z",
  dueDate: null,
  lastSuggestedAt: null,
};

const breakdown = {
  priorityScore: 0.80,
  urgencyScore: 0.60,
  energyScore: 0.50,
  durationScore: 0.40,
  flowBonus: 0.20,
  suggestionPenalty: 0,
  totalScore: 2.50,
  reasons: ["High priority", "Due soon"],
};

const inProgressActions: TaskAction[] = [
  { id: "complete", icon: <Icon asset={CheckCircle} label="Complete" size={24} />, label: "Complete", color: "#d1fae5" },
  { id: "snooze", icon: <Icon asset={Moon} label="Snooze" size={24} />, label: "Snooze", color: "#ede9fe" },
  { id: "delete", icon: <Icon asset={Trash} label="Delete" size={24} />, label: "Delete", color: "#fee2e2" },
];

const sampleActions: TaskAction[] = [
  { id: "start", icon: <Icon asset={Play} label="Start" size={24} />, label: "Start", color: "#d1fae5" },
  { id: "edit", icon: <Icon asset={Pencil} label="Edit" size={24} />, label: "Edit", color: "#fef9c3" },
  { id: "snooze", icon: <Icon asset={Moon} label="Snooze" size={24} />, label: "Snooze", color: "#ede9fe" },
  { id: "complete", icon: <Icon asset={CheckCircle} label="Complete" size={24} />, label: "Complete", color: "#d1fae5" },
  { id: "delete", icon: <Icon asset={Trash} label="Delete" size={24} />, label: "Delete", color: "#fee2e2" },
];

const defaultArgs = {
  task,
  breakdown,
  explain: false,
  flavor: "outlined" as const,
  selected: false,
  showActionLabels: false,
};

const meta: Meta<typeof TaskCard> = {
  title: "Entity/TaskCard",
  component: TaskCard,
  argTypes: {
    onSelect: { action: "onSelect" },
    onAction: { action: "onAction" },
  },
};

export default meta;

// Appearance

export const Default: StoryObj<typeof TaskCard> = {
  args: defaultArgs,
};

export const Flavors: StoryObj<typeof TaskCard> = {
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <TaskCard {...args} flavor="outlined" />
      <TaskCard {...args} flavor="flat" />
    </div>
  ),
  args: defaultArgs,
};

// State

export const Selected: StoryObj<typeof TaskCard> = {
  args: { ...defaultArgs, selected: true },
};

export const InProgress: StoryObj<typeof TaskCard> = {
  args: { ...defaultArgs, flavor: "flat", task: { ...task, status: "in_progress" }, actions: inProgressActions },
};

export const Completed: StoryObj<typeof TaskCard> = {
  args: { ...defaultArgs, task: { ...task, status: "completed" }, actions: sampleActions },
};

// Explain

export const ExplainOn: StoryObj<typeof TaskCard> = {
  args: { ...defaultArgs, explain: true },
};

// Actions

export const WithActions: StoryObj<typeof TaskCard> = {
  args: { ...defaultArgs, actions: sampleActions },
};

export const WithActionLabels: StoryObj<typeof TaskCard> = {
  args: { ...defaultArgs, actions: sampleActions, showActionLabels: true },
};

// Location

export const LocationHome: StoryObj<typeof TaskCard> = {
  args: { ...defaultArgs, task: { ...task, location: "home" } },
};

export const LocationInPerson: StoryObj<typeof TaskCard> = {
  args: { ...defaultArgs, task: { ...task, location: "in-person", title: "Go to Nature food store" } },
};

export const LocationAnywhere: StoryObj<typeof TaskCard> = {
  args: { ...defaultArgs, task: { ...task, location: "anywhere", title: "Read a page in French" } },
};

// Ancestors

export const WithAncestors: StoryObj<typeof TaskCard> = {
  args: {
    ...defaultArgs,
    task: {
      ...task,
      title: "Water the seedlings",
      ancestors: [
        { id: "home", title: "Home projects" },
        { id: "garden", title: "Garden" },
      ],
    },
  },
};

export const WithDeepAncestors: StoryObj<typeof TaskCard> = {
  args: {
    ...defaultArgs,
    task: {
      ...task,
      title: "10-min jog",
      ancestors: [
        { id: "personal", title: "Personal" },
        { id: "health", title: "Health & fitness" },
        { id: "routine", title: "Morning routine" },
      ],
    },
  },
};

// Edge cases

export const LongTitle: StoryObj<typeof TaskCard> = {
  args: { ...defaultArgs, task: { ...task, title: "Research and compare three different composting methods suitable for a small urban balcony garden" } },
};

export const LongTitleWithActions: StoryObj<typeof TaskCard> = {
  args: { ...defaultArgs, task: { ...task, title: "Research and compare three different composting methods suitable for a small urban balcony garden" }, actions: sampleActions },
};
