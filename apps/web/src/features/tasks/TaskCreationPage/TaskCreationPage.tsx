import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TaskCreationForm, type TaskCreationPayload } from "../TaskCreationForm/TaskCreationForm";
import { getContextItems, type ContextItem } from "../../../services/contextService";
import { createTask, createContext } from "../../../services/taskCreationService";
import styles from "./TaskCreationPage.module.css";

export function TaskCreationPage() {
  const navigate = useNavigate();
  const [contexts, setContexts] = useState<ContextItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getContextItems().then(setContexts).catch(() => {});
  }, []);

  async function handleSubmit(payload: TaskCreationPayload) {
    setLoading(true);
    setError(null);
    try {
      const id = crypto.randomUUID();
      const task = await createTask({ id, ...payload });
      navigate(`/tasks/${task.id}`);
    } catch {
      setError("Failed to save task. Please try again.");
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
      <h1 className={styles.heading}>New task</h1>
      {error && <p className={styles.error}>{error}</p>}
      <TaskCreationForm
        contexts={contexts}
        onSubmit={(payload) => void handleSubmit(payload)}
        onCancel={() => navigate(-1)}
        onCreateContext={handleCreateContext}
        loading={loading}
      />
    </div>
  );
}
