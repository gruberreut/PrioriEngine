import type { Meta, StoryObj } from "@storybook/react";
import { Icon } from "../../../components/Icon/Icon";
import { StartPlay } from "../../../assets/icons/StartPlay";
import { EditPencil } from "../../../assets/icons/EditPencil";
import { SnoozeMoon } from "../../../assets/icons/SnoozeMoon";
import { CompleteCircle } from "../../../assets/icons/CompleteCircle";
import { DeleteTrash } from "../../../assets/icons/DeleteTrash";
import { TaskCard, type TaskAction } from "./TaskCard";

const task = {
  id: "task-1",
  title: "Repot the tomato seedlings",
  duration: 30,
  energyRequired: "medium" as const,
  contexts: ["Garden"],
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
  { id: "complete", icon: <Icon asset={CompleteCircle} label="Complete" size={24} />, label: "Complete", color: "#d1fae5" },
  { id: "snooze", icon: <Icon asset={SnoozeMoon} label="Snooze" size={24} />, label: "Snooze", color: "#ede9fe" },
  { id: "delete", icon: <Icon asset={DeleteTrash} label="Delete" size={24} />, label: "Delete", color: "#fee2e2" },
];

const sampleActions: TaskAction[] = [
  { id: "start", icon: <Icon asset={StartPlay} label="Start" size={24} />, label: "Start", color: "#d1fae5" },
  { id: "edit", icon: <Icon asset={EditPencil} label="Edit" size={24} />, label: "Edit", color: "#fef9c3" },
  { id: "snooze", icon: <Icon asset={SnoozeMoon} label="Snooze" size={24} />, label: "Snooze", color: "#ede9fe" },
  { id: "complete", icon: <Icon asset={CompleteCircle} label="Complete" size={24} />, label: "Complete", color: "#d1fae5" },
  { id: "delete", icon: <Icon asset={DeleteTrash} label="Delete" size={24} />, label: "Delete", color: "#fee2e2" },
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
  title: "Features/Ranking/TaskCard",
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
  args: { ...defaultArgs, flavor: "flat", actions: inProgressActions },
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

// Edge cases

export const LongTitle: StoryObj<typeof TaskCard> = {
  args: { ...defaultArgs, task: { ...task, title: "Research and compare three different composting methods suitable for a small urban balcony garden" } },
};

export const LongTitleWithActions: StoryObj<typeof TaskCard> = {
  args: { ...defaultArgs, task: { ...task, title: "Research and compare three different composting methods suitable for a small urban balcony garden" }, actions: sampleActions },
};
