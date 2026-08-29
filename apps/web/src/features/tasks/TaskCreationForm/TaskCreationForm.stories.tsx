import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { TaskCreationForm } from "./TaskCreationForm";
import type { ContextItem } from "../../../services/contextService";

const existingContexts: ContextItem[] = [
  { id: "ctx-1", name: "Learning" },
  { id: "ctx-2", name: "Creativity" },
  { id: "ctx-3", name: "Projects" },
  { id: "ctx-4", name: "Physical" },
];

const defaultArgs = {
  contexts: [],
  loading: false,
};

const meta: Meta<typeof TaskCreationForm> = {
  title: "Features/Tasks/TaskCreationForm",
  component: TaskCreationForm,
  argTypes: {
    onSubmit: { action: "onSubmit" },
    onCancel: { action: "onCancel" },
  },
  args: {
    onSubmit: fn(),
    onCancel: fn(),
    onCreateContext: fn().mockResolvedValue({ id: "ctx-new", name: "New context" }),
  },
  decorators: [
    (Story) => (
      <div style={{ padding: "24px" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof TaskCreationForm>;

export const Default: Story = {
  args: defaultArgs,
};

export const WithExistingContexts: Story = {
  args: { ...defaultArgs, contexts: existingContexts },
};

export const Loading: Story = {
  args: { ...defaultArgs, contexts: existingContexts, loading: true },
};
