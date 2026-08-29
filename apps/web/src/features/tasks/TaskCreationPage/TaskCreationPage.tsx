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

function CreatedTaskRow({ task, contexts }: { task: Task; contexts: ContextItem[] }) {
  const contextName = contexts.find((c) => c.id === task.contextId)?.name;
  const priorityLabel = PRIORITY_LABELS[task.priority] ?? `P${task.priority}`;

  return (
    <div className={styles.taskRow}>
      <span className={styles.taskTitle}>{task.title}</span>
      <span className={styles.taskMeta}>
        {priorityLabel} · {task.duration} min · {task.energyRequired}
        {contextName ? ` · ${contextName}` : ""}
      </span>
    </div>
  );
}

export function TaskCreationPage() {
  const navigate = useNavigate();
  const [contexts, setContexts] = useState<ContextItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdTasks, setCreatedTasks] = useState<Task[]>([]);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    getContextItems().then(setContexts).catch(() => {});
  }, []);

  async function handleSubmit(payload: TaskCreationPayload) {
    setLoading(true);
    setError(null);
    try {
      const id = crypto.randomUUID();
      const task = await createTask({ id, ...payload });
      setCreatedTasks((prev) => [task, ...prev]);
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

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Add tasks</h1>
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
          <h2 className={styles.createdHeading}>Added this session</h2>
          {createdTasks.map((task) => (
            <CreatedTaskRow key={task.id} task={task} contexts={contexts} />
          ))}
        </div>
      )}
    </div>
  );
}
