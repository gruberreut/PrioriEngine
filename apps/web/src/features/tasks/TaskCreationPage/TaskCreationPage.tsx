import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TaskCreationForm, type TaskCreationPayload } from "../TaskCreationForm/TaskCreationForm";
import { getContextItems, type ContextItem } from "../../../services/contextService";
import { createTask, createContext } from "../../../services/taskCreationService";
import type { Task } from "../../../types/task";
import styles from "./TaskCreationPage.module.css";

const PRIORITY_LABELS: Record<number, string> = {
  1: "Urgent",
  3: "Soon",
  6: "Medium",
  8: "Later",
  10: "Ongoing",
};

function CreatedTaskRow({
  task,
  contexts,
  selected,
  onClick,
}: {
  task: Task;
  contexts: ContextItem[];
  selected: boolean;
  onClick: () => void;
}) {
  const contextName = contexts.find((c) => c.id === task.contextId)?.name;
  const priorityLabel = PRIORITY_LABELS[task.priority] ?? `P${task.priority}`;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${styles.taskRow} ${selected ? styles.taskRowSelected : ""}`}
    >
      <span className={styles.taskTitle}>{task.title}</span>
      <span className={styles.taskMeta}>
        {priorityLabel} · {task.duration} min · {task.energyRequired}
        {contextName ? ` · ${contextName}` : ""}
      </span>
    </button>
  );
}

export function TaskCreationPage() {
  const navigate = useNavigate();
  const [contexts, setContexts] = useState<ContextItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdTasks, setCreatedTasks] = useState<Task[]>([]);
  const [formKey, setFormKey] = useState(0);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

  useEffect(() => {
    getContextItems().then(setContexts).catch(() => {});
  }, []);

  function handleRowClick(taskId: string) {
    setSelectedParentId((prev) => (prev === taskId ? null : taskId));
  }

  async function handleSubmit(payload: TaskCreationPayload) {
    setLoading(true);
    setError(null);
    try {
      const id = crypto.randomUUID();
      const task = await createTask({ id, parentId: selectedParentId, ...payload });
      setCreatedTasks((prev) => [task, ...prev]);
      setSelectedParentId(null);
      setFormKey((k) => k + 1);
    } catch {
      setError("Failed to save task. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateContext(name: string): Promise<ContextItem> {
    const created = await createContext(name);
    setContexts((prev) => [...prev, created]);
    return created;
  }

  const selectedParent = createdTasks.find((t) => t.id === selectedParentId);

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Add tasks</h1>
      {selectedParent && (
        <p className={styles.subtaskNotice}>
          Adding as subtask of <strong>{selectedParent.title}</strong>
        </p>
      )}
      {error && <p className={styles.error}>{error}</p>}
      <TaskCreationForm
        key={formKey}
        contexts={contexts}
        onSubmit={(payload) => void handleSubmit(payload)}
        onCancel={() => navigate("/tasks")}
        onCreateContext={handleCreateContext}
        loading={loading}
      />
      {createdTasks.length > 0 && (
        <div className={styles.createdList}>
          <h2 className={styles.createdHeading}>
            Added this session · tap to set as parent
          </h2>
          {createdTasks.map((task) => (
            <CreatedTaskRow
              key={task.id}
              task={task}
              contexts={contexts}
              selected={task.id === selectedParentId}
              onClick={() => handleRowClick(task.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
